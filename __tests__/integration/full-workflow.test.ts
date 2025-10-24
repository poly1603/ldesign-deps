import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  DependencyManager,
  VersionChecker,
  DependencyAnalyzer,
  SecurityAuditor,
  PackageUpdater,
  ConfigLoader
} from '../../src/core'
import { createTestProject, cleanTempTestDir } from '../helpers/mock'

describe('Full Workflow Integration', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = await createTestProject()
  })

  afterEach(async () => {
    await cleanTempTestDir(testDir)
  })

  describe('完整更新工作流', () => {
    it('应该完成从检查到更新的完整流程', async () => {
      // 1. 加载配置
      const configLoader = new ConfigLoader(testDir)
      const config = await configLoader.loadConfig()
      expect(config).toBeDefined()

      // 2. 获取依赖列表
      const manager = new DependencyManager(testDir)
      const deps = await manager.getAllDependencies()
      expect(Object.keys(deps).length).toBeGreaterThan(0)

      // 3. 检查版本更新
      const checker = new VersionChecker()
      const depsToCheck = Object.fromEntries(
        Object.values(deps).map(d => [d.name, d.version])
      )
      const updates = await checker.checkUpdates(depsToCheck)
      expect(Array.isArray(updates)).toBe(true)

      // 4. 分析依赖
      const analyzer = new DependencyAnalyzer(testDir)
      const analysis = await analyzer.analyze()
      expect(analysis).toBeDefined()
      expect(analysis.unused).toBeDefined()
      expect(analysis.missing).toBeDefined()

      // 5. 干运行更新（不实际更新）
      const updater = new PackageUpdater(testDir, { dryRun: true })
      const hasUpdates = updates.filter(u => u.hasUpdate)

      if (hasUpdates.length > 0) {
        const firstUpdate = hasUpdates[0]
        const result = await updater.updatePackage(
          firstUpdate.packageName,
          firstUpdate.latestVersion
        )
        expect(result.success).toBe(true)
        expect(result.dryRun).toBe(true)
      }
    })
  })

  describe('完整审计工作流', () => {
    it('应该完成安全审计流程', async () => {
      // 1. 获取依赖
      const manager = new DependencyManager(testDir)
      const deps = await manager.getAllDependencies()

      // 2. 执行安全审计
      const auditor = new SecurityAuditor(testDir, {
        auditLevel: 'moderate',
        checkLicenses: true
      })

      const result = await auditor.audit()

      // 3. 验证审计结果
      expect(result).toBeDefined()
      expect(result.vulnerabilities).toBeDefined()
      expect(result.licenses).toBeDefined()
      expect(result.securityScore).toBeDefined()
      expect(result.summary).toBeDefined()

      // 4. 生成报告
      const report = auditor.generateReport(result)
      expect(report).toContain('安全审计报告')
    })
  })

  describe('配置驱动工作流', () => {
    it('应该根据配置执行操作', async () => {
      // 1. 加载配置
      const configLoader = new ConfigLoader(testDir)
      const config = await configLoader.loadConfig()

      // 2. 根据配置创建分析器
      const analyzer = new DependencyAnalyzer(testDir, config.analyze)

      // 3. 执行分析
      const analysis = await analyzer.analyze()

      // 4. 验证配置被应用
      expect(analysis).toBeDefined()

      // 根据配置决定检查项
      if (config.analyze?.checkUnused) {
        expect(analysis.unused).toBeDefined()
      }

      if (config.analyze?.checkMissing) {
        expect(analysis.missing).toBeDefined()
      }

      if (config.analyze?.checkDuplicates) {
        expect(analysis.duplicates).toBeDefined()
      }
    })
  })

  describe('错误恢复流程', () => {
    it('应该在更新失败后正确恢复', async () => {
      const updater = new PackageUpdater(testDir)

      // 尝试更新一个不存在的包（会失败）
      const result = await updater.updatePackage('non-existent-package-xyz-12345')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()

      // 验证 package.json 没有被破坏
      const manager = new DependencyManager(testDir)
      const deps = await manager.getAllDependencies()
      expect(Object.keys(deps).length).toBeGreaterThan(0)
    })
  })

  describe('批量操作工作流', () => {
    it('应该支持批量依赖操作', async () => {
      const manager = new DependencyManager(testDir)

      // 1. 批量添加依赖（干运行）
      const newDeps = [
        { name: 'test-dep-1', version: '1.0.0' },
        { name: 'test-dep-2', version: '2.0.0' }
      ]

      await manager.addDependencies(newDeps)

      // 2. 验证添加成功
      const deps = await manager.getAllDependencies()
      expect(deps['test-dep-1']).toBeDefined()
      expect(deps['test-dep-2']).toBeDefined()

      // 3. 批量删除
      await manager.removeDependencies(['test-dep-1', 'test-dep-2'])

      // 4. 验证删除成功
      const depsAfter = await manager.getAllDependencies()
      expect(depsAfter['test-dep-1']).toBeUndefined()
      expect(depsAfter['test-dep-2']).toBeUndefined()
    })
  })
})

