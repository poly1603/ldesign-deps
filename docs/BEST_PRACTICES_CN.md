# @ldesign/deps 最佳实践指南

本指南提供使用 @ldesign/deps 的最佳实践和推荐方法。

---

## 📋 目录

- [依赖管理策略](#依赖管理策略)
- [版本控制](#版本控制)
- [安全审计](#安全审计)
- [性能优化](#性能优化)
- [Monorepo 实践](#monorepo-实践)
- [CI/CD 集成](#cicd-集成)
- [团队协作](#团队协作)

---

## 依赖管理策略

### ✅ 推荐做法

#### 1. 定期检查依赖更新

```bash
# 每周一次检查更新
ldeps check --show-progress

# 查看过时的依赖
ldeps outdated
```

**频率建议**：
- 开发环境：每周 1-2 次
- 生产环境：每月 1 次
- 安全更新：立即处理

#### 2. 使用语义化版本范围

```json
{
  "dependencies": {
    "react": "^18.2.0",       // ✅ 推荐：允许小版本和补丁更新
    "vue": "~3.3.0",          // ✅ 可以：只允许补丁更新
    "lodash": "4.17.21"       // ⚠️ 谨慎：固定版本（特殊情况）
  }
}
```

**版本范围选择**：
- `^` - 允许次版本和补丁更新（推荐）
- `~` - 只允许补丁更新（保守）
- 固定版本 - 仅用于已知问题的包

#### 3. 区分开发和生产依赖

```typescript
// ✅ 正确分类
await manager.addDependency('react', '^18.0.0', 'dependencies')
await manager.addDependency('typescript', '^5.0.0', 'devDependencies')

// ❌ 避免：将开发工具放在 dependencies
```

**分类原则**：
- `dependencies` - 运行时必需
- `devDependencies` - 仅开发时需要
- `peerDependencies` - 由使用者提供
- `optionalDependencies` - 可选功能

---

## 版本控制

### ✅ 推荐做法

#### 1. 锁定关键依赖

```typescript
import { DependencyLockManager } from '@ldesign/deps'

const lockManager = new DependencyLockManager()

// 锁定生产环境稳定版本
await lockManager.lockDependency('react', '18.2.0', {
  reason: '生产环境稳定版本，测试充分',
  lockedBy: 'tech-lead'
})

// 锁定有安全问题的版本（临时）
await lockManager.lockDependency('vulnerable-pkg', '1.2.3', {
  reason: '新版本 1.3.0 存在兼容性问题，等待修复',
  lockedBy: 'security-team'
})
```

**何时锁定**：
- ✅ 生产环境稳定版本
- ✅ 已知问题的包
- ✅ 需要特定版本的依赖
- ❌ 不要锁定所有依赖

#### 2. 追踪依赖变更历史

```typescript
import { DependencyHistoryTracker } from '@ldesign/deps'

const tracker = new DependencyHistoryTracker()

// 每次更新都记录
await tracker.trackChange({
  packageName: 'express',
  type: 'update',
  oldVersion: '4.17.1',
  newVersion: '4.18.2',
  reason: '安全漏洞修复 CVE-2023-XXXX',
  author: process.env.USER || 'developer',
  metadata: {
    jiraTicket: 'SEC-1234',
    approvedBy: 'security-team'
  }
})

// 定期生成报告
const report = await tracker.generateReport()
console.log(report)

// 导出审计日志
await tracker.exportHistory('./audit-log.json', {
  startTime: Date.now() - 30 * 24 * 60 * 60 * 1000, // 最近30天
  format: 'json'
})
```

**追踪建议**：
- ✅ 记录所有依赖变更
- ✅ 包含变更原因
- ✅ 关联工单/PR
- ✅ 定期导出审计日志

#### 3. 使用版本范围验证

```typescript
import { satisfiesRange } from '@ldesign/deps/helpers'

// 检查版本是否满足要求
const isValid = satisfiesRange('18.2.0', '^18.0.0')  // true

// 锁定验证
const validation = await lockManager.validateLock('react', '18.2.0')
if (!validation.valid) {
  console.error(validation.message)
}
```

---

## 安全审计

### ✅ 推荐做法

#### 1. 定期安全审计

```bash
# 每日自动审计（CI/CD）
ldeps audit --level moderate

# 每周详细审计
ldeps audit --level low --json > weekly-audit.json

# 发布前审计
ldeps audit --level critical
```

**审计级别选择**：
- `critical` - 仅严重漏洞（CI 阻塞）
- `high` - 高危及以上（建议修复）
- `moderate` - 中危及以上（定期审计）
- `low` - 所有漏洞（全面审计）

#### 2. 许可证检查

```typescript
import { SecurityAuditor } from '@ldesign/deps'

const auditor = new SecurityAuditor(process.cwd(), {
  auditLevel: 'moderate',
  checkLicenses: true,
  allowedLicenses: [
    'MIT',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC'
  ],
  blockedLicenses: [
    'GPL-3.0',      // Copyleft
    'AGPL-3.0',     // Copyleft
    'SSPL'          // 限制性许可
  ]
})

const result = await auditor.audit()

// 检查许可证合规性
const incompatible = result.licenses.filter(l => !l.compatible)
if (incompatible.length > 0) {
  console.error('发现不兼容的许可证：', incompatible)
}
```

**许可证策略**：
- ✅ 明确允许的许可证列表
- ✅ 明确禁止的许可证列表
- ✅ 定期审查新增依赖的许可证
- ✅ 记录许可证决策

#### 3. 忽略已知安全问题

```json
{
  "security": {
    "ignoreVulnerabilities": [
      "CVE-2023-XXXX"  // 已评估，不影响我们的使用场景
    ]
  }
}
```

**忽略原则**：
- ✅ 仅忽略已评估的漏洞
- ✅ 记录忽略原因
- ✅ 定期重新评估
- ❌ 不要忽略严重漏洞

---

## 性能优化

### ✅ 推荐做法

#### 1. 启用缓存

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600000,      // 1小时
    "maxSize": 1000,
    "strategy": "lru"     // 最近最少使用
  }
}
```

**缓存策略选择**：
- `lru` - 最近最少使用（推荐）
- `lfu` - 最不常用（适合稳定项目）
- `fifo` - 先进先出（简单场景）

#### 2. 并发检查

```typescript
import { VersionChecker } from '@ldesign/deps'

const checker = new VersionChecker(cache, {
  concurrency: 20,  // 并发数
  retries: 3,       // 重试次数
  timeout: 30000    // 30秒超时
})

// 使用进度回调
const updates = await checker.checkUpdates(dependencies, (progress) => {
  console.log(`进度: ${progress.percentage.toFixed(0)}%`)
})
```

**性能提示**：
- ✅ 适当提高并发数（10-20）
- ✅ 设置合理的超时时间
- ✅ 使用缓存减少网络请求
- ❌ 不要设置过高的并发数

#### 3. 增量分析

```bash
# 只分析特定类型的依赖
ldeps analyze --no-duplicates

# 限制分析深度
ldeps tree --depth 2
```

---

## Monorepo 实践

### ✅ 推荐做法

#### 1. 工作区扫描

```bash
# 定期扫描工作区
ldeps workspace --scan

# 分析版本冲突
ldeps workspace --analyze
```

#### 2. 版本同步

```typescript
import { WorkspaceManager } from '@ldesign/deps'

const wsManager = new WorkspaceManager()

// 同步所有包的 React 版本
await wsManager.syncDependencyVersions('react', '^18.2.0')
```

**版本管理策略**：
- ✅ 共享依赖使用相同版本
- ✅ 在根 package.json 中管理共享依赖
- ✅ 定期检查版本冲突
- ✅ 使用 workspace: 协议

#### 3. 幽灵依赖检测

```typescript
const workspace = await wsManager.analyzeWorkspace()

if (workspace.phantomDependencies.length > 0) {
  console.warn('发现幽灵依赖：')
  workspace.phantomDependencies.forEach(dep => {
    console.warn(`- ${dep.packageName} 被 ${dep.usedBy} 使用但未声明`)
  })
}
```

**幽灵依赖处理**：
- ✅ 明确声明所有直接依赖
- ✅ 不要依赖提升的间接依赖
- ✅ 使用严格的包管理器设置
- ✅ 定期检查幽灵依赖

---

## CI/CD 集成

### ✅ 推荐做法

#### 1. GitHub Actions 示例

```yaml
name: Dependency Check

on:
  schedule:
    - cron: '0 0 * * 1'  # 每周一
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Check for updates
        run: pnpm ldeps check
        
      - name: Security audit
        run: pnpm ldeps audit --level high --json > audit.json
        
      - name: Upload audit report
        uses: actions/upload-artifact@v3
        with:
          name: audit-report
          path: audit.json
          
      - name: Fail on critical vulnerabilities
        run: pnpm ldeps audit --level critical
```

#### 2. 自动化报告

```bash
# 生成并发送报告
ldeps audit --json | \
  jq '.' | \
  mail -s "Weekly Dependency Audit" team@example.com
```

---

## 团队协作

### ✅ 推荐做法

#### 1. 统一配置

```json
// .depsrc.json - 提交到版本控制
{
  "cache": { "enabled": true },
  "security": {
    "auditLevel": "moderate",
    "allowedLicenses": ["MIT", "Apache-2.0"],
    "blockedLicenses": ["GPL-3.0"]
  }
}
```

#### 2. 文档化依赖策略

```markdown
## 依赖管理规范

### 添加新依赖
1. 评估是否真正需要
2. 检查包的维护状态
3. 审查许可证
4. 运行安全审计
5. 记录添加原因

### 更新依赖
1. 查看 CHANGELOG
2. 检查 breaking changes
3. 运行完整测试
4. 记录更新历史
```

#### 3. Code Review 清单

- [ ] 新增依赖是否必要？
- [ ] 许可证是否兼容？
- [ ] 是否有安全漏洞？
- [ ] 是否有更好的替代方案？
- [ ] 是否记录了变更原因？

---

## 🚫 常见错误

### ❌ 不要做

1. **不要忽略 package-lock.json / pnpm-lock.yaml**
   ```bash
   # ❌ 错误
   echo "pnpm-lock.yaml" >> .gitignore
   
   # ✅ 正确
   git add pnpm-lock.yaml
   ```

2. **不要使用 `*` 版本范围**
   ```json
   {
     "dependencies": {
       "some-package": "*"  // ❌ 危险
     }
   }
   ```

3. **不要在生产环境使用 --force**
   ```bash
   # ❌ 危险
   pnpm install --force
   
   # ✅ 正确
   pnpm install
   ```

4. **不要跳过安全审计**
   ```bash
   # ❌ 错误
   npm install --no-audit
   
   # ✅ 正确
   pnpm install
   ldeps audit
   ```

---

## 📊 性能基准

### 推荐配置性能

| 场景 | 推荐并发数 | 缓存TTL | 预期性能 |
|------|-----------|---------|---------|
| 小项目 (<50包) | 10 | 1小时 | <5秒 |
| 中项目 (50-200包) | 20 | 2小时 | 5-15秒 |
| 大项目 (200-500包) | 30 | 4小时 | 15-30秒 |
| Monorepo (>500包) | 50 | 6小时 | 30-60秒 |

---

## 🎯 总结

### 核心原则

1. **安全第一** - 定期审计，及时修复
2. **版本控制** - 语义化版本，锁定关键依赖
3. **性能优化** - 启用缓存，并发处理
4. **可追溯性** - 记录所有变更
5. **团队协作** - 统一规范，文档化

### 每日检查清单

- [ ] 检查安全审计报告
- [ ] 查看依赖更新
- [ ] 审查新增依赖
- [ ] 更新锁定文件

### 每周检查清单

- [ ] 完整的依赖分析
- [ ] 版本冲突检查
- [ ] 许可证审查
- [ ] 幽灵依赖检测
- [ ] 导出审计日志

---

**遵循这些最佳实践，让您的依赖管理更加安全、高效！** 🚀


