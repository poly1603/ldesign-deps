import pacote from 'pacote'
import { execa } from 'execa'
import type {
  DependencyHealthScore,
  HealthScoreDetails,
  BatchHealthScoreResult,
  HealthScoreSummary,
  ProgressCallback
} from '../types'
import { CacheManager } from './cache-manager'
import { Logger } from './logger'

/**
 * 依赖健康度评分器配置
 */
export interface HealthScorerConfig {
  /** 是否检查 GitHub 数据 */
  checkGitHub?: boolean
  /** GitHub Token (用于提高 API 限制) */
  githubToken?: string
  /** 是否使用缓存 */
  useCache?: boolean
  /** 缓存 TTL (毫秒) */
  cacheTTL?: number
  /** 并发数 */
  concurrency?: number
}

/**
 * 依赖健康度评分器
 * 
 * 评估依赖的维护活跃度、社区热度、质量指标等，提供综合健康度评分
 */
export class DependencyHealthScorer {
  private cache: CacheManager
  private logger: Logger
  private config: Required<HealthScorerConfig>

  constructor(
    private projectRoot: string = process.cwd(),
    config: HealthScorerConfig = {}
  ) {
    this.config = {
      checkGitHub: config.checkGitHub ?? true,
      githubToken: config.githubToken ?? process.env.GITHUB_TOKEN ?? '',
      useCache: config.useCache ?? true,
      cacheTTL: config.cacheTTL ?? 24 * 60 * 60 * 1000, // 24小时
      concurrency: config.concurrency ?? 5
    }

    this.cache = new CacheManager({
      enabled: this.config.useCache,
      ttl: this.config.cacheTTL,
      maxSize: 500,
      strategy: 'lru'
    })

    this.logger = new Logger('HealthScorer')
  }

  /**
   * 评估单个依赖的健康度
   */
  async scorePackage(packageName: string, version?: string): Promise<DependencyHealthScore> {
    const cacheKey = `health:${packageName}@${version || 'latest'}`
    
    if (this.config.useCache) {
      const cached = this.cache.get<DependencyHealthScore>(cacheKey)
      if (cached) {
        this.logger.debug(`使用缓存的健康度评分: ${packageName}`)
        return cached
      }
    }

    try {
      this.logger.info(`评估 ${packageName} 的健康度...`)

      // 获取包元数据
      const manifest = await pacote.manifest(`${packageName}${version ? `@${version}` : ''}`)

      // 获取详细信息
      const details = await this.collectHealthDetails(packageName, manifest)

      // 计算各项评分
      const maintenanceScore = this.calculateMaintenanceScore(details)
      const popularityScore = this.calculatePopularityScore(details)
      const qualityScore = this.calculateQualityScore(details)
      const securityScore = this.calculateSecurityScore(details)

      // 计算综合评分（加权平均）
      const overall = Math.round(
        maintenanceScore * 0.3 +
        popularityScore * 0.2 +
        qualityScore * 0.25 +
        securityScore * 0.25
      )

      // 生成建议
      const recommendations = this.generateRecommendations(details, {
        maintenanceScore,
        popularityScore,
        qualityScore,
        securityScore
      })

      // 确定等级
      const grade = this.getGrade(overall)

      const score: DependencyHealthScore = {
        packageName,
        version: manifest.version,
        overall,
        maintenanceScore,
        popularityScore,
        qualityScore,
        securityScore,
        dependencyDepth: await this.calculateDependencyDepth(packageName),
        details,
        recommendations,
        grade
      }

      // 缓存结果
      if (this.config.useCache) {
        this.cache.set(cacheKey, score)
      }

      return score
    } catch (error) {
      this.logger.error(`评估 ${packageName} 失败:`, error)
      throw error
    }
  }

  /**
   * 批量评估依赖健康度
   */
  async scorePackages(
    packages: Array<{ name: string; version?: string }>,
    onProgress?: ProgressCallback
  ): Promise<BatchHealthScoreResult> {
    const scores: DependencyHealthScore[] = []
    const total = packages.length

    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i]
      try {
        const score = await this.scorePackage(pkg.name, pkg.version)
        scores.push(score)
      } catch (error) {
        this.logger.warn(`跳过 ${pkg.name}: ${error}`)
      }

      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 100),
          message: `正在评估 ${pkg.name}...`
        })
      }
    }

    const summary = this.generateSummary(scores)

    return {
      scores,
      summary,
      timestamp: Date.now()
    }
  }

  /**
   * 收集健康度详细信息
   */
  private async collectHealthDetails(
    packageName: string,
    manifest: any
  ): Promise<HealthScoreDetails> {
    const details: HealthScoreDetails = {
      license: manifest.license,
      deprecated: !!manifest.deprecated,
      deprecationReason: manifest.deprecated,
      hasTypes: !!(manifest.types || manifest.typings),
      dependenciesCount: Object.keys(manifest.dependencies || {}).length
    }

    // 从 npm 获取下载量
    try {
      const response = await fetch(`https://api.npmjs.org/downloads/point/last-week/${packageName}`)
      if (response.ok) {
        const data = await response.json()
        details.weeklyDownloads = data.downloads
      }
    } catch (error) {
      this.logger.debug(`获取 ${packageName} 下载量失败`)
    }

    // 从 package.json 获取时间信息
    if (manifest.time) {
      details.lastPublish = new Date(manifest.time[manifest.version] || manifest.time.modified)
    }

    // 从 GitHub 获取数据
    if (this.config.checkGitHub && manifest.repository?.url) {
      const githubData = await this.fetchGitHubData(manifest.repository.url)
      if (githubData) {
        Object.assign(details, githubData)
      }
    }

    return details
  }

  /**
   * 从 GitHub 获取数据
   */
  private async fetchGitHubData(repoUrl: string): Promise<Partial<HealthScoreDetails> | null> {
    try {
      // 解析 GitHub URL
      const match = repoUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)/)
      if (!match) return null

      const [, owner, repo] = match
      const cleanRepo = repo.replace(/\.git$/, '')

      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json'
      }

      if (this.config.githubToken) {
        headers['Authorization'] = `token ${this.config.githubToken}`
      }

      const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
        headers
      })

      if (!response.ok) return null

      const data = await response.json()

      return {
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count,
        lastCommit: data.pushed_at ? new Date(data.pushed_at) : undefined
      }
    } catch (error) {
      this.logger.debug('获取 GitHub 数据失败:', error)
      return null
    }
  }

  /**
   * 计算维护活跃度评分
   */
  private calculateMaintenanceScore(details: HealthScoreDetails): number {
    let score = 100

    // 检查最后发布时间
    if (details.lastPublish) {
      const daysSincePublish = (Date.now() - details.lastPublish.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSincePublish > 730) score -= 40 // 超过2年
      else if (daysSincePublish > 365) score -= 25 // 超过1年
      else if (daysSincePublish > 180) score -= 10 // 超过6个月
    }

    // 检查最后提交时间
    if (details.lastCommit) {
      const daysSinceCommit = (Date.now() - details.lastCommit.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceCommit > 365) score -= 30
      else if (daysSinceCommit > 180) score -= 15
      else if (daysSinceCommit > 90) score -= 5
    }

    // 废弃包大幅减分
    if (details.deprecated) {
      score -= 60
    }

    return Math.max(0, score)
  }

  /**
   * 计算社区热度评分
   */
  private calculatePopularityScore(details: HealthScoreDetails): number {
    let score = 0

    // 根据 GitHub stars 评分
    if (details.stars !== undefined) {
      if (details.stars >= 10000) score += 40
      else if (details.stars >= 5000) score += 35
      else if (details.stars >= 1000) score += 30
      else if (details.stars >= 500) score += 20
      else if (details.stars >= 100) score += 10
      else score += 5
    }

    // 根据每周下载量评分
    if (details.weeklyDownloads !== undefined) {
      if (details.weeklyDownloads >= 1000000) score += 40
      else if (details.weeklyDownloads >= 100000) score += 35
      else if (details.weeklyDownloads >= 10000) score += 25
      else if (details.weeklyDownloads >= 1000) score += 15
      else if (details.weeklyDownloads >= 100) score += 5
    }

    // 根据 forks 评分
    if (details.forks !== undefined) {
      if (details.forks >= 1000) score += 20
      else if (details.forks >= 500) score += 15
      else if (details.forks >= 100) score += 10
      else if (details.forks >= 50) score += 5
    }

    return Math.min(100, score)
  }

  /**
   * 计算质量评分
   */
  private calculateQualityScore(details: HealthScoreDetails): number {
    let score = 50 // 基础分

    // 有 TypeScript 定义加分
    if (details.hasTypes) {
      score += 20
    }

    // 有许可证加分
    if (details.license) {
      score += 15
    }

    // 依赖数量少加分（依赖越少越好）
    const depsCount = details.dependenciesCount || 0
    if (depsCount === 0) score += 15
    else if (depsCount <= 5) score += 10
    else if (depsCount <= 10) score += 5
    else if (depsCount > 50) score -= 10

    // issue 数量影响（太多 issue 减分）
    if (details.openIssues !== undefined) {
      if (details.openIssues > 200) score -= 10
      else if (details.openIssues > 100) score -= 5
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * 计算安全评分
   */
  private calculateSecurityScore(details: HealthScoreDetails): number {
    let score = 100

    // 已知漏洞减分
    if (details.vulnerabilities !== undefined) {
      score -= details.vulnerabilities * 20
    }

    // 废弃包减分
    if (details.deprecated) {
      score -= 30
    }

    return Math.max(0, score)
  }

  /**
   * 计算依赖链深度
   */
  private async calculateDependencyDepth(packageName: string): Promise<number> {
    try {
      const manifest = await pacote.manifest(packageName)
      const deps = manifest.dependencies || {}
      
      if (Object.keys(deps).length === 0) return 0

      // 简化计算：返回直接依赖数量作为深度指标
      return Object.keys(deps).length
    } catch {
      return 0
    }
  }

  /**
   * 生成建议
   */
  private generateRecommendations(
    details: HealthScoreDetails,
    scores: {
      maintenanceScore: number
      popularityScore: number
      qualityScore: number
      securityScore: number
    }
  ): string[] {
    const recommendations: string[] = []

    if (details.deprecated) {
      recommendations.push(`⚠️ 此包已废弃${details.deprecationReason ? `: ${details.deprecationReason}` : '，建议寻找替代方案'}`)
    }

    if (scores.maintenanceScore < 50) {
      recommendations.push('⚠️ 维护活跃度较低，建议关注包的更新情况')
    }

    if (scores.popularityScore < 30) {
      recommendations.push('💡 社区热度较低，建议评估是否有更流行的替代方案')
    }

    if (!details.hasTypes) {
      recommendations.push('💡 建议使用有 TypeScript 类型定义的包以提升开发体验')
    }

    if (details.vulnerabilities && details.vulnerabilities > 0) {
      recommendations.push(`🔴 发现 ${details.vulnerabilities} 个安全漏洞，请尽快更新`)
    }

    if ((details.dependenciesCount || 0) > 30) {
      recommendations.push('⚡ 依赖项较多，可能影响安装和构建速度')
    }

    if (details.lastPublish) {
      const daysSincePublish = (Date.now() - details.lastPublish.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSincePublish > 365) {
        recommendations.push('📅 超过一年未更新，建议评估是否继续使用')
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ 依赖健康状况良好')
    }

    return recommendations
  }

  /**
   * 根据评分确定等级
   */
  private getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * 生成摘要
   */
  private generateSummary(scores: DependencyHealthScore[]): HealthScoreSummary {
    const total = scores.length
    const averageScore = scores.reduce((sum, s) => sum + s.overall, 0) / total

    const gradesDistribution: Record<string, number> = {
      A: 0, B: 0, C: 0, D: 0, F: 0
    }

    let criticalIssues = 0
    let deprecatedCount = 0
    let outdatedCount = 0

    scores.forEach(score => {
      gradesDistribution[score.grade]++

      if (score.overall < 50) criticalIssues++
      if (score.details.deprecated) deprecatedCount++
      if (score.maintenanceScore < 60) outdatedCount++
    })

    return {
      total,
      averageScore: Math.round(averageScore),
      gradesDistribution,
      criticalIssues,
      deprecatedCount,
      outdatedCount
    }
  }

  /**
   * 生成格式化报告
   */
  generateReport(result: BatchHealthScoreResult): string {
    const { scores, summary } = result

    let report = '\n=== 依赖健康度报告 ===\n\n'
    
    report += `总计: ${summary.total} 个依赖\n`
    report += `平均评分: ${summary.averageScore}/100\n`
    report += `等级分布: A(${summary.gradesDistribution.A}) B(${summary.gradesDistribution.B}) C(${summary.gradesDistribution.C}) D(${summary.gradesDistribution.D}) F(${summary.gradesDistribution.F})\n`
    report += `关键问题: ${summary.criticalIssues} 个\n`
    report += `已废弃: ${summary.deprecatedCount} 个\n`
    report += `过时依赖: ${summary.outdatedCount} 个\n\n`

    // 按评分排序，显示需要关注的依赖
    const needsAttention = scores
      .filter(s => s.overall < 70)
      .sort((a, b) => a.overall - b.overall)

    if (needsAttention.length > 0) {
      report += '需要关注的依赖:\n\n'
      needsAttention.forEach(score => {
        report += `${score.packageName}@${score.version} [${score.grade}] ${score.overall}/100\n`
        score.recommendations.forEach(rec => {
          report += `  ${rec}\n`
        })
        report += '\n'
      })
    }

    return report
  }
}
