# 最佳实践

遵循这些最佳实践，最大化 @ldesign/deps 的价值。

## 日常工作流

### 每日检查

在开始工作前，快速检查依赖状态：

```bash
# 快速检查更新
ldeps check --parallel

# 查看健康度低的依赖
ldeps health --all --threshold 70
```

将这些命令添加到你的晨间例行任务中，或配置为每日自动任务。

### 添加新依赖时

在添加新依赖之前，先评估其质量：

```bash
# 评估包的健康度
ldeps health <package-name>

# 查看性能影响
ldeps performance

# 检查安全问题
ldeps audit
```

### 定期维护

**每周任务：**

```bash
# 完整健康度检查
ldeps health --all --report health-weekly.json

# 安全审计
ldeps audit --level moderate

# 依赖分析
ldeps analyze

# 成本分析
ldeps cost --trends
```

**每月任务：**

```bash
# 查找替代方案
ldeps alternatives --all --threshold 60

# 更新依赖
ldeps update --interactive

# 生成变更日志
ldeps changelog --output CHANGELOG.md
```

## 团队协作

### 共享配置

创建团队共享的配置文件：

```json
// .depsrc.json
{
  "cache": {
    "enabled": true,
    "ttl": 3600000
  },
  "security": {
    "auditLevel": "moderate",
    "allowedLicenses": ["MIT", "Apache-2.0", "BSD-3-Clause"]
  },
  "health": {
    "threshold": 70
  }
}
```

提交到版本控制，团队成员保持一致。

### 代码审查清单

在代码审查时检查：

- [ ] 新增依赖的健康度评分
- [ ] 是否有更轻量的替代方案
- [ ] License 是否符合项目要求
- [ ] 是否存在已知安全漏洞
- [ ] 对 bundle 大小的影响

### Pull Request 模板

添加依赖检查到 PR 模板：

```markdown
## 依赖变更

- [ ] 已运行 `ldeps health <new-package>`
- [ ] 已运行 `ldeps audit`
- [ ] 已检查 bundle 大小影响
- [ ] 已更新依赖文档

**健康度报告：**
<!-- 粘贴 ldeps health 输出 -->

**成本影响：**
<!-- 粘贴 ldeps cost 输出 -->
```

## CI/CD 集成

### GitHub Actions

创建自动化工作流：

```yaml
# .github/workflows/deps-check.yml
name: Dependency Check

on:
  schedule:
    - cron: '0 9 * * 1'  # 每周一早上 9 点
  pull_request:
    paths:
      - 'package.json'
      - 'package-lock.json'
      - 'pnpm-lock.yaml'

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install @ldesign/deps
        run: npm install -g @ldesign/deps
      
      - name: Check for updates
        run: ldeps check --json > updates.json
      
      - name: Security audit
        run: ldeps audit --level moderate
      
      - name: Health check
        run: |
          ldeps health --all --threshold 60 --report health-report.json
        continue-on-error: true
      
      - name: Cost analysis
        run: ldeps cost --json > cost-report.json
      
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: dependency-reports
          path: |
            updates.json
            health-report.json
            cost-report.json
      
      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs')
            const health = JSON.parse(fs.readFileSync('health-report.json', 'utf8'))
            const cost = JSON.parse(fs.readFileSync('cost-report.json', 'utf8'))
            
            const comment = `
            ## 依赖检查报告
            
            ### 健康度
            - 总依赖数: ${health.total}
            - 低分依赖: ${health.lowScore.length}
            
            ### 成本
            - 安装时间: ${cost.overallCost.installTime}ms
            - 磁盘空间: ${cost.overallCost.totalDiskSpace}MB
            - 月度成本: $${cost.ciCost.estimatedCost}
            `
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            })
```

### GitLab CI

```yaml
# .gitlab-ci.yml
deps-check:
  stage: test
  image: node:18
  script:
    - npm install -g @ldesign/deps
    - ldeps check
    - ldeps audit --level moderate
    - ldeps health --all --threshold 60
    - ldeps cost --json > cost-report.json
  artifacts:
    reports:
      junit: cost-report.json
  only:
    changes:
      - package.json
      - package-lock.json
```

### 持续监控

设置定时任务，定期运行检查：

```yaml
# .github/workflows/deps-monitor.yml
name: Dependency Monitor

on:
  schedule:
    - cron: '0 0 * * *'  # 每天午夜

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g @ldesign/deps
      
      - name: Full analysis
        run: |
          ldeps check --json > updates.json
          ldeps health --all --json > health.json
          ldeps audit --json > audit.json
          ldeps cost --json > cost.json
      
      - name: Send notification
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        run: |
          ldeps notify --test --channel slack
```

## 性能优化

### 使用缓存

启用缓存以加快重复查询：

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600000,
    "maxSize": 1000
  }
}
```

在 CI 环境中，可以缓存 `.deps-cache` 目录：

```yaml
# GitHub Actions
- uses: actions/cache@v3
  with:
    path: .deps-cache
    key: deps-cache-${{ hashFiles('package.json') }}
```

### 并行检查

使用并行选项加快版本检查：

```bash
ldeps check --parallel --show-progress
```

### 选择性检查

只检查需要的内容：

```bash
# 只检查生产依赖
ldeps health --type dependencies

# 只检查高危漏洞
ldeps audit --level high

# 只分析未使用的依赖
ldeps analyze --check-unused
```

## 安全最佳实践

### License 合规

配置允许的 License：

```json
{
  "security": {
    "checkLicenses": true,
    "allowedLicenses": [
      "MIT",
      "Apache-2.0",
      "BSD-2-Clause",
      "BSD-3-Clause",
      "ISC"
    ]
  }
}
```

### Pre-commit Hook

使用 Husky 添加 pre-commit 检查：

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "ldeps audit --level high && ldeps analyze --check-unused"
    }
  }
}
```

或使用 lint-staged：

```json
{
  "lint-staged": {
    "package.json": [
      "ldeps audit --level high",
      "ldeps health --all --threshold 60"
    ]
  }
}
```

### 自动修复

在 CI 中尝试自动修复漏洞：

```bash
ldeps audit --fix
```

但建议在本地测试后再提交。

## Monorepo 最佳实践

### 统一版本管理

扫描并分析版本冲突：

```bash
# 扫描工作区
ldeps workspace --scan

# 分析冲突
ldeps workspace --analyze

# 获取优化建议
ldeps workspace --scan --analyze
```

### 批量操作

对所有工作区包执行操作：

```bash
# 更新所有工作区
ldeps update --workspace

# 健康度检查
ldeps health --all --workspace
```

### 共享依赖

配置依赖提升：

```json
{
  "workspace": {
    "enabled": true,
    "packages": ["packages/*", "apps/*"],
    "hoistDependencies": true
  }
}
```

## 通知策略

### 按严重性分类

配置不同级别的通知：

```json
{
  "notifications": {
    "enabled": true,
    "triggers": {
      "updates": false,           // 不通知常规更新
      "vulnerabilities": true,    // 始终通知漏洞
      "healthScore": 60           // 低于 60 分时通知
    },
    "channels": ["email", "slack"]
  }
}
```

### 智能通知

避免通知疲劳：

- 仅在工作日发送
- 合并多个通知
- 设置通知频率限制

```bash
# 在 CI 中，只在失败时通知
ldeps audit || ldeps notify --channel slack
```

## 依赖选择指南

### 选择依赖的黄金法则

1. **健康度优先**
   - 优先选择 A 或 B 级的包
   - 避免 F 级的包

2. **活跃维护**
   - 最近 6 个月内有更新
   - Issue 响应及时

3. **社区支持**
   - 周下载量 > 10,000
   - GitHub Stars > 100

4. **轻量级**
   - 尽量选择小型库
   - 考虑 tree-shaking 支持

5. **安全性**
   - 无已知漏洞
   - License 合规

### 评估新依赖

使用以下命令评估：

```bash
# 综合评估
ldeps health <package-name>

# 查看大小影响
npm view <package-name> dist.unpackedSize

# 查看依赖树
ldeps tree <package-name>

# 查找替代方案
ldeps alternatives <package-name>
```

### 依赖最小化

遵循"最少依赖"原则：

```bash
# 定期清理未使用的依赖
ldeps analyze --check-unused

# 考虑内置替代方案
# 例如，用原生 fetch 替代 axios
# 用 dayjs 替代 moment
```

## 版本管理策略

### 语义化版本

理解版本范围：

```json
{
  "dependencies": {
    "react": "^18.2.0",      // 允许次版本和补丁更新
    "lodash": "~4.17.21",    // 只允许补丁更新
    "typescript": "5.7.3"    // 固定版本
  }
}
```

### 更新策略

**保守策略（推荐生产环境）：**
```bash
# 只更新补丁版本
ldeps update --patch

# 手动审查主版本更新
ldeps check --json | jq '.[] | select(.type=="major")'
```

**激进策略（适合开发环境）：**
```bash
# 更新到最新版本
ldeps update --latest

# 使用交互式模式
ldeps update --interactive
```

### Lockfile 管理

定期验证 lockfile：

```bash
# 解析 lockfile
ldeps lockfile --parse

# 检查重复
ldeps analyze --check-duplicates

# 去重
ldeps dedupe
```

## 文档和报告

### 自动生成文档

定期生成依赖文档：

```bash
# 导出依赖图
ldeps graph --format mermaid --output docs/dependencies.md

# 生成健康度报告
ldeps health --all --report docs/health-report.json

# 生成成本报告
ldeps cost --json > docs/cost-report.json
```

### 项目文档

在 README 中添加徽章：

```markdown
# My Project

![Dependencies Health](https://img.shields.io/badge/dependencies-healthy-green)
![Security Audit](https://img.shields.io/badge/security-passing-green)

## 依赖管理

我们使用 [@ldesign/deps](https://github.com/ldesign/ldesign) 进行依赖管理。

### 检查依赖状态

\`\`\`bash
npm run deps:check
\`\`\`

### 更新依赖

\`\`\`bash
npm run deps:update
\`\`\`
```

添加 npm scripts：

```json
{
  "scripts": {
    "deps:check": "ldeps check",
    "deps:health": "ldeps health --all",
    "deps:audit": "ldeps audit",
    "deps:update": "ldeps update --interactive",
    "deps:analyze": "ldeps analyze"
  }
}
```

## 成本控制

### CI 优化

减少 CI 运行时间：

```yaml
# 使用缓存
- uses: actions/cache@v3
  with:
    path: |
      node_modules
      .deps-cache
    key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json') }}

# 只在必要时运行
- name: Dependency check
  if: contains(github.event.head_commit.message, 'deps')
  run: ldeps check
```

### 依赖优化

定期检查昂贵的依赖：

```bash
# 分析成本
ldeps cost

# 查看优化建议
ldeps cost --trends

# 寻找替代方案
ldeps alternatives --all
```

## 故障排除

### 常见问题

**1. 命令执行慢**

```bash
# 启用缓存
ldeps cache clear && ldeps check

# 减少并发数
DEPS_CONCURRENCY=3 ldeps check --parallel
```

**2. 网络问题**

```bash
# 使用镜像
npm config set registry https://registry.npmmirror.com

# 增加超时
DEPS_TIMEOUT=60000 ldeps check
```

**3. 内存不足**

```bash
# 限制并发
export DEPS_CONCURRENCY=2
ldeps health --all
```

### 调试模式

启用详细日志：

```bash
# 详细输出
ldeps check --verbose

# 调试模式
DEBUG=deps:* ldeps check

# 保存日志
ldeps check --verbose > deps.log 2>&1
```

## 持续改进

### 定期审查

每季度进行全面审查：

1. 检查所有依赖的健康度
2. 更新过时的依赖
3. 清理未使用的依赖
4. 寻找更好的替代方案
5. 优化 CI/CD 流程
6. 更新团队文档

### 指标跟踪

跟踪关键指标：

- 依赖总数
- 平均健康度评分
- 安全漏洞数量
- CI 运行时间
- Bundle 大小

```bash
# 导出趋势数据
ldeps cost --trends --json > metrics/$(date +%Y-%m-%d).json
```

### 团队培训

定期培训团队成员：

- 依赖管理最佳实践
- @ldesign/deps 工具使用
- 安全意识
- 性能优化

## 总结

遵循这些最佳实践，你可以：

- ✅ 保持依赖健康和安全
- ✅ 降低维护成本
- ✅ 提高开发效率
- ✅ 改善项目质量
- ✅ 增强团队协作

记住：**依赖管理是一个持续的过程，而不是一次性任务。**

## 下一步

- 📚 阅读 [配置指南](/config/configuration) 自定义行为
- 🎯 查看 [CLI 命令](/cli/commands) 完整列表
- 🔧 探索 [API 文档](/api/core) 编程接口
