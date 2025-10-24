#!/bin/bash

# @ldesign/deps 演示脚本
# 展示所有主要功能

echo "🎉 @ldesign/deps 功能演示"
echo "================================"
echo ""

# 1. 基础命令
echo "📦 1. 列出所有依赖"
ldeps list
echo ""

# 2. 检查更新
echo "🔍 2. 检查依赖更新（并行模式）"
ldeps check --parallel --show-progress
echo ""

# 3. 依赖分析
echo "📊 3. 分析依赖使用情况"
ldeps analyze
echo ""

# 4. 安全审计
echo "🔐 4. 执行安全审计"
ldeps audit --level moderate
echo ""

# 5. 依赖树
echo "🌳 5. 显示依赖树"
ldeps tree --depth 2
echo ""

# 6. 检测重复依赖
echo "🔄 6. 检测重复依赖"
ldeps duplicate
echo ""

# 7. 过时依赖
echo "⏰ 7. 列出过时的依赖"
ldeps outdated
echo ""

# 8. 导出依赖图
echo "📈 8. 导出依赖图（Mermaid 格式）"
ldeps graph --format mermaid --output deps-graph.md --depth 3
echo "   已保存到: deps-graph.md"
echo ""

# 9. Monorepo 检查
echo "🏢 9. Monorepo 工作区检查"
ldeps workspace --scan || echo "   不是 monorepo 项目"
echo ""

# 10. 生成配置
echo "⚙️ 10. 生成配置文件（交互式）"
echo "   运行: ldeps config"
echo ""

# 11. 交互式更新
echo "🎨 11. 交互式更新依赖"
echo "   运行: ldeps interactive"
echo ""

echo "================================"
echo "✨ 演示完成！"
echo ""
echo "💡 提示："
echo "   - 使用 'ldeps --help' 查看所有命令"
echo "   - 使用 'ldeps <command> --help' 查看命令详情"
echo "   - 阅读 START_HERE.md 开始使用"
echo ""

