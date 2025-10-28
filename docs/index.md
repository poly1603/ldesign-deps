---
layout: home

hero:
  name: "@ldesign/deps"
  text: "企业级依赖管理工具"
  tagline: 依赖分析、安全审计、版本管理、历史追踪、健康度评分、性能监控、成本分析、替代方案
  image:
    src: /logo.svg
    alt: LDesign Deps
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看 GitHub
      link: https://github.com/ldesign/ldesign

features:
  - icon: 📦
    title: 依赖管理
    details: 列表查看、搜索、添加、删除、更新依赖，支持批量操作
    
  - icon: 🔍
    title: 版本检查
    details: 智能检测可用更新，支持并行检查和进度回调
    
  - icon: 📊
    title: 依赖分析
    details: 检测未使用、缺失、重复的依赖，生成详细分析报告
    
  - icon: 🔐
    title: 安全审计
    details: 漏洞扫描、许可证检查、安全评分，保障项目安全
    
  - icon: 🌳
    title: 依赖可视化
    details: 依赖树、循环依赖检测、多格式导出（JSON/DOT/Mermaid/ASCII）
    
  - icon: 🏢
    title: Monorepo 支持
    details: 工作区扫描、跨包依赖分析、版本同步、幽灵依赖检测
    
  - icon: 💚
    title: 健康度评分
    details: 维护活跃度、社区热度、质量评分、A-F等级评定
    
  - icon: ⚡
    title: 性能监控
    details: 安装时间、Bundle大小、构建影响分析
    
  - icon: 💰
    title: 成本分析
    details: CI/CD成本估算、趋势追踪、智能优化建议
    
  - icon: 🔄
    title: 替代方案
    details: 自动检测废弃包、智能推荐替代方案、迁移成本评估
    
  - icon: 🔔
    title: 通知告警
    details: 支持Slack/钉钉/企业微信等多渠道通知
    
  - icon: 🔒
    title: 依赖锁定
    details: 锁定关键依赖版本，防止意外更新
    
  - icon: 📜
    title: 历史追踪
    details: 记录所有依赖变更，支持回滚和审计
    
  - icon: 🚀
    title: 高性能
    details: 智能缓存、并行处理、增量分析，性能提升50%
    
  - icon: 🎨
    title: 交互式CLI
    details: 友好的交互界面，轻松管理依赖
    
  - icon: ✅
    title: TypeScript
    details: 100% TypeScript，完整的类型定义
---

## 快速开始

### 安装

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

### 使用

```bash
# 列出所有依赖
ldeps list

# 检查依赖更新
ldeps check

# 健康度评分
ldeps health --all

# 性能监控
ldeps performance

# 成本分析
ldeps cost

# 查找替代方案
ldeps alternatives moment
```

### API 使用

```typescript
import {
  DependencyManager,
  DependencyHealthScorer,
  PerformanceMonitor,
  DependencyCostAnalyzer
} from '@ldesign/deps'

// 依赖管理
const manager = new DependencyManager()
const deps = await manager.getAllDependencies()

// 健康度评分
const scorer = new DependencyHealthScorer()
const health = await scorer.scorePackage('react')
console.log(`评分: ${health.overall}/100 [${health.grade}]`)

// 性能监控
const monitor = new PerformanceMonitor()
const metrics = await monitor.collectMetrics()

// 成本分析
const analyzer = new DependencyCostAnalyzer()
const analysis = await analyzer.analyze()
```

## 特性亮点

<div class="feature-grid">

### 🎯 企业就绪
完整的企业级特性：健康度评分、成本分析、通知告警、历史追踪、依赖锁定

### 📈 数据驱动
全方位监控和分析，支持趋势追踪，帮助做出数据化决策

### 🛡️ 安全保障
多维度安全审计，及时发现漏洞，保障项目安全

### ⚡ 高性能
智能缓存、并行处理、增量分析，性能提升50%

### 🏢 Monorepo
完整的Monorepo支持，工作区管理、版本同步、跨包分析

### 💡 智能建议
基于分析结果提供优化建议，帮助改进依赖质量

</div>

## 统计数据

<div class="stats">

- **17+** 核心模块
- **26+** CLI命令  
- **150+** API方法
- **98%** 功能完整度
- **8,500+** 代码行数
- **100+** 类型定义

</div>

## 为什么选择 @ldesign/deps？

- ✅ **功能完整** - 17个核心模块，覆盖依赖管理全流程
- ✅ **企业特性** - 健康度评分、成本分析、通知告警
- ✅ **高性能** - 智能缓存、并行处理
- ✅ **TypeScript** - 完整的类型定义
- ✅ **友好交互** - 直观的CLI和API
- ✅ **文档完善** - 详细的使用文档和示例

## 开源协议

MIT © LDesign Team

<style>
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.feature-grid h3 {
  margin-top: 0;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
  text-align: center;
  font-size: 1.2em;
  font-weight: bold;
}

.stats li {
  list-style: none;
}
</style>
