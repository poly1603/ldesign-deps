import fs from 'fs-extra'
import path from 'path'
import semver from 'semver'
import type { PackageJson, DependencyInfo } from '../types'
import { DependencyError, ParseError } from '../types'

/**
 * 依赖管理器 - 管理项目依赖
 */
export class DependencyManager {
  private packageJsonPath: string
  private packageJson: PackageJson | null = null

  constructor(private projectDir: string = process.cwd()) {
    this.packageJsonPath = path.join(projectDir, 'package.json')
  }

  /**
   * 加载 package.json
   */
  async loadPackageJson(): Promise<PackageJson> {
    try {
      if (!this.packageJson) {
        if (!(await fs.pathExists(this.packageJsonPath))) {
          throw new ParseError(
            'package.json 文件不存在',
            this.packageJsonPath
          )
        }
        this.packageJson = await fs.readJSON(this.packageJsonPath)
      }
      return this.packageJson
    } catch (error) {
      if (error instanceof ParseError) {
        throw error
      }
      throw new ParseError(
        `解析 package.json 失败: ${error instanceof Error ? error.message : String(error)}`,
        this.packageJsonPath
      )
    }
  }

  /**
   * 重新加载 package.json（清除缓存）
   */
  async reloadPackageJson(): Promise<PackageJson> {
    this.packageJson = null
    return this.loadPackageJson()
  }

  /**
   * 获取所有依赖
   */
  async getAllDependencies(): Promise<Record<string, DependencyInfo>> {
    try {
      const pkg = await this.loadPackageJson()
      const deps: Record<string, DependencyInfo> = {}

      // 合并所有依赖类型
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
        ...pkg.peerDependencies,
        ...pkg.optionalDependencies
      }

      for (const [name, version] of Object.entries(allDeps || {})) {
        deps[name] = {
          name,
          version: version || '',
          type: this.getDependencyType(name, pkg)
        }
      }

      return deps
    } catch (error) {
      throw new DependencyError(
        '获取依赖列表失败',
        'GET_DEPENDENCIES_FAILED',
        error
      )
    }
  }

  /**
   * 搜索依赖
   */
  async searchDependencies(query: string): Promise<DependencyInfo[]> {
    const allDeps = await this.getAllDependencies()
    const lowerQuery = query.toLowerCase()

    return Object.values(allDeps).filter(dep =>
      dep.name.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * 获取特定类型的依赖
   */
  async getDependenciesByType(
    type: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies'
  ): Promise<Record<string, DependencyInfo>> {
    const allDeps = await this.getAllDependencies()
    return Object.fromEntries(
      Object.entries(allDeps).filter(([_, info]) => info.type === type)
    )
  }

  /**
   * 添加依赖
   */
  async addDependency(
    name: string,
    version: string,
    type: 'dependencies' | 'devDependencies' = 'dependencies'
  ): Promise<void> {
    try {
      const pkg = await this.loadPackageJson()

      if (!pkg[type]) {
        pkg[type] = {}
      }

      pkg[type]![name] = version
      await this.savePackageJson(pkg)
    } catch (error) {
      throw new DependencyError(
        `添加依赖 ${name} 失败`,
        'ADD_DEPENDENCY_FAILED',
        error
      )
    }
  }

  /**
   * 批量添加依赖
   */
  async addDependencies(
    dependencies: Array<{ name: string; version: string; type?: 'dependencies' | 'devDependencies' }>
  ): Promise<void> {
    try {
      const pkg = await this.loadPackageJson()

      for (const dep of dependencies) {
        const type = dep.type || 'dependencies'
        if (!pkg[type]) {
          pkg[type] = {}
        }
        pkg[type]![dep.name] = dep.version
      }

      await this.savePackageJson(pkg)
    } catch (error) {
      throw new DependencyError(
        '批量添加依赖失败',
        'ADD_DEPENDENCIES_FAILED',
        error
      )
    }
  }

  /**
   * 删除依赖
   */
  async removeDependency(name: string): Promise<void> {
    try {
      const pkg = await this.loadPackageJson()

      delete pkg.dependencies?.[name]
      delete pkg.devDependencies?.[name]
      delete pkg.peerDependencies?.[name]
      delete pkg.optionalDependencies?.[name]

      await this.savePackageJson(pkg)
    } catch (error) {
      throw new DependencyError(
        `删除依赖 ${name} 失败`,
        'REMOVE_DEPENDENCY_FAILED',
        error
      )
    }
  }

  /**
   * 批量删除依赖
   */
  async removeDependencies(names: string[]): Promise<void> {
    try {
      const pkg = await this.loadPackageJson()

      for (const name of names) {
        delete pkg.dependencies?.[name]
        delete pkg.devDependencies?.[name]
        delete pkg.peerDependencies?.[name]
        delete pkg.optionalDependencies?.[name]
      }

      await this.savePackageJson(pkg)
    } catch (error) {
      throw new DependencyError(
        '批量删除依赖失败',
        'REMOVE_DEPENDENCIES_FAILED',
        error
      )
    }
  }

  /**
   * 更新依赖版本
   */
  async updateDependencyVersion(name: string, version: string): Promise<void> {
    try {
      const pkg = await this.loadPackageJson()
      let updated = false

      if (pkg.dependencies?.[name]) {
        pkg.dependencies[name] = version
        updated = true
      }

      if (pkg.devDependencies?.[name]) {
        pkg.devDependencies[name] = version
        updated = true
      }

      if (pkg.peerDependencies?.[name]) {
        pkg.peerDependencies[name] = version
        updated = true
      }

      if (pkg.optionalDependencies?.[name]) {
        pkg.optionalDependencies[name] = version
        updated = true
      }

      if (!updated) {
        throw new DependencyError(
          `依赖 ${name} 不存在`,
          'DEPENDENCY_NOT_FOUND'
        )
      }

      await this.savePackageJson(pkg)
    } catch (error) {
      if (error instanceof DependencyError) {
        throw error
      }
      throw new DependencyError(
        `更新依赖 ${name} 版本失败`,
        'UPDATE_DEPENDENCY_FAILED',
        error
      )
    }
  }

  /**
   * 检查依赖是否存在
   */
  async hasDependency(name: string): Promise<boolean> {
    const pkg = await this.loadPackageJson()
    return !!(
      pkg.dependencies?.[name] ||
      pkg.devDependencies?.[name] ||
      pkg.peerDependencies?.[name] ||
      pkg.optionalDependencies?.[name]
    )
  }

  /**
   * 解析版本范围
   */
  resolveVersionRange(versionRange: string): { min?: string; max?: string } | null {
    try {
      const range = new semver.Range(versionRange)

      return {
        min: range.set[0]?.[0]?.semver?.version,
        max: range.set[range.set.length - 1]?.[0]?.semver?.version
      }
    } catch (error) {
      return null
    }
  }

  /**
   * 获取 overrides/resolutions
   */
  async getOverrides(): Promise<Record<string, string>> {
    const pkg = await this.loadPackageJson()
    return pkg.overrides || pkg.resolutions || {}
  }

  /**
   * 设置 override/resolution
   */
  async setOverride(packageName: string, version: string): Promise<void> {
    try {
      const pkg = await this.loadPackageJson()

      // 优先使用 overrides (npm 8.3+)
      if (!pkg.overrides) {
        pkg.overrides = {}
      }
      pkg.overrides[packageName] = version

      await this.savePackageJson(pkg)
    } catch (error) {
      throw new DependencyError(
        `设置 override ${packageName} 失败`,
        'SET_OVERRIDE_FAILED',
        error
      )
    }
  }

  /**
   * 保存 package.json
   */
  private async savePackageJson(pkg: PackageJson): Promise<void> {
    try {
      await fs.writeJSON(this.packageJsonPath, pkg, { spaces: 2 })
      this.packageJson = pkg
    } catch (error) {
      throw new DependencyError(
        '保存 package.json 失败',
        'SAVE_PACKAGE_JSON_FAILED',
        error
      )
    }
  }

  /**
   * 获取依赖类型
   */
  private getDependencyType(
    name: string,
    pkg: PackageJson
  ): 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies' | 'unknown' {
    if (pkg.dependencies?.[name]) return 'dependencies'
    if (pkg.devDependencies?.[name]) return 'devDependencies'
    if (pkg.peerDependencies?.[name]) return 'peerDependencies'
    if (pkg.optionalDependencies?.[name]) return 'optionalDependencies'
    return 'unknown'
  }
}


