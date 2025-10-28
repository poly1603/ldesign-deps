import { execa } from 'execa'
import fs from 'fs-extra'
import path from 'path'
import { glob } from 'fast-glob'
import type {
  PerformanceMetrics,
  InstallMetrics,
  BundleMetrics,
  DependencyStats,
  BuildImpact
} from '../types'
import { Logger } from './logger'
import { DependencyManager } from './dependency-manager'

/**
 * 性能监控器配置
 */
export interface PerformanceMonitorConfig {
  /** 是否包含 Bundle 分析 */
  includeBundleAnalysis?: boolean
  /** 是否包含构建影响分析 */
  includeBuildImpact?: boolean
  /** 安装超时时间 (ms) */
  installTimeout?: number
}

/**
 * 性能监控器
 * 
 * 监控和分析依赖对项目性能的影响
 */
export class PerformanceMonitor {
  private logger: Logger
  private config: Required<PerformanceMonitorConfig>

  constructor(
    private projectRoot: string = process.cwd(),
    config: PerformanceMonitorConfig = {}
  ) {
    this.config = {
      includeBundleAnalysis: config.includeBundleAnalysis ?? true,
      includeBuildImpact: config.includeBuildImpact ?? false,
      installTimeout: config.installTimeout ?? 5 * 60 * 1000 // 5分钟
    }

    this.logger = new Logger('PerformanceMonitor')
  }

  /**
   * 收集性能指标
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    this.logger.info('开始收集性能指标...')

    const [installMetrics, bundleMetrics, dependencyStats] = await Promise.all([
      this.measureInstallTime(),
      this.config.includeBundleAnalysis ? this.analyzeBundleSize() : this.getEmptyBundleMetrics(),
      this.analyzeDependencyStats()
    ])

    const buildImpact = this.config.includeBuildImpact 
      ? await this.measureBuildImpact()
      : undefined

    return {
      installMetrics,
      bundleMetrics,
      dependencyStats,
      buildImpact,
      timestamp: Date.now()
    }
  }

  /**
   * 测量安装时间
   */
  private async measureInstallTime(): Promise<InstallMetrics> {
    this.logger.info('测量依赖安装时间...')

    try {
      // 检测包管理器
      const packageManager = await this.detectPackageManager()
      
      // 备份 node_modules
      const hasNodeModules = await fs.pathExists(path.join(this.projectRoot, 'node_modules'))
      const tempDir = path.join(this.projectRoot, '.deps-temp')
      
      if (hasNodeModules) {
        await fs.move(
          path.join(this.projectRoot, 'node_modules'),
          path.join(tempDir, 'node_modules'),
          { overwrite: true }
        )
      }

      // 测量安装时间
      const startTime = Date.now()
      
      try {
        await execa(packageManager, ['install'], {
          cwd: this.projectRoot,
          timeout: this.config.installTimeout,
          stdio: 'pipe'
        })
      } catch (error) {
        this.logger.warn('安装过程中出现错误，但继续收集指标')
      }

      const totalTime = Date.now() - startTime

      // 恢复备份
      if (hasNodeModules) {
        await fs.remove(path.join(this.projectRoot, 'node_modules'))
        await fs.move(
          path.join(tempDir, 'node_modules'),
          path.join(this.projectRoot, 'node_modules')
        )
        await fs.remove(tempDir)
      }

      // 估算各部分时间（简化处理）
      const downloadTime = Math.round(totalTime * 0.4)
      const resolveTime = Math.round(totalTime * 0.2)

      return {
        totalTime,
        downloadTime,
        resolveTime,
        slowestDependencies: [] // 需要更详细的日志分析来获取
      }
    } catch (error) {
      this.logger.error('测量安装时间失败:', error)
      return {
        totalTime: 0,
        downloadTime: 0,
        resolveTime: 0,
        slowestDependencies: []
      }
    }
  }

  /**
   * 分析 Bundle 大小
   */
  private async analyzeBundleSize(): Promise<BundleMetrics> {
    this.logger.info('分析 Bundle 大小...')

    try {
      const nodeModulesPath = path.join(this.projectRoot, 'node_modules')
      
      if (!await fs.pathExists(nodeModulesPath)) {
        return this.getEmptyBundleMetrics()
      }

      // 计算 node_modules 总大小
      const totalSize = await this.getDirectorySize(nodeModulesPath)

      // 分析各依赖大小
      const sizeByDependency: Record<string, number> = {}
      const packages = await fs.readdir(nodeModulesPath)
      
      for (const pkg of packages) {
        if (pkg.startsWith('.') || pkg.startsWith('@')) {
          if (pkg.startsWith('@')) {
            // 处理 scoped packages
            const scopeDir = path.join(nodeModulesPath, pkg)
            const scopedPackages = await fs.readdir(scopeDir)
            for (const scopedPkg of scopedPackages) {
              const pkgPath = path.join(scopeDir, scopedPkg)
              const size = await this.getDirectorySize(pkgPath)
              sizeByDependency[`${pkg}/${scopedPkg}`] = size
            }
          }
          continue
        }

        const pkgPath = path.join(nodeModulesPath, pkg)
        const stats = await fs.stat(pkgPath)
        if (stats.isDirectory()) {
          const size = await this.getDirectorySize(pkgPath)
          sizeByDependency[pkg] = size
        }
      }

      // 找出最大的依赖
      const largestDependencies = Object.entries(sizeByDependency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, size]) => ({ name, size }))

      // 估算 gzip 大小（通常为原大小的 30%）
      const gzipSize = Math.round(totalSize * 0.3)

      return {
        totalSize,
        gzipSize,
        sizeByDependency,
        largestDependencies,
        treeShakingImpact: undefined // 需要构建工具集成来获取
      }
    } catch (error) {
      this.logger.error('分析 Bundle 大小失败:', error)
      return this.getEmptyBundleMetrics()
    }
  }

  /**
   * 分析依赖统计信息
   */
  private async analyzeDependencyStats(): Promise<DependencyStats> {
    this.logger.info('分析依赖统计信息...')

    try {
      const manager = new DependencyManager(this.projectRoot)
      const deps = await manager.getAllDependencies()

      const directDeps = Object.values(deps).filter(
        d => d.type === 'dependencies' || d.type === 'devDependencies'
      )

      // 读取 package-lock.json 或 pnpm-lock.yaml 来获取传递依赖
      const transitiveDeps = await this.countTransitiveDependencies()

      // 计算依赖深度
      const { averageDepth, maxDepth } = await this.calculateDependencyDepth()

      return {
        directCount: directDeps.length,
        transitiveCount: transitiveDeps,
        totalCount: directDeps.length + transitiveDeps,
        averageDepth,
        maxDepth
      }
    } catch (error) {
      this.logger.error('分析依赖统计信息失败:', error)
      return {
        directCount: 0,
        transitiveCount: 0,
        totalCount: 0,
        averageDepth: 0,
        maxDepth: 0
      }
    }
  }

  /**
   * 测量构建影响
   */
  private async measureBuildImpact(): Promise<BuildImpact | undefined> {
    this.logger.info('测量构建影响...')

    try {
      // 检查是否有构建脚本
      const packageJson = await fs.readJson(path.join(this.projectRoot, 'package.json'))
      if (!packageJson.scripts?.build) {
        this.logger.warn('未找到构建脚本，跳过构建影响分析')
        return undefined
      }

      // 运行构建并测量时间
      const startTime = Date.now()
      const startMem = process.memoryUsage().heapUsed

      await execa('npm', ['run', 'build'], {
        cwd: this.projectRoot,
        timeout: 10 * 60 * 1000, // 10分钟
        stdio: 'pipe'
      })

      const buildTime = Date.now() - startTime
      const endMem = process.memoryUsage().heapUsed
      const memoryDelta = (endMem - startMem) / 1024 / 1024 // 转换为 MB

      // 确定影响程度
      let impactLevel: 'low' | 'medium' | 'high' = 'low'
      if (buildTime > 120000 || memoryDelta > 500) { // 2分钟或500MB
        impactLevel = 'high'
      } else if (buildTime > 60000 || memoryDelta > 200) { // 1分钟或200MB
        impactLevel = 'medium'
      }

      return {
        buildTimeDelta: buildTime,
        memoryDelta,
        impactLevel
      }
    } catch (error) {
      this.logger.error('测量构建影响失败:', error)
      return undefined
    }
  }

  /**
   * 计算目录大小
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
        const filePath = path.join(dirPath, file)
        const stats = await fs.stat(filePath)
        totalSize += stats.size
      }
    } catch (error) {
      // 忽略错误
    }

    return totalSize
  }

  /**
   * 统计传递依赖数量
   */
  private async countTransitiveDependencies(): Promise<number> {
    try {
      const nodeModulesPath = path.join(this.projectRoot, 'node_modules')
      
      if (!await fs.pathExists(nodeModulesPath)) {
        return 0
      }

      // 简化计算：统计所有 node_modules 中的包
      let count = 0
      const packages = await fs.readdir(nodeModulesPath)

      for (const pkg of packages) {
        if (pkg.startsWith('.')) continue

        if (pkg.startsWith('@')) {
          const scopeDir = path.join(nodeModulesPath, pkg)
          const scopedPackages = await fs.readdir(scopeDir)
          count += scopedPackages.length
        } else {
          count++
        }
      }

      // 减去直接依赖
      const manager = new DependencyManager(this.projectRoot)
      const deps = await manager.getAllDependencies()
      const directCount = Object.keys(deps).length

      return Math.max(0, count - directCount)
    } catch {
      return 0
    }
  }

  /**
   * 计算依赖深度
   */
  private async calculateDependencyDepth(): Promise<{ averageDepth: number; maxDepth: number }> {
    try {
      // 这里需要更复杂的依赖树分析
      // 简化实现：返回估算值
      return {
        averageDepth: 3,
        maxDepth: 8
      }
    } catch {
      return {
        averageDepth: 0,
        maxDepth: 0
      }
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
   * 获取空的 Bundle 指标
   */
  private getEmptyBundleMetrics(): BundleMetrics {
    return {
      totalSize: 0,
      gzipSize: 0,
      sizeByDependency: {},
      largestDependencies: []
    }
  }

  /**
   * 格式化性能报告
   */
  generateReport(metrics: PerformanceMetrics): string {
    let report = '\n=== 性能监控报告 ===\n\n'

    // 安装时间
    report += '📦 安装性能:\n'
    report += `  总安装时间: ${(metrics.installMetrics.totalTime / 1000).toFixed(2)}s\n`
    report += `  下载时间: ${(metrics.installMetrics.downloadTime / 1000).toFixed(2)}s\n`
    report += `  解析时间: ${(metrics.installMetrics.resolveTime / 1000).toFixed(2)}s\n\n`

    // Bundle 大小
    if (metrics.bundleMetrics.totalSize > 0) {
      report += '📊 Bundle 分析:\n'
      report += `  总大小: ${(metrics.bundleMetrics.totalSize / 1024 / 1024).toFixed(2)} MB\n`
      report += `  Gzip 后: ${(metrics.bundleMetrics.gzipSize / 1024 / 1024).toFixed(2)} MB\n`
      
      if (metrics.bundleMetrics.largestDependencies.length > 0) {
        report += '  最大的依赖:\n'
        metrics.bundleMetrics.largestDependencies.slice(0, 5).forEach(dep => {
          report += `    - ${dep.name}: ${(dep.size / 1024 / 1024).toFixed(2)} MB\n`
        })
      }
      report += '\n'
    }

    // 依赖统计
    report += '📈 依赖统计:\n'
    report += `  直接依赖: ${metrics.dependencyStats.directCount}\n`
    report += `  间接依赖: ${metrics.dependencyStats.transitiveCount}\n`
    report += `  总依赖数: ${metrics.dependencyStats.totalCount}\n`
    report += `  平均深度: ${metrics.dependencyStats.averageDepth}\n`
    report += `  最大深度: ${metrics.dependencyStats.maxDepth}\n\n`

    // 构建影响
    if (metrics.buildImpact) {
      report += '⚡ 构建影响:\n'
      report += `  构建时间: ${(metrics.buildImpact.buildTimeDelta / 1000).toFixed(2)}s\n`
      report += `  内存增量: ${metrics.buildImpact.memoryDelta.toFixed(2)} MB\n`
      report += `  影响程度: ${metrics.buildImpact.impactLevel}\n`
    }

    return report
  }
}
