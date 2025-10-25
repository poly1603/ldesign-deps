import fs from 'fs-extra'
import path from 'path'
import fg from 'fast-glob'
import type {
  WorkspaceInfo,
  WorkspacePackage,
  CrossDependency,
  PhantomDependency,
  WorkspaceAnalysis,
  VersionConflict,
  SharedDependency,
  PackageJson
} from '../types'
import { DependencyError, ParseError } from '../types'
import { DepsErrorCode } from '../constants'
import { logger } from './logger'

/**
 * Monorepo 工作区管理器 - 管理多包项目的依赖关系
 * 
 * 支持的工作区类型：
 * - pnpm (pnpm-workspace.yaml)
 * - yarn (package.json workspaces + yarn.lock)
 * - npm (package.json workspaces)
 * - lerna (lerna.json)
 * 
 * @example
 * ```ts
 * const wsManager = new WorkspaceManager()
 * const workspace = await wsManager.analyzeWorkspace()
 * console.log(`工作区类型: ${workspace.type}`)
 * console.log(`包数量: ${workspace.packages.length}`)
 * ```
 */
export class WorkspaceManager {
  constructor(private projectDir: string = process.cwd()) { }

  /**
   * 扫描并分析工作区
   */
  async analyzeWorkspace(): Promise<WorkspaceInfo> {
    try {
      const type = await this.detectWorkspaceType()

      if (!type) {
        throw new DependencyError(
          '当前项目不是 monorepo 工作区',
          DepsErrorCode.WORKSPACE_NOT_FOUND
        )
      }

      const packages = await this.scanPackages(type)
      const crossDependencies = this.analyzeCrossDependencies(packages)
      const phantomDependencies = await this.detectPhantomDependencies(packages)

      return {
        root: this.projectDir,
        packages,
        type,
        crossDependencies,
        phantomDependencies
      }
    } catch (error) {
      logger.error('工作区分析失败', error)
      throw new DependencyError(
        `工作区分析失败: ${error instanceof Error ? error.message : String(error)}`,
        DepsErrorCode.WORKSPACE_ANALYSIS_FAILED,
        error
      )
    }
  }

  /**
   * 检测工作区类型
   */
  async detectWorkspaceType(): Promise<'pnpm' | 'yarn' | 'npm' | 'lerna' | null> {
    // 检查 pnpm
    if (await fs.pathExists(path.join(this.projectDir, 'pnpm-workspace.yaml'))) {
      return 'pnpm'
    }

    // 检查 lerna
    if (await fs.pathExists(path.join(this.projectDir, 'lerna.json'))) {
      return 'lerna'
    }

    // 检查 package.json 中的 workspaces 字段
    try {
      const pkgPath = path.join(this.projectDir, 'package.json')
      if (await fs.pathExists(pkgPath)) {
        const pkg: PackageJson = await fs.readJSON(pkgPath)

        if (pkg.workspaces) {
          // 检查是否有 yarn.lock
          if (await fs.pathExists(path.join(this.projectDir, 'yarn.lock'))) {
            return 'yarn'
          }
          // 否则假定为 npm
          return 'npm'
        }
      }
    } catch (error) {
      logger.warn('读取 package.json 失败', error)
    }

    return null
  }

  /**
   * 扫描所有包
   */
  async scanPackages(type: 'pnpm' | 'yarn' | 'npm' | 'lerna'): Promise<WorkspacePackage[]> {
    const patterns = await this.getWorkspacePatterns(type)
    const packagePaths = await fg(
      patterns.map(p => path.join(p, 'package.json')),
      {
        cwd: this.projectDir,
        absolute: true,
        ignore: ['**/node_modules/**']
      }
    )

    // 性能优化：一次性读取所有 package.json 文件，避免重复读取
    const packageContentsMap = new Map<string, PackageJson>()

    // 并行读取所有 package.json 文件
    await Promise.all(
      packagePaths.map(async (pkgPath) => {
        try {
          const content = await fs.readJSON(pkgPath)
          packageContentsMap.set(pkgPath, content)
        } catch (error) {
          logger.warn(`读取 ${pkgPath} 失败`, error)
          throw new ParseError(
            `解析 package.json 失败: ${error instanceof Error ? error.message : String(error)}`,
            pkgPath,
            undefined,
            DepsErrorCode.PARSE_PACKAGE_JSON_FAILED
          )
        }
      })
    )

    // 收集所有包名用于判断是本地还是外部依赖
    const allPackageNames = new Set(
      Array.from(packageContentsMap.values())
        .map(pkg => pkg.name)
        .filter((name): name is string => name !== undefined)
    )

    const packages: WorkspacePackage[] = []

    // 处理每个包
    for (const [pkgPath, pkg] of packageContentsMap.entries()) {
      const pkgDir = path.dirname(pkgPath)
      const localDeps: string[] = []
      const externalDeps: string[] = []

      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      }

      // 分类依赖：本地依赖 vs 外部依赖
      for (const depName of Object.keys(allDeps || {})) {
        if (allPackageNames.has(depName) || allDeps[depName]?.startsWith('workspace:')) {
          localDeps.push(depName)
        } else {
          externalDeps.push(depName)
        }
      }

      packages.push({
        name: pkg.name || path.basename(pkgDir),
        version: pkg.version || '0.0.0',
        path: pkgDir,
        dependencies: pkg.dependencies || {},
        devDependencies: pkg.devDependencies || {},
        localDependencies: localDeps,
        externalDependencies: externalDeps
      })
    }

    return packages
  }

  /**
   * 获取工作区匹配模式
   */
  private async getWorkspacePatterns(
    type: 'pnpm' | 'yarn' | 'npm' | 'lerna'
  ): Promise<string[]> {
    switch (type) {
      case 'pnpm': {
        const workspaceFile = path.join(this.projectDir, 'pnpm-workspace.yaml')
        const content = await fs.readFile(workspaceFile, 'utf-8')
        // 简单解析 YAML（实际应使用 yaml 库）
        const match = content.match(/packages:\s*\n((?:\s*-\s*.+\n?)+)/)
        if (match) {
          return match[1]
            .split('\n')
            .map(line => line.trim().replace(/^-\s*['"]?(.+?)['"]?$/, '$1'))
            .filter(Boolean)
        }
        return []
      }

      case 'lerna': {
        const lernaFile = path.join(this.projectDir, 'lerna.json')
        const lerna = await fs.readJSON(lernaFile)
        return lerna.packages || ['packages/*']
      }

      case 'yarn':
      case 'npm': {
        const pkgPath = path.join(this.projectDir, 'package.json')
        const pkg: PackageJson = await fs.readJSON(pkgPath)

        if (Array.isArray(pkg.workspaces)) {
          return pkg.workspaces
        } else if (pkg.workspaces?.packages) {
          return pkg.workspaces.packages
        }

        return []
      }

      default:
        return []
    }
  }

  /**
   * 分析跨包依赖
   */
  private analyzeCrossDependencies(packages: WorkspacePackage[]): CrossDependency[] {
    const crossDeps: CrossDependency[] = []
    const packageMap = new Map(packages.map(p => [p.name, p]))

    for (const pkg of packages) {
      for (const localDep of pkg.localDependencies) {
        const targetPkg = packageMap.get(localDep)

        if (targetPkg) {
          const depVersion = pkg.dependencies[localDep] || pkg.devDependencies[localDep]
          const compatible = this.isVersionCompatible(depVersion, targetPkg.version)

          crossDeps.push({
            from: pkg.name,
            to: localDep,
            version: depVersion,
            type: pkg.dependencies[localDep] ? 'dependencies' : 'devDependencies',
            compatible
          })
        }
      }
    }

    return crossDeps
  }

  /**
   * 检测幽灵依赖
   */
  private async detectPhantomDependencies(
    packages: WorkspacePackage[]
  ): Promise<PhantomDependency[]> {
    const phantoms: PhantomDependency[] = []

    // 这里简化实现，实际需要分析源代码的 import/require
    // 检查每个包使用的依赖是否在其 package.json 中声明

    for (const pkg of packages) {
      const declaredDeps = new Set([
        ...Object.keys(pkg.dependencies),
        ...Object.keys(pkg.devDependencies)
      ])

      // 获取根目录的依赖
      const rootPkgPath = path.join(this.projectDir, 'package.json')
      let rootDeps: string[] = []

      try {
        const rootPkg: PackageJson = await fs.readJSON(rootPkgPath)
        rootDeps = [
          ...Object.keys(rootPkg.dependencies || {}),
          ...Object.keys(rootPkg.devDependencies || {})
        ]
      } catch (error) {
        // 忽略错误
      }

      // 检查是否有从根依赖提升的包（简化检测）
      for (const rootDep of rootDeps) {
        if (!declaredDeps.has(rootDep)) {
          // 这是一个潜在的幽灵依赖
          phantoms.push({
            packageName: rootDep,
            usedBy: pkg.name,
            version: 'unknown',
            source: 'root',
            risk: 'medium'
          })
        }
      }
    }

    return phantoms
  }

  /**
   * 分析版本冲突
   */
  async analyzeVersionConflicts(): Promise<WorkspaceAnalysis> {
    const workspace = await this.analyzeWorkspace()
    const versionMap = new Map<string, Map<string, string[]>>()

    // 收集所有外部依赖的版本
    for (const pkg of workspace.packages) {
      for (const dep of pkg.externalDependencies) {
        const version = pkg.dependencies[dep] || pkg.devDependencies[dep]

        if (!versionMap.has(dep)) {
          versionMap.set(dep, new Map())
        }

        const depVersions = versionMap.get(dep)!
        if (!depVersions.has(version)) {
          depVersions.set(version, [])
        }

        depVersions.get(version)!.push(pkg.name)
      }
    }

    // 识别冲突
    const conflicts: VersionConflict[] = []
    const sharedDeps: SharedDependency[] = []

    for (const [dep, versions] of versionMap.entries()) {
      if (versions.size > 1) {
        conflicts.push({
          dependency: dep,
          versions,
          recommendation: `建议统一版本为 ${Array.from(versions.keys())[0]}`
        })
      }

      if (versions.size >= 1) {
        const allUsers: string[] = []
        versions.forEach(users => allUsers.push(...users))

        sharedDeps.push({
          name: dep,
          versions: new Set(versions.keys()),
          usedBy: allUsers,
          canBeHoisted: versions.size === 1
        })
      }
    }

    // 找出孤立的包（没有依赖其他本地包的包）
    const isolatedPackages = workspace.packages
      .filter(pkg => pkg.localDependencies.length === 0)
      .map(pkg => pkg.name)

    return {
      versionConflicts: conflicts,
      sharedDependencies: sharedDeps,
      isolatedPackages
    }
  }

  /**
   * 同步依赖版本
   */
  async syncDependencyVersions(
    dependencyName: string,
    targetVersion: string
  ): Promise<void> {
    const workspace = await this.analyzeWorkspace()

    for (const pkg of workspace.packages) {
      let updated = false
      const pkgPath = path.join(pkg.path, 'package.json')
      const pkgJson: PackageJson = await fs.readJSON(pkgPath)

      if (pkgJson.dependencies?.[dependencyName]) {
        pkgJson.dependencies[dependencyName] = targetVersion
        updated = true
      }

      if (pkgJson.devDependencies?.[dependencyName]) {
        pkgJson.devDependencies[dependencyName] = targetVersion
        updated = true
      }

      if (updated) {
        await fs.writeJSON(pkgPath, pkgJson, { spaces: 2 })
        console.log(`已更新 ${pkg.name} 中的 ${dependencyName} 到 ${targetVersion}`)
      }
    }
  }

  /**
   * 批量更新所有包
   */
  async updateAllPackages(command: string[]): Promise<void> {
    const workspace = await this.analyzeWorkspace()

    for (const pkg of workspace.packages) {
      console.log(`正在更新 ${pkg.name}...`)

      try {
        const { execa } = await import('execa')
        await execa(command[0], command.slice(1), {
          cwd: pkg.path,
          stdio: 'inherit'
        })
      } catch (error) {
        console.error(`更新 ${pkg.name} 失败:`, error)
      }
    }
  }

  /**
   * 判断版本兼容性
   */
  private isVersionCompatible(declaredVersion: string, actualVersion: string): boolean {
    // 简化实现，实际应使用 semver.satisfies
    if (declaredVersion.startsWith('workspace:')) {
      return true
    }

    if (declaredVersion === actualVersion) {
      return true
    }

    if (declaredVersion === '*' || declaredVersion === 'latest') {
      return true
    }

    // 这里应该使用 semver 库进行更精确的判断
    return false
  }
}

