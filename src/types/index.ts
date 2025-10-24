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

export interface DependencyAnalysis {
  unused: string[]
  missing: string[]
  invalidFiles: Record<string, any>
  invalidDirs: Record<string, any>
  usingDependencies: Record<string, string[]>
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

export class DependencyError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DependencyError'
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public url?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ParseError extends Error {
  constructor(
    message: string,
    public file: string,
    public line?: number
  ) {
    super(message)
    this.name = 'ParseError'
  }
}

