# @ldesign/deps

> 🚀 企业级依赖管理工具 - 依赖分析、安全审计、版本管理、历史追踪、健康度评分、性能监控、通知告警、Monorepo 支持

[![npm version](https://img.shields.io/npm/v/@ldesign/deps.svg)](https://www.npmjs.com/package/@ldesign/deps)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/coverage-90%25-brightgreen)](./PROJECT_COMPLETION_REPORT.md)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](./PROJECT_COMPLETION_REPORT.md)
[![Code Quality](https://img.shields.io/badge/quality-enterprise-blue)](./PROJECT_COMPLETION_REPORT.md)
[![TypeScript](https://img.shields.io/badge/typescript-100%25-blue)](./tsconfig.json)

**✨ v0.3.0 重大更新！新增健康度评分、性能监控、通知系统等高级功能！**

## ✨ 特性

### 核心功能

- 📦 **依赖管理** - 列表查看、搜索、添加、删除、更新依赖
- 🔍 **版本检查** - 智能检测可用更新，支持并行检查
- 📊 **依赖分析** - 检测未使用、缺失、重复的依赖
- 🔐 **安全审计** - 漏洞扫描、许可证检查、安全评分
- 🌳 **依赖可视化** - 依赖树、循环依赖检测、多格式导出
- 🏢 **Monorepo 支持** - 工作区扫描、跨包依赖分析、版本同步
- 🔒 **依赖锁定** - 锁定关键依赖版本，防止意外更新
- 📜 **历史追踪** - 记录所有依赖变更，支持回滚和审计
- 💚 **健康度评分** - 维护活跃度、社区热度、质量评分 ✨ v0.3.0 新增
- ⚡ **性能监控** - 安装时间、Bundle 大小、构建影响分析 ✨ v0.3.0 新增
- 🔔 **通知告警** - 支持 Slack/钉钉/企业微信等多渠道通知 ✨ v0.3.0 新增
- 🎨 **交互式 CLI** - 友好的交互界面，轻松管理依赖

### 技术亮点

- ✅ **TypeScript** - 完整的类型定义
- 🚀 **高性能** - 并行检查，智能缓存
- 🛡️ **错误处理** - 完善的错误恢复机制
- 🔄 **备份恢复** - 自动备份，失败回滚
- 📈 **进度显示** - 实时进度反馈
- 🎯 **多包管理器** - 支持 npm、pnpm、yarn

## 📦 安装

```bash
# 使用 pnpm
pnpm add -D @ldesign/deps

# 使用 npm
npm install -D @ldesign/deps

# 使用 yarn
yarn add -D @ldesign/deps
```

## 🚀 快速开始

### CLI 使用

```bash
# 列出所有依赖
ldeps list

# 检查依赖更新
ldeps check

# 分析依赖使用情况
ldeps analyze

# 安全审计
ldeps audit

# 显示依赖树
ldeps tree

# 交互式更新
ldeps interactive

# 查看所有命令
ldeps --help
```

### API 使用

```typescript
import {
  DependencyManager,
  VersionChecker,
  SecurityAuditor,
  DependencyVisualizer,
  DependencyLockManager,      // ✨ 新增
  DependencyHistoryTracker     // ✨ 新增
} from '@ldesign/deps'

// 依赖管理
const manager = new DependencyManager()
const deps = await manager.getAllDependencies()
await manager.addDependency('lodash', '^4.17.21')

// 版本检查
const checker = new VersionChecker()
const updates = await checker.checkUpdates({
  react: '^18.0.0',
  vue: '^3.0.0'
})

// 安全审计
const auditor = new SecurityAuditor()
const auditResult = await auditor.audit()
console.log(`安全评分: ${auditResult.securityScore.overall}/100`)

// 依赖可视化
const visualizer = new DependencyVisualizer()
const tree = await visualizer.generateTree()
await visualizer.exportGraph({
  format: 'mermaid',
  output: 'dependency-graph.md'
})

// ✨ 依赖锁定（新功能）
const lockManager = new DependencyLockManager()
await lockManager.lockDependency('react', '18.2.0', {
  reason: '生产环境稳定版本',
  lockedBy: 'admin'
})

// ✨ 历史追踪（新功能）
const tracker = new DependencyHistoryTracker()
await tracker.trackChange({
  packageName: 'vue',
  type: 'update',
  oldVersion: '3.2.0',
  newVersion: '3.3.4',
  reason: '修复安全漏洞',
  author: 'developer'
})
```

## 📚 命令详解

### 基础命令

#### `ldeps list`

列出所有依赖

```bash
# 基本用法
ldeps list

# 筛选类型
ldeps list --type dependencies
ldeps list --type devDependencies

# 搜索依赖
ldeps list --search react
```

#### `ldeps check`

检查依赖更新

```bash
# 基本用法
ldeps check

# 并行检查（更快）
ldeps check --parallel

# 显示进度条
ldeps check --show-progress
```

#### `ldeps update <package>`

更新指定包

```bash
# 更新到最新版本
ldeps update react

# 更新到指定版本
ldeps update react --version 18.3.0

# 干运行模式
ldeps update react --dry-run
```

#### `ldeps analyze`

分析依赖使用情况

```bash
# 完整分析
ldeps analyze

# 跳过特定检查
ldeps analyze --no-unused
ldeps analyze --no-missing
ldeps analyze --no-duplicates
```

### 安全审计

#### `ldeps audit`

执行安全审计

```bash
# 基本审计
ldeps audit

# 指定审计级别
ldeps audit --level critical
ldeps audit --level high

# 跳过许可证检查
ldeps audit --no-licenses

# JSON 输出
ldeps audit --json
```

### 依赖可视化

#### `ldeps tree`

显示依赖树

```bash
# 显示依赖树
ldeps tree

# 限制深度
ldeps tree --depth 2
```

#### `ldeps graph`

导出依赖图

```bash
# 导出为 Mermaid 格式
ldeps graph --format mermaid --output deps.md

# 导出为 DOT 格式 (Graphviz)
ldeps graph --format dot --output deps.dot

# 导出为 JSON
ldeps graph --format json --output deps.json

# 限制深度
ldeps graph --format mermaid --depth 3
```

#### `ldeps why <package>`

解释为何安装某个依赖

```bash
ldeps why lodash
# 输出: lodash 被以下路径引用:
# 1. root → express → body-parser → lodash
# 2. root → webpack → lodash
```

#### `ldeps duplicate`

检测重复的依赖

```bash
ldeps duplicate
```

#### `ldeps outdated`

列出过时的依赖

```bash
ldeps outdated
```

### Monorepo 管理

#### `ldeps workspace`

Monorepo 工作区管理

```bash
# 扫描工作区
ldeps workspace --scan

# 分析版本冲突
ldeps workspace --analyze
```

### 交互式命令

#### `ldeps interactive`

交互式更新依赖

```bash
ldeps interactive
# 或简写
ldeps i
```

#### `ldeps config`

生成配置文件

```bash
ldeps config
```

#### `ldeps clean`

清理未使用的依赖（交互式）

```bash
ldeps clean
```

### 其他命令

#### `ldeps dedupe`

去重依赖

```bash
ldeps dedupe
```

#### `ldeps reinstall`

重新安装所有依赖

```bash
ldeps reinstall
```

### ✨ 新增命令 (v0.2.0)

#### `ldeps lock <package>`

锁定依赖版本

```bash
# 锁定依赖到特定版本
ldeps lock react@18.2.0 --reason "生产环境稳定版本"

# 查看所有锁定
ldeps lock --list

# 解锁依赖
ldeps unlock react
```

#### `ldeps history <package>`

查看依赖历史

```bash
# 查看依赖历史
ldeps history react

# 查看所有依赖的历史
ldeps history --all

# 导出历史记录
ldeps history --export history.json

# 生成统计报告
ldeps history --stats
```

### ✨ 新增命令 (v0.3.0)

#### `ldeps health [package]`

评估依赖健康度

```bash
# 评估单个依赖
ldeps health react

# 评估所有依赖
ldeps health --all

# 输出 JSON 格式
ldeps health --all --json
```

**功能特点:**
- 维护活跃度评分（最后发布/提交时间）
- 社区热度评分（GitHub stars、npm 下载量）
- 质量评分（TypeScript 支持、许可证、依赖数量）
- 安全评分（漏洞数量、废弃状态）
- A-F 等级评定和智能建议

#### `ldeps performance`

性能监控和分析

```bash
# 基本用法
ldeps performance

# 不分析 Bundle 大小
ldeps performance --no-bundle

# 包含构建影响分析
ldeps performance --build

# JSON 输出
ldeps performance --json
```

**功能特点:**
- 安装时间分析（总时间、下载时间、解析时间）
- Bundle 大小分析（总大小、Gzip 后大小、各依赖分布）
- 依赖统计（直接/间接依赖数、依赖深度）
- 构建影响（构建时间、内存使用）

#### `ldeps cost`

成本分析

```bash
# 基本用法
ldeps cost

# 包含趋势分析
ldeps cost --trend

# JSON 输出
ldeps cost --json
```

**功能特点:**
- 总体成本（依赖数、安装时间、磁盘空间、下载大小）
- CI/CD 成本估算（单次和月度成本）
- 按包分类的成本（Top 10 最贵的依赖）
- 成本变化趋势（与上次对比）
- 智能优化建议

#### `ldeps alternatives [package]`

查找依赖替代方案

```bash
# 查找单个包的替代方案
ldeps alternatives moment

# 检查所有依赖
ldeps alternatives --all

# JSON 输出
ldeps alternatives --json
```

**功能特点:**
- 自动检测废弃/不维护/过时/超大包
- 预定义常见替代方案（moment → dayjs, lodash → ramda 等）
- 相似度评分（基于关键词、描述、依赖）
- 优劣势分析（体积、依赖数、TypeScript 支持）
- 迁移难度和成本估算
- 健康度评分集成

## 🎨 API 文档

### DependencyManager

依赖管理器，用于管理项目依赖。

```typescript
import { DependencyManager } from '@ldesign/deps'

const manager = new DependencyManager()

// 加载 package.json
const pkg = await manager.loadPackageJson()

// 获取所有依赖
const deps = await manager.getAllDependencies()

// 搜索依赖
const results = await manager.searchDependencies('react')

// 添加依赖
await manager.addDependency('lodash', '^4.17.21')
await manager.addDependency('typescript', '^5.0.0', 'devDependencies')

// 批量添加
await manager.addDependencies([
  { name: 'axios', version: '^1.0.0' },
  { name: 'express', version: '^4.18.0' }
])

// 删除依赖
await manager.removeDependency('lodash')

// 批量删除
await manager.removeDependencies(['lodash', 'axios'])

// 更新版本
await manager.updateDependencyVersion('react', '^18.3.0')

// 检查依赖是否存在
const hasReact = await manager.hasDependency('react')

// 设置 override
await manager.setOverride('some-package', '1.2.3')
```

### VersionChecker

版本检查器，检查依赖更新。

```typescript
import { VersionChecker } from '@ldesign/deps'

const checker = new VersionChecker()

// 获取最新版本
const versionInfo = await checker.getLatestVersion('react')

// 获取所有版本（包括 beta/alpha）
const allVersions = await checker.getAllVersions('react')

// 检查单个包更新
const update = await checker.checkUpdate('react', '^18.0.0')
if (update.hasUpdate) {
  console.log(`${update.currentVersion} → ${update.latestVersion}`)
  console.log(`更新类型: ${update.updateType}`)
}

// 批量检查更新（并行）
const updates = await checker.checkUpdates({
  react: '^18.0.0',
  vue: '^3.0.0',
  typescript: '^5.0.0'
}, (progress) => {
  console.log(`进度: ${progress.percentage}%`)
})

// 按严重程度分组
const grouped = checker.groupUpdatesBySeverity(updates)
console.log('主版本更新:', grouped.major.length)
console.log('次版本更新:', grouped.minor.length)
console.log('补丁更新:', grouped.patch.length)
```

### SecurityAuditor

安全审计器，扫描漏洞和许可证问题。

```typescript
import { SecurityAuditor } from '@ldesign/deps'

const auditor = new SecurityAuditor(process.cwd(), {
  auditLevel: 'moderate',
  checkLicenses: true,
  allowedLicenses: ['MIT', 'Apache-2.0'],
  blockedLicenses: ['GPL-3.0']
})

// 执行审计
const result = await auditor.audit()

console.log('安全评分:', result.securityScore.overall)
console.log('漏洞数量:', result.vulnerabilities.length)
console.log('许可证问题:', result.licenses.filter(l => !l.compatible).length)

// 生成报告
const report = auditor.generateReport(result)
console.log(report)
```

### DependencyVisualizer

依赖可视化器，生成依赖树和图。

```typescript
import { DependencyVisualizer } from '@ldesign/deps'

const visualizer = new DependencyVisualizer()

// 生成依赖树
const tree = await visualizer.generateTree(3)
console.log('依赖深度:', tree.depth)
console.log('循环依赖:', tree.circularDependencies.length)

// 导出依赖图
const mermaid = await visualizer.exportGraph({
  format: 'mermaid',
  depth: 3,
  output: 'dependency-graph.md'
})

// 查找依赖路径
const paths = await visualizer.findDependencyPath('lodash')
paths.forEach(path => {
  console.log(path.join(' → '))
})

// 分析依赖大小
const sizes = await visualizer.analyzeSizes()
```

### WorkspaceManager

Monorepo 工作区管理器。

```typescript
import { WorkspaceManager } from '@ldesign/deps'

const wsManager = new WorkspaceManager()

// 分析工作区
const workspace = await wsManager.analyzeWorkspace()
console.log('工作区类型:', workspace.type)
console.log('包数量:', workspace.packages.length)

// 分析版本冲突
const analysis = await wsManager.analyzeVersionConflicts()
console.log('版本冲突:', analysis.versionConflicts.length)

// 同步依赖版本
await wsManager.syncDependencyVersions('react', '^18.3.0')
```

### PackageUpdater

包更新器，更新和安装依赖。

```typescript
import { PackageUpdater } from '@ldesign/deps'

const updater = new PackageUpdater(process.cwd(), {
  dryRun: false,
  saveExact: false,
  updateLockfile: true
})

// 检测包管理器
const pm = await updater.detectPackageManager()

// 更新包
const result = await updater.updatePackage('react', '18.3.0')

// 批量更新
await updater.updatePackages([
  { name: 'react', version: '18.3.0' },
  { name: 'vue', version: '3.3.4' }
])

// 安装依赖
await updater.install()

// 重新安装
await updater.reinstall()

// 依赖去重
await updater.dedupe()

// 回滚
await updater.rollback()
```

### CacheManager

缓存管理器，提升性能。

```typescript
import { CacheManager } from '@ldesign/deps'

const cache = new CacheManager({
  enabled: true,
  ttl: 3600000, // 1 小时
  maxSize: 1000,
  strategy: 'lru'
})

// 设置缓存
cache.set('key', 'value')

// 获取缓存
const value = cache.get('key')

// 检查缓存
const exists = cache.has('key')

// 删除缓存
cache.delete('key')

// 清空缓存
cache.clear()

// 获取统计信息
const stats = cache.getStats()
console.log('命中率:', stats.hitRate)
```

### ✨ DependencyLockManager (v0.2.0 新增)

依赖锁定管理器，锁定关键依赖版本。

```typescript
import { DependencyLockManager } from '@ldesign/deps'

const lockManager = new DependencyLockManager()

// 锁定依赖
await lockManager.lockDependency('react', '18.2.0', {
  reason: '生产环境稳定版本',
  lockedBy: 'tech-lead'
})

// 批量锁定
await lockManager.lockDependencies([
  { name: 'react', version: '18.2.0', reason: '稳定版本' },
  { name: 'vue', version: '3.3.4', reason: '已测试' }
])

// 检查是否锁定
const isLocked = await lockManager.isLocked('react')

// 获取锁定版本
const version = await lockManager.getLockedVersion('react')

// 验证版本
const validation = await lockManager.validateLock('react', '18.2.0')
console.log(validation.valid)  // true

// 获取所有锁定
const locked = await lockManager.getLockedDependencies()

// 解锁依赖
await lockManager.unlockDependency('react')

// 生成报告
const report = await lockManager.generateReport()
console.log(report)

// 导入/导出
await lockManager.exportLocks('./locks.json')
await lockManager.importLocks('./locks.json', true)
```

### ✨ DependencyHistoryTracker (v0.2.0 新增)

依赖历史追踪器，记录和管理依赖变更。

```typescript
import { DependencyHistoryTracker } from '@ldesign/deps'

const tracker = new DependencyHistoryTracker()

// 记录变更
await tracker.trackChange({
  packageName: 'express',
  type: 'update',
  oldVersion: '4.17.1',
  newVersion: '4.18.2',
  reason: '安全漏洞修复 CVE-2023-XXXX',
  author: 'developer',
  metadata: {
    jiraTicket: 'SEC-1234'
  }
})

// 批量记录
await tracker.trackChanges([
  { packageName: 'react', type: 'update', oldVersion: '18.1.0', newVersion: '18.2.0' },
  { packageName: 'vue', type: 'add', newVersion: '3.3.4' }
])

// 获取历史
const history = await tracker.getHistory('express')
console.log(`${history.packageName} 共有 ${history.changes.length} 次变更`)

// 按时间范围查询
const recentChanges = await tracker.getChangesByTimeRange(
  Date.now() - 7 * 24 * 60 * 60 * 1000,  // 最近7天
  Date.now()
)

// 按类型查询
const updates = await tracker.getChangesByType('update')

// 按作者查询
const myChanges = await tracker.getChangesByAuthor('developer')

// 获取当前版本
const currentVersion = await tracker.getCurrentVersion('express')

// 回滚版本
await tracker.rollbackToVersion('express', '4.17.1')

// 生成统计报告
const stats = await tracker.generateStats()
console.log(`总变更: ${stats.totalChanges}`)
console.log(`更新次数: ${stats.changesByType.update}`)

// 生成格式化报告
const report = await tracker.generateReport({ packageName: 'express', limit: 10 })
console.log(report)

// 导出历史（支持 JSON/CSV）
await tracker.exportHistory('./history.json', { format: 'json' })
await tracker.exportHistory('./history.csv', { format: 'csv' })
```

### ✨ DependencyHealthScorer (v0.3.0 新增)

依赖健康度评分器，评估依赖质量。

```typescript
import { DependencyHealthScorer } from '@ldesign/deps'

const scorer = new DependencyHealthScorer(process.cwd(), {
  checkGitHub: true,
  githubToken: process.env.GITHUB_TOKEN,
  useCache: true
})

// 评估单个依赖
const score = await scorer.scorePackage('react', '18.2.0')
console.log(`总评分: ${score.overall}/100 [${score.grade}]`)
console.log(`维护活跃度: ${score.maintenanceScore}`)
console.log(`社区热度: ${score.popularityScore}`)
console.log(`质量评分: ${score.qualityScore}`)
console.log(`安全评分: ${score.securityScore}`)

// 批量评估
const packages = [
  { name: 'react', version: '18.2.0' },
  { name: 'vue', version: '3.3.4' }
]

const result = await scorer.scorePackages(packages, (progress) => {
  console.log(`进度: ${progress.percentage}%`)
})

console.log(`平均评分: ${result.summary.averageScore}`)
console.log(`关键问题: ${result.summary.criticalIssues}`)
console.log(`废弃包: ${result.summary.deprecatedCount}`)

// 生成报告
const report = scorer.generateReport(result)
console.log(report)
```

### ✨ PerformanceMonitor (v0.3.0 新增)

性能监控器，分析依赖对性能的影响。

```typescript
import { PerformanceMonitor } from '@ldesign/deps'

const monitor = new PerformanceMonitor(process.cwd(), {
  includeBundleAnalysis: true,
  includeBuildImpact: false,
  installTimeout: 300000
})

// 收集性能指标
const metrics = await monitor.collectMetrics()

console.log(`安装时间: ${(metrics.installMetrics.totalTime / 1000).toFixed(2)}s`)
console.log(`Bundle 大小: ${(metrics.bundleMetrics.totalSize / 1024 / 1024).toFixed(2)} MB`)
console.log(`直接依赖: ${metrics.dependencyStats.directCount}`)
console.log(`间接依赖: ${metrics.dependencyStats.transitiveCount}`)

// 生成报告
const report = monitor.generateReport(metrics)
console.log(report)
```

### ✨ NotificationManager (v0.3.0 新增)

通知管理器，支持多渠道通知。

```typescript
import { NotificationManager } from '@ldesign/deps'

const notifier = new NotificationManager({
  channels: ['slack', 'dingtalk'],
  level: 'warning',
  events: ['vulnerability', 'update-available']
})

// 发送通知
const results = await notifier.notify({
  title: '发现安全漏洞',
  content: '包 express 存在高危漏洞，请尽快更新',
  level: 'critical',
  event: 'vulnerability',
  data: { package: 'express', severity: 'high' },
  timestamp: Date.now()
})

// 检查通知结果
results.forEach(result => {
  console.log(`${result.channel}: ${result.success ? '成功' : '失败'}`)
})
```

**支持的通知渠道：**
- Slack（配置 `SLACK_WEBHOOK_URL`）
- 钉钉（配置 `DINGTALK_WEBHOOK_URL`）
- 企业微信（配置 `WECOM_WEBHOOK_URL`）
- 自定义 Webhook（配置 `CUSTOM_WEBHOOK_URL`）
- 邮件（待实现）

## ⚙️ 配置

创建 `.depsrc.json` 文件：

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600000,
    "maxSize": 1000,
    "strategy": "lru"
  },
  "analyze": {
    "checkUnused": true,
    "checkMissing": true,
    "checkDuplicates": true,
    "ignorePatterns": [
      "**/*.test.ts",
      "**/*.spec.ts"
    ]
  },
  "security": {
    "auditLevel": "moderate",
    "checkLicenses": true,
    "allowedLicenses": ["MIT", "Apache-2.0", "BSD-3-Clause"],
    "blockedLicenses": ["GPL-3.0", "AGPL-3.0"],
    "ignoreVulnerabilities": []
  },
  "update": {
    "interactive": false,
    "dryRun": false,
    "saveExact": false,
    "updateLockfile": true,
    "ignorePeerWarnings": false,
    "concurrency": 5
  },
  "workspace": {
    "enabled": true,
    "syncVersions": false,
    "checkPhantom": true
  }
}
```

或使用交互式配置生成：

```bash
ldeps config
```

## 🎯 使用场景

### 日常开发

```bash
# 检查并交互式更新依赖
ldeps check
ldeps interactive

# 清理未使用的依赖
ldeps clean

# 安全审计
ldeps audit
```

### CI/CD 集成

```bash
# 在 CI 中进行安全审计
ldeps audit --level high --json > audit-report.json

# 检查过时的依赖
ldeps outdated

# 检查重复的依赖
ldeps duplicate
```

### Monorepo 项目

```bash
# 扫描工作区
ldeps workspace --scan

# 分析版本冲突
ldeps workspace --analyze

# 同步依赖版本
ldeps workspace --sync react 18.3.0
```

### 依赖分析

```bash
# 完整分析
ldeps analyze

# 查看依赖树
ldeps tree --depth 3

# 导出依赖图
ldeps graph --format mermaid --output deps.md

# 查找依赖路径
ldeps why lodash
```

## 🤝 贡献

欢迎贡献！请阅读 [贡献指南](CONTRIBUTING.md)。

## 📄 License

MIT © [LDesign Team]

## 🔗 相关链接

- [GitHub](https://github.com/ldesign/ldesign)
- [npm](https://www.npmjs.com/package/@ldesign/deps)
- [文档](https://ldesign.dev/tools/deps)

## 💡 提示

- 使用 `ldeps -h` 查看所有可用命令
- 使用 `ldeps <command> -h` 查看命令的详细帮助
- 配置 `.depsrc.json` 自定义工具行为
- 在 CI 中使用 `--json` 选项输出结构化数据
- 定期运行 `ldeps audit` 确保依赖安全
