# 最佳实践指南

## 📋 目录

- [日常使用](#日常使用)
- [团队协作](#团队协作)
- [CI/CD 集成](#cicd-集成)
- [性能优化](#性能优化)
- [安全实践](#安全实践)
- [Monorepo 管理](#monorepo-管理)

## 日常使用

### 1. 建立日常检查习惯

```bash
# 每天开始工作前
ldeps check --parallel       # 快速检查更新
ldeps audit                  # 安全检查

# 每周一次
ldeps analyze                # 分析依赖使用
ldeps duplicate              # 检查重复依赖
ldeps outdated               # 查看过时依赖
```

### 2. 使用交互式模式更新

```bash
# 推荐使用交互式模式，更安全
ldeps interactive

# 而不是盲目更新所有
# ❌ 不推荐
npm update
```

### 3. 分批更新依赖

```bash
# 1. 先更新补丁版本（最安全）
ldeps check --parallel | grep "patch"
ldeps interactive  # 选择 patch 更新

# 2. 再更新次版本（需要测试）
ldeps interactive  # 选择 minor 更新

# 3. 最后更新主版本（需要仔细评估）
ldeps interactive  # 选择 major 更新
```

### 4. 定期清理

```bash
# 清理未使用的依赖
ldeps clean

# 去重依赖
ldeps dedupe
```

## 团队协作

### 1. 共享配置

在项目根目录创建 `.depsrc.json`:

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600000
  },
  "security": {
    "auditLevel": "high",
    "checkLicenses": true,
    "allowedLicenses": ["MIT", "Apache-2.0", "BSD-3-Clause"]
  },
  "analyze": {
    "checkUnused": true,
    "checkMissing": true,
    "checkDuplicates": true,
    "ignorePatterns": [
      "**/*.test.ts",
      "**/dist/**"
    ]
  }
}
```

提交到版本控制，团队成员自动使用相同配置。

### 2. 依赖更新流程

```bash
# 1. 创建分支
git checkout -b deps/update-react

# 2. 更新依赖
ldeps update react --version 18.3.0

# 3. 运行测试
npm test

# 4. 审计安全
ldeps audit --level high

# 5. 提交 PR
git add package.json package-lock.json
git commit -m "chore(deps): update react to 18.3.0"
```

### 3. 依赖批准机制

在 PR 模板中添加检查清单：

```markdown
## 依赖变更检查清单

- [ ] 运行 `ldeps audit` 无严重漏洞
- [ ] 运行 `ldeps analyze` 无新增未使用依赖
- [ ] 所有测试通过
- [ ] 文档已更新（如有 API 变更）
- [ ] CHANGELOG 已更新
```

## CI/CD 集成

### 1. GitHub Actions 配置

```yaml
name: Dependency Check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1' # 每周一

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Security Audit
        run: |
          npx ldeps audit --level high --json > audit-report.json
          cat audit-report.json
      
      - name: Check Outdated
        run: npx ldeps outdated
      
      - name: Check Duplicates
        run: npx ldeps duplicate
      
      - name: Analyze Dependencies
        run: npx ldeps analyze
      
      - name: Upload Audit Report
        uses: actions/upload-artifact@v3
        with:
          name: audit-report
          path: audit-report.json
```

### 2. GitLab CI 配置

```yaml
dependency_check:
  stage: test
  script:
    - npm install
    - npx ldeps audit --level high
    - npx ldeps analyze
    - npx ldeps duplicate
  only:
    - merge_requests
    - main
```

### 3. 定期自动更新

```yaml
name: Auto Update Dependencies

on:
  schedule:
    - cron: '0 0 * * 0' # 每周日

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Update Patch Versions
        run: |
          npm install
          # 只更新 patch 版本
          npx ldeps check --parallel | \
            grep "patch" | \
            awk '{print $1}' | \
            xargs -I {} npx ldeps update {}
      
      - name: Run Tests
        run: npm test
      
      - name: Create PR
        uses: peter-evans/create-pull-request@v5
        with:
          title: 'chore(deps): auto update patch versions'
          body: 'Automated dependency updates (patch versions only)'
```

## 性能优化

### 1. 启用缓存

```json
{
  "cache": {
    "enabled": true,
    "ttl": 7200000,
    "maxSize": 2000,
    "strategy": "lru",
    "persistPath": "./.cache/deps-cache.json"
  }
}
```

### 2. 并行检查

```bash
# 使用 --parallel 提升 3-5 倍速度
ldeps check --parallel --show-progress
```

### 3. 增量分析

```bash
# 使用 quickAnalyze 快速分析
# 在 API 中使用
const analyzer = new DependencyAnalyzer()
const result = await analyzer.quickAnalyze() // 更快
```

### 4. 配置合理的并发数

```json
{
  "update": {
    "concurrency": 10  // 根据网络情况调整
  }
}
```

## 安全实践

### 1. 设置严格的审计级别

```json
{
  "security": {
    "auditLevel": "high",  // 或 "critical"
    "checkLicenses": true,
    "blockedLicenses": ["GPL-3.0", "AGPL-3.0"]
  }
}
```

### 2. 定期安全扫描

```bash
# 每天自动运行
0 9 * * * cd /path/to/project && ldeps audit --level high
```

### 3. 监控新漏洞

```bash
# 使用 watch 模式
watch -n 3600 'ldeps audit --level high --json > audit-$(date +%Y%m%d).json'
```

### 4. 许可证合规

```bash
# 生成许可证报告
ldeps audit --json | jq '.licenses[] | {name: .packageName, license: .license}' > licenses.json
```

## Monorepo 管理

### 1. 工作区配置

```json
{
  "workspace": {
    "enabled": true,
    "syncVersions": true,
    "checkPhantom": true
  }
}
```

### 2. 版本同步

```bash
# 扫描工作区
ldeps workspace --scan

# 分析版本冲突
ldeps workspace --analyze

# 同步依赖版本（交互式）
ldeps interactive
```

### 3. 避免幽灵依赖

```bash
# 定期检查幽灵依赖
ldeps workspace --scan | grep "phantom"

# 确保所有依赖都在 package.json 中声明
```

### 4. 批量操作

```bash
# 对所有子包执行命令
# 在 API 中使用
const wsManager = new WorkspaceManager()
const workspace = await wsManager.analyzeWorkspace()

for (const pkg of workspace.packages) {
  // 对每个包执行操作
}
```

## 避免常见错误

### ❌ 不要做

```bash
# 1. 不要盲目更新所有依赖
npm update  # ❌

# 2. 不要忽略主版本变更
ldeps update react  # ❌ 没有查看 breaking changes

# 3. 不要跳过安全审计
# ❌ 直接部署到生产环境

# 4. 不要忽略测试
ldeps update lodash && git commit  # ❌ 没有测试
```

### ✅ 应该做

```bash
# 1. 使用交互式更新
ldeps interactive  # ✅

# 2. 检查更新类型
ldeps check
ldeps outdated  # ✅ 查看详情

# 3. 总是运行安全审计
ldeps audit --level high  # ✅

# 4. 更新后运行测试
ldeps update lodash
npm test  # ✅
ldeps audit  # ✅
```

## 性能基准

根据测试，使用最佳实践可以获得：

- **并行检查**: 比顺序检查快 3-5 倍
- **缓存命中**: 减少 80% 的网络请求
- **增量分析**: 大型项目快 2-3 倍
- **批量操作**: Monorepo 效率提升 4 倍

## 推荐工作流

```bash
# 每天
ldeps check --parallel
ldeps audit

# 每周
ldeps analyze
ldeps duplicate
ldeps clean

# 每月
ldeps outdated
ldeps interactive  # 计划更新
```

## 更多资源

- [CLI 使用指南](./CLI_GUIDE.md)
- [API 文档](./api.md)
- [故障排除](./TROUBLESHOOTING.md)
- [性能优化](./PERFORMANCE.md)

