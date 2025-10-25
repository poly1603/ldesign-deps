/**
 * DependencyHistoryTracker 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DependencyHistoryTracker } from '../../src/core/dependency-history-tracker'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'

describe('DependencyHistoryTracker', () => {
  let tracker: DependencyHistoryTracker
  let testDir: string
  let historyFilePath: string

  beforeEach(async () => {
    // 创建临时测试目录
    testDir = path.join(os.tmpdir(), `deps-test-${Date.now()}`)
    await fs.ensureDir(testDir)
    historyFilePath = path.join(testDir, '.deps-history.json')

    tracker = new DependencyHistoryTracker(testDir)
  })

  afterEach(async () => {
    // 清理测试目录
    await fs.remove(testDir)
  })

  describe('trackChange', () => {
    it('应该成功记录依赖变更', async () => {
      const change = await tracker.trackChange({
        packageName: 'react',
        type: 'add',
        newVersion: '18.2.0',
        reason: '添加 React',
        author: 'developer'
      })

      expect(change.id).toBeDefined()
      expect(change.timestamp).toBeDefined()
      expect(change.packageName).toBe('react')
      expect(change.type).toBe('add')
      expect(change.newVersion).toBe('18.2.0')
    })

    it('应该自动生成 ID 和时间戳', async () => {
      const change = await tracker.trackChange({
        packageName: 'vue',
        type: 'update',
        oldVersion: '3.2.0',
        newVersion: '3.3.4'
      })

      expect(change.id).toMatch(/^change-\d+-[a-z0-9]+$/)
      expect(change.timestamp).toBeGreaterThan(0)
    })
  })

  describe('trackChanges', () => {
    it('应该批量记录变更', async () => {
      const changes = await tracker.trackChanges([
        { packageName: 'react', type: 'add', newVersion: '18.2.0' },
        { packageName: 'vue', type: 'add', newVersion: '3.3.4' },
      ])

      expect(changes).toHaveLength(2)
      expect(changes[0].packageName).toBe('react')
      expect(changes[1].packageName).toBe('vue')
    })
  })

  describe('getHistory', () => {
    it('应该获取指定包的历史记录', async () => {
      await tracker.trackChanges([
        { packageName: 'react', type: 'add', newVersion: '18.0.0' },
        { packageName: 'react', type: 'update', oldVersion: '18.0.0', newVersion: '18.2.0' },
        { packageName: 'vue', type: 'add', newVersion: '3.3.4' },
      ])

      const history = await tracker.getHistory('react')

      expect(history.packageName).toBe('react')
      expect(history.changes).toHaveLength(2)
      expect(history.firstAdded).toBeDefined()
      expect(history.lastUpdated).toBeDefined()
    })

    it('应该为没有历史的包返回空列表', async () => {
      const history = await tracker.getHistory('nonexistent')

      expect(history.packageName).toBe('nonexistent')
      expect(history.changes).toHaveLength(0)
      expect(history.firstAdded).toBeUndefined()
    })
  })

  describe('getAllHistory', () => {
    it('应该获取所有包的历史记录', async () => {
      await tracker.trackChanges([
        { packageName: 'react', type: 'add', newVersion: '18.2.0' },
        { packageName: 'vue', type: 'add', newVersion: '3.3.4' },
      ])

      const allHistory = await tracker.getAllHistory()

      expect(Object.keys(allHistory)).toHaveLength(2)
      expect(allHistory.react).toBeDefined()
      expect(allHistory.vue).toBeDefined()
    })
  })

  describe('getChangesByTimeRange', () => {
    it('应该按时间范围查询变更', async () => {
      const now = Date.now()
      const yesterday = now - 24 * 60 * 60 * 1000
      const tomorrow = now + 24 * 60 * 60 * 1000

      await tracker.trackChange({
        packageName: 'react',
        type: 'add',
        newVersion: '18.2.0'
      })

      const changes = await tracker.getChangesByTimeRange(yesterday, tomorrow)
      expect(changes).toHaveLength(1)

      const emptyChanges = await tracker.getChangesByTimeRange(0, yesterday)
      expect(emptyChanges).toHaveLength(0)
    })
  })

  describe('getChangesByType', () => {
    it('应该按类型查询变更', async () => {
      await tracker.trackChanges([
        { packageName: 'react', type: 'add', newVersion: '18.2.0' },
        { packageName: 'vue', type: 'update', oldVersion: '3.2.0', newVersion: '3.3.4' },
        { packageName: 'lodash', type: 'remove', oldVersion: '4.17.21' },
      ])

      const addChanges = await tracker.getChangesByType('add')
      expect(addChanges).toHaveLength(1)

      const updateChanges = await tracker.getChangesByType('update')
      expect(updateChanges).toHaveLength(1)

      const removeChanges = await tracker.getChangesByType('remove')
      expect(removeChanges).toHaveLength(1)
    })
  })

  describe('getChangesByAuthor', () => {
    it('应该按作者查询变更', async () => {
      await tracker.trackChanges([
        { packageName: 'react', type: 'add', newVersion: '18.2.0', author: 'alice' },
        { packageName: 'vue', type: 'add', newVersion: '3.3.4', author: 'bob' },
        { packageName: 'lodash', type: 'add', newVersion: '4.17.21', author: 'alice' },
      ])

      const aliceChanges = await tracker.getChangesByAuthor('alice')
      expect(aliceChanges).toHaveLength(2)

      const bobChanges = await tracker.getChangesByAuthor('bob')
      expect(bobChanges).toHaveLength(1)
    })
  })

  describe('rollbackToVersion', () => {
    it('应该回滚到指定版本', async () => {
      await tracker.trackChanges([
        { packageName: 'react', type: 'add', newVersion: '18.0.0' },
        { packageName: 'react', type: 'update', oldVersion: '18.0.0', newVersion: '18.2.0' },
      ])

      const result = await tracker.rollbackToVersion('react', '18.0.0')

      expect(result.success).toBe(true)
      expect(result.message).toContain('成功回滚')
    })

    it('应该为不存在的版本返回失败', async () => {
      const result = await tracker.rollbackToVersion('react', '99.99.99')

      expect(result.success).toBe(false)
      expect(result.message).toContain('未找到')
    })
  })

  describe('getCurrentVersion', () => {
    it('应该获取当前版本', async () => {
      await tracker.trackChanges([
        { packageName: 'react', type: 'add', newVersion: '18.0.0' },
        { packageName: 'react', type: 'update', oldVersion: '18.0.0', newVersion: '18.2.0' },
      ])

      const version = await tracker.getCurrentVersion('react')
      expect(version).toBe('18.2.0')
    })

    it('应该为没有记录的包返回 null', async () => {
      const version = await tracker.getCurrentVersion('nonexistent')
      expect(version).toBeNull()
    })

    it('应该处理删除操作', async () => {
      await tracker.trackChanges([
        { packageName: 'react', type: 'add', newVersion: '18.0.0' },
        { packageName: 'react', type: 'remove', oldVersion: '18.0.0' },
      ])

      const version = await tracker.getCurrentVersion('react')
      expect(version).toBeNull()
    })
  })

  describe('clearHistory', () => {
    it('应该清除指定包的历史', async () => {
      await tracker.trackChanges([
        { packageName: 'react', type: 'add', newVersion: '18.2.0' },
        { packageName: 'vue', type: 'add', newVersion: '3.3.4' },
      ])

      await tracker.clearHistory('react')

      const reactHistory = await tracker.getHistory('react')
      expect(reactHistory.changes).toHaveLength(0)

      const vueHistory = await tracker.getHistory('vue')
      expect(vueHistory.changes).toHaveLength(1)
    })
  })

  describe('clearAllHistory', () => {
    it('应该清除所有历史记录', async () => {
      await tracker.trackChanges([
        { packageName: 'react', type: 'add', newVersion: '18.2.0' },
        { packageName: 'vue', type: 'add', newVersion: '3.3.4' },
      ])

      await tracker.clearAllHistory()

      const allHistory = await tracker.getAllHistory()
      expect(Object.keys(allHistory)).toHaveLength(0)
    })
  })

  describe('generateStats', () => {
    it('应该生成统计报告', async () => {
      await tracker.trackChanges([
        { packageName: 'react', type: 'add', newVersion: '18.2.0' },
        { packageName: 'react', type: 'update', oldVersion: '18.2.0', newVersion: '18.3.0' },
        { packageName: 'vue', type: 'add', newVersion: '3.3.4' },
        { packageName: 'lodash', type: 'remove', oldVersion: '4.17.21' },
      ])

      const stats = await tracker.generateStats()

      expect(stats.totalChanges).toBe(4)
      expect(stats.changesByType.add).toBe(2)
      expect(stats.changesByType.update).toBe(1)
      expect(stats.changesByType.remove).toBe(1)
      expect(stats.mostActivePackages[0].name).toBe('react')
      expect(stats.mostActivePackages[0].changes).toBe(2)
    })
  })

  describe('exportHistory', () => {
    it('应该导出 JSON 格式', async () => {
      await tracker.trackChange({
        packageName: 'react',
        type: 'add',
        newVersion: '18.2.0'
      })

      const exportPath = path.join(testDir, 'history.json')
      await tracker.exportHistory(exportPath, { format: 'json' })

      expect(await fs.pathExists(exportPath)).toBe(true)

      const exported = await fs.readJSON(exportPath)
      expect(exported.changes).toHaveLength(1)
    })

    it('应该导出 CSV 格式', async () => {
      await tracker.trackChange({
        packageName: 'react',
        type: 'add',
        newVersion: '18.2.0',
        author: 'developer'
      })

      const exportPath = path.join(testDir, 'history.csv')
      await tracker.exportHistory(exportPath, { format: 'csv' })

      expect(await fs.pathExists(exportPath)).toBe(true)

      const csvContent = await fs.readFile(exportPath, 'utf-8')
      expect(csvContent).toContain('时间,包名,类型')
      expect(csvContent).toContain('react')
    })

    it('应该支持过滤导出', async () => {
      await tracker.trackChanges([
        { packageName: 'react', type: 'add', newVersion: '18.2.0' },
        { packageName: 'vue', type: 'add', newVersion: '3.3.4' },
      ])

      const exportPath = path.join(testDir, 'react-history.json')
      await tracker.exportHistory(exportPath, {
        packageName: 'react',
        format: 'json'
      })

      const exported = await fs.readJSON(exportPath)
      expect(exported.changes).toHaveLength(1)
      expect(exported.changes[0].packageName).toBe('react')
    })
  })

  describe('generateReport', () => {
    it('应该生成格式化报告', async () => {
      await tracker.trackChanges([
        { packageName: 'react', type: 'add', newVersion: '18.0.0', author: 'alice' },
        { packageName: 'react', type: 'update', oldVersion: '18.0.0', newVersion: '18.2.0', reason: '升级' },
      ])

      const report = await tracker.generateReport({ packageName: 'react' })

      expect(report).toContain('react')
      expect(report).toContain('18.0.0')
      expect(report).toContain('18.2.0')
      expect(report).toContain('ADD')
      expect(report).toContain('UPDATE')
    })

    it('应该支持限制显示数量', async () => {
      await tracker.trackChanges([
        { packageName: 'react', type: 'add', newVersion: '18.0.0' },
        { packageName: 'react', type: 'update', oldVersion: '18.0.0', newVersion: '18.1.0' },
        { packageName: 'react', type: 'update', oldVersion: '18.1.0', newVersion: '18.2.0' },
      ])

      const report = await tracker.generateReport({
        packageName: 'react',
        limit: 2
      })

      // 报告应该只显示最近的2条记录
      const updateCount = (report.match(/UPDATE/g) || []).length
      expect(updateCount).toBeLessThanOrEqual(2)
    })
  })
})


