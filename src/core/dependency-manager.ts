import fs from 'fs-extra'
import path from 'path'
import type { PackageJson, DependencyInfo } from '../types'

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
    if (!this.packageJson) {
      this.packageJson = await fs.readJSON(this.packageJsonPath)
    }
    return this.packageJson
  }

  /**
   * 获取所有依赖
   */
  async getAllDependencies(): Promise<Record<string, DependencyInfo>> {
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
  }

  /**
   * 添加依赖
   */
  async addDependency(name: string, version: string, type: 'dependencies' | 'devDependencies' = 'dependencies'): Promise<void> {
    const pkg = await this.loadPackageJson()

    if (!pkg[type]) {
      pkg[type] = {}
    }

    pkg[type]![name] = version
    await fs.writeJSON(this.packageJsonPath, pkg, { spaces: 2 })
    this.packageJson = pkg
  }

  /**
   * 删除依赖
   */
  async removeDependency(name: string): Promise<void> {
    const pkg = await this.loadPackageJson()

    delete pkg.dependencies?.[name]
    delete pkg.devDependencies?.[name]
    delete pkg.peerDependencies?.[name]
    delete pkg.optionalDependencies?.[name]

    await fs.writeJSON(this.packageJsonPath, pkg, { spaces: 2 })
    this.packageJson = pkg
  }

  /**
   * 获取依赖类型
   */
  private getDependencyType(name: string, pkg: PackageJson): string {
    if (pkg.dependencies?.[name]) return 'dependencies'
    if (pkg.devDependencies?.[name]) return 'devDependencies'
    if (pkg.peerDependencies?.[name]) return 'peerDependencies'
    if (pkg.optionalDependencies?.[name]) return 'optionalDependencies'
    return 'unknown'
  }
}


