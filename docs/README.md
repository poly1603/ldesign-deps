# @ldesign/deps 文档

欢迎使用 @ldesign/deps 的官方文档！

## 📚 文档结构

### 指南 (Guide)

- **[介绍](./guide/introduction.md)** - 项目概述、核心理念、为什么选择 @ldesign/deps
- **[快速开始](./guide/getting-started.md)** - 安装、基础命令、快速上手
- **[核心功能](./guide/core-features.md)** - 17 个核心模块的详细说明和使用示例
- **[最佳实践](./guide/best-practices.md)** - 日常工作流、团队协作、CI/CD 集成

### CLI 命令 (CLI)

- **[命令参考](./cli/commands.md)** - 26+ CLI 命令的完整文档

### 配置 (Config)

- **[配置指南](./config/configuration.md)** - 完整的配置系统说明

### API 文档 (API)

- **[核心 API](./api/core.md)** - TypeScript API 完整文档

## 🚀 快速导航

### 新手入门

1. 阅读 [介绍](./guide/introduction.md) 了解项目
2. 按照 [快速开始](./guide/getting-started.md) 安装和使用
3. 查看 [CLI 命令](./cli/commands.md) 学习常用命令

### 开发者

1. 查看 [核心功能](./guide/core-features.md) 了解各模块
2. 阅读 [API 文档](./api/core.md) 进行编程集成
3. 参考 [配置指南](./config/configuration.md) 自定义行为

### 团队协作

1. 学习 [最佳实践](./guide/best-practices.md)
2. 配置 CI/CD 集成
3. 建立团队规范

## 📖 文档站点

本地运行文档站点：

```bash
# 开发模式
npm run docs:dev

# 构建文档
npm run docs:build

# 预览构建结果
npm run docs:preview
```

访问 http://localhost:5173 查看文档。

## 🎯 核心特性

@ldesign/deps 提供以下核心功能：

### 1. 依赖管理 
- 依赖增删改查
- 版本检查和更新
- Package.json 管理

### 2. 健康度评估 ⭐
- 维护活跃度 (30%)
- 社区热度 (25%)
- 质量评分 (25%)
- 安全评分 (20%)
- A-F 等级评定

### 3. 性能监控 ⚡
- 安装时间分析
- Bundle 大小统计
- 依赖深度分析
- 性能基准测试

### 4. 成本分析 💰
- 安装成本
- 磁盘成本
- CI/CD 成本估算
- 趋势分析

### 5. 智能推荐 🔄
- 检测废弃包
- 推荐轻量替代品
- 迁移成本评估
- 健康度集成

### 6. 安全审计 🔒
- 漏洞扫描
- License 检查
- 自动修复建议
- CVE 跟踪

### 7. 依赖分析 🔍
- 未使用依赖检测
- 缺失依赖发现
- 重复依赖识别
- 优化建议

### 8. 可视化 📊
- 依赖树生成
- Mermaid/DOT/JSON 导出
- 循环依赖检测
- 依赖路径分析

### 9. Monorepo 支持 🏢
- 工作区扫描
- 版本冲突分析
- 共享依赖优化
- 批量操作

### 10. 通知集成 📬
- Email (Nodemailer)
- Slack Webhook
- 钉钉 Webhook
- 企业微信 Webhook

## 📦 安装

```bash
# npm
npm install -D @ldesign/deps

# pnpm
pnpm add -D @ldesign/deps

# yarn
yarn add -D @ldesign/deps
```

## 🎨 快速示例

### CLI 使用

```bash
# 列出依赖
ldeps list

# 检查更新
ldeps check --parallel

# 健康度评估
ldeps health --all

# 性能分析
ldeps performance

# 成本分析
ldeps cost

# 查找替代方案
ldeps alternatives moment

# 安全审计
ldeps audit
```

### API 使用

```typescript
import {
  DependencyManager,
  VersionChecker,
  DependencyHealthScorer,
  PerformanceMonitor,
  DependencyCostAnalyzer
} from '@ldesign/deps'

// 依赖管理
const manager = new DependencyManager()
const deps = await manager.getAllDependencies()

// 版本检查
const checker = new VersionChecker({ parallel: true })
const updates = await checker.checkUpdates(depsToCheck)

// 健康度评估
const scorer = new DependencyHealthScorer()
const health = await scorer.scorePackage('react')

// 性能监控
const monitor = new PerformanceMonitor()
const metrics = await monitor.collectMetrics()

// 成本分析
const costAnalyzer = new DependencyCostAnalyzer()
const analysis = await costAnalyzer.analyze()
```

## 🌟 主要亮点

### 企业级特性
- ✅ 17 个核心模块
- ✅ 26+ CLI 命令
- ✅ 完整的 TypeScript 支持
- ✅ 高性能并行处理
- ✅ 智能缓存机制

### 开发者友好
- ✅ 简洁的 CLI 界面
- ✅ 丰富的配置选项
- ✅ 详细的文档
- ✅ 完善的错误处理
- ✅ 交互式模式

### 生产就绪
- ✅ 高测试覆盖率
- ✅ 稳定的 API
- ✅ 版本 v0.4.0
- ✅ 98% 功能完成度
- ✅ 活跃维护

## 🔗 相关链接

- [GitHub 仓库](https://github.com/ldesign/ldesign)
- [问题反馈](https://github.com/ldesign/ldesign/issues)
- [讨论区](https://github.com/ldesign/ldesign/discussions)
- [更新日志](../CHANGELOG.md)

## 📝 License

MIT © ldesign

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](https://github.com/ldesign/ldesign/blob/main/CONTRIBUTING.md)。

---

**开始使用：**

1. 📖 [阅读介绍](./guide/introduction.md)
2. 🚀 [快速开始](./guide/getting-started.md)
3. 🎯 [查看命令](./cli/commands.md)
4. 🔧 [API 文档](./api/core.md)
5. 💡 [最佳实践](./guide/best-practices.md)
