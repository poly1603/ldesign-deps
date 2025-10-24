import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DependencyManager } from '../../src/core/dependency-manager'
import { createTestProject, cleanTempTestDir, createMockPackageJson } from '../helpers/mock'

describe('DependencyManager', () => {
  let testDir: string
  let manager: DependencyManager

  beforeEach(async () => {
    testDir = await createTestProject()
    manager = new DependencyManager(testDir)
  })

  afterEach(async () => {
    await cleanTempTestDir(testDir)
  })

  describe('loadPackageJson', () => {
    it('应该成功加载 package.json', async () => {
      const pkg = await manager.loadPackageJson()
      expect(pkg).toBeDefined()
      expect(pkg.name).toBe('test-package')
      expect(pkg.version).toBe('1.0.0')
    })

    it('应该缓存加载的 package.json', async () => {
      const pkg1 = await manager.loadPackageJson()
      const pkg2 = await manager.loadPackageJson()
      expect(pkg1).toBe(pkg2)
    })
  })

  describe('getAllDependencies', () => {
    it('应该返回所有依赖', async () => {
      const deps = await manager.getAllDependencies()
      expect(deps).toBeDefined()
      expect(Object.keys(deps).length).toBeGreaterThan(0)
      expect(deps['react']).toBeDefined()
      expect(deps['vue']).toBeDefined()
      expect(deps['typescript']).toBeDefined()
    })

    it('应该正确标记依赖类型', async () => {
      const deps = await manager.getAllDependencies()
      expect(deps['react'].type).toBe('dependencies')
      expect(deps['typescript'].type).toBe('devDependencies')
    })
  })

  describe('searchDependencies', () => {
    it('应该能搜索依赖', async () => {
      const results = await manager.searchDependencies('react')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].name).toBe('react')
    })

    it('应该不区分大小写', async () => {
      const results = await manager.searchDependencies('REACT')
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('addDependency', () => {
    it('应该能添加新依赖', async () => {
      await manager.addDependency('lodash', '^4.17.21')
      const deps = await manager.getAllDependencies()
      expect(deps['lodash']).toBeDefined()
      expect(deps['lodash'].version).toBe('^4.17.21')
    })

    it('应该能添加到 devDependencies', async () => {
      await manager.addDependency('eslint', '^8.0.0', 'devDependencies')
      const deps = await manager.getAllDependencies()
      expect(deps['eslint']).toBeDefined()
      expect(deps['eslint'].type).toBe('devDependencies')
    })
  })

  describe('removeDependency', () => {
    it('应该能删除依赖', async () => {
      await manager.removeDependency('react')
      const deps = await manager.getAllDependencies()
      expect(deps['react']).toBeUndefined()
    })
  })

  describe('updateDependencyVersion', () => {
    it('应该能更新依赖版本', async () => {
      await manager.updateDependencyVersion('react', '^18.3.0')
      const pkg = await manager.reloadPackageJson()
      expect(pkg.dependencies?.['react']).toBe('^18.3.0')
    })
  })

  describe('hasDependency', () => {
    it('应该正确检测依赖是否存在', async () => {
      const hasReact = await manager.hasDependency('react')
      const hasNonExistent = await manager.hasDependency('non-existent-package')

      expect(hasReact).toBe(true)
      expect(hasNonExistent).toBe(false)
    })
  })
})

