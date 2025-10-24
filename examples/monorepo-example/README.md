# Monorepo 使用示例

这个示例展示了如何在 Monorepo 项目中使用 `@ldesign/deps`。

## 项目结构

```
monorepo-example/
├── packages/          # 共享库
│   ├── ui/
│   ├── utils/
│   └── config/
├── apps/             # 应用
│   ├── web/
│   └── mobile/
├── package.json
├── pnpm-workspace.yaml
└── .depsrc.json
```

## 配置文件

### pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### .depsrc.json

```json
{
  "workspace": {
    "enabled": true,
    "syncVersions": true,
    "checkPhantom": true
  },
  "security": {
    "auditLevel": "high",
    "checkLicenses": true
  },
  "cache": {
    "enabled": true,
    "ttl": 7200000
  }
}
```

## 使用方法

### 1. 扫描工作区

```bash
npm run deps:workspace
# 或
ldeps workspace --scan
```

输出：
```
工作区信息:
  类型: pnpm
  包数: 5
  跨包依赖: 8
  幽灵依赖: 0
```

### 2. 分析版本冲突

```bash
npm run deps:conflicts
# 或
ldeps workspace --analyze
```

输出：
```
发现 3 个版本冲突:

  react:
    ^18.0.0: packages/ui, apps/web
    ^17.0.0: apps/mobile
    建议: 建议统一版本为 ^18.0.0

  lodash:
    ^4.17.21: packages/utils
    ^4.17.20: packages/ui
    建议: 建议统一版本为 ^4.17.21
```

### 3. 同步依赖版本

```bash
# 交互式同步
ldeps interactive

# 或使用 API
```

```typescript
import { WorkspaceManager } from '@ldesign/deps'

const wsManager = new WorkspaceManager()

// 同步 react 版本到 18.3.0
await wsManager.syncDependencyVersions('react', '^18.3.0')
```

### 4. 检查幽灵依赖

幽灵依赖是指在代码中使用但未在 package.json 中声明的依赖。

```bash
ldeps workspace --scan
```

如果发现幽灵依赖：
```
幽灵依赖 (2):
  - lodash (使用于: packages/ui, 来源: root)
  - axios (使用于: apps/web, 来源: root)
```

修复方法：
```bash
# 在相应的包中添加依赖
cd packages/ui
pnpm add lodash

cd ../../apps/web
pnpm add axios
```

### 5. 批量更新所有包

```bash
# 检查所有包的更新
ldeps check --parallel

# 交互式更新
ldeps interactive
```

### 6. 生成依赖关系图

```bash
npm run deps:graph
# 或
ldeps graph --format mermaid --output deps-graph.md
```

## API 使用

### 获取工作区信息

```typescript
import { WorkspaceManager } from '@ldesign/deps'

const wsManager = new WorkspaceManager()

// 分析工作区
const workspace = await wsManager.analyzeWorkspace()

console.log('工作区类型:', workspace.type)
console.log('包列表:', workspace.packages.map(p => p.name))

// 查看跨包依赖
workspace.crossDependencies.forEach(dep => {
  console.log(`${dep.from} → ${dep.to} (${dep.version})`)
  if (!dep.compatible) {
    console.warn('版本不兼容！')
  }
})
```

### 分析版本冲突

```typescript
const analysis = await wsManager.analyzeVersionConflicts()

// 处理版本冲突
for (const conflict of analysis.versionConflicts) {
  console.log(`冲突: ${conflict.dependency}`)
  
  conflict.versions.forEach((packages, version) => {
    console.log(`  ${version}: ${packages.join(', ')}`)
  })
  
  if (conflict.recommendation) {
    console.log(`  建议: ${conflict.recommendation}`)
  }
}
```

### 自动同步版本

```typescript
// 获取所有版本冲突
const analysis = await wsManager.analyzeVersionConflicts()

// 自动选择最新版本并同步
for (const conflict of analysis.versionConflicts) {
  const versions = Array.from(conflict.versions.keys())
  const latestVersion = versions.sort(semver.rcompare)[0]
  
  console.log(`同步 ${conflict.dependency} 到 ${latestVersion}`)
  await wsManager.syncDependencyVersions(conflict.dependency, latestVersion)
}
```

## 最佳实践

### 1. 定期检查

在 CI 中添加定期检查：

```yaml
# .github/workflows/monorepo-check.yml
name: Monorepo Check

on:
  schedule:
    - cron: '0 0 * * 1'  # 每周一

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check workspace
        run: |
          npm install
          npx ldeps workspace --analyze
```

### 2. 统一依赖版本

创建脚本自动统一版本：

```typescript
// scripts/sync-deps.ts
import { WorkspaceManager } from '@ldesign/deps'

async function syncCommonDeps() {
  const wsManager = new WorkspaceManager()
  const workspace = await wsManager.analyzeWorkspace()
  
  // 需要统一的依赖列表
  const commonDeps = ['react', 'react-dom', 'typescript']
  
  for (const dep of commonDeps) {
    // 找到最新使用的版本
    const versions = new Set<string>()
    
    workspace.packages.forEach(pkg => {
      const version = pkg.dependencies[dep] || pkg.devDependencies[dep]
      if (version) versions.add(version)
    })
    
    if (versions.size > 1) {
      console.log(`统一 ${dep} 版本...`)
      const latest = Array.from(versions).sort().pop()!
      await wsManager.syncDependencyVersions(dep, latest)
    }
  }
}

syncCommonDeps()
```

### 3. 防止幽灵依赖

在 package.json 中添加检查：

```json
{
  "scripts": {
    "pretest": "ldeps workspace --scan",
    "postinstall": "ldeps analyze"
  }
}
```

## 常见问题

### Q: 如何处理 pnpm 的幽灵依赖？

A: pnpm 默认使用严格的依赖隔离，但仍可能出现幽灵依赖。使用 `ldeps workspace --scan` 检测并修复。

### Q: 如何在 CI 中使用？

A: 参考上面的 CI 配置示例，在 workflow 中添加 monorepo 检查步骤。

### Q: 能自动修复版本冲突吗？

A: 可以使用交互式模式 `ldeps interactive` 选择要更新的版本，或使用 API 编写自动化脚本。

## 相关链接

- [Monorepo 最佳实践](../../docs/BEST_PRACTICES.md#monorepo-管理)
- [Workspace API 文档](../../docs/api.md#workspacemanager)
- [CLI 工作区命令](../../docs/CLI_GUIDE.md#monorepo-管理)

