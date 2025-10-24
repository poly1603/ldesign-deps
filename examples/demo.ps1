# @ldesign/deps 演示脚本 (PowerShell)
# 展示所有主要功能

Write-Host "🎉 @ldesign/deps 功能演示" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. 基础命令
Write-Host "📦 1. 列出所有依赖" -ForegroundColor Green
ldeps list
Write-Host ""

# 2. 检查更新
Write-Host "🔍 2. 检查依赖更新（并行模式）" -ForegroundColor Green
ldeps check --parallel --show-progress
Write-Host ""

# 3. 依赖分析
Write-Host "📊 3. 分析依赖使用情况" -ForegroundColor Green
ldeps analyze
Write-Host ""

# 4. 安全审计
Write-Host "🔐 4. 执行安全审计" -ForegroundColor Green
ldeps audit --level moderate
Write-Host ""

# 5. 依赖树
Write-Host "🌳 5. 显示依赖树" -ForegroundColor Green
ldeps tree --depth 2
Write-Host ""

# 6. 检测重复依赖
Write-Host "🔄 6. 检测重复依赖" -ForegroundColor Green
ldeps duplicate
Write-Host ""

# 7. 过时依赖
Write-Host "⏰ 7. 列出过时的依赖" -ForegroundColor Green
ldeps outdated
Write-Host ""

# 8. 导出依赖图
Write-Host "📈 8. 导出依赖图（Mermaid 格式）" -ForegroundColor Green
ldeps graph --format mermaid --output deps-graph.md --depth 3
Write-Host "   已保存到: deps-graph.md" -ForegroundColor Gray
Write-Host ""

# 9. Monorepo 检查
Write-Host "🏢 9. Monorepo 工作区检查" -ForegroundColor Green
try {
    ldeps workspace --scan
} catch {
    Write-Host "   不是 monorepo 项目" -ForegroundColor Gray
}
Write-Host ""

# 10. 生成配置
Write-Host "⚙️ 10. 生成配置文件（交互式）" -ForegroundColor Green
Write-Host "   运行: ldeps config" -ForegroundColor Gray
Write-Host ""

# 11. 交互式更新
Write-Host "🎨 11. 交互式更新依赖" -ForegroundColor Green
Write-Host "   运行: ldeps interactive" -ForegroundColor Gray
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "✨ 演示完成！" -ForegroundColor Green
Write-Host ""
Write-Host "💡 提示：" -ForegroundColor Yellow
Write-Host "   - 使用 'ldeps --help' 查看所有命令"
Write-Host "   - 使用 'ldeps <command> --help' 查看命令详情"
Write-Host "   - 阅读 START_HERE.md 开始使用"
Write-Host ""

