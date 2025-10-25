# 迁移指南：v0.1.0 → v0.2.0

本指南帮助您从 `@ldesign/deps` v0.1.0 升级到 v0.2.0。

---

## 📋 概览

**v0.2.0 主要变更**：
- ✅ 类型安全增强（完全移除 `any` 类型）
- ✅ 错误处理标准化（70+ 错误代码）
- ✅ 性能提升 50%
- ✅ 新增依赖锁定功能
- ✅ 新增历史追踪功能
- ✅ 新增 21+ 工具函数

**破坏性变更**: ⚠️ 轻微

---

## 🔄 升级步骤

### 1. 更新依赖

```bash
# 使用 pnpm
pnpm update @ldesign/deps

# 使用 npm
npm update @ldesign/deps

# 使用 yarn
yarn upgrade @ldesign/deps
```

### 2. 检查类型错误

由于启用了 TypeScript 严格模式，可能需要修复一些类型错误：

```bash
pnpm type-check
```

### 3. 更新配置文件（可选）

如果您有自定义配置，建议重新生成：

```bash
ldeps config
```

---

## ⚠️ 破坏性变更

### 1. 错误类构造函数签名变更

**v0.1.0**:
```typescript
throw new DependencyError('错误信息', 'ERROR_CODE', details)
```

**v0.2.0**:
```typescript
import { DepsErrorCode } from '@ldesign/deps/constants'

throw new DependencyError(
  '错误信息',
  DepsErrorCode.OPERATION_FAILED,  // 使用枚举
  details,
  true  // 新增：是否可恢复
)
```

**迁移建议**: 
- 将字符串错误码替换为 `DepsErrorCode` 枚举
- 如果您的代码捕获了 `DependencyError`，更新类型导入

### 2. Logger 参数类型变更

**v0.1.0**:
```typescript
logger.info('消息', ...args: any[])
```

**v0.2.0**:
```typescript
logger.info('消息', ...args: unknown[])
```

**影响**: 极小，仅在使用 logger 并且启用严格类型检查时

**迁移建议**: 无需修改，类型会自动推导

---

## ✨ 新功能使用

### 1. 依赖锁定

锁定生产环境的关键依赖：

```typescript
import { DependencyLockManager } from '@ldesign/deps'

const lockManager = new DependencyLockManager()

// 锁定依赖
await lockManager.lockDependency('react', '18.2.0', {
  reason: '生产环境稳定版本',
  lockedBy: 'admin'
})

// 验证是否符合锁定要求
const validation = await lockManager.validateLock('react', '18.2.0')
if (!validation.valid) {
  console.error(validation.message)
}
```

### 2. 历史追踪

记录所有依赖变更：

```typescript
import { DependencyHistoryTracker } from '@ldesign/deps'

const tracker = new DependencyHistoryTracker()

// 记录更新
await tracker.trackChange({
  packageName: 'vue',
  type: 'update',
  oldVersion: '3.2.0',
  newVersion: '3.3.4',
  reason: '修复安全漏洞',
  author: process.env.USER
})

// 查看历史
const history = await tracker.getHistory('vue')

// 回滚（如果需要）
await tracker.rollbackToVersion('vue', '3.2.0')
```

### 3. 使用工具函数

```typescript
import { formatBytes, formatDuration, parseVersion } from '@ldesign/deps/helpers'

// 格式化
console.log(formatBytes(1048576))    // '1.00 MB'
console.log(formatDuration(65000))   // '1m 5s'

// 解析
const version = parseVersion('^1.2.3')
console.log(version?.major)  // 1
```

---

## 🔧 配置更新

### tsconfig.json

如果您扩展了 deps 的 tsconfig，建议更新：

```json
{
  "extends": "@ldesign/deps/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### package.json scripts

推荐的新 scripts：

```json
{
  "scripts": {
    "deps:check": "ldeps check",
    "deps:audit": "ldeps audit --level high",
    "deps:analyze": "ldeps analyze",
    "deps:lock": "ldeps lock --list",
    "deps:history": "ldeps history --stats"
  }
}
```

---

## 📈 性能优化建议

### 1. 启用缓存

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600000,
    "strategy": "lru"
  }
}
```

### 2. 调整并发数

```json
{
  "update": {
    "concurrency": 20  // 根据项目大小调整
  }
}
```

---

## 🎯 最佳实践

### 1. 在 CI/CD 中使用

```yaml
# .github/workflows/deps.yml
- name: Check dependencies
  run: |
    pnpm ldeps check
    pnpm ldeps audit --level high
    pnpm ldeps analyze
```

### 2. 锁定生产依赖

```bash
# 在部署前锁定所有关键依赖
ldeps lock react@18.2.0 --reason "生产版本"
ldeps lock vue@3.3.4 --reason "生产版本"
```

### 3. 记录变更历史

```bash
# 每次更新后记录
ldeps history --stats
```

---

## 🐛 常见问题

### Q: 升级后出现类型错误

**A**: 这是因为 v0.2.0 启用了 TypeScript 严格模式。建议：

1. 运行类型检查：`pnpm type-check`
2. 修复具体的类型错误
3. 如果需要，临时禁用严格模式（不推荐）

### Q: 错误码从哪里导入？

**A**: 从 constants 模块导入：

```typescript
import { DepsErrorCode } from '@ldesign/deps/constants'
```

### Q: 如何查看锁定的依赖？

**A**: 使用以下方法：

```bash
# CLI
ldeps lock --list

# API
const locked = await lockManager.getLockedDependencies()
```

### Q: 历史记录保存在哪里？

**A**: 保存在项目根目录的 `.deps-history.json` 文件中。

建议将其加入版本控制：
```bash
git add .deps-history.json
```

---

## 📚 更多资源

- [快速开始指南](./docs/QUICK_START_CN.md)
- [最佳实践指南](./docs/BEST_PRACTICES_CN.md)
- [完整 CHANGELOG](./CHANGELOG.md)
- [项目完成报告](./PROJECT_COMPLETION_REPORT.md)

---

## 💬 获取帮助

如果在迁移过程中遇到问题：

1. 查看 [故障排查指南](./docs/TROUBLESHOOTING.md)
2. 提交 [GitHub Issue](https://github.com/ldesign/ldesign/issues)
3. 查看 [示例代码](./examples/)

---

**欢迎升级到 v0.2.0！享受更快、更安全、更强大的依赖管理体验！** 🚀


