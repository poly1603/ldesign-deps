/**
 * 依赖历史追踪器 - 追踪和管理依赖变更历史
 * @module core/dependency-history-tracker
 */

import fs from 'fs-extra'
import path from 'path'
import { DependencyError } from '../types'
import { DepsErrorCode } from '../constants'
import { logger } from './logger'

/**
 * 依赖变更类型
 */
export type ChangeType = 'add' | 'remove' | 'update' | 'lock' | 'unlock'

/**
 * 依赖变更记录
 */
export interface DependencyChange {
  /** 变更ID */
  id: string
  /** 包名 */
  packageName: string
  /** 变更类型 */
  type: ChangeType
  /** 旧版本 */
  oldVersion?: string
  /** 新版本 */
  newVersion?: string
  /** 变更原因 */
  reason?: string
  /** 变更者 */
  author?: string
  /** 变更时间 */
  timestamp: number
  /** 额外元数据 */
  metadata?: Record<string, unknown>
}

/**
 * 依赖历史记录
 */
export interface DependencyHistory {
  /** 包名 */
  packageName: string
  /** 变更记录列表 */
  changes: DependencyChange[]
  /** 首次添加时间 */
  firstAdded?: number
  /** 最后更新时间 */
  lastUpdated?: number
}

/**
 * 历史文件内容
 */
interface HistoryFile {
  /** 格式版本 */
  version: string
  /** 所有变更记录 */
  changes: DependencyChange[]
  /** 最后更新时间 */
  lastUpdated: number
}

/**
 * 依赖历史追踪器
 * 
 * 记录所有依赖的变更历史，支持查询、回滚和统计分析。
 * 
 * @example
 * ```ts
 * const tracker = new DependencyHistoryTracker()
 * 
 * // 记录依赖添加
 * await tracker.trackChange({
 *   packageName: 'react',
 *   type: 'add',
 *   newVersion: '18.2.0',
 *   reason: '升级到最新稳定版',
 *   author: 'developer'
 * })
 * 
 * // 获取历史记录
 * const history = await tracker.getHistory('react')
 * 
 * // 回滚到之前的版本
 * await tracker.rollbackToVersion('react', '18.1.0')
 * ```
 */
export class DependencyHistoryTracker {
  private historyFilePath: string
  private historyFile: HistoryFile | null = null

  constructor(private projectDir: string = process.cwd()) {
    this.historyFilePath = path.join(projectDir, '.deps-history.json')
  }

  /**
   * 记录依赖变更
   * @param change - 变更信息（不包含 id 和 timestamp）
   * @returns 生成的变更记录
   */
  async trackChange(
    change: Omit<DependencyChange, 'id' | 'timestamp'>
  ): Promise<DependencyChange> {
    await this.loadHistoryFile()

    const fullChange: DependencyChange = {
      ...change,
      id: this.generateChangeId(),
      timestamp: Date.now(),
    }

    this.historyFile!.changes.push(fullChange)
    this.historyFile!.lastUpdated = Date.now()

    await this.saveHistoryFile()

    logger.info(
      `记录依赖变更: ${change.packageName} ${change.type} ` +
      `${change.oldVersion || ''} → ${change.newVersion || ''}`
    )

    return fullChange
  }

  /**
   * 批量记录变更
   * @param changes - 变更列表
   */
  async trackChanges(
    changes: Array<Omit<DependencyChange, 'id' | 'timestamp'>>
  ): Promise<DependencyChange[]> {
    const results: DependencyChange[] = []

    for (const change of changes) {
      results.push(await this.trackChange(change))
    }

    return results
  }

  /**
   * 获取指定包的历史记录
   * @param packageName - 包名
   * @returns 历史记录
   */
  async getHistory(packageName: string): Promise<DependencyHistory> {
    await this.loadHistoryFile()

    const changes = this.historyFile!.changes.filter(
      (c) => c.packageName === packageName
    )

    const firstAdded = changes.find((c) => c.type === 'add')?.timestamp
    const lastUpdated = changes.length > 0
      ? changes[changes.length - 1].timestamp
      : undefined

    return {
      packageName,
      changes,
      firstAdded,
      lastUpdated,
    }
  }

  /**
   * 获取所有历史记录
   * @returns 按包名分组的历史记录
   */
  async getAllHistory(): Promise<Record<string, DependencyHistory>> {
    await this.loadHistoryFile()

    const historyMap: Record<string, DependencyHistory> = {}
    const packageNames = new Set(
      this.historyFile!.changes.map((c) => c.packageName)
    )

    for (const packageName of packageNames) {
      historyMap[packageName] = await this.getHistory(packageName)
    }

    return historyMap
  }

  /**
   * 获取时间范围内的变更
   * @param startTime - 开始时间（时间戳）
   * @param endTime - 结束时间（时间戳），默认为当前时间
   * @returns 变更记录列表
   */
  async getChangesByTimeRange(
    startTime: number,
    endTime: number = Date.now()
  ): Promise<DependencyChange[]> {
    await this.loadHistoryFile()

    return this.historyFile!.changes.filter(
      (c) => c.timestamp >= startTime && c.timestamp <= endTime
    )
  }

  /**
   * 获取指定类型的变更
   * @param type - 变更类型
   * @returns 变更记录列表
   */
  async getChangesByType(type: ChangeType): Promise<DependencyChange[]> {
    await this.loadHistoryFile()
    return this.historyFile!.changes.filter((c) => c.type === type)
  }

  /**
   * 获取指定作者的变更
   * @param author - 作者名称
   * @returns 变更记录列表
   */
  async getChangesByAuthor(author: string): Promise<DependencyChange[]> {
    await this.loadHistoryFile()
    return this.historyFile!.changes.filter((c) => c.author === author)
  }

  /**
   * 回滚到指定版本
   * @param packageName - 包名
   * @param version - 目标版本
   * @returns 回滚信息
   */
  async rollbackToVersion(
    packageName: string,
    version: string
  ): Promise<{
    success: boolean
    change?: DependencyChange
    message: string
  }> {
    const history = await this.getHistory(packageName)

    // 查找目标版本的变更记录
    const targetChange = history.changes.find(
      (c) => c.newVersion === version
    )

    if (!targetChange) {
      return {
        success: false,
        message: `未找到 ${packageName}@${version} 的历史记录`,
      }
    }

    // 记录回滚操作
    const rollbackChange = await this.trackChange({
      packageName,
      type: 'update',
      oldVersion: history.changes[history.changes.length - 1]?.newVersion,
      newVersion: version,
      reason: `回滚到版本 ${version}`,
      metadata: {
        rollback: true,
        targetChangeId: targetChange.id,
      },
    })

    return {
      success: true,
      change: rollbackChange,
      message: `成功回滚 ${packageName} 到版本 ${version}`,
    }
  }

  /**
   * 获取当前版本
   * @param packageName - 包名
   * @returns 当前版本，如果没有记录返回 null
   */
  async getCurrentVersion(packageName: string): Promise<string | null> {
    const history = await this.getHistory(packageName)

    if (history.changes.length === 0) {
      return null
    }

    // 获取最后一次有效的版本更新
    for (let i = history.changes.length - 1; i >= 0; i--) {
      const change = history.changes[i]
      if (change.newVersion && change.type !== 'remove') {
        return change.newVersion
      }
    }

    return null
  }

  /**
   * 清除指定包的历史记录
   * @param packageName - 包名
   */
  async clearHistory(packageName: string): Promise<void> {
    await this.loadHistoryFile()

    this.historyFile!.changes = this.historyFile!.changes.filter(
      (c) => c.packageName !== packageName
    )
    this.historyFile!.lastUpdated = Date.now()

    await this.saveHistoryFile()
    logger.info(`已清除 ${packageName} 的历史记录`)
  }

  /**
   * 清除所有历史记录
   */
  async clearAllHistory(): Promise<void> {
    await this.loadHistoryFile()

    this.historyFile!.changes = []
    this.historyFile!.lastUpdated = Date.now()

    await this.saveHistoryFile()
    logger.info('已清除所有历史记录')
  }

  /**
   * 导出历史记录
   * @param outputPath - 输出文件路径
   * @param options - 导出选项
   */
  async exportHistory(
    outputPath: string,
    options?: {
      packageName?: string
      startTime?: number
      endTime?: number
      format?: 'json' | 'csv'
    }
  ): Promise<void> {
    let changes = this.historyFile!.changes

    // 应用过滤
    if (options?.packageName) {
      changes = changes.filter((c) => c.packageName === options.packageName)
    }

    if (options?.startTime || options?.endTime) {
      const start = options.startTime || 0
      const end = options.endTime || Date.now()
      changes = changes.filter(
        (c) => c.timestamp >= start && c.timestamp <= end
      )
    }

    const format = options?.format || 'json'

    if (format === 'json') {
      await fs.writeJSON(outputPath, { changes }, { spaces: 2 })
    } else if (format === 'csv') {
      const csv = this.convertToCSV(changes)
      await fs.writeFile(outputPath, csv, 'utf-8')
    }

    logger.info(`历史记录已导出到 ${outputPath}`)
  }

  /**
   * 生成统计报告
   * @returns 统计信息
   */
  async generateStats(): Promise<{
    totalChanges: number
    changesByType: Record<ChangeType, number>
    mostActivePackages: Array<{ name: string; changes: number }>
    recentChanges: DependencyChange[]
  }> {
    await this.loadHistoryFile()

    const changes = this.historyFile!.changes

    // 按类型统计
    const changesByType: Record<ChangeType, number> = {
      add: 0,
      remove: 0,
      update: 0,
      lock: 0,
      unlock: 0,
    }

    changes.forEach((c) => {
      changesByType[c.type]++
    })

    // 最活跃的包
    const packageChanges = new Map<string, number>()
    changes.forEach((c) => {
      packageChanges.set(c.packageName, (packageChanges.get(c.packageName) || 0) + 1)
    })

    const mostActivePackages = Array.from(packageChanges.entries())
      .map(([name, count]) => ({ name, changes: count }))
      .sort((a, b) => b.changes - a.changes)
      .slice(0, 10)

    // 最近的变更（最多10条）
    const recentChanges = changes
      .slice(-10)
      .reverse()

    return {
      totalChanges: changes.length,
      changesByType,
      mostActivePackages,
      recentChanges,
    }
  }

  /**
   * 生成变更报告
   * @param options - 报告选项
   * @returns 格式化的报告字符串
   */
  async generateReport(options?: {
    packageName?: string
    limit?: number
  }): Promise<string> {
    const history = options?.packageName
      ? await this.getHistory(options.packageName)
      : null

    const changes = history
      ? history.changes
      : this.historyFile!.changes

    const limitedChanges = options?.limit
      ? changes.slice(-options.limit).reverse()
      : changes.slice().reverse()

    const lines: string[] = []
    lines.push('依赖变更历史报告')
    lines.push('='.repeat(60))
    lines.push('')

    if (options?.packageName) {
      lines.push(`包名: ${options.packageName}`)
      lines.push(`总变更次数: ${changes.length}`)
      if (history?.firstAdded) {
        lines.push(`首次添加: ${new Date(history.firstAdded).toLocaleString()}`)
      }
      if (history?.lastUpdated) {
        lines.push(`最后更新: ${new Date(history.lastUpdated).toLocaleString()}`)
      }
    } else {
      lines.push(`总变更记录: ${changes.length}`)
    }

    lines.push('')
    lines.push('最近变更:')
    lines.push('')

    limitedChanges.forEach((change, index) => {
      lines.push(`${index + 1}. [${change.type.toUpperCase()}] ${change.packageName}`)

      if (change.oldVersion || change.newVersion) {
        const versionInfo = change.oldVersion
          ? `${change.oldVersion} → ${change.newVersion || '删除'}`
          : change.newVersion || ''
        lines.push(`   版本: ${versionInfo}`)
      }

      if (change.reason) {
        lines.push(`   原因: ${change.reason}`)
      }

      if (change.author) {
        lines.push(`   作者: ${change.author}`)
      }

      lines.push(`   时间: ${new Date(change.timestamp).toLocaleString()}`)
      lines.push('')
    })

    lines.push('='.repeat(60))
    return lines.join('\n')
  }

  /**
   * 加载历史文件
   */
  private async loadHistoryFile(): Promise<void> {
    if (this.historyFile) {
      return
    }

    try {
      if (await fs.pathExists(this.historyFilePath)) {
        this.historyFile = await fs.readJSON(this.historyFilePath)
        logger.debug(`加载历史文件: ${this.historyFilePath}`)
      } else {
        // 创建新的历史文件
        this.historyFile = {
          version: '1.0.0',
          changes: [],
          lastUpdated: Date.now(),
        }
      }
    } catch (error) {
      logger.error('加载历史文件失败', error)
      throw new DependencyError(
        `加载历史文件失败: ${error instanceof Error ? error.message : String(error)}`,
        DepsErrorCode.FILE_READ_FAILED,
        { path: this.historyFilePath, error }
      )
    }
  }

  /**
   * 保存历史文件
   */
  private async saveHistoryFile(): Promise<void> {
    if (!this.historyFile) {
      return
    }

    try {
      await fs.writeJSON(this.historyFilePath, this.historyFile, { spaces: 2 })
      logger.debug(`保存历史文件: ${this.historyFilePath}`)
    } catch (error) {
      logger.error('保存历史文件失败', error)
      throw new DependencyError(
        `保存历史文件失败: ${error instanceof Error ? error.message : String(error)}`,
        DepsErrorCode.FILE_WRITE_FAILED,
        { path: this.historyFilePath, error }
      )
    }
  }

  /**
   * 生成变更ID
   */
  private generateChangeId(): string {
    return `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 转换为CSV格式
   */
  private convertToCSV(changes: DependencyChange[]): string {
    const headers = ['时间', '包名', '类型', '旧版本', '新版本', '原因', '作者']
    const rows = changes.map((c) => [
      new Date(c.timestamp).toISOString(),
      c.packageName,
      c.type,
      c.oldVersion || '',
      c.newVersion || '',
      c.reason || '',
      c.author || '',
    ])

    const csvLines = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ]

    return csvLines.join('\n')
  }
}


