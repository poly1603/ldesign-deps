import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PackageUpdater } from '../../src/core/package-updater'
import { createTestProject, cleanTempTestDir } from '../helpers/mock'

describe('PackageUpdater', () => {
  let testDir: string
  let updater: PackageUpdater

  beforeEach(async () => {
    testDir = await createTestProject()
    updater = new PackageUpdater(testDir)
  })

  afterEach(async () => {
    await cleanTempTestDir(testDir)
  })

  describe('detectPackageManager', () => {
    it('应该检测包管理器', async () => {
      const pm = await updater.detectPackageManager()

      expect(pm).toBeDefined()
      expect(['npm', 'pnpm', 'yarn']).toContain(pm)
    })
  })

  describe('updatePackage (dry-run)', () => {
    it('干运行模式不应该实际更新', async () => {
      const dryRunUpdater = new PackageUpdater(testDir, { dryRun: true })

      const result = await dryRunUpdater.updatePackage('lodash', '4.17.21')

      expect(result.success).toBe(true)
      expect(result.dryRun).toBe(true)
      expect(result.message).toContain('DRY RUN')
    })
  })

  describe('updatePackages (dry-run)', () => {
    it('应该支持批量更新', async () => {
      const dryRunUpdater = new PackageUpdater(testDir, { dryRun: true })

      const packages = [
        { name: 'lodash', version: '4.17.21' },
        { name: 'axios', version: '1.0.0' }
      ]

      const results = await dryRunUpdater.updatePackages(packages)

      expect(results).toHaveLength(2)
      expect(results.every(r => r.success)).toBe(true)
    })
  })

  describe('install (dry-run)', () => {
    it('干运行模式不应该实际安装', async () => {
      const dryRunUpdater = new PackageUpdater(testDir, { dryRun: true })

      const result = await dryRunUpdater.install()

      expect(result.success).toBe(true)
      expect(result.dryRun).toBe(true)
    })
  })

  describe('reinstall (dry-run)', () => {
    it('干运行模式不应该实际重装', async () => {
      const dryRunUpdater = new PackageUpdater(testDir, { dryRun: true })

      const result = await dryRunUpdater.reinstall()

      expect(result.success).toBe(true)
      expect(result.dryRun).toBe(true)
    })
  })

  describe('dedupe (dry-run)', () => {
    it('干运行模式不应该实际去重', async () => {
      const dryRunUpdater = new PackageUpdater(testDir, { dryRun: true })

      const result = await dryRunUpdater.dedupe()

      expect(result.success).toBe(true)
      expect(result.dryRun).toBe(true)
    })
  })

  describe('配置选项', () => {
    it('应该支持自定义配置', () => {
      const customUpdater = new PackageUpdater(testDir, {
        dryRun: true,
        saveExact: true,
        updateLockfile: false,
        ignorePeerWarnings: true
      })

      expect(customUpdater).toBeDefined()
    })
  })

  describe('错误处理', () => {
    it('应该处理无效的包名', async () => {
      const result = await updater.updatePackage('non-existent-invalid-package-xyz')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})

