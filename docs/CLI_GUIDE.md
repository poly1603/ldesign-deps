# CLI 使用指南

## 快速入门

安装后，可以使用 `ldeps` 或 `ldesign-deps` 命令。

```bash
# 查看帮助
ldeps --help

# 查看版本
ldeps --version
```

## 常用命令

### 1. 查看依赖列表

```bash
# 列出所有依赖
ldeps list

# 只看生产依赖
ldeps list --type dependencies

# 只看开发依赖
ldeps list --type devDependencies

# 搜索特定依赖
ldeps list --search react
```

### 2. 检查依赖更新

```bash
# 检查所有依赖的更新
ldeps check

# 并行检查（更快）
ldeps check --parallel

# 显示进度条
ldeps check --show-progress

# 查看过时的依赖
ldeps outdated
```

### 3. 更新依赖

```bash
# 更新单个包到最新版本
ldeps update react

# 更新到指定版本
ldeps update react --version 18.3.0

# 干运行模式（预览）
ldeps update react --dry-run

# 交互式更新（推荐）
ldeps interactive
```

### 4. 依赖分析

```bash
# 完整分析
ldeps analyze

# 检测重复依赖
ldeps duplicate

# 查找为何安装某个包
ldeps why lodash

# 显示依赖树
ldeps tree

# 限制深度
ldeps tree --depth 2
```

### 5. 安全审计

```bash
# 执行安全审计
ldeps audit

# 设置审计级别
ldeps audit --level high
ldeps audit --level critical

# 跳过许可证检查
ldeps audit --no-licenses

# JSON 输出（适合 CI）
ldeps audit --json
```

### 6. 依赖可视化

```bash
# 导出为 Mermaid 格式
ldeps graph --format mermaid --output deps.md

# 导出为 DOT 格式
ldeps graph --format dot --output deps.dot

# 导出为 JSON
ldeps graph --format json --output deps.json

# ASCII 树形图
ldeps graph --format ascii
```

### 7. Monorepo 管理

```bash
# 扫描工作区
ldeps workspace --scan

# 分析版本冲突
ldeps workspace --analyze
```

### 8. 维护操作

```bash
# 安装依赖
ldeps install

# 重新安装所有依赖
ldeps reinstall

# 去重依赖
ldeps dedupe

# 清理未使用的依赖（交互式）
ldeps clean
```

### 9. 配置管理

```bash
# 生成配置文件
ldeps config
```

## 实用技巧

### 1. 日常工作流

```bash
# 每天开始工作前
ldeps check          # 检查更新
ldeps audit          # 安全检查

# 需要更新时
ldeps interactive    # 交互式选择更新

# 定期维护
ldeps analyze        # 分析依赖使用
ldeps clean          # 清理未使用的依赖
```

### 2. CI/CD 集成

```bash
# 在 CI 中使用
ldeps audit --level high --json > audit-report.json
ldeps outdated
ldeps duplicate

# 检查未使用的依赖
ldeps analyze
```

### 3. 项目迁移

```bash
# 分析现有依赖
ldeps list
ldeps tree

# 检查安全问题
ldeps audit

# 清理无用依赖
ldeps analyze
ldeps clean

# 更新所有依赖
ldeps interactive
```

### 4. 调试依赖问题

```bash
# 为什么安装了这个包？
ldeps why some-package

# 有重复的依赖吗？
ldeps duplicate

# 依赖树是什么样的？
ldeps tree --depth 3

# 有循环依赖吗？
ldeps tree  # 会显示循环依赖警告
```

## 选项说明

### 通用选项

- `--help`, `-h` - 显示帮助信息
- `--version`, `-v` - 显示版本号

### check 命令选项

- `--parallel` - 并行检查，速度更快
- `--show-progress` - 显示进度条

### update 命令选项

- `-v, --version <version>` - 指定版本号
- `--dry-run` - 干运行模式，不实际更新

### analyze 命令选项

- `--no-unused` - 不检查未使用的依赖
- `--no-missing` - 不检查缺失的依赖
- `--no-duplicates` - 不检查重复的依赖

### audit 命令选项

- `-l, --level <level>` - 审计级别：low, moderate, high, critical
- `--no-licenses` - 不检查许可证
- `--json` - JSON 格式输出

### graph 命令选项

- `-f, --format <format>` - 导出格式：json, dot, mermaid, ascii
- `-o, --output <file>` - 输出文件路径
- `-d, --depth <depth>` - 最大深度

### tree 命令选项

- `-d, --depth <depth>` - 最大深度（默认 3）

### workspace 命令选项

- `--scan` - 扫描工作区
- `--analyze` - 分析版本冲突

## 退出码

- `0` - 成功
- `1` - 失败或发现严重问题

安全审计时，如果发现 critical 或 high 级别的漏洞，会返回退出码 1，适合在 CI 中使用。

## 配置文件

创建 `.depsrc.json` 文件进行自定义配置：

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600000
  },
  "security": {
    "auditLevel": "moderate",
    "checkLicenses": true
  }
}
```

使用 `ldeps config` 可以交互式生成配置文件。

## 获取帮助

任何命令都可以加 `--help` 查看详细说明：

```bash
ldeps check --help
ldeps audit --help
ldeps graph --help
```

