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

