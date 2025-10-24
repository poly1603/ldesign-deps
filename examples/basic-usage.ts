/**
 * @ldesign/deps 基础使用示例
 */

import {
  DependencyManager,
  VersionChecker,
  DependencyAnalyzer,
  SecurityAuditor,
  PackageUpdater
} from '@ldesign/deps'

async function basicExample() {
  console.log('=== 基础使用示例 ===\n')

  // 1. 依赖管理
  console.log('1. 依赖管理')
  const manager = new DependencyManager()

  const deps = await manager.getAllDependencies()
  console.log(`项目共有 ${Object.keys(deps).length} 个依赖`)

  // 搜索依赖
  const reactDeps = await manager.searchDependencies('react')
  console.log(`找到 ${reactDeps.length} 个与 react 相关的依赖\n`)

  // 2. 版本检查
  console.log('2. 版本检查')
  const checker = new VersionChecker()

  const depsToCheck = Object.fromEntries(
    Object.values(deps).map(d => [d.name, d.version])
  )

  const updates = await checker.checkUpdates(depsToCheck)
  const hasUpdates = updates.filter(u => u.hasUpdate)

  console.log(`发现 ${hasUpdates.length} 个可更新的依赖`)

  if (hasUpdates.length > 0) {
    const grouped = checker.groupUpdatesBySeverity(hasUpdates)
    console.log(`  主版本更新: ${grouped.major.length}`)
    console.log(`  次版本更新: ${grouped.minor.length}`)
    console.log(`  补丁更新: ${grouped.patch.length}\n`)
  }

  // 3. 依赖分析
  console.log('3. 依赖分析')
  const analyzer = new DependencyAnalyzer()
  const analysis = await analyzer.analyze()

  console.log(`未使用的依赖: ${analysis.unused.length}`)
  console.log(`缺失的依赖: ${analysis.missing.length}`)
  console.log(`重复的依赖: ${analysis.duplicates?.length || 0}\n`)

  // 4. 安全审计
  console.log('4. 安全审计')
  const auditor = new SecurityAuditor()
  const auditResult = await auditor.audit()

  console.log(`安全评分: ${auditResult.securityScore.overall}/100`)
  console.log(`漏洞数量: ${auditResult.vulnerabilities.length}`)
  console.log(`  严重: ${auditResult.summary.criticalCount}`)
  console.log(`  高危: ${auditResult.summary.highCount}`)
  console.log(`  中危: ${auditResult.summary.moderateCount}`)
  console.log(`  低危: ${auditResult.summary.lowCount}\n`)

  // 5. 包更新（干运行模式）
  console.log('5. 包更新（干运行示例）')
  const updater = new PackageUpdater(process.cwd(), { dryRun: true })

  const pm = await updater.detectPackageManager()
  console.log(`检测到包管理器: ${pm}`)

  if (hasUpdates.length > 0) {
    const firstUpdate = hasUpdates[0]
    const result = await updater.updatePackage(
      firstUpdate.packageName,
      firstUpdate.latestVersion
    )
    console.log(result.message)
  }
}

// 运行示例
basicExample().catch(console.error)

