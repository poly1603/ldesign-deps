# 介绍

@ldesign/deps 是一个企业级 **Node.js 依赖管理工具包**，提供全方位的依赖管理解决方案。

## 核心理念

在现代前端开发中，依赖管理往往被忽视，但它却是项目成功的关键因素之一。@ldesign/deps 致力于解决以下问题：

- 🔍 **依赖健康度评估** - 了解依赖的真实质量和风险
- 📊 **性能影响分析** - 量化依赖对项目性能的影响
- 💰 **成本透明化** - 清楚了解依赖的隐藏成本
- 🔄 **智能替代方案** - 自动推荐更好的替代品
- 🔒 **安全性保障** - 持续监控和预警安全问题
- ⚡ **开发效率** - 自动化依赖维护流程

## 为什么选择 @ldesign/deps？

### 全面的功能覆盖

与传统的依赖管理工具相比，@ldesign/deps 提供了 **17+ 核心模块** 和 **26+ CLI 命令**，覆盖依赖管理的方方面面。

| 功能类别 | 传统工具 | @ldesign/deps |
|---------|---------|---------------|
| 版本检查 | ✅ | ✅ |
| 安全审计 | ✅ | ✅ |
| 依赖分析 | ⚠️ 基础 | ✅ 深度分析 |
| 健康度评分 | ❌ | ✅ 完整评估体系 |
| 性能监控 | ❌ | ✅ 全维度监控 |
| 成本分析 | ❌ | ✅ 详细成本核算 |
| 智能推荐 | ❌ | ✅ AI 驱动推荐 |
| 通知集成 | ❌ | ✅ 多渠道通知 |

### 企业级特性

- **可扩展架构** - 支持大型 Monorepo 项目
- **高性能** - 并行处理、智能缓存
- **可配置** - 灵活的配置系统
- **可集成** - REST API、Webhook、CI/CD
- **可观测** - 详细的日志和指标

### 开发者友好

- 📝 **TypeScript 优先** - 完整的类型定义
- 🎨 **美观的 CLI** - 彩色输出、进度条、表格
- 🤖 **自动化** - 减少手动操作
- 🧪 **测试覆盖** - 高质量代码保证
- 📚 **完善文档** - 详细的使用指南

## 主要功能

### 1. 依赖管理核心

- **DependencyManager** - 依赖的增删改查
- **VersionChecker** - 版本更新检查
- **DependencyUpdater** - 智能更新依赖
- **PackageJsonManager** - package.json 管理

### 2. 健康度评估

**DependencyHealthScorer** 提供 360° 健康度评估：

- **维护活跃度** (30%) - 最近提交、发布频率、响应时间
- **社区热度** (25%) - Star 数、Fork 数、贡献者
- **质量评分** (25%) - 测试覆盖率、文档质量、代码质量
- **安全评分** (20%) - 漏洞数量、安全问题、license

最终输出 **A-F 等级评定** 和详细报告。

### 3. 性能监控

**PerformanceMonitor** 全方位性能分析：

- **安装性能** - 安装时间、网络耗时
- **Bundle 大小** - 对打包产物的影响
- **依赖统计** - 深度、数量、类型
- **构建影响** - 对构建时间的影响

### 4. 成本分析

**DependencyCostAnalyzer** 量化依赖成本：

- **安装成本** - 安装时间、网络流量
- **磁盘成本** - node_modules 大小
- **CI/CD 成本** - 预估每月运行成本
- **趋势分析** - 历史成本变化

### 5. 智能推荐

**DependencyAlternativesFinder** 智能查找替代方案：

- 检测 **废弃/不维护** 的包
- 推荐 **更轻量** 的替代品
- 评估 **迁移成本**
- 集成 **健康度评分**

### 6. 安全审计

**SecurityAuditor** 全面安全检查：

- 漏洞扫描和分类
- License 合规检查
- 依赖来源验证
- 自动修复建议

### 7. 依赖分析

**DependencyAnalyzer** 深度代码分析：

- 检测 **未使用** 的依赖
- 发现 **缺失** 的依赖
- 识别 **重复** 的依赖
- 推荐优化方案

### 8. 依赖可视化

**DependencyTreeGenerator** & **DependencyGraphExporter**：

- 树形结构展示
- 导出为 Mermaid/DOT/JSON
- 循环依赖检测
- 依赖路径分析

### 9. Monorepo 支持

**WorkspaceAnalyzer**：

- 扫描工作区包
- 检测版本冲突
- 分析共享依赖
- 优化建议

### 10. 通知集成

**NotificationManager** 多渠道通知：

- 📧 Email (Nodemailer)
- 💬 Slack (Webhook)
- 🔔 钉钉 (Webhook)
- 🐦 企业微信 (Webhook)

### 11. 变更日志

**ChangelogGenerator** 自动生成：

- 解析 Git 提交历史
- 分类变更（feat/fix/breaking）
- 支持多种格式（Markdown/JSON）
- 自定义模板

### 12. Lockfile 管理

**LockfileParser** 支持多种格式：

- package-lock.json (npm)
- yarn.lock (Yarn)
- pnpm-lock.yaml (pnpm)

## 架构设计

@ldesign/deps 采用模块化架构，各模块相互独立又紧密协作：

```
@ldesign/deps
├── core/              # 核心功能模块
│   ├── dependency-manager.ts
│   ├── version-checker.ts
│   └── ...
├── health/            # 健康度评估
│   └── dependency-health-scorer.ts
├── performance/       # 性能监控
│   └── performance-monitor.ts
├── cost/              # 成本分析
│   └── dependency-cost-analyzer.ts
├── alternatives/      # 替代方案
│   └── dependency-alternatives-finder.ts
├── security/          # 安全审计
│   └── security-auditor.ts
├── analysis/          # 依赖分析
│   └── dependency-analyzer.ts
├── visualization/     # 可视化
│   ├── dependency-tree-generator.ts
│   └── dependency-graph-exporter.ts
├── workspace/         # Monorepo
│   └── workspace-analyzer.ts
├── notifications/     # 通知
│   └── notification-manager.ts
├── changelog/         # 变更日志
│   └── changelog-generator.ts
├── lockfile/          # Lockfile
│   └── lockfile-parser.ts
├── cache/             # 缓存
│   └── cache-manager.ts
├── config/            # 配置
│   └── config-manager.ts
└── cli/               # 命令行
    └── index.ts
```

## 技术栈

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **CLI Framework**: Commander.js
- **UI Components**: chalk, ora, cli-table3, inquirer
- **Package Registry**: npm Registry API
- **Security**: npm audit, snyk (可选)
- **Testing**: Jest / Vitest
- **Documentation**: VitePress

## 使用场景

### 1. 日常开发

```bash
# 每天工作前检查更新
ldeps check

# 定期评估依赖健康度
ldeps health --all

# 发现性能问题
ldeps performance
```

### 2. 代码审查

```bash
# 分析新增依赖的影响
ldeps analyze

# 检查安全问题
ldeps audit

# 评估依赖成本
ldeps cost
```

### 3. 项目重构

```bash
# 查找过时的依赖
ldeps outdated

# 寻找替代方案
ldeps alternatives --all

# 清理未使用的依赖
ldeps analyze --check-unused
```

### 4. CI/CD 集成

```yaml
# .github/workflows/deps.yml
- name: Check dependencies
  run: |
    ldeps check
    ldeps audit
    ldeps health --all --json > health-report.json
```

### 5. Monorepo 维护

```bash
# 扫描所有包
ldeps workspace --scan

# 分析版本冲突
ldeps workspace --analyze

# 批量更新
ldeps update --workspace
```

## 性能表现

在典型的中大型项目中（~100 依赖）：

- **依赖列表**: < 100ms
- **版本检查**: 2-5s（并行）
- **健康度评分**: 3-8s（单个包）
- **性能监控**: 5-15s
- **成本分析**: 3-10s
- **依赖分析**: 1-3s

通过缓存机制，重复操作可提速 **80%+**。

## 兼容性

- ✅ Node.js 18+
- ✅ npm 8+
- ✅ Yarn 1.x / 2.x / 3.x
- ✅ pnpm 7+
- ✅ macOS / Linux / Windows
- ✅ TypeScript / JavaScript

## 开发状态

当前版本：**v0.4.0**  
功能完成度：**~98%**

✅ 17 个核心模块  
✅ 26 个 CLI 命令  
✅ 完整的 TypeScript 类型  
✅ 详尽的文档  
✅ 高测试覆盖率  

⏳ 计划中的功能：
- 自动更新管理器
- 依赖文档生成器
- IDE 集成（VS Code 插件）
- 审批工作流

## 社区与支持

- 📖 [完整文档](/)
- 💻 [GitHub 仓库](https://github.com/ldesign/ldesign)
- 🐛 [问题反馈](https://github.com/ldesign/ldesign/issues)
- 💬 [讨论区](https://github.com/ldesign/ldesign/discussions)

## 下一步

- 📚 阅读 [快速开始](/guide/getting-started)
- 🎯 浏览 [CLI 命令](/cli/commands)
- 🔧 查看 [API 文档](/api/core)
- ⚙️ 了解 [配置选项](/config/configuration)
