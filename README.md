# @ldesign/deps

LDesign 依赖管理工具 - 强大的依赖分析、版本检查和更新管理工具。

## 特性

- 📦 依赖列表查看
- 🔍 版本更新检查
- 📊 依赖使用分析
- 🚀 智能更新管理
- 🛠️ 支持 npm/pnpm/yarn
- 💡 未使用依赖检测
- ⚡ 缺失依赖提醒

## 安装

```bash
pnpm add -D @ldesign/deps
```

## 使用

### CLI 方式

```bash
# 列出所有依赖
ldesign-deps list
ldeps list

# 检查依赖更新
ldesign-deps check

# 分析依赖使用情况
ldesign-deps analyze

# 更新指定包
ldesign-deps update <package-name>
ldesign-deps update react --version 18.3.0

# 安装依赖
ldesign-deps install
```

### API 方式

```typescript
import { DependencyManager, VersionChecker, DependencyAnalyzer, PackageUpdater } from '@ldesign/deps'

// 依赖管理
const manager = new DependencyManager()
const deps = await manager.getAllDependencies()
console.log(deps)

// 添加依赖
await manager.addDependency('lodash', '^4.17.21')

// 删除依赖
await manager.removeDependency('lodash')

// 版本检查
const checker = new VersionChecker()
const update = await checker.checkUpdate('react', '^18.0.0')
if (update.hasUpdate) {
  console.log(`可更新: ${update.currentVersion} -> ${update.latestVersion}`)
  console.log(`更新类型: ${update.updateType}`)
}

// 批量检查
const updates = await checker.checkUpdates({
  react: '^18.0.0',
  vue: '^3.0.0'
})

// 依赖分析
const analyzer = new DependencyAnalyzer()
const analysis = await analyzer.analyze()
console.log('未使用的依赖:', analysis.unused)
console.log('缺失的依赖:', analysis.missing)

// 包更新
const updater = new PackageUpdater()

// 检测包管理器
const pm = await updater.detectPackageManager()
console.log(`当前使用: ${pm}`)

// 更新包
await updater.updatePackage('react', '18.3.0')

// 批量更新
await updater.updatePackages([
  { name: 'react', version: '18.3.0' },
  { name: 'vue' } // 不指定版本则更新到最新
])

// 安装依赖
await updater.install()
```

## API 文档

### DependencyManager

依赖管理器。

#### 方法

- `loadPackageJson()` - 加载 package.json
- `getAllDependencies()` - 获取所有依赖
- `addDependency(name, version, type)` - 添加依赖
- `removeDependency(name)` - 删除依赖

### VersionChecker

版本检查器。

#### 方法

- `getLatestVersion(packageName)` - 获取最新版本
- `checkUpdate(packageName, currentVersion)` - 检查单个包更新
- `checkUpdates(dependencies)` - 批量检查更新

### DependencyAnalyzer

依赖分析器。

#### 方法

- `analyze()` - 分析依赖使用情况
- `getUnusedDependencies()` - 获取未使用的依赖
- `getMissingDependencies()` - 获取缺失的依赖

### PackageUpdater

包更新器。

#### 方法

- `detectPackageManager()` - 检测包管理器
- `updatePackage(packageName, version)` - 更新单个包
- `updatePackages(packages)` - 批量更新
- `install()` - 安装依赖

## License

MIT

