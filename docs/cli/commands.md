# CLI 命令参考

@ldesign/deps 提供了 26+ 个强大的 CLI 命令，涵盖依赖管理的方方面面。

## 目录

[[toc]]

## 全局选项

所有命令支持以下全局选项：

```bash
--help, -h          # 显示帮助信息
--version, -v       # 显示版本号
--json              # 以 JSON 格式输出（适用于大多数命令）
--silent            # 静默模式，减少输出
--verbose           # 详细模式，显示更多信息
```

## 依赖管理

### `ldeps list`

列出项目中的所有依赖。

```bash
ldeps list [options]
```

**选项:**

- `--type <type>` - 过滤依赖类型: `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`
- `--json` - 以 JSON 格式输出
- `--sort <field>` - 排序字段: `name`, `version`, `type`

**示例:**

```bash
# 列出所有依赖
ldeps list

# 只列出生产依赖
ldeps list --type dependencies

# 按名称排序并输出 JSON
ldeps list --sort name --json
```

### `ldeps add`

添加新的依赖。

```bash
ldeps add <package> [options]
```

**选项:**

- `--dev, -D` - 添加到 devDependencies
- `--peer, -P` - 添加到 peerDependencies
- `--optional, -O` - 添加到 optionalDependencies
- `--exact, -E` - 精确版本
- `--version <version>` - 指定版本

**示例:**

```bash
# 添加生产依赖
ldeps add react

# 添加开发依赖
ldeps add -D typescript

# 添加指定版本
ldeps add react@18.2.0 --exact
```

### `ldeps remove`

移除依赖。

```bash
ldeps remove <package> [options]
```

**选项:**

- `--type <type>` - 指定依赖类型

**示例:**

```bash
# 移除依赖
ldeps remove lodash

# 移除开发依赖
ldeps remove --type devDependencies typescript
```

### `ldeps update`

更新依赖到指定版本或最新版本。

```bash
ldeps update [package] [options]
```

**选项:**

- `--to <version>` - 更新到指定版本
- `--latest` - 更新到最新版本（忽略语义化版本范围）
- `--workspace` - 更新工作区中的所有包
- `--interactive, -i` - 交互式选择要更新的包
- `--dry-run` - 模拟更新，不实际修改

**示例:**

```bash
# 更新单个包到最新兼容版本
ldeps update react

# 更新所有包到最新版本
ldeps update --latest

# 交互式更新
ldeps update --interactive

# 模拟更新
ldeps update --dry-run
```

## 版本检查

### `ldeps check`

检查依赖是否有可用更新。

```bash
ldeps check [options]
```

**选项:**

- `--parallel` - 并行检查（更快）
- `--show-progress` - 显示进度条
- `--json` - JSON 输出

**示例:**

```bash
# 检查更新
ldeps check

# 并行检查并显示进度
ldeps check --parallel --show-progress

# JSON 输出
ldeps check --json
```

### `ldeps outdated`

列出过时的依赖（类似 `npm outdated`）。

```bash
ldeps outdated [options]
```

**选项:**

- `--json` - JSON 格式输出
- `--depth <n>` - 依赖树深度

**示例:**

```bash
ldeps outdated
ldeps outdated --json
```

## 健康度评估

### `ldeps health`

评估依赖的健康度。

```bash
ldeps health [package] [options]
```

**选项:**

- `--all` - 评估所有依赖
- `--threshold <score>` - 仅显示低于阈值的包（0-100）
- `--json` - JSON 输出
- `--report <file>` - 导出详细报告

**示例:**

```bash
# 评估单个包
ldeps health react

# 评估所有依赖
ldeps health --all

# 只显示评分低于 60 的包
ldeps health --all --threshold 60

# 导出报告
ldeps health --all --report health-report.json
```

**输出示例:**

```
┌─────────────────────┬──────────┬────────┬─────────────┬──────────────────────────────┐
│ 包名                │ 版本     │ 评分   │ 等级        │ 问题                         │
├─────────────────────┼──────────┼────────┼─────────────┼──────────────────────────────┤
│ react               │ 18.2.0   │ 95     │ A           │ -                            │
│ lodash              │ 4.17.21  │ 72     │ C           │ 更新频率低                   │
│ moment              │ 2.29.4   │ 45     │ F           │ 已废弃，推荐使用 dayjs       │
└─────────────────────┴──────────┴────────┴─────────────┴──────────────────────────────┘
```

## 性能监控

### `ldeps performance`

分析依赖对性能的影响。

```bash
ldeps performance [options]
```

**选项:**

- `--json` - JSON 输出
- `--report <file>` - 导出详细报告
- `--include-bundle` - 包含 bundle 大小分析（需要构建）

**示例:**

```bash
# 基础性能分析
ldeps performance

# 完整分析（含 bundle 大小）
ldeps performance --include-bundle

# 导出报告
ldeps performance --report perf-report.json
```

**输出内容:**

- 安装时间统计
- node_modules 大小
- 依赖数量和深度
- Top 10 最大的依赖
- Bundle 大小影响（可选）

## 成本分析

### `ldeps cost`

分析依赖的成本（时间、空间、CI/CD）。

```bash
ldeps cost [options]
```

**选项:**

- `--json` - JSON 输出
- `--trends` - 包含趋势分析（需要历史数据）
- `--ci-runs <n>` - CI/CD 每月运行次数（默认: 1000）

**示例:**

```bash
# 基础成本分析
ldeps cost

# 包含趋势
ldeps cost --trends

# 自定义 CI 运行次数
ldeps cost --ci-runs 5000
```

**输出内容:**

- 总体成本概览（依赖数、安装时间、磁盘空间）
- Top 10 最贵的依赖
- CI/CD 成本估算
- 优化建议

## 替代方案

### `ldeps alternatives`

查找依赖的替代方案。

```bash
ldeps alternatives [package] [options]
```

**选项:**

- `--all` - 查找所有依赖的替代方案
- `--json` - JSON 输出
- `--threshold <score>` - 只查找健康度低于阈值的包

**示例:**

```bash
# 查找单个包的替代方案
ldeps alternatives moment

# 查找所有过时包的替代方案
ldeps alternatives --all --threshold 60

# JSON 输出
ldeps alternatives moment --json
```

**输出示例:**

```
📦 moment 的替代方案:

原因: 包已废弃，不再维护

推荐替代方案:

1. dayjs
   描述: 2KB 的轻量级时间库，API 兼容 Moment.js
   健康度: 92/100 [A]
   大小: 2.0 KB (vs moment: 288 KB)
   迁移成本: 中等
   
2. date-fns
   描述: 现代 JavaScript 日期工具库
   健康度: 90/100 [A]
   大小: 78 KB (tree-shakable)
   迁移成本: 较高

3. luxon
   描述: Moment 团队推荐的替代品
   健康度: 88/100 [A]
   大小: 72 KB
   迁移成本: 较高
```

## 安全审计

### `ldeps audit`

执行安全漏洞扫描。

```bash
ldeps audit [options]
```

**选项:**

- `--level <level>` - 最低严重级别: `low`, `moderate`, `high`, `critical`
- `--json` - JSON 输出
- `--fix` - 尝试自动修复
- `--report <file>` - 导出报告

**示例:**

```bash
# 基础审计
ldeps audit

# 只显示高危和严重漏洞
ldeps audit --level high

# 自动修复
ldeps audit --fix

# 导出报告
ldeps audit --report audit-report.json
```

### `ldeps licenses`

检查依赖的许可证。

```bash
ldeps licenses [options]
```

**选项:**

- `--allowed <licenses>` - 允许的许可证列表（逗号分隔）
- `--json` - JSON 输出

**示例:**

```bash
# 列出所有许可证
ldeps licenses

# 检查合规性
ldeps licenses --allowed MIT,Apache-2.0,BSD-3-Clause

# JSON 输出
ldeps licenses --json
```

## 依赖分析

### `ldeps analyze`

深度分析依赖（未使用、缺失、重复）。

```bash
ldeps analyze [options]
```

**选项:**

- `--check-unused` - 检查未使用的依赖
- `--check-missing` - 检查缺失的依赖
- `--check-duplicates` - 检查重复的依赖
- `--json` - JSON 输出

不指定选项时，执行所有检查。

**示例:**

```bash
# 完整分析
ldeps analyze

# 只检查未使用的依赖
ldeps analyze --check-unused

# 组合检查
ldeps analyze --check-unused --check-missing
```

**输出内容:**

- 未使用的依赖列表
- 缺失的依赖（代码中导入但未声明）
- 重复的依赖（不同版本）
- 优化建议

### `ldeps dedupe`

移除重复的依赖。

```bash
ldeps dedupe [options]
```

**选项:**

- `--dry-run` - 模拟运行
- `--json` - JSON 输出

**示例:**

```bash
# 模拟去重
ldeps dedupe --dry-run

# 执行去重
ldeps dedupe
```

## 依赖可视化

### `ldeps tree`

以树形结构显示依赖。

```bash
ldeps tree [package] [options]
```

**选项:**

- `--depth <n>` - 最大深度（默认: 无限）
- `--prod` - 只显示生产依赖
- `--dev` - 只显示开发依赖
- `--json` - JSON 输出

**示例:**

```bash
# 完整依赖树
ldeps tree

# 限制深度
ldeps tree --depth 2

# 只看生产依赖
ldeps tree --prod

# 查看特定包的依赖树
ldeps tree react
```

### `ldeps graph`

导出依赖图。

```bash
ldeps graph [options]
```

**选项:**

- `--format <format>` - 输出格式: `mermaid`, `dot`, `json`
- `--output <file>` - 输出文件路径
- `--layout <layout>` - 布局方式: `TB`, `LR`, `RL`, `BT`（仅 Mermaid）

**示例:**

```bash
# 导出 Mermaid 格式
ldeps graph --format mermaid --output deps.md

# 导出 DOT 格式（用于 Graphviz）
ldeps graph --format dot --output deps.dot

# 导出 JSON
ldeps graph --format json --output deps.json

# 自定义布局
ldeps graph --format mermaid --layout LR --output deps-lr.md
```

## Monorepo 支持

### `ldeps workspace`

Monorepo 工作区管理。

```bash
ldeps workspace [options]
```

**选项:**

- `--scan` - 扫描工作区包
- `--analyze` - 分析版本冲突
- `--json` - JSON 输出

**示例:**

```bash
# 扫描工作区
ldeps workspace --scan

# 分析冲突
ldeps workspace --analyze

# 组合使用
ldeps workspace --scan --analyze
```

## 通知与集成

### `ldeps notify`

配置和测试通知。

```bash
ldeps notify [options]
```

**选项:**

- `--test` - 发送测试通知
- `--config` - 配置通知渠道
- `--channel <channel>` - 指定渠道: `email`, `slack`, `dingtalk`, `wecom`

**示例:**

```bash
# 配置通知
ldeps notify --config

# 测试邮件通知
ldeps notify --test --channel email

# 测试所有渠道
ldeps notify --test
```

## 变更日志

### `ldeps changelog`

生成变更日志。

```bash
ldeps changelog [options]
```

**选项:**

- `--output <file>` - 输出文件（默认: CHANGELOG.md）
- `--format <format>` - 格式: `markdown`, `json`
- `--since <tag>` - 起始标签
- `--to <tag>` - 结束标签（默认: HEAD）

**示例:**

```bash
# 生成完整变更日志
ldeps changelog

# 生成指定范围的变更日志
ldeps changelog --since v1.0.0 --to v2.0.0

# JSON 格式
ldeps changelog --format json --output changelog.json
```

## Lockfile 管理

### `ldeps lockfile`

解析和分析 lockfile。

```bash
ldeps lockfile [options]
```

**选项:**

- `--parse` - 解析 lockfile
- `--type <type>` - 指定类型: `npm`, `yarn`, `pnpm`
- `--json` - JSON 输出

**示例:**

```bash
# 解析当前项目的 lockfile
ldeps lockfile --parse

# 指定类型
ldeps lockfile --parse --type pnpm

# JSON 输出
ldeps lockfile --parse --json
```

## 配置管理

### `ldeps config`

管理配置文件。

```bash
ldeps config [options]
```

**选项:**

- `--init` - 初始化配置文件
- `--show` - 显示当前配置
- `--edit` - 编辑配置

**示例:**

```bash
# 交互式初始化
ldeps config --init

# 显示配置
ldeps config --show

# 编辑配置
ldeps config --edit
```

## 缓存管理

### `ldeps cache`

管理缓存。

```bash
ldeps cache <command> [options]
```

**命令:**

- `clear` - 清除所有缓存
- `size` - 显示缓存大小
- `list` - 列出缓存项

**示例:**

```bash
# 清除缓存
ldeps cache clear

# 查看缓存大小
ldeps cache size

# 列出缓存项
ldeps cache list
```

## 交互式模式

### `ldeps interactive`

交互式依赖管理界面。

```bash
ldeps interactive
# 或
ldeps i
```

提供交互式界面，可以：
- 浏览依赖列表
- 选择要更新的依赖
- 查看依赖详情
- 执行各种操作

## 帮助与文档

### `ldeps help`

显示帮助信息。

```bash
ldeps help [command]
```

**示例:**

```bash
# 显示所有命令
ldeps help

# 显示特定命令的帮助
ldeps help check
ldeps help health
```

### `ldeps doctor`

诊断环境和配置问题。

```bash
ldeps doctor
```

检查：
- Node.js 版本
- 包管理器版本
- 网络连接
- 配置文件有效性
- 项目结构

## 最佳实践

### 日常使用

```bash
# 早上工作前
ldeps check --parallel

# 添加新依赖时
ldeps add <package>
ldeps health <package>

# 定期维护（每周）
ldeps health --all --threshold 70
ldeps audit
ldeps analyze
```

### CI/CD 集成

```yaml
# .github/workflows/deps.yml
name: Dependency Check

on:
  schedule:
    - cron: '0 0 * * 1'  # 每周一
  pull_request:
    paths:
      - 'package.json'
      - 'package-lock.json'

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g @ldesign/deps
      - run: ldeps check --json > updates.json
      - run: ldeps audit --level moderate
      - run: ldeps health --all --threshold 60
      - run: ldeps analyze
```

### Pre-commit Hook

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "ldeps audit --level high"
    }
  }
}
```

## 故障排除

### 命令执行慢？

```bash
# 启用并行和缓存
ldeps check --parallel
ldeps health --all  # 第二次会使用缓存
```

### 网络问题？

```bash
# 使用国内镜像
npm config set registry https://registry.npmmirror.com
ldeps check
```

### 权限问题？

```bash
# 使用 npx
npx ldeps list

# 或全局安装
npm install -g @ldesign/deps
```

## 下一步

- 🔧 查看 [配置选项](/config/configuration)
- 📚 阅读 [API 文档](/api/core)
- 💡 了解 [最佳实践](/guide/best-practices)
