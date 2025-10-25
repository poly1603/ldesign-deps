# 贡献指南

感谢您考虑为 @ldesign/deps 做出贡献！

---

## 📋 目录

- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [提交流程](#提交流程)
- [测试要求](#测试要求)
- [文档要求](#文档要求)

---

## 开发环境设置

### 前置要求

- Node.js >= 16.0.0
- pnpm >= 8.0.0

### 克隆和安装

```bash
# 克隆仓库
git clone https://github.com/ldesign/ldesign.git
cd ldesign/tools/deps

# 安装依赖
pnpm install

# 构建
pnpm build

# 运行测试
pnpm test
```

---

## 代码规范

### TypeScript 规范

#### ✅ 必须遵守

1. **严格类型检查**
   ```typescript
   // ✅ 推荐
   const deps: Record<string, DependencyInfo> = {}
   
   // ❌ 禁止
   const deps: any = {}
   ```

2. **使用 unknown 代替 any**
   ```typescript
   // ✅ 推荐
   function process(data: unknown): void
   
   // ❌ 禁止
   function process(data: any): void
   ```

3. **完整的类型导出**
   ```typescript
   // ✅ 推荐
   export interface MyInterface { ... }
   export type MyType = ...
   
   // ❌ 避免
   interface MyInterface { ... }  // 未导出
   ```

### 命名规范

#### 变量命名

```typescript
// ✅ 推荐
const packageManager = await detectPackageManager()
const isLocked = await lockManager.isLocked('react')
const hasUpdate = update.hasUpdate

// ❌ 避免
const pm = await detectPackageManager()
const locked = await lockManager.isLocked('react')
const update = update.hasUpdate
```

#### 函数命名

```typescript
// ✅ 推荐
async function loadPackageJson(): Promise<PackageJson>
function isVersionCompatible(v1: string, v2: string): boolean
function handleError(error: Error): void

// ❌ 避免
async function load(): Promise<any>
function check(v1, v2): boolean
function error(e): void
```

### 错误处理

#### ✅ 必须遵守

```typescript
import { DependencyError, DepsErrorCode } from '../types'
import { logger } from './logger'

// ✅ 推荐
try {
  // 操作代码
} catch (error) {
  logger.error('操作失败', error)
  throw new DependencyError(
    '详细错误信息',
    DepsErrorCode.OPERATION_FAILED,
    error,
    true  // 可恢复
  )
}

// ❌ 禁止
try {
  // 操作代码
} catch (error) {
  console.log('失败')  // 不要直接使用 console
  throw new Error('失败')  // 使用 DependencyError
}
```

### 注释规范

#### JSDoc 注释

所有公共 API 必须有完整的 JSDoc 注释：

```typescript
/**
 * 功能简短描述
 * 
 * 详细说明（可选）
 * 
 * @param paramName - 参数说明
 * @returns 返回值说明
 * @throws {DependencyError} 抛出错误说明
 * @example
 * ```ts
 * // 使用示例
 * const result = await myFunction('value')
 * ```
 */
export async function myFunction(paramName: string): Promise<Result> {
  // 实现
}
```

#### 内联注释

```typescript
// ✅ 推荐：解释"为什么"
// 使用 Map 提升查找性能，避免 O(n) 复杂度
const packageMap = new Map<string, PackageJson>()

// ❌ 避免：重复代码内容
// 创建一个 Map
const packageMap = new Map()
```

---

## 提交流程

### 1. 创建分支

```bash
# 功能分支
git checkout -b feature/my-feature

# 修复分支
git checkout -b fix/my-fix
```

### 2. 开发

```bash
# 启动监听模式
pnpm dev

# 运行测试
pnpm test:watch
```

### 3. 提交前检查

```bash
# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 运行测试
pnpm test:run

# 验证优化
pnpm tsx scripts/verify-optimization.ts
```

### 4. 提交消息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 功能
git commit -m "feat: 添加依赖锁定功能"

# 修复
git commit -m "fix: 修复重复文件读取问题"

# 文档
git commit -m "docs: 更新 API 文档"

# 性能
git commit -m "perf: 优化 workspace 扫描性能"

# 重构
git commit -m "refactor: 统一错误处理"

# 测试
git commit -m "test: 添加单元测试"
```

### 5. 推送和 PR

```bash
# 推送分支
git push origin feature/my-feature

# 创建 Pull Request
# 在 GitHub 上创建 PR，填写详细说明
```

---

## 测试要求

### 单元测试

**覆盖率要求**: ≥ 80%

```typescript
import { describe, it, expect } from 'vitest'
import { MyClass } from '../src/core/my-class'

describe('MyClass', () => {
  it('should work correctly', async () => {
    const instance = new MyClass()
    const result = await instance.myMethod()
    expect(result).toBe(expected)
  })

  it('should handle errors', async () => {
    const instance = new MyClass()
    await expect(instance.invalidOperation()).rejects.toThrow()
  })
})
```

### 集成测试

测试多个模块的协作：

```typescript
describe('Integration: Lock and History', () => {
  it('should track lock operations', async () => {
    const lockManager = new DependencyLockManager()
    const tracker = new DependencyHistoryTracker()

    await lockManager.lockDependency('react', '18.2.0')
    await tracker.trackChange({
      packageName: 'react',
      type: 'lock',
      newVersion: '18.2.0'
    })

    const history = await tracker.getHistory('react')
    expect(history.changes).toHaveLength(1)
  })
})
```

### 运行测试

```bash
# 运行所有测试
pnpm test:run

# 生成覆盖率报告
pnpm test:coverage

# 监听模式
pnpm test:watch

# UI 模式
pnpm test:ui
```

---

## 文档要求

### 代码文档

- ✅ 所有公共 API 必须有 JSDoc
- ✅ JSDoc 必须包含参数和返回值说明
- ✅ 复杂逻辑必须有示例代码
- ✅ 抛出的错误必须文档化

### README 更新

如果添加新功能，必须更新：

1. 特性列表
2. API 文档
3. CLI 命令说明
4. 使用示例

### Changelog

所有变更必须记录在 `CHANGELOG.md`：

```markdown
## [版本号] - 日期

### Added
- 新增功能

### Changed
- 变更内容

### Fixed
- 修复问题

### Performance
- 性能优化
```

---

## 代码审查清单

### Pull Request 清单

- [ ] 代码符合规范
- [ ] 所有测试通过
- [ ] 测试覆盖率 ≥ 80%
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告
- [ ] JSDoc 文档完整
- [ ] README 已更新
- [ ] CHANGELOG 已更新
- [ ] 提交消息规范

### Reviewer 清单

- [ ] 代码逻辑正确
- [ ] 错误处理完善
- [ ] 性能合理
- [ ] 安全性检查
- [ ] 向后兼容性
- [ ] 文档清晰

---

## 发布流程

### 版本号规范

遵循 [Semantic Versioning](https://semver.org/)：

- **Major (x.0.0)**: 破坏性变更
- **Minor (0.x.0)**: 新增功能，向后兼容
- **Patch (0.0.x)**: Bug 修复，向后兼容

### 发布步骤

1. 更新版本号
   ```bash
   pnpm version minor  # 或 major/patch
   ```

2. 更新 CHANGELOG
   ```bash
   # 编辑 CHANGELOG.md
   ```

3. 运行完整测试
   ```bash
   pnpm test:run
   pnpm type-check
   pnpm lint
   ```

4. 构建
   ```bash
   pnpm build
   ```

5. 发布
   ```bash
   pnpm publish
   ```

---

## 获取帮助

- 📖 阅读 [README](./README.md)
- 🚀 查看 [快速开始](./docs/QUICK_START_CN.md)
- 💡 参考 [最佳实践](./docs/BEST_PRACTICES_CN.md)
- 🐛 提交 [Issue](https://github.com/ldesign/ldesign/issues)
- 💬 加入社区讨论

---

## 行为准则

- 尊重所有贡献者
- 保持友好和专业
- 提供建设性的反馈
- 遵守项目规范

---

**感谢您的贡献！** 🙏


