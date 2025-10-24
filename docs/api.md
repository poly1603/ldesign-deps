# API 文档

## 核心模块

### DependencyManager

完整的依赖管理 API。

```typescript
class DependencyManager {
  constructor(projectDir?: string)
  
  // 加载和读取
  loadPackageJson(): Promise<PackageJson>
  reloadPackageJson(): Promise<PackageJson>
  getAllDependencies(): Promise<Record<string, DependencyInfo>>
  getDependenciesByType(type): Promise<Record<string, DependencyInfo>>
  
  // 搜索和查询
  searchDependencies(query: string): Promise<DependencyInfo[]>
  hasDependency(name: string): Promise<boolean>
  
  // 添加和删除
  addDependency(name: string, version: string, type?): Promise<void>
  addDependencies(deps: Array<{name, version, type?}>): Promise<void>
  removeDependency(name: string): Promise<void>
  removeDependencies(names: string[]): Promise<void>
  
  // 更新
  updateDependencyVersion(name: string, version: string): Promise<void>
  
  // 工具方法
  resolveVersionRange(versionRange: string): { min?: string; max?: string } | null
  getOverrides(): Promise<Record<string, string>>
  setOverride(packageName: string, version: string): Promise<void>
}
```

### VersionChecker

版本检查和更新检测。

```typescript
class VersionChecker {
  constructor(cache?: CacheManager, parallelConfig?: Partial<ParallelConfig>)
  
  // 版本信息
  getLatestVersion(packageName: string): Promise<VersionInfo>
  getAllVersions(packageName: string): Promise<VersionInfo>
  
  // 更新检查
  checkUpdate(packageName: string, currentVersion: string): Promise<UpdateAvailable>
  checkUpdates(deps: Record<string, string>, onProgress?): Promise<UpdateAvailable[]>
  checkOutdated(deps: Record<string, string>): Promise<UpdateAvailable[]>
  
  // 工具方法
  groupUpdatesBySeverity(updates): { major, minor, patch }
  clearCache(): void
  getCacheStats(): CacheStats
}
```

### SecurityAuditor

安全审计和漏洞扫描。

```typescript
class SecurityAuditor {
  constructor(projectDir?: string, config?: Partial<SecurityConfig>)
  
  // 审计功能
  audit(): Promise<SecurityAuditResult>
  scanVulnerabilities(): Promise<VulnerabilityInfo[]>
  checkLicenses(): Promise<LicenseInfo[]>
  
  // 报告生成
  generateReport(result: SecurityAuditResult): string
}
```

### DependencyVisualizer

依赖可视化和分析。

```typescript
class DependencyVisualizer {
  constructor(projectDir?: string)
  
  // 树和图生成
  generateTree(maxDepth?: number): Promise<DependencyTree>
  exportGraph(options: DependencyGraphOptions): Promise<string>
  detectCircularDependencies(nodes): CircularDependency[]
  
  // 依赖查询
  findDependencyPath(targetPackage: string): Promise<string[][]>
  analyzeSizes(): Promise<Map<string, number>>
}
```

### WorkspaceManager

Monorepo 工作区管理。

```typescript
class WorkspaceManager {
  constructor(projectDir?: string)
  
  // 工作区分析
  analyzeWorkspace(): Promise<WorkspaceInfo>
  detectWorkspaceType(): Promise<'pnpm' | 'yarn' | 'npm' | 'lerna' | null>
  scanPackages(type): Promise<WorkspacePackage[]>
  
  // 依赖分析
  analyzeVersionConflicts(): Promise<WorkspaceAnalysis>
  
  // 依赖同步
  syncDependencyVersions(depName: string, targetVersion: string): Promise<void>
  updateAllPackages(command: string[]): Promise<void>
}
```

### PackageUpdater

包更新和安装。

```typescript
class PackageUpdater {
  constructor(projectDir?: string, config?: Partial<UpdateConfig>)
  
  // 包管理器
  detectPackageManager(): Promise<'npm' | 'pnpm' | 'yarn'>
  
  // 更新操作
  updatePackage(packageName: string, version?: string): Promise<UpdateResult>
  updatePackages(packages): Promise<UpdateResult[]>
  
  // 安装操作
  install(): Promise<UpdateResult>
  reinstall(): Promise<UpdateResult>
  
  // 维护操作
  dedupe(): Promise<UpdateResult>
  rollback(): Promise<UpdateResult>
}
```

### DependencyAnalyzer

依赖使用分析。

```typescript
class DependencyAnalyzer {
  constructor(projectDir?: string, config?: Partial<AnalyzeConfig>)
  
  // 分析功能
  analyze(): Promise<DependencyAnalysis>
  quickAnalyze(): Promise<Partial<DependencyAnalysis>>
  
  // 特定检查
  getUnusedDependencies(): Promise<string[]>
  getMissingDependencies(): Promise<string[]>
  findDuplicates(): Promise<DuplicateDependency[]>
  
  // 详细分析
  analyzeUsageDetails(): Promise<Record<string, { files: string[]; count: number }>>
  
  // 报告
  generateReport(analysis): string
}
```

### CacheManager

缓存管理和性能优化。

```typescript
class CacheManager {
  constructor(config?: Partial<CacheConfig>)
  
  // 缓存操作
  get<T>(key: string): T | null
  set<T>(key: string, value: T, ttl?: number): void
  has(key: string): boolean
  delete(key: string): boolean
  clear(): void
  
  // 持久化
  persist(): Promise<void>
  load(): Promise<void>
  
  // 统计
  getStats(): CacheStats
  
  // 静态方法
  static generateKey(...parts: string[]): string
}
```

## 类型定义

详见 [types/index.ts](../src/types/index.ts)

### 基础类型

- `PackageJson`
- `DependencyInfo`
- `VersionInfo`
- `UpdateAvailable`
- `UpdateResult`

### 安全相关

- `SecurityAuditResult`
- `VulnerabilityInfo`
- `LicenseInfo`
- `SecurityScore`
- `SecuritySummary`

### 可视化相关

- `DependencyTree`
- `DependencyNode`
- `CircularDependency`
- `GraphExportFormat`

### Monorepo 相关

- `WorkspaceInfo`
- `WorkspacePackage`
- `CrossDependency`
- `PhantomDependency`
- `WorkspaceAnalysis`

### 配置相关

- `DepsConfig`
- `CacheConfig`
- `SecurityConfig`
- `UpdateConfig`
- `AnalyzeConfig`
- `WorkspaceConfig`

### 错误类型

- `DependencyError`
- `NetworkError`
- `ParseError`

## 使用示例

查看 [examples](../examples) 目录获取完整示例。

