# 快速开始

开始使用 @ldesign/deps，几分钟内即可上手！

## 安装

选择您喜欢的包管理器：

::: code-group

```bash [pnpm]
pnpm add -D @ldesign/deps
```

```bash [npm]
npm install -D @ldesign/deps
```

```bash [yarn]
yarn add -D @ldesign/deps
```

:::

## 第一个命令

安装完成后，运行您的第一个命令：

```bash
# 列出所有依赖
ldeps list
```

输出示例：
```
┌────────────────────────────────────────┬──────────────────────┬───────────────────────┐
│ 包名                                    │ 版本                 │ 类型                  │
├────────────────────────────────────────┼──────────────────────┼───────────────────────┤
│ react                                  │ ^18.2.0              │ dependencies          │
│ typescript                             │ ^5.7.3               │ devDependencies       │
│ ...                                    │                      │                       │
└────────────────────────────────────────┴──────────────────────┴───────────────────────┘

总计: 25 个依赖
```

## 检查更新

检查是否有可用的依赖更新：

```bash
ldeps check
```

## 健康度评分 ⭐

评估所有依赖的健康状况：

```bash
ldeps health --all
```

这会为每个依赖进行全面评估，包括：
- 维护活跃度
- 社区热度
- 质量评分  
- 安全评分
- A-F 等级评定

## 性能监控 ⚡

分析依赖对性能的影响：

```bash
ldeps performance
```

查看：
- 安装时间
- Bundle 大小
- 依赖统计
- 构建影响

## 成本分析 💰

了解依赖的真实成本：

```bash
ldeps cost
```

输出包括：
- 总体成本（依赖数、安装时间、磁盘空间）
- CI/CD 成本估算
- Top 10 最贵的依赖
- 优化建议

## 查找替代方案 🔄

自动查找过时或废弃包的替代方案：

```bash
ldeps alternatives moment
```

## 安全审计

执行安全漏洞扫描：

```bash
ldeps audit
```

## 依赖分析

检测未使用、缺失或重复的依赖：

```bash
ldeps analyze
```

## 依赖可视化

查看依赖树：

```bash
ldeps tree
```

导出依赖图：

```bash
# Mermaid 格式
ldeps graph --format mermaid --output deps.md

# DOT 格式 (Graphviz)
ldeps graph --format dot --output deps.dot

# JSON 格式
ldeps graph --format json --output deps.json
```

## 交互式模式

使用交互式界面更新依赖：

```bash
ldeps interactive
# 或简写
ldeps i
```

## API 使用

除了CLI，您也可以通过编程方式使用：

```typescript
import {
  DependencyManager,
  VersionChecker,
  DependencyHealthScorer,
  PerformanceMonitor,
  DependencyCostAnalyzer,
  DependencyAlternativesFinder
} from '@ldesign/deps'

// 依赖管理
const manager = new DependencyManager()
const deps = await manager.getAllDependencies()
console.log(`总依赖数: ${Object.keys(deps).length}`)

// 版本检查
const checker = new VersionChecker()
const depsToCheck = Object.fromEntries(
  Object.values(deps).map(d => [d.name, d.version])
)
const updates = await checker.checkUpdates(depsToCheck)
console.log(`发现 ${updates.filter(u => u.hasUpdate).length} 个可更新的依赖`)

// 健康度评分
const scorer = new DependencyHealthScorer()
const health = await scorer.scorePackage('react')
console.log(`React 健康度: ${health.overall}/100 [${health.grade}]`)

// 性能监控
const monitor = new PerformanceMonitor()
const metrics = await monitor.collectMetrics()
console.log(`安装时间: ${metrics.installMetrics.totalTime}ms`)

// 成本分析
const costAnalyzer = new DependencyCostAnalyzer()
const analysis = await costAnalyzer.analyze()
console.log(`总成本: ${analysis.overallCost.totalDiskSpace.toFixed(2)} MB`)

// 替代方案
const altFinder = new DependencyAlternativesFinder()
const alternatives = await altFinder.findAlternatives('moment')
if (alternatives) {
  console.log(`为 moment 找到 ${alternatives.alternatives.length} 个替代方案`)
}
```

## 配置文件

创建 `.depsrc.json` 文件来自定义行为：

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600000,
    "maxSize": 1000
  },
  "analyze": {
    "checkUnused": true,
    "checkMissing": true,
    "checkDuplicates": true
  },
  "security": {
    "auditLevel": "moderate",
    "checkLicenses": true,
    "allowedLicenses": ["MIT", "Apache-2.0"]
  }
}
```

或通过交互式方式生成：

```bash
ldeps config
```

## Monorepo 项目

如果您使用 Monorepo：

```bash
# 扫描工作区
ldeps workspace --scan

# 分析版本冲突
ldeps workspace --analyze
```

## 下一步

- 📖 阅读 [指南](/guide/introduction) 了解详细功能
- 🎯 查看 [CLI 命令](/cli/commands) 完整列表
- 🔧 浏览 [API 文档](/api/core) 了解编程接口
- ⚙️ 配置 [环境变量](/config/environment) 启用通知等功能

## 常见问题

### 命令找不到？

确保全局安装或使用 `npx`：

```bash
# 使用 npx
npx ldeps list

# 或在 package.json scripts 中使用
{
  "scripts": {
    "deps:check": "ldeps check"
  }
}
```

### 需要帮助？

```bash
# 查看所有命令
ldeps --help

# 查看特定命令帮助
ldeps <command> --help
```

### 性能问题？

使用缓存和并行选项：

```bash
ldeps check --parallel --show-progress
```

## 支持

- 🐛 [报告问题](https://github.com/ldesign/ldesign/issues)
- 💬 [讨论区](https://github.com/ldesign/ldesign/discussions)
- 📧 联系我们
