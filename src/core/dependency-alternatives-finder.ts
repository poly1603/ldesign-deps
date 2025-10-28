import pacote from 'pacote'
import type {
  DependencyAlternative,
  AlternativePackage,
  MigrationCost
} from '../types'
import { Logger } from './logger'
import { DependencyHealthScorer } from './dependency-health-scorer'
import { CacheManager } from './cache-manager'

/**
 * 替代方案查找器配置
 */
export interface AlternativesFinderConfig {
  /** 是否检查健康度评分 */
  checkHealth?: boolean
  /** 最大推荐数量 */
  maxAlternatives?: number
  /** 是否使用缓存 */
  useCache?: boolean
}

/**
 * 依赖替代方案查找器
 * 
 * 检测废弃包、推荐轻量级替代品、分析迁移成本
 */
export class DependencyAlternativesFinder {
  private logger: Logger
  private healthScorer?: DependencyHealthScorer
  private cache: CacheManager
  private config: Required<AlternativesFinderConfig>

  // 预定义的常见替代方案映射
  private static readonly KNOWN_ALTERNATIVES: Record<string, string[]> = {
    'moment': ['dayjs', 'date-fns', 'luxon'],
    'lodash': ['lodash-es', 'ramda', 'just'],
    'request': ['axios', 'got', 'node-fetch'],
    'mkdirp': ['make-dir', 'fs-extra'],
    'rimraf': ['del', 'fs-extra'],
    'jquery': ['cash-dom', 'umbrella', 'zepto'],
    'underscore': ['lodash', 'ramda'],
    'bluebird': ['native Promise'],
    'webpack': ['vite', 'rollup', 'esbuild', 'parcel'],
    'gulp': ['npm scripts', 'grunt', 'broccoli'],
    'bower': ['npm', 'yarn', 'pnpm']
  }

  // 废弃包列表（常见的）
  private static readonly DEPRECATED_PACKAGES = [
    'request', 'bower', 'gulp-util', 'natives', 'colors',
    'ncp', 'eslint-loader', 'node-sass'
  ]

  constructor(
    private projectRoot: string = process.cwd(),
    config: AlternativesFinderConfig = {}
  ) {
    this.config = {
      checkHealth: config.checkHealth ?? true,
      maxAlternatives: config.maxAlternatives ?? 5,
      useCache: config.useCache ?? true
    }

    this.logger = new Logger('AlternativesFinder')
    
    if (this.config.checkHealth) {
      this.healthScorer = new DependencyHealthScorer(projectRoot)
    }

    this.cache = new CacheManager({
      enabled: this.config.useCache,
      ttl: 7 * 24 * 60 * 60 * 1000, // 7天
      maxSize: 200,
      strategy: 'lru'
    })
  }

  /**
   * 查找包的替代方案
   */
  async findAlternatives(packageName: string): Promise<DependencyAlternative | null> {
    const cacheKey = `alternatives:${packageName}`
    
    if (this.config.useCache) {
      const cached = this.cache.get<DependencyAlternative>(cacheKey)
      if (cached) {
        this.logger.debug(`使用缓存的替代方案: ${packageName}`)
        return cached
      }
    }

    try {
      this.logger.info(`查找 ${packageName} 的替代方案...`)

      // 获取包信息
      const manifest = await pacote.manifest(packageName)
      
      // 检查包状态
      const status = await this.determinePackageStatus(packageName, manifest)
      
      if (status === 'healthy') {
        this.logger.debug(`${packageName} 状态良好，无需替代`)
        return null
      }

      // 查找替代包
      const alternatives = await this.searchAlternatives(packageName, manifest)

      if (alternatives.length === 0) {
        this.logger.debug(`未找到 ${packageName} 的替代方案`)
        return null
      }

      const reason = this.generateReason(status, manifest)

      const result: DependencyAlternative = {
        originalPackage: packageName,
        alternatives,
        status,
        reason
      }

      // 缓存结果
      if (this.config.useCache) {
        this.cache.set(cacheKey, result)
      }

      return result
    } catch (error) {
      this.logger.error(`查找 ${packageName} 替代方案失败:`, error)
      return null
    }
  }

  /**
   * 批量查找替代方案
   */
  async findMultipleAlternatives(
    packageNames: string[]
  ): Promise<DependencyAlternative[]> {
    const results: DependencyAlternative[] = []

    for (const packageName of packageNames) {
      const alternative = await this.findAlternatives(packageName)
      if (alternative) {
        results.push(alternative)
      }
    }

    return results
  }

  /**
   * 确定包的状态
   */
  private async determinePackageStatus(
    packageName: string,
    manifest: any
  ): Promise<'deprecated' | 'unmaintained' | 'vulnerable' | 'heavy' | 'outdated' | 'healthy'> {
    // 检查是否废弃
    if (manifest.deprecated || DependencyAlternativesFinder.DEPRECATED_PACKAGES.includes(packageName)) {
      return 'deprecated'
    }

    // 检查最后发布时间（超过2年视为不维护）
    if (manifest.time) {
      const lastPublish = new Date(manifest.time[manifest.version] || manifest.time.modified)
      const daysSincePublish = (Date.now() - lastPublish.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSincePublish > 730) {
        return 'unmaintained'
      }

      if (daysSincePublish > 365) {
        return 'outdated'
      }
    }

    // 检查包大小（超过5MB视为heavy）
    if (manifest.dist?.unpackedSize && manifest.dist.unpackedSize > 5 * 1024 * 1024) {
      return 'heavy'
    }

    // 使用健康度评分判断
    if (this.healthScorer) {
      try {
        const health = await this.healthScorer.scorePackage(packageName)
        if (health.overall < 50) {
          return 'vulnerable'
        }
      } catch {
        // 忽略错误
      }
    }

    return 'healthy'
  }

  /**
   * 搜索替代包
   */
  private async searchAlternatives(
    packageName: string,
    manifest: any
  ): Promise<AlternativePackage[]> {
    const alternatives: AlternativePackage[] = []

    // 1. 检查预定义的替代方案
    const knownAlts = DependencyAlternativesFinder.KNOWN_ALTERNATIVES[packageName]
    if (knownAlts) {
      for (const altName of knownAlts.slice(0, this.config.maxAlternatives)) {
        const alt = await this.evaluateAlternative(altName, manifest)
        if (alt) {
          alternatives.push(alt)
        }
      }
    }

    // 2. 基于关键词搜索
    if (alternatives.length < this.config.maxAlternatives && manifest.keywords) {
      const searchResults = await this.searchByKeywords(manifest.keywords, packageName)
      for (const altName of searchResults) {
        if (alternatives.length >= this.config.maxAlternatives) break
        if (alternatives.some(a => a.name === altName)) continue

        const alt = await this.evaluateAlternative(altName, manifest)
        if (alt) {
          alternatives.push(alt)
        }
      }
    }

    // 3. 搜索类似名称的包
    if (alternatives.length < this.config.maxAlternatives) {
      const similarNames = this.generateSimilarNames(packageName)
      for (const altName of similarNames) {
        if (alternatives.length >= this.config.maxAlternatives) break
        if (alternatives.some(a => a.name === altName)) continue

        const alt = await this.evaluateAlternative(altName, manifest)
        if (alt) {
          alternatives.push(alt)
        }
      }
    }

    return alternatives.sort((a, b) => b.similarityScore - a.similarityScore)
  }

  /**
   * 评估替代包
   */
  private async evaluateAlternative(
    altName: string,
    originalManifest: any
  ): Promise<AlternativePackage | null> {
    try {
      const altManifest = await pacote.manifest(altName)

      // 计算相似度
      const similarityScore = this.calculateSimilarity(originalManifest, altManifest)

      // 获取健康度评分
      let healthScore = 70 // 默认值
      if (this.healthScorer) {
        try {
          const health = await this.healthScorer.scorePackage(altName)
          healthScore = health.overall
        } catch {
          // 忽略错误
        }
      }

      // 分析优劣势
      const { advantages, disadvantages } = this.analyzeProsCons(originalManifest, altManifest)

      // 评估迁移难度和成本
      const { difficulty, cost } = this.estimateMigration(originalManifest, altManifest)

      return {
        name: altName,
        version: altManifest.version,
        similarityScore,
        advantages,
        disadvantages,
        migrationDifficulty: difficulty,
        migrationCost: cost,
        healthScore
      }
    } catch (error) {
      this.logger.debug(`评估 ${altName} 失败:`, error)
      return null
    }
  }

  /**
   * 计算相似度
   */
  private calculateSimilarity(original: any, alternative: any): number {
    let score = 0

    // 关键词相似度 (40分)
    if (original.keywords && alternative.keywords) {
      const originalKeywords = new Set(original.keywords)
      const altKeywords = new Set(alternative.keywords)
      const common = [...originalKeywords].filter(k => altKeywords.has(k)).length
      const total = new Set([...originalKeywords, ...altKeywords]).size
      score += (common / total) * 40
    }

    // 描述相似度 (20分) - 简化处理
    if (original.description && alternative.description) {
      const commonWords = this.getCommonWords(original.description, alternative.description)
      score += Math.min(commonWords * 5, 20)
    }

    // 依赖相似度 (20分)
    if (original.dependencies && alternative.dependencies) {
      const originalDeps = new Set(Object.keys(original.dependencies))
      const altDeps = new Set(Object.keys(alternative.dependencies))
      const common = [...originalDeps].filter(d => altDeps.has(d)).length
      const total = new Set([...originalDeps, ...altDeps]).size
      score += (common / total) * 20
    }

    // License 相似度 (10分)
    if (original.license === alternative.license) {
      score += 10
    }

    // 活跃度加分 (10分)
    if (alternative.time) {
      const lastPublish = new Date(alternative.time[alternative.version] || alternative.time.modified)
      const daysSincePublish = (Date.now() - lastPublish.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSincePublish < 180) score += 10
      else if (daysSincePublish < 365) score += 5
    }

    return Math.min(Math.round(score), 100)
  }

  /**
   * 分析优劣势
   */
  private analyzeProsCons(
    original: any,
    alternative: any
  ): { advantages: string[]; disadvantages: string[] } {
    const advantages: string[] = []
    const disadvantages: string[] = []

    // 比较大小
    if (alternative.dist?.unpackedSize && original.dist?.unpackedSize) {
      const altSize = alternative.dist.unpackedSize
      const origSize = original.dist.unpackedSize
      
      if (altSize < origSize * 0.5) {
        advantages.push(`体积更小 (${((1 - altSize / origSize) * 100).toFixed(0)}% 更轻量)`)
      } else if (altSize > origSize * 1.5) {
        disadvantages.push(`体积更大 (${((altSize / origSize - 1) * 100).toFixed(0)}% 更重)`)
      }
    }

    // 比较依赖数量
    const origDeps = Object.keys(original.dependencies || {}).length
    const altDeps = Object.keys(alternative.dependencies || {}).length
    
    if (altDeps < origDeps * 0.7) {
      advantages.push(`依赖更少 (${origDeps} → ${altDeps})`)
    } else if (altDeps > origDeps * 1.3) {
      disadvantages.push(`依赖更多 (${origDeps} → ${altDeps})`)
    }

    // TypeScript 支持
    if (alternative.types || alternative.typings) {
      if (!(original.types || original.typings)) {
        advantages.push('内置 TypeScript 类型定义')
      }
    } else if (original.types || original.typings) {
      disadvantages.push('缺少 TypeScript 类型定义')
    }

    // 活跃度
    if (alternative.time && original.time) {
      const altLastPublish = new Date(alternative.time[alternative.version] || alternative.time.modified)
      const origLastPublish = new Date(original.time[original.version] || original.time.modified)
      
      if (altLastPublish > origLastPublish) {
        const daysDiff = (altLastPublish.getTime() - origLastPublish.getTime()) / (1000 * 60 * 60 * 24)
        if (daysDiff > 90) {
          advantages.push('更活跃的维护')
        }
      }
    }

    // 默认优势
    if (advantages.length === 0) {
      advantages.push('功能相似')
    }

    return { advantages, disadvantages }
  }

  /**
   * 估算迁移难度和成本
   */
  private estimateMigration(
    original: any,
    alternative: any
  ): { difficulty: 'easy' | 'medium' | 'hard'; cost: MigrationCost } {
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium'
    
    // 估算工时
    let estimatedHours = 2 // 基础值

    // 估算影响文件数（假设值）
    const affectedFiles = 5

    // API 变更数量（简化估算）
    let apiChanges = 10

    // 风险等级
    let riskLevel: 'low' | 'medium' | 'high' = 'medium'

    // 相似度高，迁移容易
    const similarity = this.calculateSimilarity(original, alternative)
    if (similarity > 70) {
      difficulty = 'easy'
      estimatedHours = 1
      apiChanges = 5
      riskLevel = 'low'
    } else if (similarity < 40) {
      difficulty = 'hard'
      estimatedHours = 8
      apiChanges = 30
      riskLevel = 'high'
    }

    return {
      difficulty,
      cost: {
        estimatedHours,
        affectedFiles,
        apiChanges,
        riskLevel
      }
    }
  }

  /**
   * 基于关键词搜索
   */
  private async searchByKeywords(
    keywords: string[],
    excludeName: string
  ): Promise<string[]> {
    // 简化实现：返回空数组
    // 实际应该调用 npm registry API 搜索
    return []
  }

  /**
   * 生成相似名称
   */
  private generateSimilarNames(packageName: string): string[] {
    const names: string[] = []
    
    // 移除前缀后缀的变体
    const prefixes = ['node-', 'js-', 'npm-', '@types/']
    const suffixes = ['-js', '-node', '-npm', '.js']

    prefixes.forEach(prefix => {
      if (packageName.startsWith(prefix)) {
        names.push(packageName.slice(prefix.length))
      }
    })

    suffixes.forEach(suffix => {
      if (packageName.endsWith(suffix)) {
        names.push(packageName.slice(0, -suffix.length))
      }
    })

    return names
  }

  /**
   * 获取共同单词数量
   */
  private getCommonWords(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\W+/))
    const words2 = new Set(text2.toLowerCase().split(/\W+/))
    
    return [...words1].filter(w => words2.has(w) && w.length > 3).length
  }

  /**
   * 生成原因说明
   */
  private generateReason(
    status: string,
    manifest: any
  ): string {
    switch (status) {
      case 'deprecated':
        return manifest.deprecated || '此包已被作者标记为废弃'
      case 'unmaintained':
        return '此包超过2年未更新，可能已不再维护'
      case 'vulnerable':
        return '此包存在已知的安全漏洞或质量问题'
      case 'heavy':
        return '此包体积较大，可能影响安装和构建性能'
      case 'outdated':
        return '此包超过1年未更新，建议寻找更活跃的替代方案'
      default:
        return '建议评估是否有更好的替代方案'
    }
  }

  /**
   * 生成格式化报告
   */
  generateReport(alternatives: DependencyAlternative[]): string {
    if (alternatives.length === 0) {
      return '\n✅ 未发现需要替换的依赖\n'
    }

    let report = '\n=== 依赖替代方案推荐 ===\n\n'

    alternatives.forEach((alt, index) => {
      report += `${index + 1}. ${alt.originalPackage}\n`
      report += `   状态: ${this.formatStatus(alt.status)}\n`
      report += `   原因: ${alt.reason}\n`
      report += `   推荐替代方案:\n\n`

      alt.alternatives.forEach((pkg, i) => {
        report += `   ${String.fromCharCode(97 + i)}. ${pkg.name}@${pkg.version}\n`
        report += `      相似度: ${pkg.similarityScore}/100\n`
        report += `      健康度: ${pkg.healthScore}/100\n`
        report += `      迁移难度: ${this.formatDifficulty(pkg.migrationDifficulty)}\n`
        report += `      预估工时: ${pkg.migrationCost.estimatedHours} 小时\n`
        
        if (pkg.advantages.length > 0) {
          report += `      优势: ${pkg.advantages.join(', ')}\n`
        }
        
        if (pkg.disadvantages.length > 0) {
          report += `      劣势: ${pkg.disadvantages.join(', ')}\n`
        }
        
        report += '\n'
      })

      report += '\n'
    })

    return report
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      deprecated: '🔴 已废弃',
      unmaintained: '🟠 不再维护',
      vulnerable: '⚠️  存在风险',
      heavy: '📦 体积过大',
      outdated: '⏰ 过时'
    }
    return statusMap[status] || status
  }

  private formatDifficulty(difficulty: string): string {
    const difficultyMap: Record<string, string> = {
      easy: '🟢 简单',
      medium: '🟡 中等',
      hard: '🔴 困难'
    }
    return difficultyMap[difficulty] || difficulty
  }
}
