/**
 * @ldesign/deps 高级使用示例
 */

import {
  DependencyManager,
  VersionChecker,
  DependencyAnalyzer,
  SecurityAuditor,
  DependencyVisualizer,
  WorkspaceManager,
  CacheManager
} from '@ldesign/deps'

async function advancedExample() {
  console.log('=== 高级使用示例 ===\n')

  // 1. 使用自定义缓存配置
  console.log('1. 自定义缓存配置')
  const cache = new CacheManager({
    enabled: true,
    ttl: 7200000, // 2 小时
    maxSize: 2000,
    strategy: 'lfu' // 最不常用淘汰
  })

  const checker = new VersionChecker(cache, {
    concurrency: 20, // 高并发
    retries: 5, // 更多重试
    timeout: 60000 // 60 秒超时
  })

  // 2. 批量检查并分组
  console.log('\n2. 批量检查并按严重程度分组')
  const manager = new DependencyManager()
  const deps = await manager.getAllDependencies()

  const updates = await checker.checkUpdates(
    Object.fromEntries(Object.values(deps).map(d => [d.name, d.version])),
    (progress) => {
      process.stdout.write(`\r检查进度: ${progress.percentage.toFixed(0)}%`)
    }
  )
  console.log('\n')

  const grouped = checker.groupUpdatesBySeverity(updates.filter(u => u.hasUpdate))
  console.log(`  主版本更新 (Breaking): ${grouped.major.length}`)
  console.log(`  次版本更新 (Features): ${grouped.minor.length}`)
  console.log(`  补丁更新 (Fixes): ${grouped.patch.length}`)

  // 显示缓存统计
  const stats = checker.getCacheStats()
  console.log(`\n  缓存命中率: ${(stats.hitRate * 100).toFixed(2)}%`)
  console.log(`  缓存大小: ${stats.size}/${stats.maxSize}`)

  // 3. 高级依赖分析
  console.log('\n3. 高级依赖分析')
  const analyzer = new DependencyAnalyzer(process.cwd(), {
    checkUnused: true,
    checkMissing: true,
    checkDuplicates: true,
    ignorePatterns: [
      '**/dist/**',
      '**/build/**',
      '**/*.test.ts',
      '**/__tests__/**'
    ]
  })

  const analysis = await analyzer.analyze()
  const usageDetails = await analyzer.analyzeUsageDetails()

  console.log('\n使用详情（前 5 个）:')
  Object.entries(usageDetails)
    .slice(0, 5)
    .forEach(([dep, detail]) => {
      console.log(`  ${dep}: 在 ${detail.count} 个文件中使用`)
    })

  // 4. 安全审计高级配置
  console.log('\n4. 安全审计（高级配置）')
  const auditor = new SecurityAuditor(process.cwd(), {
    auditLevel: 'high',
    checkLicenses: true,
    allowedLicenses: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC'],
    blockedLicenses: ['GPL-3.0', 'AGPL-3.0'],
    ignoreVulnerabilities: [] // 可以忽略特定的漏洞 ID
  })

  const auditResult = await auditor.audit()

  console.log(`\n安全评分详情:`)
  console.log(`  综合评分: ${auditResult.securityScore.overall}/100`)
  console.log(`  漏洞评分: ${auditResult.securityScore.vulnerabilityScore}/100`)
  console.log(`  许可证评分: ${auditResult.securityScore.licenseScore}/100`)
  console.log(`  维护评分: ${auditResult.securityScore.maintenanceScore}/100`)
  console.log(`  流行度评分: ${auditResult.securityScore.popularityScore}/100`)

  // 按严重程度列出漏洞
  if (auditResult.vulnerabilities.length > 0) {
    console.log('\n漏洞分类:')
    const vulnBySeverity = auditResult.vulnerabilities.reduce((acc, vuln) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    Object.entries(vulnBySeverity).forEach(([severity, count]) => {
      console.log(`  ${severity}: ${count}`)
    })
  }

  // 5. 依赖可视化高级功能
  console.log('\n5. 依赖可视化')
  const visualizer = new DependencyVisualizer()

  // 生成依赖树并检测循环依赖
  const tree = await visualizer.generateTree(3)
  console.log(`  依赖层级深度: ${tree.depth}`)
  console.log(`  循环依赖数: ${tree.circularDependencies.length}`)

  if (tree.circularDependencies.length > 0) {
    console.log('\n  循环依赖详情:')
    tree.circularDependencies.slice(0, 3).forEach((circular, index) => {
      console.log(`    ${index + 1}. ${circular.path.join(' → ')}`)
    })
  }

  // 导出多种格式
  console.log('\n  导出依赖图到文件...')
  await visualizer.exportGraph({
    format: 'mermaid',
    output: './deps-graph.md',
    depth: 3
  })
  console.log('    ✓ Mermaid 格式已导出')

  await visualizer.exportGraph({
    format: 'json',
    output: './deps-graph.json'
  })
  console.log('    ✓ JSON 格式已导出')

  // 查找特定依赖的路径
  const targetPackage = 'react' // 示例
  const paths = await visualizer.findDependencyPath(targetPackage)
  if (paths.length > 0) {
    console.log(`\n  ${targetPackage} 的依赖路径:`)
    paths.slice(0, 3).forEach((path, index) => {
      console.log(`    ${index + 1}. ${path.join(' → ')}`)
    })
  }

  // 6. Monorepo 高级分析
  console.log('\n6. Monorepo 分析（如果是 monorepo 项目）')
  try {
    const wsManager = new WorkspaceManager()
    const wsType = await wsManager.detectWorkspaceType()

    if (wsType) {
      console.log(`  工作区类型: ${wsType}`)

      const workspace = await wsManager.analyzeWorkspace()
      console.log(`  子包数量: ${workspace.packages.length}`)
      console.log(`  跨包依赖: ${workspace.crossDependencies.length}`)
      console.log(`  幽灵依赖: ${workspace.phantomDependencies.length}`)

      const analysis = await wsManager.analyzeVersionConflicts()
      if (analysis.versionConflicts.length > 0) {
        console.log(`\n  版本冲突 (${analysis.versionConflicts.length}):`)
        analysis.versionConflicts.slice(0, 3).forEach(conflict => {
          console.log(`    - ${conflict.dependency}`)
        })
      }
    } else {
      console.log('  不是 monorepo 项目')
    }
  } catch (error) {
    console.log('  不是 monorepo 项目')
  }

  // 7. 组合使用：完整的健康检查
  console.log('\n7. 项目健康度综合评估')

  const healthScore = {
    updates: grouped.patch.length === 0 ? 100 : Math.max(0, 100 - grouped.major.length * 10 - grouped.minor.length * 5),
    security: auditResult.securityScore.overall,
    unused: analysis.unused.length === 0 ? 100 : Math.max(0, 100 - analysis.unused.length * 5),
    duplicates: (analysis.duplicates?.length || 0) === 0 ? 100 : Math.max(0, 100 - (analysis.duplicates?.length || 0) * 10)
  }

  const overallHealth = Object.values(healthScore).reduce((a, b) => a + b, 0) / Object.keys(healthScore).length

  console.log(`\n  综合健康度: ${overallHealth.toFixed(1)}/100`)
  console.log(`    更新状态: ${healthScore.updates.toFixed(1)}`)
  console.log(`    安全状态: ${healthScore.security.toFixed(1)}`)
  console.log(`    依赖清洁度: ${healthScore.unused.toFixed(1)}`)
  console.log(`    去重状态: ${healthScore.duplicates.toFixed(1)}`)

  // 8. 性能提示
  console.log('\n8. 性能优化建议')
  console.log(`  ✓ 使用缓存减少网络请求`)
  console.log(`  ✓ 并行检查提升 3-5 倍速度`)
  console.log(`  ✓ 增量分析只检查变更`)
  console.log(`  ✓ 持久化缓存跨会话使用`)
}

// 运行高级示例
advancedExample().catch(console.error)

