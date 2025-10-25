/**
 * DependencyLockManager 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DependencyLockManager } from '../../src/core/dependency-lock-manager'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'

describe('DependencyLockManager', () => {
  let lockManager: DependencyLockManager
  let testDir: string
  let lockFilePath: string

  beforeEach(async () => {
    // 创建临时测试目录
    testDir = path.join(os.tmpdir(), `deps-test-${Date.now()}`)
    await fs.ensureDir(testDir)
    lockFilePath = path.join(testDir, '.deps-lock.json')

    lockManager = new DependencyLockManager(testDir)
  })

  afterEach(async () => {
    // 清理测试目录
    await fs.remove(testDir)
  })

  describe('lockDependency', () => {
    it('应该成功锁定依赖', async () => {
      await lockManager.lockDependency('react', '18.2.0', {
        reason: '测试锁定',
        lockedBy: 'test'
      })

      const isLocked = await lockManager.isLocked('react')
      expect(isLocked).toBe(true)

      const version = await lockManager.getLockedVersion('react')
      expect(version).toBe('18.2.0')
    })

    it('应该拒绝重复锁定', async () => {
      await lockManager.lockDependency('react', '18.2.0')

      await expect(
        lockManager.lockDependency('react', '18.3.0')
      ).rejects.toThrow()
    })

    it('应该支持强制覆盖锁定', async () => {
      await lockManager.lockDependency('react', '18.2.0')
      await lockManager.lockDependency('react', '18.3.0', { force: true })

      const version = await lockManager.getLockedVersion('react')
      expect(version).toBe('18.3.0')
    })
  })

  describe('unlockDependency', () => {
    it('应该成功解锁依赖', async () => {
      await lockManager.lockDependency('react', '18.2.0')
      await lockManager.unlockDependency('react')

      const isLocked = await lockManager.isLocked('react')
      expect(isLocked).toBe(false)
    })

    it('应该在解锁不存在的依赖时抛出错误', async () => {
      await expect(
        lockManager.unlockDependency('nonexistent')
      ).rejects.toThrow()
    })
  })

  describe('batch operations', () => {
    it('应该支持批量锁定', async () => {
      await lockManager.lockDependencies([
        { name: 'react', version: '18.2.0', reason: '测试' },
        { name: 'vue', version: '3.3.4', reason: '测试' },
      ])

      const locked = await lockManager.getLockedDependencies()
      expect(locked).toHaveLength(2)
    })

    it('应该支持批量解锁', async () => {
      await lockManager.lockDependencies([
        { name: 'react', version: '18.2.0' },
        { name: 'vue', version: '3.3.4' },
      ])

      await lockManager.unlockDependencies(['react', 'vue'])

      const locked = await lockManager.getLockedDependencies()
      expect(locked).toHaveLength(0)
    })
  })

  describe('validateLock', () => {
    it('应该验证版本是否符合锁定要求', async () => {
      await lockManager.lockDependency('react', '18.2.0')

      const validResult = await lockManager.validateLock('react', '18.2.0')
      expect(validResult.valid).toBe(true)
      expect(validResult.locked).toBe(true)

      const invalidResult = await lockManager.validateLock('react', '18.3.0')
      expect(invalidResult.valid).toBe(false)
      expect(invalidResult.locked).toBe(true)
    })

    it('应该允许未锁定的依赖', async () => {
      const result = await lockManager.validateLock('unlocked-pkg', '1.0.0')
      expect(result.valid).toBe(true)
      expect(result.locked).toBe(false)
    })
  })

  describe('getLockInfo', () => {
    it('应该返回完整的锁定信息', async () => {
      await lockManager.lockDependency('react', '18.2.0', {
        reason: '生产环境',
        lockedBy: 'admin'
      })

      const info = await lockManager.getLockInfo('react')
      expect(info).toBeDefined()
      expect(info?.name).toBe('react')
      expect(info?.version).toBe('18.2.0')
      expect(info?.reason).toBe('生产环境')
      expect(info?.lockedBy).toBe('admin')
      expect(info?.lockedAt).toBeDefined()
    })

    it('应该为未锁定的依赖返回 null', async () => {
      const info = await lockManager.getLockInfo('nonexistent')
      expect(info).toBeNull()
    })
  })

  describe('clearAllLocks', () => {
    it('应该清除所有锁定', async () => {
      await lockManager.lockDependencies([
        { name: 'react', version: '18.2.0' },
        { name: 'vue', version: '3.3.4' },
      ])

      await lockManager.clearAllLocks()

      const locked = await lockManager.getLockedDependencies()
      expect(locked).toHaveLength(0)
    })
  })

  describe('export/import', () => {
    it('应该导出锁定配置', async () => {
      await lockManager.lockDependency('react', '18.2.0')

      const exportPath = path.join(testDir, 'exported-locks.json')
      await lockManager.exportLocks(exportPath)

      expect(await fs.pathExists(exportPath)).toBe(true)

      const exported = await fs.readJSON(exportPath)
      expect(exported.locked.react).toBeDefined()
    })

    it('应该导入锁定配置', async () => {
      const importData = {
        version: '1.0.0',
        locked: {
          react: {
            name: 'react',
            version: '18.2.0',
            lockedAt: Date.now()
          }
        },
        lastUpdated: Date.now()
      }

      const importPath = path.join(testDir, 'import-locks.json')
      await fs.writeJSON(importPath, importData)

      await lockManager.importLocks(importPath)

      const isLocked = await lockManager.isLocked('react')
      expect(isLocked).toBe(true)
    })

    it('应该支持合并导入', async () => {
      await lockManager.lockDependency('vue', '3.3.4')

      const importData = {
        version: '1.0.0',
        locked: {
          react: {
            name: 'react',
            version: '18.2.0',
            lockedAt: Date.now()
          }
        },
        lastUpdated: Date.now()
      }

      const importPath = path.join(testDir, 'merge-locks.json')
      await fs.writeJSON(importPath, importData)

      await lockManager.importLocks(importPath, true)

      const locked = await lockManager.getLockedDependencies()
      expect(locked).toHaveLength(2)
    })
  })

  describe('generateReport', () => {
    it('应该生成锁定报告', async () => {
      await lockManager.lockDependencies([
        { name: 'react', version: '18.2.0', reason: '稳定版本' },
        { name: 'vue', version: '3.3.4', reason: '已测试' },
      ])

      const report = await lockManager.generateReport()
      expect(report).toContain('react')
      expect(report).toContain('vue')
      expect(report).toContain('18.2.0')
      expect(report).toContain('3.3.4')
    })

    it('应该处理空锁定列表', async () => {
      const report = await lockManager.generateReport()
      expect(report).toContain('没有锁定的依赖')
    })
  })
})


