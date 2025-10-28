# 核心 API

@ldesign/deps 提供完整的 TypeScript API，支持编程方式使用所有功能。

## 安装

```bash
npm install @ldesign/deps
# 或
pnpm add @ldesign/deps
```

## 基础导入

```typescript
import {
  // 核心功能
  DependencyManager,
  VersionChecker,
  DependencyUpdater,
  PackageJsonManager,
  
  // 健康度评估
  DependencyHealthScorer,
  
  // 性能监控
  PerformanceMonitor,
  
  // 成本分析
  DependencyCostAnalyzer,
  
  // 替代方案
  DependencyAlternativesFinder,
  
  // 安全审计
  SecurityAuditor,
  
  // 依赖分析
  DependencyAnalyzer,
  
  // 可视化
  DependencyTreeGenerator,
  DependencyGraphExporter,
  
  // Monorepo
  WorkspaceAnalyzer,
  
  // 通知
  NotificationManager,
  
  // 变更日志
  ChangelogGenerator,
  
  // Lockfile
  LockfileParser,
  
  // 配置和缓存
  ConfigManager,
  CacheManager,
  
  // 类型定义
  type Dependency,
  type VersionUpdate,
  type HealthScore,
  type PerformanceMetrics
} from '@ldesign/deps'
```

## DependencyManager

依赖管理核心类，提供依赖的增删改查操作。

### 构造函数

```typescript
constructor(options?: DependencyManagerOptions)
```

**选项:**

```typescript
interface DependencyManagerOptions {
  projectPath?: string      // 项目路径，默认当前目录
  packageJsonPath?: string  // package.json 路径
}
```

### 方法

#### getAllDependencies()

获取所有依赖。

```typescript
async getAllDependencies(): Promise<Record<string, Dependency>>
```

**返回值:**

```typescript
interface Dependency {
  name: string
  version: string
  type: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies'
  resolved?: string
  integrity?: string
}
```

**示例:**

```typescript
const manager = new DependencyManager()
const deps = await manager.getAllDependencies()

console.log(`总共 ${Object.keys(deps).length} 个依赖`)
for (const [name, dep] of Object.entries(deps)) {
  console.log(`${name}@${dep.version} (${dep.type})`)
}
```

#### getDependenciesByType()

按类型获取依赖。

```typescript
async getDependenciesByType(
  type: DependencyType
): Promise<Record<string, Dependency>>
```

**参数:**

- `type`: 依赖类型

```typescript
type DependencyType = 
  | 'dependencies'
  | 'devDependencies'
  | 'peerDependencies'
  | 'optionalDependencies'
```

**示例:**

```typescript
const prodDeps = await manager.getDependenciesByType('dependencies')
const devDeps = await manager.getDependenciesByType('devDependencies')

console.log(`生产依赖: ${Object.keys(prodDeps).length}`)
console.log(`开发依赖: ${Object.keys(devDeps).length}`)
```

#### getDependency()

获取单个依赖信息。

```typescript
async getDependency(name: string): Promise<Dependency | null>
```

**示例:**

```typescript
const react = await manager.getDependency('react')
if (react) {
  console.log(`React 版本: ${react.version}`)
}
```

#### addDependency()

添加新依赖。

```typescript
async addDependency(
  name: string,
  options: AddDependencyOptions
): Promise<void>
```

**选项:**

```typescript
interface AddDependencyOptions {
  version: string
  type?: DependencyType
  exact?: boolean      // 是否精确版本
  install?: boolean    // 是否立即安装
}
```

**示例:**

```typescript
// 添加生产依赖
await manager.addDependency('lodash', {
  version: '^4.17.21',
  type: 'dependencies'
})

// 添加精确版本的开发依赖
await manager.addDependency('typescript', {
  version: '5.7.3',
  type: 'devDependencies',
  exact: true
})
```

#### removeDependency()

移除依赖。

```typescript
async removeDependency(
  name: string,
  type?: DependencyType
): Promise<void>
```

**示例:**

```typescript
await manager.removeDependency('lodash')
```

#### updateDependency()

更新依赖版本。

```typescript
async updateDependency(
  name: string,
  version: string
): Promise<void>
```

**示例:**

```typescript
await manager.updateDependency('react', '18.3.0')
```

## VersionChecker

版本检查和更新检测。

### 构造函数

```typescript
constructor(options?: VersionCheckerOptions)
```

**选项:**

```typescript
interface VersionCheckerOptions {
  parallel?: boolean        // 是否并行检查
  concurrency?: number      // 并发数，默认 5
  timeout?: number          // 超时时间（毫秒）
  registry?: string         // npm registry URL
  showProgress?: boolean    // 是否显示进度
}
```

### 方法

#### checkUpdates()

检查依赖更新。

```typescript
async checkUpdates(
  dependencies: Record<string, string>
): Promise<VersionUpdate[]>
```

**返回值:**

```typescript
interface VersionUpdate {
  name: string
  current: string
  latest: string
  wanted: string          // 满足 semver 范围的最新版本
  hasUpdate: boolean
  type: 'major' | 'minor' | 'patch' | 'none'
  breaking: boolean       // 是否为破坏性更新
}
```

**示例:**

```typescript
const checker = new VersionChecker({ parallel: true })

const deps = {
  'react': '^18.2.0',
  'vue': '^3.3.0',
  'lodash': '^4.17.20'
}

const updates = await checker.checkUpdates(deps)

for (const update of updates) {
  if (update.hasUpdate) {
    console.log(`
${update.name}:
  当前: ${update.current}
  可用: ${update.wanted} (兼容)
  最新: ${update.latest}
  类型: ${update.type}
    `)
  }
}
```

#### checkUpdate()

检查单个包的更新。

```typescript
async checkUpdate(
  name: string,
  currentVersion: string
): Promise<VersionUpdate>
```

**示例:**

```typescript
const update = await checker.checkUpdate('react', '18.2.0')
if (update.hasUpdate) {
  console.log(`React 有更新: ${update.latest}`)
}
```

#### getLatestVersion()

获取包的最新版本。

```typescript
async getLatestVersion(name: string): Promise<string>
```

**示例:**

```typescript
const latest = await checker.getLatestVersion('react')
console.log(`React 最新版本: ${latest}`)
```

## DependencyHealthScorer

依赖健康度评估。

### 构造函数

```typescript
constructor(options?: HealthScorerOptions)
```

**选项:**

```typescript
interface HealthScorerOptions {
  weights?: {
    maintenance?: number   // 维护活跃度权重
    popularity?: number    // 社区热度权重
    quality?: number       // 质量评分权重
    security?: number      // 安全评分权重
  }
  cache?: boolean         // 是否使用缓存
}
```

### 方法

#### scorePackage()

评估单个包的健康度。

```typescript
async scorePackage(
  packageName: string,
  version?: string
): Promise<HealthScore>
```

**返回值:**

```typescript
interface HealthScore {
  packageName: string
  version: string
  overall: number        // 综合评分 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  scores: {
    maintenance: number  // 维护活跃度 0-100
    popularity: number   // 社区热度 0-100
    quality: number      // 质量评分 0-100
    security: number     // 安全评分 0-100
  }
  details: {
    maintenance: MaintenanceDetails
    popularity: PopularityDetails
    quality: QualityDetails
    security: SecurityDetails
  }
  issues: string[]       // 发现的问题
  recommendations: string[] // 建议
}

interface MaintenanceDetails {
  lastCommit: Date
  lastRelease: Date
  commitFrequency: number    // 每月提交数
  releaseFrequency: number   // 每年发布数
  issueResponseTime: number  // 小时
}

interface PopularityDetails {
  stars: number
  forks: number
  weeklyDownloads: number
  contributors: number
}

interface QualityDetails {
  hasTypeScript: boolean
  hasTests: boolean
  hasDocs: boolean
  codeQuality: number
}

interface SecurityDetails {
  vulnerabilities: number
  criticalVulnerabilities: number
  license: string
  licenseCompliant: boolean
}
```

**示例:**

```typescript
const scorer = new DependencyHealthScorer()
const health = await scorer.scorePackage('react')

console.log(`
${health.packageName}@${health.version}
综合评分: ${health.overall}/100 [${health.grade}]

详细评分:
- 维护活跃度: ${health.scores.maintenance}/100
- 社区热度: ${health.scores.popularity}/100
- 质量评分: ${health.scores.quality}/100
- 安全评分: ${health.scores.security}/100

维护信息:
- 最近提交: ${health.details.maintenance.lastCommit.toLocaleDateString()}
- 最近发布: ${health.details.maintenance.lastRelease.toLocaleDateString()}
- 提交频率: ${health.details.maintenance.commitFrequency} 次/月

社区热度:
- Stars: ${health.details.popularity.stars.toLocaleString()}
- 周下载: ${health.details.popularity.weeklyDownloads.toLocaleString()}
- 贡献者: ${health.details.popularity.contributors}
`)

if (health.issues.length > 0) {
  console.log('\n⚠️  问题:')
  health.issues.forEach(issue => console.log(`- ${issue}`))
}

if (health.recommendations.length > 0) {
  console.log('\n💡 建议:')
  health.recommendations.forEach(rec => console.log(`- ${rec}`))
}
```

#### scoreMultiple()

批量评估多个包。

```typescript
async scoreMultiple(
  packages: string[]
): Promise<HealthScore[]>
```

**示例:**

```typescript
const packages = ['react', 'vue', 'angular', 'svelte']
const scores = await scorer.scoreMultiple(packages)

// 按评分排序
scores.sort((a, b) => b.overall - a.overall)

scores.forEach((score, i) => {
  console.log(`${i + 1}. ${score.packageName}: ${score.overall}/100 [${score.grade}]`)
})
```

## PerformanceMonitor

性能监控和分析。

### 构造函数

```typescript
constructor(options?: PerformanceMonitorOptions)
```

**选项:**

```typescript
interface PerformanceMonitorOptions {
  includeBundle?: boolean
  bundler?: 'webpack' | 'vite' | 'rollup'
  benchmarkRuns?: number
}
```

### 方法

#### collectMetrics()

收集性能指标。

```typescript
async collectMetrics(
  options?: CollectMetricsOptions
): Promise<PerformanceMetrics>
```

**选项:**

```typescript
interface CollectMetricsOptions {
  includeBundle?: boolean
  fresh?: boolean      // 是否清除缓存后测试
}
```

**返回值:**

```typescript
interface PerformanceMetrics {
  installMetrics: InstallMetrics
  diskMetrics: DiskMetrics
  dependencyMetrics: DependencyMetrics
  bundleMetrics?: BundleMetrics
  topLargestDeps: Array<{ name: string; size: number }>
}

interface InstallMetrics {
  totalTime: number      // 毫秒
  networkTime: number
  extractTime: number
  linkTime: number
}

interface DiskMetrics {
  totalSize: number      // 字节
  fileCount: number
  directoryCount: number
}

interface DependencyMetrics {
  totalCount: number
  prodCount: number
  devCount: number
  maxDepth: number
}

interface BundleMetrics {
  totalSize: number      // 字节
  gzipSize: number
  brotliSize: number
  largestContributor: string
  treeshakeable: boolean
}
```

**示例:**

```typescript
const monitor = new PerformanceMonitor()
const metrics = await monitor.collectMetrics()

console.log(`
=== 性能报告 ===

安装性能:
- 总时间: ${(metrics.installMetrics.totalTime / 1000).toFixed(2)}s
- 网络: ${(metrics.installMetrics.networkTime / 1000).toFixed(2)}s
- 解压: ${(metrics.installMetrics.extractTime / 1000).toFixed(2)}s

磁盘占用:
- 总大小: ${(metrics.diskMetrics.totalSize / 1024 / 1024).toFixed(2)} MB
- 文件数: ${metrics.diskMetrics.fileCount.toLocaleString()}

依赖统计:
- 总数: ${metrics.dependencyMetrics.totalCount}
- 生产: ${metrics.dependencyMetrics.prodCount}
- 开发: ${metrics.dependencyMetrics.devCount}
- 最大深度: ${metrics.dependencyMetrics.maxDepth}

Top 10 最大依赖:
`)

metrics.topLargestDeps.forEach((dep, i) => {
  console.log(`${i + 1}. ${dep.name}: ${(dep.size / 1024).toFixed(2)} KB`)
})
```

#### benchmark()

性能基准测试。

```typescript
async benchmark(runs?: number): Promise<BenchmarkResult>
```

**返回值:**

```typescript
interface BenchmarkResult {
  freshInstall: number   // 首次安装时间（毫秒）
  cachedInstall: number  // 缓存安装时间
  ciInstall: number      // CI 环境安装时间
  averageInstall: number
}
```

**示例:**

```typescript
const benchmark = await monitor.benchmark(3)

console.log(`
基准测试结果 (3 次平均):
- 首次安装: ${(benchmark.freshInstall / 1000).toFixed(2)}s
- 缓存安装: ${(benchmark.cachedInstall / 1000).toFixed(2)}s
- CI 环境: ${(benchmark.ciInstall / 1000).toFixed(2)}s
- 平均: ${(benchmark.averageInstall / 1000).toFixed(2)}s
`)
```

## DependencyCostAnalyzer

依赖成本分析。

### 构造函数

```typescript
constructor(options?: CostAnalyzerOptions)
```

**选项:**

```typescript
interface CostAnalyzerOptions {
  ciRuns?: number        // 每月 CI 运行次数
  ciPricing?: Record<string, number>
  includeTrends?: boolean
}
```

### 方法

#### analyze()

执行成本分析。

```typescript
async analyze(
  options?: AnalyzeOptions
): Promise<CostAnalysis>
```

**返回值:**

```typescript
interface CostAnalysis {
  overallCost: OverallCost
  ciCost: CICost
  topExpensiveDeps: ExpensiveDep[]
  suggestions: CostSuggestion[]
  trends?: CostTrends
}

interface OverallCost {
  totalDependencies: number
  installTime: number      // 毫秒
  totalDiskSpace: number   // MB
  networkUsage: number     // MB
}

interface CICost {
  avgRunTime: number       // 秒
  monthlyRuns: number
  monthlyTime: number      // 总分钟数
  estimatedCost: number    // 美元
}

interface ExpensiveDep {
  name: string
  installTime: number
  size: number             // MB
  impact: 'high' | 'medium' | 'low'
}

interface CostSuggestion {
  type: 'replace' | 'remove' | 'optimize'
  package: string
  reason: string
  savings: {
    installTime: number
    diskSpace: number
    estimated: number      // 美元
  }
}
```

**示例:**

```typescript
const analyzer = new DependencyCostAnalyzer({ ciRuns: 1000 })
const analysis = await analyzer.analyze()

console.log(`
=== 成本分析 ===

总体成本:
- 依赖数: ${analysis.overallCost.totalDependencies}
- 安装时间: ${(analysis.overallCost.installTime / 1000).toFixed(2)}s
- 磁盘空间: ${analysis.overallCost.totalDiskSpace.toFixed(2)} MB
- 网络流量: ${analysis.overallCost.networkUsage.toFixed(2)} MB

CI/CD 成本:
- 单次运行: ${analysis.ciCost.avgRunTime.toFixed(2)}s
- 月运行次数: ${analysis.ciCost.monthlyRuns}
- 月总时间: ${analysis.ciCost.monthlyTime.toFixed(2)} 分钟
- 预估成本: $${analysis.ciCost.estimatedCost.toFixed(2)}/月
`)

if (analysis.suggestions.length > 0) {
  console.log('\n💡 优化建议:')
  analysis.suggestions.forEach(s => {
    console.log(`
${s.type === 'replace' ? '🔄' : s.type === 'remove' ? '❌' : '⚡'} ${s.package}
  原因: ${s.reason}
  节省: ${s.savings.installTime}ms, ${s.savings.diskSpace.toFixed(2)}MB, $${s.savings.estimated.toFixed(2)}/月
    `)
  })
}
```

## 类型定义

完整的 TypeScript 类型定义。

```typescript
// 依赖类型
export type DependencyType = 
  | 'dependencies'
  | 'devDependencies'
  | 'peerDependencies'
  | 'optionalDependencies'

// 更新类型
export type UpdateType = 'major' | 'minor' | 'patch' | 'none'

// 健康度等级
export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F'

// 严重程度
export type Severity = 'critical' | 'high' | 'moderate' | 'low'

// 迁移成本
export type MigrationCost = '低' | '中等' | '较高' | '很高'
```

## 错误处理

所有异步方法可能抛出以下错误：

```typescript
import { 
  DepsError,
  PackageNotFoundError,
  NetworkError,
  ValidationError 
} from '@ldesign/deps'

try {
  const manager = new DependencyManager()
  await manager.addDependency('invalid-package', { version: '1.0.0' })
} catch (error) {
  if (error instanceof PackageNotFoundError) {
    console.error('包不存在:', error.packageName)
  } else if (error instanceof NetworkError) {
    console.error('网络错误:', error.message)
  } else if (error instanceof ValidationError) {
    console.error('验证错误:', error.message)
  } else {
    console.error('未知错误:', error)
  }
}
```

## 完整示例

综合使用多个 API 的完整示例：

```typescript
import {
  DependencyManager,
  VersionChecker,
  DependencyHealthScorer,
  PerformanceMonitor,
  DependencyCostAnalyzer
} from '@ldesign/deps'

async function analyzeProject() {
  // 1. 获取所有依赖
  const manager = new DependencyManager()
  const deps = await manager.getAllDependencies()
  console.log(`项目有 ${Object.keys(deps).length} 个依赖`)
  
  // 2. 检查更新
  const checker = new VersionChecker({ parallel: true })
  const depsToCheck = Object.fromEntries(
    Object.values(deps).map(d => [d.name, d.version])
  )
  const updates = await checker.checkUpdates(depsToCheck)
  const hasUpdates = updates.filter(u => u.hasUpdate)
  console.log(`发现 ${hasUpdates.length} 个可更新的依赖`)
  
  // 3. 评估健康度
  const scorer = new DependencyHealthScorer()
  const healthScores = await scorer.scoreMultiple(Object.keys(deps))
  const lowScoreDeps = healthScores.filter(h => h.overall < 70)
  console.log(`发现 ${lowScoreDeps.length} 个低分依赖`)
  
  // 4. 性能分析
  const monitor = new PerformanceMonitor()
  const metrics = await monitor.collectMetrics()
  console.log(`node_modules 大小: ${(metrics.diskMetrics.totalSize / 1024 / 1024).toFixed(2)} MB`)
  
  // 5. 成本分析
  const costAnalyzer = new DependencyCostAnalyzer()
  const costAnalysis = await costAnalyzer.analyze()
  console.log(`预估 CI 成本: $${costAnalysis.ciCost.estimatedCost.toFixed(2)}/月`)
  
  // 6. 生成报告
  const report = {
    summary: {
      totalDeps: Object.keys(deps).length,
      updatesAvailable: hasUpdates.length,
      lowScoreDeps: lowScoreDeps.length,
      diskSize: metrics.diskMetrics.totalSize,
      monthlyCost: costAnalysis.ciCost.estimatedCost
    },
    updates: hasUpdates,
    lowScoreDeps: lowScoreDeps,
    topExpensiveDeps: costAnalysis.topExpensiveDeps,
    suggestions: costAnalysis.suggestions
  }
  
  return report
}

// 运行分析
analyzeProject()
  .then(report => {
    console.log('\n=== 分析报告 ===')
    console.log(JSON.stringify(report, null, 2))
  })
  .catch(error => {
    console.error('分析失败:', error)
  })
```

## 下一步

- 🎯 查看 [CLI 命令](/cli/commands) 学习命令行用法
- 🔧 阅读 [配置指南](/config/configuration) 自定义行为
- 💡 探索 [核心功能](/guide/core-features) 了解更多用法
