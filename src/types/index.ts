// ============ 基础类型 ============

export interface PackageJson {
  name?: string
  version?: string
  description?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  overrides?: Record<string, string>
  resolutions?: Record<string, string>
  workspaces?: string[] | { packages: string[] }
  [key: string]: any
}

export interface DependencyInfo {
  name: string
  version: string
  type: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies' | 'unknown'
  resolved?: string
  size?: number
}

export interface VersionInfo {
  current: string
  latest: string
  hasUpdate: boolean
  wanted?: string
  beta?: string
  alpha?: string
}

export interface UpdateAvailable {
  packageName: string
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  updateType: 'major' | 'minor' | 'patch' | 'none'
  error?: string
  breakingChanges?: boolean
  changelog?: string
}

/**
 * 文件分析详情
 */
export interface FileAnalysisDetail {
  path: string
  error: string
  line?: number
  column?: number
}

/**
 * 目录分析详情
 */
export interface DirAnalysisDetail {
  path: string
  error: string
  reason?: string
}

/**
 * 依赖分析结果
 */
export interface DependencyAnalysis {
  /** 未使用的依赖列表 */
  unused: string[]
  /** 缺失的依赖列表 */
  missing: string[]
  /** 无效文件详情 */
  invalidFiles: Record<string, FileAnalysisDetail>
  /** 无效目录详情 */
  invalidDirs: Record<string, DirAnalysisDetail>
  /** 依赖使用情况映射 */
  usingDependencies: Record<string, string[]>
  /** 重复的依赖 */
  duplicates?: DuplicateDependency[]
}

export interface UpdateResult {
  success: boolean
  packageName?: string
  message: string
  output?: string
  error?: string
  dryRun?: boolean
}

export interface DuplicateDependency {
  name: string
  versions: string[]
  locations: string[]
}

// ============ 安全审计相关 ============

export interface SecurityAuditResult {
  vulnerabilities: VulnerabilityInfo[]
  licenses: LicenseInfo[]
  securityScore: SecurityScore
  summary: SecuritySummary
  timestamp: number
}

export interface VulnerabilityInfo {
  id: string
  packageName: string
  version: string
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'info'
  title: string
  description: string
  cve?: string[]
  cvss?: number
  recommendation?: string
  fixedIn?: string
  patchAvailable: boolean
  url?: string
}

export interface LicenseInfo {
  packageName: string
  version: string
  license: string
  licenseType: 'permissive' | 'copyleft' | 'proprietary' | 'unknown'
  compatible: boolean
  url?: string
  warning?: string
}

export interface SecurityScore {
  overall: number
  vulnerabilityScore: number
  licenseScore: number
  maintenanceScore: number
  popularityScore: number
}

export interface SecuritySummary {
  totalPackages: number
  vulnerablePackages: number
  criticalCount: number
  highCount: number
  moderateCount: number
  lowCount: number
  incompatibleLicenses: number
}

// ============ 依赖可视化相关 ============

export interface DependencyTree {
  name: string
  version: string
  dependencies: DependencyNode[]
  depth: number
  circularDependencies: CircularDependency[]
  totalSize?: number
}

export interface DependencyNode {
  name: string
  version: string
  children: DependencyNode[]
  depth: number
  size?: number
  resolved?: string
  devDependency: boolean
  circular?: boolean
}

export interface CircularDependency {
  path: string[]
  severity: 'warning' | 'error'
}

export type GraphExportFormat = 'json' | 'dot' | 'mermaid' | 'ascii'

export interface DependencyGraphOptions {
  format: GraphExportFormat
  depth?: number
  includeDevDeps?: boolean
  output?: string
}

// ============ Monorepo 相关 ============

export interface WorkspaceInfo {
  root: string
  packages: WorkspacePackage[]
  type: 'pnpm' | 'yarn' | 'npm' | 'lerna'
  crossDependencies: CrossDependency[]
  phantomDependencies: PhantomDependency[]
}

export interface WorkspacePackage {
  name: string
  version: string
  path: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  localDependencies: string[]
  externalDependencies: string[]
}

export interface CrossDependency {
  from: string
  to: string
  version: string
  type: 'dependencies' | 'devDependencies'
  compatible: boolean
}

export interface PhantomDependency {
  packageName: string
  usedBy: string
  version: string
  source: string
  risk: 'high' | 'medium' | 'low'
}

export interface WorkspaceAnalysis {
  versionConflicts: VersionConflict[]
  sharedDependencies: SharedDependency[]
  isolatedPackages: string[]
}

export interface VersionConflict {
  dependency: string
  versions: Map<string, string[]>
  recommendation?: string
}

export interface SharedDependency {
  name: string
  versions: Set<string>
  usedBy: string[]
  canBeHoisted: boolean
}

// ============ 缓存相关 ============

export interface CacheEntry<T = any> {
  key: string
  value: T
  timestamp: number
  ttl: number
  hits: number
}

export interface CacheConfig {
  enabled: boolean
  ttl: number
  maxSize: number
  strategy: 'lru' | 'lfu' | 'fifo'
  persistPath?: string
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
  maxSize: number
}

// ============ 性能相关 ============

export interface ProgressInfo {
  current: number
  total: number
  percentage: number
  message?: string
  eta?: number
}

export interface ParallelConfig {
  concurrency: number
  batchSize?: number
  retries?: number
  timeout?: number
}

export type ProgressCallback = (progress: ProgressInfo) => void

// ============ 配置相关 ============

export interface DepsConfig {
  cache?: Partial<CacheConfig>
  analyze?: AnalyzeConfig
  update?: UpdateConfig
  security?: SecurityConfig
  workspace?: WorkspaceConfig
  registry?: string
  ignore?: string[]
}

export interface AnalyzeConfig {
  checkUnused: boolean
  checkMissing: boolean
  checkDuplicates: boolean
  ignorePatterns: string[]
  depth?: number
}

export interface UpdateConfig {
  interactive: boolean
  dryRun: boolean
  saveExact: boolean
  updateLockfile: boolean
  ignorePeerWarnings: boolean
  concurrency: number
}

export interface SecurityConfig {
  auditLevel: 'low' | 'moderate' | 'high' | 'critical'
  checkLicenses: boolean
  allowedLicenses: string[]
  blockedLicenses: string[]
  ignoreVulnerabilities: string[]
}

export interface WorkspaceConfig {
  enabled: boolean
  scanPattern?: string[]
  syncVersions: boolean
  checkPhantom: boolean
}

// ============ 错误类型 ============

import { DepsErrorCode, ErrorSeverity, ERROR_SEVERITY_MAP } from '../constants/error-codes'

/**
 * 依赖管理错误基类
 */
export class DependencyError extends Error {
  /** 错误严重程度 */
  public readonly severity: ErrorSeverity
  /** 错误时间戳 */
  public readonly timestamp: number
  /** 是否可恢复 */
  public readonly recoverable: boolean

  constructor(
    message: string,
    public readonly code: DepsErrorCode,
    public readonly details?: unknown,
    recoverable = false
  ) {
    super(message)
    this.name = 'DependencyError'
    this.severity = ERROR_SEVERITY_MAP[code]
    this.timestamp = Date.now()
    this.recoverable = recoverable

    // 捕获堆栈跟踪
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * 将错误转换为 JSON 格式
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
      details: this.details,
      stack: this.stack,
    }
  }
}

/**
 * 网络请求错误
 */
export class NetworkError extends DependencyError {
  constructor(
    message: string,
    public readonly url?: string,
    public readonly statusCode?: number,
    code: DepsErrorCode = DepsErrorCode.NETWORK_REQUEST_FAILED
  ) {
    super(message, code, { url, statusCode }, true)
    this.name = 'NetworkError'
  }
}

/**
 * 解析错误
 */
export class ParseError extends DependencyError {
  constructor(
    message: string,
    public readonly file: string,
    public readonly line?: number,
    code: DepsErrorCode = DepsErrorCode.PARSE_JSON_FAILED
  ) {
    super(message, code, { file, line }, false)
    this.name = 'ParseError'
  }
}

// ============ 健康度评分相关 ============

/**
 * 依赖健康度评分结果
 */
export interface DependencyHealthScore {
  /** 包名 */
  packageName: string
  /** 版本 */
  version: string
  /** 综合评分 (0-100) */
  overall: number
  /** 维护活跃度评分 (0-100) */
  maintenanceScore: number
  /** 社区热度评分 (0-100) */
  popularityScore: number
  /** 质量评分 (0-100) */
  qualityScore: number
  /** 安全评分 (0-100) */
  securityScore: number
  /** 依赖链深度 */
  dependencyDepth: number
  /** 详细信息 */
  details: HealthScoreDetails
  /** 建议 */
  recommendations: string[]
  /** 评分等级 */
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

/**
 * 健康度评分详细信息
 */
export interface HealthScoreDetails {
  /** 最后发布时间 */
  lastPublish?: Date
  /** 最后提交时间 */
  lastCommit?: Date
  /** GitHub stars */
  stars?: number
  /** GitHub forks */
  forks?: number
  /** npm 每周下载量 */
  weeklyDownloads?: number
  /** 开放的 issues 数量 */
  openIssues?: number
  /** 依赖项数量 */
  dependenciesCount?: number
  /** 已知漏洞数量 */
  vulnerabilities?: number
  /** 许可证类型 */
  license?: string
  /** 是否有 TypeScript 定义 */
  hasTypes?: boolean
  /** 是否废弃 */
  deprecated?: boolean
  /** 废弃原因 */
  deprecationReason?: string
}

/**
 * 批量健康度评分结果
 */
export interface BatchHealthScoreResult {
  scores: DependencyHealthScore[]
  summary: HealthScoreSummary
  timestamp: number
}

export interface HealthScoreSummary {
  total: number
  averageScore: number
  gradesDistribution: Record<string, number>
  criticalIssues: number
  deprecatedCount: number
  outdatedCount: number
}

// ============ 性能监控相关 ============

/**
 * 性能监控结果
 */
export interface PerformanceMetrics {
  /** 安装时间指标 */
  installMetrics: InstallMetrics
  /** Bundle 大小指标 */
  bundleMetrics: BundleMetrics
  /** 依赖统计 */
  dependencyStats: DependencyStats
  /** 构建性能影响 */
  buildImpact?: BuildImpact
  /** 时间戳 */
  timestamp: number
}

export interface InstallMetrics {
  /** 总安装时间 (ms) */
  totalTime: number
  /** 下载时间 (ms) */
  downloadTime: number
  /** 解析时间 (ms) */
  resolveTime: number
  /** 最慢的依赖 */
  slowestDependencies: Array<{ name: string; time: number }>
}

export interface BundleMetrics {
  /** 总大小 (bytes) */
  totalSize: number
  /** 压缩后大小 (bytes) */
  gzipSize: number
  /** 各依赖大小分布 */
  sizeByDependency: Record<string, number>
  /** 最大的依赖 */
  largestDependencies: Array<{ name: string; size: number }>
  /** Tree-shaking 效果 */
  treeShakingImpact?: number
}

export interface DependencyStats {
  /** 直接依赖数量 */
  directCount: number
  /** 间接依赖数量 */
  transitiveCount: number
  /** 总依赖数量 */
  totalCount: number
  /** 平均依赖深度 */
  averageDepth: number
  /** 最大依赖深度 */
  maxDepth: number
}

export interface BuildImpact {
  /** 构建时间增量 (ms) */
  buildTimeDelta: number
  /** 内存使用增量 (MB) */
  memoryDelta: number
  /** 影响程度 */
  impactLevel: 'low' | 'medium' | 'high'
}

// ============ 自动更新相关 ============

/**
 * 自动更新配置
 */
export interface AutoUpdateConfig {
  /** 是否启用 */
  enabled: boolean
  /** 更新策略 */
  strategy: 'conservative' | 'moderate' | 'aggressive'
  /** 允许的更新类型 */
  allowedUpdateTypes: Array<'major' | 'minor' | 'patch'>
  /** 排除的包 */
  excludePackages: string[]
  /** 仅包含的包 */
  includePackages?: string[]
  /** 是否创建 PR */
  createPR: boolean
  /** PR 配置 */
  prConfig?: PRConfig
  /** 测试配置 */
  testConfig?: TestConfig
  /** 通知配置 */
  notificationConfig?: NotificationConfig
  /** 调度配置 */
  schedule?: ScheduleConfig
}

export interface PRConfig {
  /** PR 标题模板 */
  titleTemplate: string
  /** PR 描述模板 */
  bodyTemplate: string
  /** 目标分支 */
  targetBranch: string
  /** 标签 */
  labels: string[]
  /** 审核者 */
  reviewers: string[]
  /** 是否自动合并 */
  autoMerge: boolean
}

export interface TestConfig {
  /** 测试命令 */
  command: string
  /** 超时时间 (ms) */
  timeout: number
  /** 是否必需 */
  required: boolean
}

export interface ScheduleConfig {
  /** 检查频率 */
  frequency: 'daily' | 'weekly' | 'monthly'
  /** 具体时间 (cron 表达式) */
  cron?: string
  /** 时区 */
  timezone?: string
}

/**
 * 自动更新结果
 */
export interface AutoUpdateResult {
  /** 更新的包列表 */
  updatedPackages: Array<{
    name: string
    oldVersion: string
    newVersion: string
    updateType: 'major' | 'minor' | 'patch'
  }>
  /** PR 信息 */
  pullRequest?: {
    url: string
    number: number
  }
  /** 测试结果 */
  testResults?: {
    passed: boolean
    output: string
  }
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  errors: string[]
  /** 时间戳 */
  timestamp: number
}

// ============ 通知相关 ============

/**
 * 通知配置
 */
export interface NotificationConfig {
  /** 通知渠道 */
  channels: NotificationChannel[]
  /** 通知级别 */
  level: 'all' | 'warning' | 'error' | 'critical'
  /** 通知事件 */
  events: NotificationEvent[]
}

export type NotificationChannel = 'email' | 'slack' | 'dingtalk' | 'wecom' | 'webhook'

export type NotificationEvent = 'vulnerability' | 'update-available' | 'auto-update' | 'health-check' | 'dependency-added' | 'dependency-removed'

/**
 * 通知消息
 */
export interface NotificationMessage {
  /** 标题 */
  title: string
  /** 内容 */
  content: string
  /** 级别 */
  level: 'info' | 'warning' | 'error' | 'critical'
  /** 事件类型 */
  event: NotificationEvent
  /** 相关数据 */
  data?: any
  /** 时间戳 */
  timestamp: number
}

/**
 * 通知结果
 */
export interface NotificationResult {
  /** 渠道 */
  channel: NotificationChannel
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  error?: string
  /** 时间戳 */
  timestamp: number
}

// ============ 替代方案相关 ============

/**
 * 依赖替代方案
 */
export interface DependencyAlternative {
  /** 原包名 */
  originalPackage: string
  /** 替代包列表 */
  alternatives: AlternativePackage[]
  /** 原包状态 */
  status: 'deprecated' | 'unmaintained' | 'vulnerable' | 'heavy' | 'outdated'
  /** 推荐理由 */
  reason: string
}

export interface AlternativePackage {
  /** 包名 */
  name: string
  /** 版本 */
  version: string
  /** 相似度评分 (0-100) */
  similarityScore: number
  /** 优势 */
  advantages: string[]
  /** 劣势 */
  disadvantages: string[]
  /** 迁移难度 */
  migrationDifficulty: 'easy' | 'medium' | 'hard'
  /** 迁移成本评估 */
  migrationCost: MigrationCost
  /** 健康度评分 */
  healthScore: number
}

export interface MigrationCost {
  /** 预估工时 (小时) */
  estimatedHours: number
  /** 影响的文件数 */
  affectedFiles: number
  /** API 变更数量 */
  apiChanges: number
  /** 风险等级 */
  riskLevel: 'low' | 'medium' | 'high'
}

// ============ 成本分析相关 ============

/**
 * 依赖成本分析结果
 */
export interface DependencyCostAnalysis {
  /** 总体成本 */
  overallCost: OverallCost
  /** 按包分类的成本 */
  costByPackage: CostByPackage[]
  /** 成本趋势 */
  trend?: CostTrend
  /** 时间戳 */
  timestamp: number
}

export interface OverallCost {
  /** 总依赖数 */
  totalDependencies: number
  /** 总安装时间 (s) */
  totalInstallTime: number
  /** 总磁盘空间 (MB) */
  totalDiskSpace: number
  /** 总下载大小 (MB) */
  totalDownloadSize: number
  /** 估算的 CI/CD 时间成本 (分钟/次) */
  cicdTimeCost: number
  /** 估算的月度成本 (CI/CD运行时长) */
  monthlyCost?: number
}

export interface CostByPackage {
  /** 包名 */
  name: string
  /** 安装时间 (ms) */
  installTime: number
  /** 磁盘空间 (bytes) */
  diskSpace: number
  /** 下载大小 (bytes) */
  downloadSize: number
  /** 间接依赖数量 */
  transitiveDependencies: number
  /** 成本占比 (%) */
  costPercentage: number
}

export interface CostTrend {
  /** 与上次对比 */
  comparison: {
    dependenciesChange: number
    installTimeChange: number
    diskSpaceChange: number
  }
  /** 历史数据点 */
  history: Array<{
    timestamp: number
    totalDependencies: number
    totalInstallTime: number
    totalDiskSpace: number
  }>
}

// ============ 文档生成相关 ============

/**
 * 文档生成配置
 */
export interface DocGenerationConfig {
  /** 输出格式 */
  format: 'markdown' | 'html' | 'pdf' | 'json'
  /** 输出路径 */
  output: string
  /** 包含的章节 */
  sections: DocSection[]
  /** 模板路径 */
  template?: string
  /** 是否包含图表 */
  includeCharts: boolean
}

export type DocSection = 'overview' | 'dependencies' | 'licenses' | 'security' | 'performance' | 'health' | 'changelog' | 'architecture'

/**
 * 生成的文档内容
 */
export interface GeneratedDoc {
  /** 标题 */
  title: string
  /** 内容 */
  content: string
  /** 格式 */
  format: 'markdown' | 'html' | 'pdf' | 'json'
  /** 元数据 */
  metadata: {
    generatedAt: number
    version: string
    totalPages?: number
  }
}

