# 配置指南

@ldesign/deps 提供灵活的配置系统，支持多种配置方式。

## 配置文件

### 创建配置文件

使用交互式命令创建配置文件：

```bash
ldeps config --init
```

或手动创建 `.depsrc.json` 文件：

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600000,
    "maxSize": 1000
  },
  "analyze": {
    "checkUnused": true,
    "checkMissing": true,
    "checkDuplicates": true,
    "excludePatterns": ["test/**", "**/*.spec.ts"]
  },
  "security": {
    "auditLevel": "moderate",
    "checkLicenses": true,
    "allowedLicenses": ["MIT", "Apache-2.0", "BSD-3-Clause", "ISC"]
  },
  "health": {
    "threshold": 70,
    "weights": {
      "maintenance": 0.3,
      "popularity": 0.25,
      "quality": 0.25,
      "security": 0.2
    }
  },
  "performance": {
    "includeBundle": false,
    "bundler": "webpack"
  },
  "cost": {
    "ciRuns": 1000,
    "includeTrends": true
  },
  "notifications": {
    "enabled": false,
    "channels": []
  }
}
```

### 配置文件位置

配置文件按以下顺序查找：

1. `.depsrc.json` (当前目录)
2. `.depsrc.js` (当前目录)
3. `package.json` 中的 `deps` 字段
4. `~/.depsrc.json` (用户主目录)

## 配置项详解

### 缓存配置 (cache)

控制缓存行为以提升性能。

```json
{
  "cache": {
    "enabled": true,          // 是否启用缓存
    "ttl": 3600000,          // 缓存过期时间（毫秒），默认 1 小时
    "maxSize": 1000,         // 最大缓存项数
    "directory": ".deps-cache" // 缓存目录，默认 .deps-cache
  }
}
```

**使用场景：**
- 开发环境：启用缓存，加快重复查询
- CI 环境：可以禁用缓存或使用较短的 TTL

**命令行覆盖：**
```bash
# 清除缓存
ldeps cache clear

# 禁用缓存
DEPS_CACHE_ENABLED=false ldeps check
```

### 依赖分析配置 (analyze)

配置依赖分析行为。

```json
{
  "analyze": {
    "checkUnused": true,        // 检查未使用的依赖
    "checkMissing": true,       // 检查缺失的依赖
    "checkDuplicates": true,    // 检查重复的依赖
    "excludePatterns": [        // 排除的文件模式
      "test/**",
      "**/*.spec.ts",
      "**/*.test.ts",
      "dist/**",
      "build/**"
    ],
    "includePatterns": [        // 包含的文件模式（优先级高）
      "src/**/*.ts",
      "src/**/*.tsx"
    ],
    "ignorePackages": [         // 忽略的包（不会被标记为未使用）
      "@types/*",
      "typescript"
    ]
  }
}
```

**使用场景：**
- 单元测试依赖通常不会在源码中导入，可以加入 `ignorePackages`
- TypeScript 类型包不会在运行时导入，但不应标记为未使用

### 安全配置 (security)

安全审计相关配置。

```json
{
  "security": {
    "auditLevel": "moderate",   // 最低漏洞级别: low, moderate, high, critical
    "checkLicenses": true,      // 是否检查 License
    "allowedLicenses": [        // 允许的 License 列表
      "MIT",
      "Apache-2.0",
      "BSD-2-Clause",
      "BSD-3-Clause",
      "ISC",
      "0BSD"
    ],
    "autofix": false,          // 是否自动修复
    "ignoreCVEs": [],          // 忽略的 CVE 编号
    "ignorePackages": []       // 忽略的包
  }
}
```

**许可证参考：**
- **宽松型**: MIT, Apache-2.0, BSD-*
- **需注意**: GPL-*, LGPL-*, AGPL-*
- **限制型**: 商业许可

**命令行覆盖：**
```bash
# 只显示高危漏洞
ldeps audit --level high

# 尝试自动修复
ldeps audit --fix
```

### 健康度配置 (health)

依赖健康度评估配置。

```json
{
  "health": {
    "threshold": 70,           // 健康度阈值（低于此分数会警告）
    "weights": {               // 各维度权重（总和应为 1）
      "maintenance": 0.3,      // 维护活跃度权重
      "popularity": 0.25,      // 社区热度权重
      "quality": 0.25,         // 质量评分权重
      "security": 0.2          // 安全评分权重
    },
    "criteria": {
      "minStars": 100,         // 最低 Star 数
      "minWeeklyDownloads": 1000, // 最低周下载量
      "maxLastCommitDays": 365  // 最大距上次提交天数
    }
  }
}
```

**权重说明：**
- 默认权重适用于大多数项目
- 企业项目可增加 `security` 权重
- 开源项目可增加 `popularity` 权重

**自定义权重示例：**
```json
{
  "health": {
    "weights": {
      "maintenance": 0.2,
      "popularity": 0.2,
      "quality": 0.2,
      "security": 0.4  // 强调安全性
    }
  }
}
```

### 性能配置 (performance)

性能监控配置。

```json
{
  "performance": {
    "includeBundle": false,    // 是否包含 bundle 大小分析
    "bundler": "webpack",      // 构建工具: webpack, vite, rollup
    "benchmarkRuns": 3,        // 基准测试运行次数
    "timeout": 300000          // 超时时间（毫秒）
  }
}
```

**Bundle 分析要求：**
- 需要项目有构建配置
- 第一次运行会比较慢
- 建议在 CI 环境中使用

### 成本分析配置 (cost)

依赖成本分析配置。

```json
{
  "cost": {
    "ciRuns": 1000,           // CI/CD 每月运行次数
    "ciPricing": {            // CI 定价（美元/分钟）
      "github": 0.008,
      "gitlab": 0.0067,
      "circleci": 0.0006
    },
    "includeTrends": true,    // 是否包含趋势分析
    "storageLocation": ".deps-cost-history" // 历史数据存储位置
  }
}
```

**成本计算：**
- 基于实际安装时间和 CI 运行次数
- 支持自定义 CI 平台定价
- 趋势分析需要多次运行积累数据

### 通知配置 (notifications)

多渠道通知配置。

```json
{
  "notifications": {
    "enabled": true,
    "channels": ["email", "slack"],
    "triggers": {              // 触发条件
      "updates": true,         // 有更新时通知
      "vulnerabilities": true, // 发现漏洞时通知
      "healthScore": 60       // 健康度低于此分数时通知
    },
    "email": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "${EMAIL_USER}",
        "pass": "${EMAIL_PASS}"
      },
      "from": "deps@example.com",
      "to": ["team@example.com"]
    },
    "slack": {
      "webhookUrl": "${SLACK_WEBHOOK_URL}",
      "channel": "#dependencies",
      "username": "Deps Bot"
    },
    "dingtalk": {
      "webhookUrl": "${DINGTALK_WEBHOOK_URL}",
      "secret": "${DINGTALK_SECRET}"
    },
    "wecom": {
      "webhookUrl": "${WECOM_WEBHOOK_URL}"
    }
  }
}
```

**环境变量：**
- 敏感信息应使用环境变量
- 格式：`${VAR_NAME}`
- 在配置中引用，运行时自动替换

**示例：**
```bash
# 设置环境变量
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASS="your-app-password"

# 测试通知
ldeps notify --test --channel slack
```

### Workspace 配置 (workspace)

Monorepo 工作区配置。

```json
{
  "workspace": {
    "enabled": true,           // 是否启用 workspace 功能
    "packages": [              // 包路径模式
      "packages/*",
      "apps/*"
    ],
    "ignorePatterns": [        // 忽略的路径
      "**/node_modules/**",
      "**/dist/**"
    ],
    "analyzeConflicts": true,  // 是否自动分析版本冲突
    "hoistDependencies": true  // 是否提升共享依赖
  }
}
```

## 配置优先级

配置按以下优先级合并（高到低）：

1. **命令行参数**
   ```bash
   ldeps check --parallel --json
   ```

2. **环境变量**
   ```bash
   DEPS_CACHE_ENABLED=false ldeps check
   ```

3. **项目配置文件** (`.depsrc.json`)

4. **用户配置文件** (`~/.depsrc.json`)

5. **默认配置**

## 使用 JavaScript 配置

对于更复杂的配置需求，可以使用 `.depsrc.js`：

```javascript
// .depsrc.js
module.exports = {
  cache: {
    enabled: process.env.NODE_ENV !== 'ci',
    ttl: 3600000
  },
  analyze: {
    checkUnused: true,
    excludePatterns: [
      'test/**',
      '**/*.spec.ts',
      // 动态添加模式
      ...(process.env.EXCLUDE_E2E ? ['e2e/**'] : [])
    ]
  },
  security: {
    auditLevel: process.env.STRICT_MODE ? 'low' : 'moderate',
    allowedLicenses: [
      'MIT',
      'Apache-2.0',
      'BSD-3-Clause'
    ]
  }
}
```

## 在 package.json 中配置

也可以在 `package.json` 中添加配置：

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "deps": {
    "cache": {
      "enabled": true
    },
    "security": {
      "auditLevel": "moderate",
      "allowedLicenses": ["MIT", "Apache-2.0"]
    }
  }
}
```

## 环境变量

所有配置都可以通过环境变量覆盖：

```bash
# 缓存
DEPS_CACHE_ENABLED=false
DEPS_CACHE_TTL=7200000

# 分析
DEPS_ANALYZE_CHECK_UNUSED=true
DEPS_ANALYZE_CHECK_MISSING=true

# 安全
DEPS_SECURITY_AUDIT_LEVEL=high
DEPS_SECURITY_AUTOFIX=true

# 健康度
DEPS_HEALTH_THRESHOLD=80

# 性能
DEPS_PERFORMANCE_INCLUDE_BUNDLE=true
DEPS_PERFORMANCE_BUNDLER=vite

# 成本
DEPS_COST_CI_RUNS=5000

# 通知
DEPS_NOTIFICATIONS_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-password
```

## 配置示例

### 开发环境

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600000
  },
  "analyze": {
    "checkUnused": true,
    "checkMissing": true,
    "excludePatterns": ["test/**", "**/*.spec.ts"]
  },
  "security": {
    "auditLevel": "moderate"
  },
  "notifications": {
    "enabled": false
  }
}
```

### CI 环境

```json
{
  "cache": {
    "enabled": false
  },
  "analyze": {
    "checkUnused": true,
    "checkMissing": true,
    "checkDuplicates": true
  },
  "security": {
    "auditLevel": "high",
    "autofix": false
  },
  "health": {
    "threshold": 70
  },
  "notifications": {
    "enabled": true,
    "channels": ["slack"],
    "triggers": {
      "vulnerabilities": true,
      "healthScore": 60
    }
  }
}
```

### 生产环境

```json
{
  "cache": {
    "enabled": true,
    "ttl": 7200000
  },
  "security": {
    "auditLevel": "critical",
    "checkLicenses": true,
    "allowedLicenses": ["MIT", "Apache-2.0"]
  },
  "health": {
    "threshold": 80,
    "weights": {
      "security": 0.4,
      "quality": 0.3,
      "maintenance": 0.2,
      "popularity": 0.1
    }
  },
  "notifications": {
    "enabled": true,
    "channels": ["email", "slack", "dingtalk"],
    "triggers": {
      "vulnerabilities": true,
      "healthScore": 70
    }
  }
}
```

### Monorepo 项目

```json
{
  "workspace": {
    "enabled": true,
    "packages": ["packages/*", "apps/*"],
    "analyzeConflicts": true,
    "hoistDependencies": true
  },
  "analyze": {
    "checkUnused": true,
    "checkDuplicates": true
  },
  "health": {
    "threshold": 75
  }
}
```

## 配置验证

验证配置文件是否正确：

```bash
# 显示当前配置
ldeps config --show

# 验证配置文件
ldeps config --validate

# 使用诊断工具
ldeps doctor
```

## 最佳实践

### 1. 分环境配置

为不同环境创建不同的配置文件：

```
.depsrc.json           # 基础配置
.depsrc.dev.json       # 开发环境
.depsrc.ci.json        # CI 环境
.depsrc.prod.json      # 生产环境
```

使用环境变量指定配置文件：

```bash
DEPS_CONFIG=.depsrc.ci.json ldeps check
```

### 2. 敏感信息管理

永远不要在配置文件中硬编码敏感信息：

```json
{
  "notifications": {
    "email": {
      "auth": {
        "user": "${EMAIL_USER}",    // ✅ 使用环境变量
        "pass": "${EMAIL_PASS}"
      }
    }
  }
}
```

### 3. 版本控制

- ✅ 提交 `.depsrc.json` 到 git
- ❌ 不要提交包含敏感信息的配置
- ✅ 添加 `.depsrc.local.json` 到 `.gitignore`

```gitignore
# .gitignore
.depsrc.local.json
.deps-cache/
.deps-cost-history/
```

### 4. 团队共享配置

使用 `.depsrc.json` 作为团队共享的基础配置，个人自定义配置放在 `.depsrc.local.json`：

```javascript
// .depsrc.js
const baseConfig = require('./.depsrc.json')
const localConfig = require('./.depsrc.local.json')

module.exports = {
  ...baseConfig,
  ...localConfig
}
```

## 故障排除

### 配置不生效？

1. 检查配置文件位置和格式
2. 查看优先级是否被覆盖
3. 使用 `ldeps config --show` 查看实际配置

### 环境变量不工作？

1. 确保环境变量已设置
2. 检查变量名是否正确（大小写敏感）
3. Windows 系统使用 `set` 或 `$env:`

```powershell
# PowerShell
$env:DEPS_CACHE_ENABLED="false"

# CMD
set DEPS_CACHE_ENABLED=false
```

## 下一步

- 📚 阅读 [API 文档](/api/core) 了解编程接口
- 🎯 查看 [CLI 命令](/cli/commands) 学习命令行用法
- 💡 探索 [最佳实践](/guide/best-practices) 优化工作流
