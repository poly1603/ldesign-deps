# 故障排除指南

## 常见问题

### 1. 网络相关问题

#### 问题：请求超时

```
Error: 请求超时
```

**解决方案**：

```bash
# 1. 增加超时时间
# 在配置文件中设置
{
  "update": {
    "timeout": 60000  // 60 秒
  }
}

# 2. 使用国内镜像
npm config set registry https://registry.npmmirror.com

# 3. 检查网络连接
ping registry.npmjs.org
```

#### 问题：npm registry 连接失败

```
NetworkError: 无法连接到 npm registry
```

**解决方案**：

```bash
# 1. 检查 npm 配置
npm config get registry

# 2. 设置代理
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# 3. 清除 npm 缓存
npm cache clean --force
```

### 2. 缓存问题

#### 问题：缓存数据过期

```bash
# 清除缓存
ldeps check  # 添加 --no-cache 选项（如果支持）

# 或手动删除缓存文件
rm -rf ./.cache/deps-cache.json
rm -rf ~/Library/Caches/ldesign-deps/  # macOS
rm -rf ~/.cache/ldesign-deps/  # Linux
```

#### 问题：缓存占用过多空间

**解决方案**：

```json
{
  "cache": {
    "maxSize": 500,  // 减小缓存大小
    "ttl": 1800000   // 缩短有效期（30分钟）
  }
}
```

### 3. 依赖分析问题

#### 问题：误报未使用的依赖

某些依赖被报告为未使用，但实际上在使用。

**解决方案**：

```json
{
  "analyze": {
    "ignorePatterns": [
      "**/webpack.config.js",  // 配置文件中使用的依赖
      "**/*.config.ts",
      "**/scripts/**"
    ]
  },
  "ignore": [
    "some-package"  // 完全忽略某个包
  ]
}
```

#### 问题：分析速度慢

**解决方案**：

```bash
# 1. 使用快速分析
# 在 API 中
const result = await analyzer.quickAnalyze()

# 2. 限制分析深度
{
  "analyze": {
    "depth": 3
  }
}

# 3. 忽略大型目录
{
  "analyze": {
    "ignorePatterns": [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**"
    ]
  }
}
```

### 4. 安全审计问题

#### 问题：已知的误报漏洞

**解决方案**：

```json
{
  "security": {
    "ignoreVulnerabilities": [
      "GHSA-xxxx-xxxx-xxxx",  // GitHub Advisory ID
      "CVE-2023-12345"         // CVE ID
    ]
  }
}
```

#### 问题：许可证检查过于严格

**解决方案**：

```json
{
  "security": {
    "checkLicenses": true,
    "allowedLicenses": [
      "MIT",
      "Apache-2.0",
      "BSD-2-Clause",
      "BSD-3-Clause",
      "ISC",
      "CC0-1.0"
    ],
    "blockedLicenses": [
      "GPL-3.0",
      "AGPL-3.0"
    ]
  }
}
```

### 5. Monorepo 问题

#### 问题：无法识别工作区

```
Error: 当前项目不是 monorepo 工作区
```

**解决方案**：

```bash
# 1. 确认 package.json 中有 workspaces 字段
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}

# 2. 或者有对应的配置文件
# pnpm-workspace.yaml (pnpm)
# lerna.json (lerna)

# 3. 手动启用
{
  "workspace": {
    "enabled": true,
    "scanPattern": ["packages/*", "apps/*"]
  }
}
```

#### 问题：幽灵依赖检测不准确

**解决方案**：

```json
{
  "workspace": {
    "checkPhantom": true,
    // 提供精确的扫描模式
    "scanPattern": [
      "packages/*/",
      "!packages/*/node_modules"
    ]
  }
}
```

### 6. CLI 问题

#### 问题：命令找不到

```
ldeps: command not found
```

**解决方案**：

```bash
# 1. 全局安装
npm install -g @ldesign/deps

# 2. 使用 npx
npx @ldesign/deps check

# 3. 在 package.json 中添加脚本
{
  "scripts": {
    "deps:check": "ldeps check",
    "deps:audit": "ldeps audit"
  }
}
```

#### 问题：权限错误

```
EACCES: permission denied
```

**解决方案**：

```bash
# 1. 使用 sudo (不推荐)
sudo ldeps install

# 2. 修复 npm 权限
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# 3. 使用 nvm
nvm use 18
```

### 7. 性能问题

#### 问题：检查速度慢

**解决方案**：

```bash
# 1. 启用并行检查
ldeps check --parallel

# 2. 启用缓存
{
  "cache": {
    "enabled": true,
    "ttl": 7200000
  }
}

# 3. 增加并发数
{
  "update": {
    "concurrency": 20
  }
}

# 4. 使用更快的网络/镜像
npm config set registry https://registry.npmmirror.com
```

#### 问题：内存占用过高

**解决方案**：

```bash
# 1. 限制并发数
{
  "update": {
    "concurrency": 5
  }
}

# 2. 增加 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=4096" ldeps check

# 3. 分批处理依赖
# 不要一次检查所有依赖
```

### 8. 配置问题

#### 问题：配置文件不生效

**解决方案**：

```bash
# 1. 检查配置文件位置
# 应该在项目根目录
ls -la .depsrc.json

# 2. 检查 JSON 格式
# 使用 JSON validator
npx jsonlint .depsrc.json

# 3. 检查配置加载顺序
# 优先级：.depsrc.js > .depsrc.json > package.json
```

#### 问题：TypeScript 配置文件报错

**解决方案**：

```javascript
// .depsrc.js
module.exports = {
  cache: {
    enabled: true
  }
}

// 或使用 ES modules
export default {
  cache: {
    enabled: true
  }
}
```

### 9. 更新问题

#### 问题：更新失败后无法回滚

**解决方案**：

```bash
# 工具会自动备份，但如果失败了：

# 1. 从 Git 恢复
git checkout package.json package-lock.json

# 2. 使用备份文件
cp .package.json.backup package.json

# 3. 重新安装
rm -rf node_modules
npm install
```

#### 问题：锁文件冲突

**解决方案**：

```bash
# 1. 删除锁文件重新生成
rm package-lock.json
npm install

# 2. 使用特定的包管理器
ldeps install --pm pnpm

# 3. 在配置中指定
{
  "update": {
    "updateLockfile": true
  }
}
```

### 10. 交互式模式问题

#### 问题：交互式界面显示异常

**解决方案**：

```bash
# 1. 检查终端支持
echo $TERM

# 2. 使用非交互式模式
ldeps update react --yes

# 3. 更新终端
# 安装支持 Unicode 的终端
```

#### 问题：无法选择依赖

**解决方案**：

```bash
# 1. 使用键盘导航
# 空格键：选择/取消选择
# 回车键：确认
# 上下箭头：移动

# 2. 使用命令行参数
ldeps update react vue lodash
```

## 调试技巧

### 启用详细日志

```bash
# 设置日志级别
DEBUG=ldeps:* ldeps check

# 或在配置中
{
  "logLevel": "debug",
  "logFile": "./deps-debug.log"
}
```

### 查看详细错误信息

```bash
# 使用 --verbose 标志
ldeps check --verbose

# 捕获完整错误堆栈
ldeps check 2> error.log
```

### 性能分析

```bash
# 使用 time 命令
time ldeps check

# 查看缓存统计
ldeps check --show-cache-stats
```

## 获取帮助

### 1. 查看帮助信息

```bash
ldeps --help
ldeps check --help
```

### 2. 查看版本信息

```bash
ldeps --version
```

### 3. 报告问题

如果遇到 bug，请提供：

1. ldeps 版本：`ldeps --version`
2. Node.js 版本：`node --version`
3. 包管理器：`npm --version` / `pnpm --version`
4. 操作系统
5. 完整错误信息
6. 重现步骤

### 4. 社区支持

- GitHub Issues
- Stack Overflow (标签: ldesign-deps)
- 官方文档

## 相关文档

- [CLI 使用指南](./CLI_GUIDE.md)
- [最佳实践](./BEST_PRACTICES.md)
- [API 文档](./api.md)

