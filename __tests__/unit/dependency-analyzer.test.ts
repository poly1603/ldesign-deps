import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DependencyAnalyzer } from '../../src/core/dependency-analyzer'
import { createTestProject, cleanTempTestDir } from '../helpers/mock'

describe('DependencyAnalyzer', () => {
  let testDir: string
  let analyzer: DependencyAnalyzer

  beforeEach(async () => {
    testDir = await createTestProject()
    analyzer = new DependencyAnalyzer(testDir)
  })

  afterEach(async () => {
    await cleanTempTestDir(testDir)
  })

  describe('analyze', () => {
    it('应该返回分析结果', async () => {
      const result = await analyzer.analyze()

      expect(result).toBeDefined()
      expect(result.unused).toBeDefined()
      expect(result.missing).toBeDefined()
      expect(result.usingDependencies).toBeDefined()
    })

    it('应该检测未使用的依赖', async () => {
      const result = await analyzer.analyze()

      expect(Array.isArray(result.unused)).toBe(true)
    })

    it('应该检测缺失的依赖', async () => {
      const result = await analyzer.analyze()

      expect(Array.isArray(result.missing)).toBe(true)
    })
  })

  describe('quickAnalyze', () => {
    it('应该快速分析', async () => {
      const result = await analyzer.quickAnalyze()

      expect(result).toBeDefined()
      expect(result.unused).toBeDefined()
    })
  })

  describe('getUnusedDependencies', () => {
    it('应该返回未使用的依赖列表', async () => {
      const unused = await analyzer.getUnusedDependencies()

      expect(Array.isArray(unused)).toBe(true)
    })
  })

  describe('getMissingDependencies', () => {
    it('应该返回缺失的依赖列表', async () => {
      const missing = await analyzer.getMissingDependencies()

      expect(Array.isArray(missing)).toBe(true)
    })
  })

  describe('findDuplicates', () => {
    it('应该检测重复的依赖', async () => {
      const duplicates = await analyzer.findDuplicates()

      expect(Array.isArray(duplicates)).toBe(true)
    })

    it('重复依赖应该包含名称和版本', async () => {
      const duplicates = await analyzer.findDuplicates()

      duplicates.forEach(dup => {
        expect(dup.name).toBeDefined()
        expect(Array.isArray(dup.versions)).toBe(true)
        expect(Array.isArray(dup.locations)).toBe(true)
      })
    })
  })

  describe('analyzeUsageDetails', () => {
    it('应该返回使用详情', async () => {
      const details = await analyzer.analyzeUsageDetails()

      expect(details).toBeDefined()
      expect(typeof details).toBe('object')
    })
  })

  describe('generateReport', () => {
    it('应该生成文本报告', async () => {
      const analysis = await analyzer.analyze()
      const report = analyzer.generateReport(analysis)

      expect(typeof report).toBe('string')
      expect(report.length).toBeGreaterThan(0)
      expect(report).toContain('依赖分析报告')
    })

    it('报告应该包含各项统计', async () => {
      const analysis = await analyzer.analyze()
      const report = analyzer.generateReport(analysis)

      expect(report).toContain('未使用的依赖')
      expect(report).toContain('缺失的依赖')
    })
  })

  describe('配置选项', () => {
    it('应该尊重配置选项', async () => {
      const customAnalyzer = new DependencyAnalyzer(testDir, {
        checkUnused: false,
        checkMissing: false,
        checkDuplicates: false
      })

      const result = await customAnalyzer.analyze()

      expect(result.unused).toHaveLength(0)
      expect(result.missing).toHaveLength(0)
      expect(result.duplicates).toHaveLength(0)
    })
  })
})

