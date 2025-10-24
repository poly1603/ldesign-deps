import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VersionChecker } from '../../src/core/version-checker'
import { CacheManager } from '../../src/core/cache-manager'

describe('VersionChecker', () => {
  let checker: VersionChecker
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager({ enabled: true, ttl: 1000 })
    checker = new VersionChecker(cache)
  })

  describe('checkUpdate', () => {
    it('应该正确检测版本更新', async () => {
      const result = await checker.checkUpdate('react', '^17.0.0')

      expect(result).toBeDefined()
      expect(result.packageName).toBe('react')
      expect(result.currentVersion).toBe('^17.0.0')
      expect(result.hasUpdate).toBeDefined()
      expect(result.updateType).toMatch(/major|minor|patch|none/)
    })

    it('应该识别主版本更新', async () => {
      const result = await checker.checkUpdate('react', '^16.0.0')

      if (result.hasUpdate) {
        expect(['major', 'minor']).toContain(result.updateType)
      }
    })

    it('应该处理无效版本号', async () => {
      const result = await checker.checkUpdate('react', 'invalid')

      expect(result.hasUpdate).toBe(false)
      expect(result.updateType).toBe('none')
    })
  })

  describe('缓存功能', () => {
    it('应该使用缓存避免重复请求', async () => {
      // 第一次请求
      const result1 = await checker.checkUpdate('lodash', '^4.17.0')

      // 第二次请求应该从缓存获取
      const result2 = await checker.checkUpdate('lodash', '^4.17.0')

      expect(result1).toEqual(result2)

      const stats = checker.getCacheStats()
      expect(stats.hits).toBeGreaterThan(0)
    })

    it('应该能清除缓存', () => {
      checker.clearCache()
      const stats = checker.getCacheStats()
      expect(stats.size).toBe(0)
    })
  })

  describe('并行检查', () => {
    it('应该能并行检查多个依赖', async () => {
      const deps = {
        'react': '^18.0.0',
        'vue': '^3.0.0',
        'lodash': '^4.17.0'
      }

      const results = await checker.checkUpdates(deps)

      expect(results).toHaveLength(3)
      expect(results.every(r => r.packageName)).toBe(true)
    })

    it('应该报告进度', async () => {
      const deps = {
        'react': '^18.0.0',
        'vue': '^3.0.0'
      }

      const progressUpdates: number[] = []

      await checker.checkUpdates(deps, (progress) => {
        progressUpdates.push(progress.percentage)
      })

      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100)
    })
  })

  describe('getAllVersions', () => {
    it('应该获取所有版本包括 beta/alpha', async () => {
      const versions = await checker.getAllVersions('react')

      expect(versions).toBeDefined()
      expect(versions.latest).toBeDefined()
    })
  })

  describe('groupUpdatesBySeverity', () => {
    it('应该正确分组更新', () => {
      const updates = [
        { packageName: 'a', currentVersion: '1.0.0', latestVersion: '2.0.0', hasUpdate: true, updateType: 'major' as const },
        { packageName: 'b', currentVersion: '1.0.0', latestVersion: '1.1.0', hasUpdate: true, updateType: 'minor' as const },
        { packageName: 'c', currentVersion: '1.0.0', latestVersion: '1.0.1', hasUpdate: true, updateType: 'patch' as const }
      ]

      const grouped = checker.groupUpdatesBySeverity(updates)

      expect(grouped.major).toHaveLength(1)
      expect(grouped.minor).toHaveLength(1)
      expect(grouped.patch).toHaveLength(1)
    })
  })

  describe('错误处理', () => {
    it('应该优雅处理网络错误', async () => {
      const result = await checker.checkUpdate('non-existent-package-xyz-123', '^1.0.0')

      expect(result.hasUpdate).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})

