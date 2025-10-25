# @ldesign/deps 快速开始指南

## 📦 安装

```bash
# 使用 pnpm（推荐）
pnpm add -D @ldesign/deps

# 使用 npm
npm install -D @ldesign/deps

# 使用 yarn
yarn add -D @ldesign/deps

# 全局安装（CLI 工具）
pnpm add -g @ldesign/deps
```

---

## 🚀 5分钟快速上手

### 1. CLI 基础使用

```bash
# 查看所有依赖
ldeps list

# 检查可更新的依赖
ldeps check

# 交互式更新依赖
ldeps interactive

# 分析依赖使用情况
ldeps analyze

# 安全审计
ldeps audit

# 查看依赖树
ldeps tree
```

### 2. API 基础使用

```typescript
import { DependencyManager, VersionChecker } from '@ldesign/deps'

// 获取所有依赖
const manager = new DependencyManager()
const deps = await manager.getAllDependencies()

console.log(`项目共有 ${Object.keys(deps).length} 个依赖`)

// 检查更新
const checker = new VersionChecker()
const updates = await checker.checkUpdates(
  Object.fromEntries(
    Object.values(deps).map(d => [d.name, d.version])
  )
)

const hasUpdates = updates.filter(u => u.hasUpdate)
console.log(`发现 ${hasUpdates.length} 个可更新的依赖`)
```

---

## 💡 常用场景

### 场景 1: 日常依赖检查

```bash
# 每天运行一次，检查依赖更新
ldeps check

# 查看过时的依赖
ldeps outdated

# 检查重复的依赖
ldeps duplicate
```

### 场景 2: 安全审计（CI/CD）

```bash
# 在 CI 中运行安全审计
ldeps audit --level high --json > audit-report.json

# 检查是否有严重漏洞（如果有则失败）
ldeps audit --level critical
```

### 场景 3: Monorepo 项目管理

```bash
# 扫描工作区
ldeps workspace --scan

# 分析版本冲突
ldeps workspace --analyze

# 检查幽灵依赖
ldeps analyze
```

### 场景 4: 依赖版本锁定

```typescript
import { DependencyLockManager } from '@ldesign/deps'

const lockManager = new DependencyLockManager()

// 锁定生产环境的关键依赖
await lockManager.lockDependency('react', '18.2.0', {
  reason: '生产环境稳定版本',
  lockedBy: 'team-lead'
})

// 检查是否被锁定
const isLocked = await lockManager.isLocked('react')
console.log(`React 是否被锁定: ${isLocked}`)

// 查看所有锁定
const locked = await lockManager.getLockedDependencies()
console.log(locked)
```

### 场景 5: 依赖历史追踪

```typescript
import { DependencyHistoryTracker } from '@ldesign/deps'

const tracker = new DependencyHistoryTracker()

// 记录依赖更新
await tracker.trackChange({
  packageName: 'vue',
  type: 'update',
  oldVersion: '3.2.0',
  newVersion: '3.3.4',
  reason: '修复安全漏洞 CVE-2023-XXXX',
  author: 'developer'
})

// 查看历史
const history = await tracker.getHistory('vue')
console.log(`Vue 共有 ${history.changes.length} 次变更`)

// 生成报告
const report = await tracker.generateReport({ 
  packageName: 'vue',
  limit: 10 
})
console.log(report)
```

---

## ⚙️ 配置文件

### 创建配置文件

```bash
# 交互式创建配置
ldeps config
```

### .depsrc.json 示例

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
    "blockedLicenses": ["GPL-3.0", "AGPL-3.0"]
  },
  "update": {
    "interactive": false,
    "dryRun": false,
    "saveExact": false,
    "updateLockfile": true,
    "concurrency": 5
  }
}
```

---

## 📊 使用工具函数

```typescript
import { formatBytes, formatDuration, parseVersion } from '@ldesign/deps/helpers'

// 格式化文件大小
const size = formatBytes(1048576)  // '1.00 MB'

// 格式化时间
const duration = formatDuration(65000)  // '1m 5s'

// 解析版本号
const version = parseVersion('^1.2.3')
console.log(version?.major)  // 1
```

---

## 🔧 常用 API

### DependencyManager - 依赖管理

```typescript
import { DependencyManager } from '@ldesign/deps'

const manager = new DependencyManager()

// 获取所有依赖
const deps = await manager.getAllDependencies()

// 搜索依赖
const reactDeps = await manager.searchDependencies('react')

// 添加依赖
await manager.addDependency('lodash', '^4.17.21')

// 删除依赖
await manager.removeDependency('lodash')

// 更新版本
await manager.updateDependencyVersion('react', '^18.3.0')
```

### VersionChecker - 版本检查

```typescript
import { VersionChecker } from '@ldesign/deps'

const checker = new VersionChecker()

// 获取最新版本
const latest = await checker.getLatestVersion('react')

// 检查单个包更新
const update = await checker.checkUpdate('react', '^18.0.0')

// 批量检查更新
const updates = await checker.checkUpdates({
  'react': '^18.0.0',
  'vue': '^3.0.0'
})

// 按严重程度分组
const grouped = checker.groupUpdatesBySeverity(updates)
console.log(`主版本更新: ${grouped.major.length}`)
```

### SecurityAuditor - 安全审计

```typescript
import { SecurityAuditor } from '@ldesign/deps'

const auditor = new SecurityAuditor(process.cwd(), {
  auditLevel: 'high',
  checkLicenses: true
})

// 执行审计
const result = await auditor.audit()

console.log(`安全评分: ${result.securityScore.overall}/100`)
console.log(`漏洞数量: ${result.vulnerabilities.length}`)

// 生成报告
const report = auditor.generateReport(result)
console.log(report)
```

---

## 🎯 最佳实践

### 1. 定期检查依赖

```bash
# 每周运行一次
ldeps check
ldeps audit
ldeps analyze
```

### 2. 锁定生产依赖

```typescript
// 锁定生产环境的关键依赖
await lockManager.lockDependency('react', '18.2.0', {
  reason: '生产环境稳定版本'
})
```

### 3. 记录所有变更

```typescript
// 每次更新依赖时记录
await tracker.trackChange({
  packageName: 'vue',
  type: 'update',
  oldVersion: '3.2.0',
  newVersion: '3.3.4',
  reason: '升级理由',
  author: process.env.USER
})
```

### 4. CI/CD 集成

```yaml
# .github/workflows/deps-check.yml
name: Dependencies Check

on:
  schedule:
    - cron: '0 0 * * 1'  # 每周一运行
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      
      - name: Check dependencies
        run: |
          pnpm ldeps check
          pnpm ldeps audit --level high
          pnpm ldeps analyze
```

---

## 📚 进阶学习

- [完整 API 文档](./api.md)
- [最佳实践指南](./BEST_PRACTICES.md)
- [故障排查](./TROUBLESHOOTING.md)
- [高级用法示例](../examples/advanced-usage.ts)

---

## 🆘 获取帮助

```bash
# 查看所有命令
ldeps --help

# 查看特定命令的帮助
ldeps check --help
```

## 💬 反馈与支持

- [GitHub Issues](https://github.com/ldesign/ldesign/issues)
- [文档](https://ldesign.dev/tools/deps)

---

**快速开始就这么简单！开始使用 @ldesign/deps 管理您的依赖吧！** 🚀


