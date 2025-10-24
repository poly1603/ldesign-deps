# ⚡ @ldesign/deps 快速参考

## 🎯 最常用命令

```bash
ldeps check              # 检查更新
ldeps interactive        # 交互式更新 ⭐推荐
ldeps audit              # 安全审计
ldeps analyze            # 依赖分析
ldeps tree               # 依赖树
```

## 📋 命令速查表

| 命令 | 功能 | 示例 |
|------|------|------|
| `list` | 列出依赖 | `ldeps list --search react` |
| `check` | 检查更新 | `ldeps check --parallel` |
| `update` | 更新包 | `ldeps update react` |
| `analyze` | 分析依赖 | `ldeps analyze` |
| `audit` | 安全审计 | `ldeps audit --level high` |
| `tree` | 依赖树 | `ldeps tree --depth 3` |
| `graph` | 依赖图 | `ldeps graph --format mermaid` |
| `why` | 依赖路径 | `ldeps why lodash` |
| `duplicate` | 重复检测 | `ldeps duplicate` |
| `outdated` | 过时依赖 | `ldeps outdated` |
| `workspace` | Monorepo | `ldeps workspace --scan` |
| `interactive` | 交互式 | `ldeps i` |
| `config` | 生成配置 | `ldeps config` |
| `clean` | 清理依赖 | `ldeps clean` |
| `dedupe` | 去重 | `ldeps dedupe` |
| `install` | 安装 | `ldeps install` |
| `reinstall` | 重装 | `ldeps reinstall` |

## 🔥 推荐工作流

### 日常使用
```bash
ldeps check          # 检查更新
ldeps interactive    # 选择更新
ldeps audit          # 安全检查
```

### 项目维护
```bash
ldeps analyze        # 分析依赖
ldeps clean          # 清理不用的
ldeps duplicate      # 检查重复
ldeps dedupe         # 去重
```

### 深度分析
```bash
ldeps tree           # 依赖树
ldeps graph --format mermaid --output deps.md
ldeps why <package>  # 为何安装
```

## 🎨 常用选项

| 选项 | 说明 |
|------|------|
| `--parallel` | 并行处理 |
| `--show-progress` | 显示进度 |
| `--dry-run` | 干运行模式 |
| `--json` | JSON 输出 |
| `--level <level>` | 审计级别 |
| `--depth <n>` | 限制深度 |
| `--format <fmt>` | 导出格式 |
| `--output <file>` | 输出文件 |

## ⚙️ 配置示例

**.depsrc.json**
```json
{
  "cache": { "enabled": true, "ttl": 3600000 },
  "security": { "auditLevel": "high" },
  "update": { "concurrency": 10 }
}
```

## 💡 API 快速示例

```typescript
import { DependencyManager, VersionChecker } from '@ldesign/deps'

// 依赖管理
const manager = new DependencyManager()
const deps = await manager.getAllDependencies()
await manager.addDependency('lodash', '^4.17.21')

// 版本检查
const checker = new VersionChecker()
const updates = await checker.checkUpdates(deps)
```

## 🆘 需要帮助？

```bash
ldeps --help                # 所有命令
ldeps <command> --help      # 命令详情
```

📖 **完整文档**: 查看 [START_HERE.md](./START_HERE.md)

---

**快速参考卡片** | v0.1.0 | MIT License

