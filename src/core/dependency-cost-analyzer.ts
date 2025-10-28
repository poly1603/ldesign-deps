import fs from 'fs-extra'
import path from 'path'
import { glob } from 'fast-glob'
import { execa } from 'execa'
import type {
  DependencyCostAnalysis,
  OverallCost,
  CostByPackage,
  CostTrend
} from '../types'
import { Logger } from './logger'
import { DependencyManager } from './dependency-manager'

/**
 * 成本分析器配置
 */
export interface CostAnalyzerConfig {
  /** 是否包含历史趋势分析 */
  includeTrend?: boolean
  /** 历史数据存储路径 */
  historyPath?: string
  /** CI/CD 每月运行次数估算 */
  monthlyBuilds?: number
}

/**
 * 依赖成本分析器
 * 
 * 分析依赖的各项成本：安装时间、磁盘空间、网络消耗、CI/CD影响
 */
export class DependencyCostAnalyzer {
  private logger: Logger
  private config: Required<CostAnalyzerConfig>

  constructor(
    private projectRoot: string = process.cwd(),
    config: CostAnalyzerConfig = {}
  ) {
    this.config = {
      includeTrend: config.includeTrend ?? false,
      historyPath: config.historyPath ?? path.join(projectRoot, '.deps-cost-history.json'),
      monthlyBuilds: config.monthlyBuilds ?? 100
    }

    this.logger = new Logger('CostAnalyzer')
  }

  /**
   * 分析依赖成本
   */
  async analyze(): Promise<DependencyCostAnalysis> {
    this.logger.info('开始分析依赖成本...')

    const [overallCost, costByPackage] = await Promise.all([
      this.calculateOverallCost(),
      this.calculateCostByPackage()
    ])

    let trend: CostTrend | undefined
    if (this.config.includeTrend) {
      trend = await this.analyzeTrend(overallCost)
    }

    const analysis: DependencyCostAnalysis = {
      overallCost,
      costByPackage,
      trend,
      timestamp: Date.now()
    }

    // 保存历史数据
    if (this.config.includeTrend) {
      await this.saveHistoryData(analysis)
    }

    return analysis
  }

  /**
   * 计算总体成本
   */
  private async calculateOverallCost(): Promise<OverallCost> {
    this.logger.info('计算总体成本...')

    try {
      const manager = new DependencyManager(this.projectRoot)
      const deps = await manager.getAllDependencies()
      const totalDependencies = Object.keys(deps).length

      // 计算安装时间
      const installTime = await this.measureInstallTime()

      // 计算磁盘空间
      const diskSpace = await this.calculateDiskSpace()

      // 估算下载大小（通常比磁盘空间小30-40%）
      const downloadSize = diskSpace * 0.35

      // 计算 CI/CD 时间成本（分钟/次）
      const cicdTimeCost = installTime / 60

      // 估算月度成本（分钟）
      const monthlyCost = cicdTimeCost * this.config.monthlyBuilds

      return {
        totalDependencies,
        totalInstallTime: installTime,
        totalDiskSpace: diskSpace,
        totalDownloadSize: downloadSize,
        cicdTimeCost,
        monthlyCost
      }
    } catch (error) {
      this.logger.error('计算总体成本失败:', error)
      return {
        totalDependencies: 0,
        totalInstallTime: 0,
        totalDiskSpace: 0,
        totalDownloadSize: 0,
        cicdTimeCost: 0,
        monthlyCost: 0
      }
    }
  }

  /**
   * 按包计算成本
   */
  private async calculateCostByPackage(): Promise<CostByPackage[]> {
    this.logger.info('按包分析成本...')

    try {
      const nodeModulesPath = path.join(this.projectRoot, 'node_modules')
      
      if (!await fs.pathExists(nodeModulesPath)) {
        return []
      }

      const packages: CostByPackage[] = []
      const allPackages = await this.getAllPackages()

      // 计算总大小用于百分比计算
      let totalSize = 0
      const packageSizes: Record<string, number> = {}

      for (const pkgName of allPackages) {
        const pkgPath = this.getPackagePath(pkgName)
        const size = await this.getDirectorySize(pkgPath)
        packageSizes[pkgName] = size
        totalSize += size
      }

      // 生成详细成本信息
      for (const pkgName of allPackages) {
        const size = packageSizes[pkgName]
        const transitiveDeps = await this.countTransitiveDeps(pkgName)

        packages.push({
          name: pkgName,
          installTime: 0, // 需要更详细的日志分析
          diskSpace: size,
          downloadSize: Math.round(size * 0.35), // 估算
          transitiveDependencies: transitiveDeps,
          costPercentage: totalSize > 0 ? (size / totalSize) * 100 : 0
        })
      }

      // 按成本占比排序
      return packages.sort((a, b) => b.costPercentage - a.costPercentage)
    } catch (error) {
      this.logger.error('按包计算成本失败:', error)
      return []
    }
  }

  /**
   * 分析成本趋势
   */
  private async analyzeTrend(currentCost: OverallCost): Promise<CostTrend | undefined> {
    try {
      const history = await this.loadHistoryData()
      
      if (history.length === 0) {
        return undefined
      }

      const lastRecord = history[history.length - 1]

      return {
        comparison: {
          dependenciesChange: currentCost.totalDependencies - lastRecord.totalDependencies,
          installTimeChange: currentCost.totalInstallTime - lastRecord.totalInstallTime,
          diskSpaceChange: currentCost.totalDiskSpace - lastRecord.totalDiskSpace
        },
        history: history.map(h => ({
          timestamp: h.timestamp,
          totalDependencies: h.overallCost.totalDependencies,
          totalInstallTime: h.overallCost.totalInstallTime,
          totalDiskSpace: h.overallCost.totalDiskSpace
        }))
      }
    } catch (error) {
      this.logger.debug('分析趋势失败:', error)
      return undefined
    }
  }

  /**
   * 测量安装时间
   */
  private async measureInstallTime(): Promise<number> {
    try {
      const packageManager = await this.detectPackageManager()
      
      // 检查是否有 node_modules
      const hasNodeModules = await fs.pathExists(path.join(this.projectRoot, 'node_modules'))
      
      if (!hasNodeModules) {
        // 如果没有 node_modules，执行一次安装来测量
        const startTime = Date.now()
        
        try {
          await execa(packageManager, ['install'], {
            cwd: this.projectRoot,
            timeout: 5 * 60 * 1000,
            stdio: 'pipe'
          })
        } catch (error) {
          this.logger.warn('安装失败，使用估算值')
        }

        return (Date.now() - startTime) / 1000 // 转换为秒
      }

      // 如果已有 node_modules，使用历史数据或估算
      const lockfilePath = await this.getLockfilePath()
      if (lockfilePath) {
        const stats = await fs.stat(lockfilePath)
        // 基于 lockfile 大小估算（粗略估计：1KB ≈ 0.1秒）
        return (stats.size / 1024) * 0.1
      }

      // 默认估算：每个依赖约 0.5 秒
      const manager = new DependencyManager(this.projectRoot)
      const deps = await manager.getAllDependencies()
      return Object.keys(deps).length * 0.5
    } catch (error) {
      this.logger.error('测量安装时间失败:', error)
      return 0
    }
  }

  /**
   * 计算磁盘空间占用
   */
  private async calculateDiskSpace(): Promise<number> {
    try {
      const nodeModulesPath = path.join(this.projectRoot, 'node_modules')
      
      if (!await fs.pathExists(nodeModulesPath)) {
        return 0
      }

      const size = await this.getDirectorySize(nodeModulesPath)
      return size / 1024 / 1024 // 转换为 MB
    } catch (error) {
      this.logger.error('计算磁盘空间失败:', error)
      return 0
    }
  }

  /**
   * 获取目录大小
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0

    try {
      const files = await glob('**/*', {
        cwd: dirPath,
        dot: true,
        onlyFiles: true
      })

      for (const file of files) {
        try {
          const filePath = path.join(dirPath, file)
          const stats = await fs.stat(filePath)
          totalSize += stats.size
        } catch {
          // 忽略无法访问的文件
        }
      }
    } catch (error) {
      this.logger.debug(`获取目录大小失败: ${dirPath}`)
    }

    return totalSize
  }

  /**
   * 获取所有包名
   */
  private async getAllPackages(): Promise<string[]> {
    const nodeModulesPath = path.join(this.projectRoot, 'node_modules')
    const packages: string[] = []

    try {
      const items = await fs.readdir(nodeModulesPath)

      for (const item of items) {
        if (item.startsWith('.')) continue

        if (item.startsWith('@')) {
          // Scoped packages
          const scopeDir = path.join(nodeModulesPath, item)
          const scopedPackages = await fs.readdir(scopeDir)
          for (const pkg of scopedPackages) {
            packages.push(`${item}/${pkg}`)
          }
        } else {
          packages.push(item)
        }
      }
    } catch (error) {
      this.logger.error('获取包列表失败:', error)
    }

    return packages
  }

  /**
   * 获取包路径
   */
  private getPackagePath(packageName: string): string {
    return path.join(this.projectRoot, 'node_modules', packageName)
  }

  /**
   * 统计传递依赖数量
   */
  private async countTransitiveDeps(packageName: string): Promise<number> {
    try {
      const pkgPath = this.getPackagePath(packageName)
      const pkgJsonPath = path.join(pkgPath, 'package.json')

      if (!await fs.pathExists(pkgJsonPath)) {
        return 0
      }

      const pkgJson = await fs.readJson(pkgJsonPath)
      const deps = {
        ...pkgJson.dependencies,
        ...pkgJson.peerDependencies
      }

      return Object.keys(deps).length
    } catch {
      return 0
    }
  }

  /**
   * 检测包管理器
   */
  private async detectPackageManager(): Promise<string> {
    if (await fs.pathExists(path.join(this.projectRoot, 'pnpm-lock.yaml'))) {
      return 'pnpm'
    }
    if (await fs.pathExists(path.join(this.projectRoot, 'yarn.lock'))) {
      return 'yarn'
    }
    return 'npm'
  }

  /**
   * 获取 lockfile 路径
   */
  private async getLockfilePath(): Promise<string | null> {
    const lockfiles = ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json']
    
    for (const lockfile of lockfiles) {
      const lockfilePath = path.join(this.projectRoot, lockfile)
      if (await fs.pathExists(lockfilePath)) {
        return lockfilePath
      }
    }

    return null
  }

  /**
   * 加载历史数据
   */
  private async loadHistoryData(): Promise<DependencyCostAnalysis[]> {
    try {
      if (await fs.pathExists(this.config.historyPath)) {
        return await fs.readJson(this.config.historyPath)
      }
    } catch (error) {
      this.logger.debug('加载历史数据失败:', error)
    }

    return []
  }

  /**
   * 保存历史数据
   */
  private async saveHistoryData(analysis: DependencyCostAnalysis): Promise<void> {
    try {
      const history = await this.loadHistoryData()
      
      // 只保留最近 30 条记录
      const maxRecords = 30
      if (history.length >= maxRecords) {
        history.shift()
      }

      history.push(analysis)
      
      await fs.writeJson(this.config.historyPath, history, { spaces: 2 })
    } catch (error) {
      this.logger.error('保存历史数据失败:', error)
    }
  }

  /**
   * 生成格式化报告
   */
  generateReport(analysis: DependencyCostAnalysis): string {
    const { overallCost, costByPackage, trend } = analysis

    let report = '\n=== 依赖成本分析报告 ===\n\n'

    // 总体成本
    report += '📊 总体成本:\n'
    report += `  总依赖数: ${overallCost.totalDependencies}\n`
    report += `  安装时间: ${overallCost.totalInstallTime.toFixed(2)}秒\n`
    report += `  磁盘空间: ${overallCost.totalDiskSpace.toFixed(2)} MB\n`
    report += `  下载大小: ${overallCost.totalDownloadSize.toFixed(2)} MB\n`
    report += `  CI/CD 单次成本: ${overallCost.cicdTimeCost.toFixed(2)} 分钟\n`
    
    if (overallCost.monthlyCost) {
      report += `  月度成本估算: ${overallCost.monthlyCost.toFixed(2)} 分钟 (${this.config.monthlyBuilds} 次构建)\n`
    }

    // 趋势分析
    if (trend) {
      report += '\n📈 成本变化趋势:\n'
      const { comparison } = trend
      
      report += `  依赖数变化: ${this.formatChange(comparison.dependenciesChange)}\n`
      report += `  安装时间变化: ${this.formatChange(comparison.installTimeChange, '秒')}\n`
      report += `  磁盘空间变化: ${this.formatChange(comparison.diskSpaceChange, 'MB')}\n`
    }

    // Top 10 最贵的包
    if (costByPackage.length > 0) {
      report += '\n💰 成本最高的依赖 (Top 10):\n\n'
      
      const top10 = costByPackage.slice(0, 10)
      top10.forEach((pkg, index) => {
        report += `${index + 1}. ${pkg.name}\n`
        report += `   磁盘空间: ${(pkg.diskSpace / 1024 / 1024).toFixed(2)} MB (${pkg.costPercentage.toFixed(1)}%)\n`
        report += `   间接依赖: ${pkg.transitiveDependencies}\n\n`
      })
    }

    // 优化建议
    report += '💡 优化建议:\n'
    
    if (overallCost.totalDiskSpace > 500) {
      report += '  ⚠️  node_modules 超过 500MB，考虑清理未使用的依赖\n'
    }
    
    if (overallCost.totalDependencies > 100) {
      report += '  ⚠️  依赖数量较多，可能影响安装和构建速度\n'
    }

    if (costByPackage.length > 0) {
      const heavyPackages = costByPackage.filter(p => p.diskSpace > 10 * 1024 * 1024) // > 10MB
      if (heavyPackages.length > 0) {
        report += `  ⚠️  发现 ${heavyPackages.length} 个超过 10MB 的大型依赖\n`
      }
    }

    if (trend && trend.comparison.diskSpaceChange > 0) {
      report += '  📈 磁盘占用持续增长，建议定期审查依赖\n'
    }

    return report
  }

  /**
   * 格式化变化值
   */
  private formatChange(value: number, unit: string = ''): string {
    const sign = value > 0 ? '+' : ''
    const color = value > 0 ? '🔴' : value < 0 ? '🟢' : '⚪'
    return `${color} ${sign}${value.toFixed(2)}${unit}`
  }
}
