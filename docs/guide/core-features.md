# 核心功能

深入了解 @ldesign/deps 的核心功能模块。

## 依赖管理核心

### DependencyManager

依赖管理器提供了完整的依赖 CRUD 操作。

#### 获取依赖

```typescript
import { DependencyManager } from '@ldesign/deps'

const manager = new DependencyManager()

// 获取所有依赖
const allDeps = await manager.getAllDependencies()

// 按类型获取
const prodDeps = await manager.getDependenciesByType('dependencies')
const devDeps = await manager.getDependenciesByType('devDependencies')

// 获取单个依赖
const reactDep = await manager.getDependency('react')
```

#### 添加依赖

```typescript
// 添加生产依赖
await manager.addDependency('react', {
  version: '^18.2.0',
  type: 'dependencies'
})

// 添加开发依赖
await manager.addDependency('typescript', {
  version: '^5.7.3',
  type: 'devDependencies'
})
```

#### 移除依赖

```typescript
await manager.removeDependency('lodash', 'dependencies')
```

### VersionChecker

检查依赖版本更新。

```typescript
import { VersionChecker } from '@ldesign/deps'

const checker = new VersionChecker()

// 检查单个包
const updates = await checker.checkUpdates({
  'react': '^18.2.0',
  'vue': '^3.3.0'
})

for (const update of updates) {
  if (update.hasUpdate) {
    console.log(`${update.name}: ${update.current} → ${update.latest}`)
  }
}
```

#### 并行检查

```typescript
// 启用并行检查以提高速度
const checker = new VersionChecker({ parallel: true })
const updates = await checker.checkUpdates(dependencies)
```

### DependencyUpdater

智能更新依赖版本。

```typescript
import { DependencyUpdater } from '@ldesign/deps'

const updater = new DependencyUpdater()

// 更新单个包
await updater.updateDependency('react', '18.3.0')

// 批量更新
await updater.updateMultiple([
  { name: 'react', version: '18.3.0' },
  { name: 'vue', version: '3.4.0' }
])

// 更新到最新版本
await updater.updateToLatest('react')
```

#### 安全更新

```typescript
// 只更新补丁版本（安全更新）
await updater.updateDependency('react', '18.2.1', { onlyPatch: true })

// 模拟更新（不实际写入）
const result = await updater.updateDependency('react', '18.3.0', { dryRun: true })
console.log(result.changes)
```

## 健康度评估

### DependencyHealthScorer

全方位评估依赖的健康状况。

```typescript
import { DependencyHealthScorer } from '@ldesign/deps'

const scorer = new DependencyHealthScorer()

// 评估单个包
const health = await scorer.scorePackage('react')

console.log(`
包名: ${health.packageName}
版本: ${health.version}
综合评分: ${health.overall}/100
等级: ${health.grade}

详细评分:
- 维护活跃度: ${health.scores.maintenance}/100
- 社区热度: ${health.scores.popularity}/100
- 质量评分: ${health.scores.quality}/100
- 安全评分: ${health.scores.security}/100
`)
```

#### 评分体系

健康度评分由以下维度组成：

**维护活跃度 (30%)**
- 最近提交时间
- 发布频率
- Issue 响应时间
- PR 合并速度

**社区热度 (25%)**
- GitHub Stars
- NPM 周下载量
- Fork 数量
- 贡献者数量

**质量评分 (25%)**
- 测试覆盖率
- 文档质量
- TypeScript 支持
- 代码质量

**安全评分 (20%)**
- 已知漏洞数量
- 漏洞严重程度
- License 合规性
- 依赖安全性

#### 等级评定

- **A (90-100)**: 优秀，可放心使用
- **B (80-89)**: 良好，推荐使用
- **C (70-79)**: 一般，可以使用但需关注
- **D (60-69)**: 较差，建议考虑替代方案
- **F (0-59)**: 不推荐，应寻找替代方案

#### 批量评估

```typescript
// 评估所有依赖
const manager = new DependencyManager()
const deps = await manager.getAllDependencies()

const results = await Promise.all(
  Object.keys(deps).map(name => scorer.scorePackage(name))
)

// 筛选低分依赖
const lowScoreDeps = results.filter(r => r.overall < 70)
console.log(`发现 ${lowScoreDeps.length} 个低分依赖`)
```

## 性能监控

### PerformanceMonitor

全方位性能分析和监控。

```typescript
import { PerformanceMonitor } from '@ldesign/deps'

const monitor = new PerformanceMonitor()

// 收集性能指标
const metrics = await monitor.collectMetrics()

console.log(`
=== 安装性能 ===
总安装时间: ${metrics.installMetrics.totalTime}ms
网络耗时: ${metrics.installMetrics.networkTime}ms
解压耗时: ${metrics.installMetrics.extractTime}ms

=== 磁盘占用 ===
node_modules 大小: ${(metrics.diskMetrics.totalSize / 1024 / 1024).toFixed(2)} MB
文件数量: ${metrics.diskMetrics.fileCount}

=== 依赖统计 ===
总依赖数: ${metrics.dependencyMetrics.totalCount}
生产依赖: ${metrics.dependencyMetrics.prodCount}
开发依赖: ${metrics.dependencyMetrics.devCount}
依赖深度: ${metrics.dependencyMetrics.maxDepth}

=== Top 10 最大依赖 ===
`)

metrics.topLargestDeps.forEach((dep, i) => {
  console.log(`${i + 1}. ${dep.name}: ${(dep.size / 1024).toFixed(2)} KB`)
})
```

#### Bundle 大小分析

```typescript
// 包含 bundle 大小分析（需要构建配置）
const metrics = await monitor.collectMetrics({
  includeBundle: true,
  bundler: 'webpack' // 或 'vite', 'rollup'
})

console.log(`
=== Bundle 影响 ===
Bundle 大小: ${(metrics.bundleMetrics.totalSize / 1024).toFixed(2)} KB
Gzip 后: ${(metrics.bundleMetrics.gzipSize / 1024).toFixed(2)} KB
最大依赖贡献: ${metrics.bundleMetrics.largestContributor}
`)
```

#### 性能基准测试

```typescript
// 性能基准测试
const benchmark = await monitor.benchmark()

console.log(`
首次安装: ${benchmark.freshInstall}ms
缓存安装: ${benchmark.cachedInstall}ms
CI 环境: ${benchmark.ciInstall}ms
`)
```

## 成本分析

### DependencyCostAnalyzer

量化依赖的真实成本。

```typescript
import { DependencyCostAnalyzer } from '@ldesign/deps'

const analyzer = new DependencyCostAnalyzer()

const analysis = await analyzer.analyze()

console.log(`
=== 总体成本 ===
总依赖数: ${analysis.overallCost.totalDependencies}
安装时间: ${(analysis.overallCost.installTime / 1000).toFixed(2)}s
磁盘空间: ${analysis.overallCost.totalDiskSpace.toFixed(2)} MB
网络流量: ${analysis.overallCost.networkUsage.toFixed(2)} MB

=== CI/CD 成本 ===
单次运行时间: ${analysis.ciCost.avgRunTime.toFixed(2)}s
月运行次数: ${analysis.ciCost.monthlyRuns}
月总时间: ${(analysis.ciCost.monthlyTime / 3600).toFixed(2)} 小时
预估成本: $${analysis.ciCost.estimatedCost.toFixed(2)}/月

=== Top 10 最贵依赖 ===
`)

analysis.topExpensiveDeps.forEach((dep, i) => {
  console.log(`${i + 1}. ${dep.name}`)
  console.log(`   安装: ${dep.installTime}ms | 大小: ${dep.size.toFixed(2)} MB`)
})
```

#### 趋势分析

```typescript
// 包含历史趋势（需要历史数据）
const analysis = await analyzer.analyze({ includeTrends: true })

if (analysis.trends) {
  console.log(`
=== 成本趋势 ===
依赖数变化: ${analysis.trends.dependencyCountChange > 0 ? '+' : ''}${analysis.trends.dependencyCountChange}
安装时间变化: ${analysis.trends.installTimeChange > 0 ? '+' : ''}${analysis.trends.installTimeChange}ms
磁盘空间变化: ${analysis.trends.diskSpaceChange > 0 ? '+' : ''}${analysis.trends.diskSpaceChange.toFixed(2)} MB
  `)
}
```

#### 优化建议

```typescript
// 获取优化建议
const suggestions = await analyzer.getOptimizationSuggestions()

suggestions.forEach(suggestion => {
  console.log(`
${suggestion.type === 'replace' ? '🔄 替换' : '❌ 移除'}: ${suggestion.package}
原因: ${suggestion.reason}
预计节省: ${suggestion.savings.installTime}ms 安装时间, ${suggestion.savings.diskSpace.toFixed(2)} MB 空间
  `)
})
```

## 智能替代方案

### DependencyAlternativesFinder

智能查找并推荐依赖替代方案。

```typescript
import { DependencyAlternativesFinder } from '@ldesign/deps'

const finder = new DependencyAlternativesFinder()

// 查找单个包的替代方案
const result = await finder.findAlternatives('moment')

if (result) {
  console.log(`
📦 ${result.package} 的替代方案
原因: ${result.reason}

推荐替代方案:
  `)
  
  result.alternatives.forEach((alt, i) => {
    console.log(`
${i + 1}. ${alt.name}
   描述: ${alt.description}
   健康度: ${alt.healthScore}/100 [${alt.grade}]
   大小: ${alt.size} (vs ${result.currentSize})
   周下载量: ${alt.weeklyDownloads.toLocaleString()}
   迁移成本: ${alt.migrationCost}
   推荐度: ${alt.recommendation}
    `)
  })
}
```

#### 批量查找

```typescript
// 查找所有过时依赖的替代方案
const allAlternatives = await finder.findAllAlternatives({
  threshold: 60 // 只查找健康度低于 60 的包
})

console.log(`发现 ${allAlternatives.length} 个需要替代的依赖`)

allAlternatives.forEach(result => {
  console.log(`\n${result.package}: ${result.alternatives.length} 个替代方案`)
})
```

#### 自定义替代策略

```typescript
// 自定义查找策略
const result = await finder.findAlternatives('lodash', {
  criteria: {
    minHealthScore: 80,
    maxSize: '50KB',
    minWeeklyDownloads: 100000
  },
  sortBy: 'healthScore' // 或 'size', 'popularity'
})
```

## 安全审计

### SecurityAuditor

全面的安全漏洞检测和分析。

```typescript
import { SecurityAuditor } from '@ldesign/deps'

const auditor = new SecurityAuditor()

// 执行安全审计
const report = await auditor.audit()

console.log(`
=== 安全审计报告 ===
总漏洞数: ${report.totalVulnerabilities}
严重: ${report.critical}
高危: ${report.high}
中危: ${report.moderate}
低危: ${report.low}
`)

// 详细漏洞信息
report.vulnerabilities.forEach(vuln => {
  console.log(`
【${vuln.severity.toUpperCase()}】${vuln.title}
影响包: ${vuln.module_name}@${vuln.vulnerable_versions}
修复版本: ${vuln.patched_versions}
建议: ${vuln.recommendation}
  `)
})
```

#### 自动修复

```typescript
// 尝试自动修复
const fixResult = await auditor.fix()

console.log(`
修复成功: ${fixResult.fixed.length} 个漏洞
需要手动处理: ${fixResult.manual.length} 个漏洞
`)

fixResult.manual.forEach(issue => {
  console.log(`手动修复 ${issue.package}: ${issue.reason}`)
})
```

#### License 检查

```typescript
// 检查 License 合规性
const licenseReport = await auditor.checkLicenses({
  allowed: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC']
})

if (licenseReport.violations.length > 0) {
  console.log('⚠️  发现 License 合规问题:')
  licenseReport.violations.forEach(v => {
    console.log(`${v.package}: ${v.license} (不在允许列表中)`)
  })
}
```

## 依赖分析

### DependencyAnalyzer

深度静态分析依赖使用情况。

```typescript
import { DependencyAnalyzer } from '@ldesign/deps'

const analyzer = new DependencyAnalyzer()

// 完整分析
const analysis = await analyzer.analyze()

console.log(`
=== 未使用的依赖 ===
`)
analysis.unusedDeps.forEach(dep => {
  console.log(`- ${dep.name} (${dep.type})`)
})

console.log(`
=== 缺失的依赖 ===
`)
analysis.missingDeps.forEach(dep => {
  console.log(`- ${dep.name} (在 ${dep.usedIn.join(', ')} 中使用)`)
})

console.log(`
=== 重复的依赖 ===
`)
analysis.duplicateDeps.forEach(dup => {
  console.log(`- ${dup.name}:`)
  dup.versions.forEach(v => {
    console.log(`  - ${v.version} (${v.count} 次)`)
  })
})
```

#### 自定义分析

```typescript
// 只检查特定类型
const analysis = await analyzer.analyze({
  checkUnused: true,
  checkMissing: false,
  checkDuplicates: true,
  excludePatterns: ['test/**', '**/*.spec.ts']
})
```

## 依赖可视化

### DependencyTreeGenerator

生成可读的依赖树。

```typescript
import { DependencyTreeGenerator } from '@ldesign/deps'

const generator = new DependencyTreeGenerator()

// 生成完整依赖树
const tree = await generator.generate()
console.log(tree.toString())

// 限制深度
const shallowTree = await generator.generate({ maxDepth: 2 })

// 只显示生产依赖
const prodTree = await generator.generate({ production: true })
```

### DependencyGraphExporter

导出多种格式的依赖图。

```typescript
import { DependencyGraphExporter } from '@ldesign/deps'

const exporter = new DependencyGraphExporter()

// 导出 Mermaid 格式
const mermaid = await exporter.export('mermaid')
await fs.writeFile('deps.md', `\`\`\`mermaid\n${mermaid}\n\`\`\``)

// 导出 DOT 格式 (Graphviz)
const dot = await exporter.export('dot')
await fs.writeFile('deps.dot', dot)

// 导出 JSON
const json = await exporter.export('json')
await fs.writeFile('deps.json', JSON.stringify(json, null, 2))
```

## Monorepo 支持

### WorkspaceAnalyzer

Monorepo 工作区分析和管理。

```typescript
import { WorkspaceAnalyzer } from '@ldesign/deps'

const analyzer = new WorkspaceAnalyzer()

// 扫描工作区
const workspaces = await analyzer.scanWorkspaces()

console.log(`发现 ${workspaces.length} 个工作区包:`)
workspaces.forEach(ws => {
  console.log(`- ${ws.name}@${ws.version} (${ws.path})`)
})

// 分析版本冲突
const conflicts = await analyzer.analyzeConflicts()

if (conflicts.length > 0) {
  console.log('\n⚠️  发现版本冲突:')
  conflicts.forEach(conflict => {
    console.log(`\n${conflict.package}:`)
    conflict.versions.forEach(v => {
      console.log(`  - ${v.version} 在 ${v.workspaces.join(', ')}`)
    })
  })
}

// 优化建议
const suggestions = await analyzer.getOptimizationSuggestions()
suggestions.forEach(s => {
  console.log(`💡 ${s.title}: ${s.description}`)
})
```

## 下一步

- 🎯 查看 [CLI 命令](/cli/commands) 学习如何在命令行使用
- 🔧 阅读 [配置指南](/config/configuration) 自定义行为
- 💡 探索 [最佳实践](/guide/best-practices) 优化工作流
