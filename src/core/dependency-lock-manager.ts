/**
 * 依赖锁定管理器 - 管理依赖版本锁定和解锁
 * @module core/dependency-lock-manager
 */

import fs from 'fs-extra'
import path from 'path'
import { DependencyError } from '../types'
import { DepsErrorCode } from '../constants'
import { logger } from './logger'

/**
 * 锁定的依赖信息
 */
export interface LockedDependency {
  /** 包名 */
  name: string
  /** 锁定的版本 */
  version: string
  /** 锁定原因 */
  reason?: string
  /** 锁定时间 */
  lockedAt: number
  /** 锁定者 */
  lockedBy?: string
}

/**
 * 锁定文件内容
 */
interface LockFile {
  /** 格式版本 */
  version: string
  /** 锁定的依赖列表 */
  locked: Record<string, LockedDependency>
  /** 最后更新时间 */
  lastUpdated: number
}

/**
 * 依赖锁定管理器
 * 
 * 用于锁定特定依赖的版本，防止意外更新。
 * 适用于需要稳定版本的生产环境或关键依赖。
 * 
 * @example
 * ```ts
 * const lockManager = new DependencyLockManager()
 * 
 * // 锁定依赖
 * await lockManager.lockDependency('react', '18.2.0', {
 *   reason: '生产环境稳定版本',
 *   lockedBy: 'admin'
 * })
 * 
 * // 检查是否锁定
 * const isLocked = await lockManager.isLocked('react')
 * 
 * // 解锁依赖
 * await lockManager.unlockDependency('react')
 * ```
 */
export class DependencyLockManager {
  private lockFilePath: string
  private lockFile: LockFile | null = null

  constructor(private projectDir: string = process.cwd()) {
    this.lockFilePath = path.join(projectDir, '.deps-lock.json')
  }

  /**
   * 锁定依赖版本
   * @param name - 包名
   * @param version - 要锁定的版本
   * @param options - 锁定选项
   * @throws {DependencyError} 如果依赖已被锁定
   */
  async lockDependency(
    name: string,
    version: string,
    options?: {
      reason?: string
      lockedBy?: string
      force?: boolean
    }
  ): Promise<void> {
    await this.loadLockFile()

    // 检查是否已锁定
    if (this.lockFile!.locked[name] && !options?.force) {
      const existing = this.lockFile!.locked[name]
      throw new DependencyError(
        `依赖 ${name} 已被锁定在版本 ${existing.version}`,
        DepsErrorCode.DEPENDENCY_ALREADY_EXISTS,
        { existing }
      )
    }

    // 添加锁定
    this.lockFile!.locked[name] = {
      name,
      version,
      reason: options?.reason,
      lockedAt: Date.now(),
      lockedBy: options?.lockedBy,
    }

    this.lockFile!.lastUpdated = Date.now()

    await this.saveLockFile()
    logger.info(`已锁定依赖 ${name}@${version}`)
  }

  /**
   * 解锁依赖
   * @param name - 包名
   * @throws {DependencyError} 如果依赖未被锁定
   */
  async unlockDependency(name: string): Promise<void> {
    await this.loadLockFile()

    if (!this.lockFile!.locked[name]) {
      throw new DependencyError(
        `依赖 ${name} 未被锁定`,
        DepsErrorCode.DEPENDENCY_NOT_FOUND
      )
    }

    delete this.lockFile!.locked[name]
    this.lockFile!.lastUpdated = Date.now()

    await this.saveLockFile()
    logger.info(`已解锁依赖 ${name}`)
  }

  /**
   * 批量锁定依赖
   * @param dependencies - 要锁定的依赖列表
   */
  async lockDependencies(
    dependencies: Array<{
      name: string
      version: string
      reason?: string
    }>
  ): Promise<void> {
    for (const dep of dependencies) {
      await this.lockDependency(dep.name, dep.version, {
        reason: dep.reason,
        force: true,
      })
    }
  }

  /**
   * 批量解锁依赖
   * @param names - 要解锁的包名列表
   */
  async unlockDependencies(names: string[]): Promise<void> {
    for (const name of names) {
      try {
        await this.unlockDependency(name)
      } catch (error) {
        logger.warn(`解锁 ${name} 失败`, error)
      }
    }
  }

  /**
   * 检查依赖是否被锁定
   * @param name - 包名
   * @returns 是否被锁定
   */
  async isLocked(name: string): Promise<boolean> {
    await this.loadLockFile()
    return name in this.lockFile!.locked
  }

  /**
   * 获取锁定的版本
   * @param name - 包名
   * @returns 锁定的版本，如果未锁定返回 null
   */
  async getLockedVersion(name: string): Promise<string | null> {
    await this.loadLockFile()
    return this.lockFile!.locked[name]?.version || null
  }

  /**
   * 获取所有锁定的依赖
   * @returns 锁定的依赖列表
   */
  async getLockedDependencies(): Promise<LockedDependency[]> {
    await this.loadLockFile()
    return Object.values(this.lockFile!.locked)
  }

  /**
   * 获取锁定信息
   * @param name - 包名
   * @returns 锁定信息，如果未锁定返回 null
   */
  async getLockInfo(name: string): Promise<LockedDependency | null> {
    await this.loadLockFile()
    return this.lockFile!.locked[name] || null
  }

  /**
   * 清除所有锁定
   */
  async clearAllLocks(): Promise<void> {
    await this.loadLockFile()
    this.lockFile!.locked = {}
    this.lockFile!.lastUpdated = Date.now()
    await this.saveLockFile()
    logger.info('已清除所有依赖锁定')
  }

  /**
   * 验证依赖是否符合锁定要求
   * @param name - 包名
   * @param version - 当前版本
   * @returns 验证结果
   */
  async validateLock(name: string, version: string): Promise<{
    valid: boolean
    locked: boolean
    expectedVersion?: string
    message?: string
  }> {
    const lockInfo = await this.getLockInfo(name)

    if (!lockInfo) {
      return {
        valid: true,
        locked: false,
      }
    }

    const valid = lockInfo.version === version

    return {
      valid,
      locked: true,
      expectedVersion: lockInfo.version,
      message: valid
        ? `版本符合锁定要求`
        : `版本不匹配！期望 ${lockInfo.version}，实际 ${version}`,
    }
  }

  /**
   * 导出锁定配置
   * @param outputPath - 输出文件路径
   */
  async exportLocks(outputPath: string): Promise<void> {
    await this.loadLockFile()
    await fs.writeJSON(outputPath, this.lockFile, { spaces: 2 })
    logger.info(`锁定配置已导出到 ${outputPath}`)
  }

  /**
   * 导入锁定配置
   * @param inputPath - 输入文件路径
   * @param merge - 是否合并现有配置，默认 false
   */
  async importLocks(inputPath: string, merge = false): Promise<void> {
    const importedLockFile = await fs.readJSON(inputPath)

    if (merge) {
      await this.loadLockFile()
      this.lockFile!.locked = {
        ...this.lockFile!.locked,
        ...importedLockFile.locked,
      }
      this.lockFile!.lastUpdated = Date.now()
    } else {
      this.lockFile = importedLockFile
    }

    await this.saveLockFile()
    logger.info(`已导入锁定配置从 ${inputPath}`)
  }

  /**
   * 加载锁定文件
   */
  private async loadLockFile(): Promise<void> {
    if (this.lockFile) {
      return
    }

    try {
      if (await fs.pathExists(this.lockFilePath)) {
        this.lockFile = await fs.readJSON(this.lockFilePath)
        logger.debug(`加载锁定文件: ${this.lockFilePath}`)
      } else {
        // 创建新的锁定文件
        this.lockFile = {
          version: '1.0.0',
          locked: {},
          lastUpdated: Date.now(),
        }
      }
    } catch (error) {
      logger.error('加载锁定文件失败', error)
      throw new DependencyError(
        `加载锁定文件失败: ${error instanceof Error ? error.message : String(error)}`,
        DepsErrorCode.FILE_READ_FAILED,
        { path: this.lockFilePath, error }
      )
    }
  }

  /**
   * 保存锁定文件
   */
  private async saveLockFile(): Promise<void> {
    if (!this.lockFile) {
      return
    }

    try {
      await fs.writeJSON(this.lockFilePath, this.lockFile, { spaces: 2 })
      logger.debug(`保存锁定文件: ${this.lockFilePath}`)
    } catch (error) {
      logger.error('保存锁定文件失败', error)
      throw new DependencyError(
        `保存锁定文件失败: ${error instanceof Error ? error.message : String(error)}`,
        DepsErrorCode.FILE_WRITE_FAILED,
        { path: this.lockFilePath, error }
      )
    }
  }

  /**
   * 生成锁定报告
   * @returns 格式化的锁定报告
   */
  async generateReport(): Promise<string> {
    const locked = await this.getLockedDependencies()

    if (locked.length === 0) {
      return '没有锁定的依赖'
    }

    const lines: string[] = []
    lines.push('依赖锁定报告')
    lines.push('='.repeat(60))
    lines.push('')
    lines.push(`总计: ${locked.length} 个锁定的依赖`)
    lines.push('')

    locked.forEach((dep, index) => {
      lines.push(`${index + 1}. ${dep.name}@${dep.version}`)
      if (dep.reason) {
        lines.push(`   原因: ${dep.reason}`)
      }
      if (dep.lockedBy) {
        lines.push(`   锁定者: ${dep.lockedBy}`)
      }
      lines.push(`   锁定时间: ${new Date(dep.lockedAt).toLocaleString()}`)
      lines.push('')
    })

    lines.push('='.repeat(60))
    return lines.join('\n')
  }
}


