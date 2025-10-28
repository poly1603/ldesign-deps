# @ldesign/deps v0.3.0 更新日志

## 🎉 重大更新

v0.3.0 版本是一次重大功能更新，新增了三个核心模块，大幅提升了企业级依赖管理能力。

## ✨ 新增功能

### 1. 依赖健康度评分系统 🩺

**核心模块:** `DependencyHealthScorer`

提供全方位的依赖质量评估：

- **维护活跃度评分** (30% 权重)
  - 最后发布时间分析
  - 最后提交时间追踪
  - 废弃状态检测

- **社区热度评分** (20% 权重)
  - GitHub stars 统计
  - npm 周下载量
  - Fork 数量分析

- **质量评分** (25% 权重)
  - TypeScript 类型定义支持
  - 许可证完整性
  - 依赖数量合理性
  - Issue 数量分析

- **安全评分** (25% 权重)
  - 已知漏洞检测
  - 废弃包识别

**功能亮点:**
- A-F 等级评定
- 智能建议生成
- 批量评估支持
- GitHub API 集成
- 智能缓存机制

**CLI 命令:**
```bash
# 评估单个依赖
ldeps health react

# 评估所有依赖
ldeps health --all

# JSON 输出
ldeps health --json
```

**API 使用:**
```typescript
import { DependencyHealthScorer } from '@ldesign/deps'

const scorer = new DependencyHealthScorer(process.cwd(), {
  checkGitHub: true,
  githubToken: process.env.GITHUB_TOKEN
})

const score = await scorer.scorePackage('react')
console.log(`评分: ${score.overall}/100 [${score.grade}]`)
```

### 2. 性能监控系统 ⚡

**核心模块:** `PerformanceMonitor`

全面监控和分析依赖性能影响：

- **安装性能分析**
  - 总安装时间测量
  - 下载时间统计
  - 依赖解析时间
  - 慢速依赖识别

- **Bundle 大小分析**
  - node_modules 总大小
  - Gzip 压缩后大小
  - 各依赖大小分布
  - 最大依赖识别

- **依赖统计**
  - 直接依赖计数
  - 间接依赖计数
  - 依赖深度分析
  - 依赖树复杂度

- **构建影响分析** (可选)
  - 构建时间测量
  - 内存使用分析
  - 影响程度评级

**功能亮点:**
- 智能备份与恢复
- 多包管理器支持 (npm/pnpm/yarn)
- 详细性能报告
- 历史趋势对比

**CLI 命令:**
```bash
# 基本性能分析
ldeps performance

# 包含构建影响
ldeps performance --build

# 跳过 Bundle 分析
ldeps performance --no-bundle

# JSON 输出
ldeps performance --json
```

**API 使用:**
```typescript
import { PerformanceMonitor } from '@ldesign/deps'

const monitor = new PerformanceMonitor(process.cwd(), {
  includeBundleAnalysis: true,
  includeBuildImpact: false
})

const metrics = await monitor.collectMetrics()
console.log(`安装时间: ${metrics.installMetrics.totalTime}ms`)
console.log(`Bundle 大小: ${metrics.bundleMetrics.totalSize} bytes`)
```

### 3. 多渠道通知告警系统 🔔

**核心模块:** `NotificationManager`

企业级通知告警解决方案：

- **多渠道支持**
  - Slack 集成
  - 钉钉集成
  - 企业微信集成
  - 自定义 Webhook
  - 邮件通知 (规划中)

- **智能过滤**
  - 通知级别配置 (info/warning/error/critical)
  - 事件类型过滤
  - 灵活的通知规则

- **支持的事件**
  - 安全漏洞告警
  - 可用更新通知
  - 自动更新结果
  - 健康检查报告
  - 依赖变更通知

**功能亮点:**
- 统一的通知接口
- 多渠道并行发送
- 失败重试机制
- 结果状态追踪

**环境变量配置:**
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
DINGTALK_WEBHOOK_URL=https://oapi.dingtalk.com/robot/send?xxx
WECOM_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/xxx
CUSTOM_WEBHOOK_URL=https://your-webhook.com/api
```

**API 使用:**
```typescript
import { NotificationManager } from '@ldesign/deps'

const notifier = new NotificationManager({
  channels: ['slack', 'dingtalk'],
  level: 'warning',
  events: ['vulnerability', 'update-available']
})

await notifier.notify({
  title: '发现安全漏洞',
  content: '包 express 存在高危漏洞',
  level: 'critical',
  event: 'vulnerability',
  timestamp: Date.now()
})
```

## 🔧 类型系统完善

新增完整的 TypeScript 类型定义：

- `DependencyHealthScore` - 健康度评分结果
- `HealthScoreDetails` - 健康度详细信息
- `BatchHealthScoreResult` - 批量评分结果
- `PerformanceMetrics` - 性能指标
- `InstallMetrics` - 安装指标
- `BundleMetrics` - Bundle 指标
- `DependencyStats` - 依赖统计
- `NotificationConfig` - 通知配置
- `NotificationMessage` - 通知消息
- `NotificationResult` - 通知结果

以及其他 30+ 个新类型定义...

## 📚 文档更新

- ✅ README 新增 v0.3.0 功能说明
- ✅ 新增 CLI 命令文档
- ✅ 新增 API 使用示例
- ✅ 完善配置说明
- ✅ 添加使用场景

## 🚀 性能优化

- 智能缓存机制（健康度评分默认缓存 24 小时）
- 并行数据获取
- 增量分析支持
- 资源占用优化

## 📦 包信息更新

- 版本号: `0.2.0` → `0.3.0`
- 描述更新，包含新功能关键词
- 核心模块导出更新

## 🔮 未来规划

基于优先级，接下来将实现：

### 中优先级功能
1. **DependencyAlternativesFinder** - 依赖替代方案推荐
2. **DependencyCostAnalyzer** - 成本分析
3. **DependencyDocGenerator** - 文档生成
4. **AutoUpdateManager** - 自动化更新策略

### 低优先级功能
5. IDE 集成插件
6. 依赖审批工作流
7. 私有源管理

## 🙏 致谢

感谢所有贡献者和用户的支持！

## 📄 许可证

MIT © LDesign Team

---

**完整功能列表**: 15+ 核心模块，20+ CLI 命令，100+ API 方法

**企业级特性**: 健康度评分、性能监控、通知告警、安全审计、历史追踪、依赖锁定、Monorepo 支持

**技术栈**: TypeScript、Node.js、Commander.js、各种开源依赖分析工具
