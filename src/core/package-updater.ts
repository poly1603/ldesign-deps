import { execa } from 'execa'
import fs from 'fs-extra'
import path from 'path'
import type { UpdateResult, UpdateConfig, PackageJson } from '../types'
import { DependencyError } from '../types'

/**
 * 包更新器 - 更新项目依赖
 */
export class PackageUpdater {
  private config: UpdateConfig
  private backupPath: string

  constructor(
    private projectDir: string = process.cwd(),
    config?: Partial<UpdateConfig>
  ) {
    this.config = {
      interactive: false,
      dryRun: false,
      saveExact: false,
      updateLockfile: true,
      ignorePeerWarnings: false,
      concurrency: 5,
      ...config
    }
    this.backupPath = path.join(this.projectDir, '.package.json.backup')
  }

  /**
   * 检测包管理器
   */
  async detectPackageManager(): Promise<'npm' | 'pnpm' | 'yarn'> {
    const lockFiles = {
      'pnpm-lock.yaml': 'pnpm',
      'yarn.lock': 'yarn',
      'package-lock.json': 'npm'
    } as const

    for (const [file, manager] of Object.entries(lockFiles)) {
      if (await fs.pathExists(path.join(this.projectDir, file))) {
        return manager as 'npm' | 'pnpm' | 'yarn'
      }
    }

    return 'npm'
  }

  /**
   * 更新单个包
   */
  async updatePackage(packageName: string, version?: string): Promise<UpdateResult> {
    const pm = await this.detectPackageManager()
    const versionSpec = version ? `@${version}` : '@latest'

    // 干运行模式
    if (this.config.dryRun) {
      return {
        success: true,
        packageName,
        message: `[DRY RUN] 将更新 ${packageName} 到 ${version || 'latest'}`,
        dryRun: true
      }
    }

    // 创建备份
    await this.createBackup()

    try {
      const args = this.buildUpdateArgs(pm, packageName, versionSpec)

      const { stdout, stderr } = await execa(pm, args, {
        cwd: this.projectDir,
        reject: false
      })

      // 检查是否成功
      if (stderr && stderr.includes('ERR')) {
        throw new Error(stderr)
      }

      return {
        success: true,
        packageName,
        message: `成功更新 ${packageName}`,
        output: stdout
      }
    } catch (error) {
      // 更新失败，恢复备份
      await this.restoreBackup()

      return {
        success: false,
        packageName,
        message: `更新 ${packageName} 失败`,
        error: error instanceof Error ? error.message : String(error)
      }
    } finally {
      // 清理备份
      await this.cleanBackup()
    }
  }

  /**
   * 构建更新命令参数
   */
  private buildUpdateArgs(
    pm: 'npm' | 'pnpm' | 'yarn',
    packageName: string,
    versionSpec: string
  ): string[] {
    const args: string[] = []

    switch (pm) {
      case 'npm':
        args.push('install', `${packageName}${versionSpec}`)
        if (this.config.saveExact) {
          args.push('--save-exact')
        }
        if (!this.config.updateLockfile) {
          args.push('--package-lock-only')
        }
        if (this.config.ignorePeerWarnings) {
          args.push('--legacy-peer-deps')
        }
        break

      case 'pnpm':
        args.push('add', `${packageName}${versionSpec}`)
        if (this.config.saveExact) {
          args.push('--save-exact')
        }
        break

      case 'yarn':
        args.push('add', `${packageName}${versionSpec}`)
        if (this.config.saveExact) {
          args.push('--exact')
        }
        break
    }

    return args
  }

  /**
   * 批量更新包
   */
  async updatePackages(packages: Array<{ name: string; version?: string }>): Promise<UpdateResult[]> {
    if (this.config.dryRun) {
      return packages.map(pkg => ({
        success: true,
        packageName: pkg.name,
        message: `[DRY RUN] 将更新 ${pkg.name} 到 ${pkg.version || 'latest'}`,
        dryRun: true
      }))
    }

    const results: UpdateResult[] = []

    for (const pkg of packages) {
      const result = await this.updatePackage(pkg.name, pkg.version)
      results.push(result)
    }

    return results
  }

  /**
   * 安装依赖
   */
  async install(): Promise<UpdateResult> {
    const pm = await this.detectPackageManager()

    if (this.config.dryRun) {
      return {
        success: true,
        message: '[DRY RUN] 将安装依赖',
        dryRun: true
      }
    }

    try {
      const args: string[] = ['install']

      if (pm === 'npm' && this.config.ignorePeerWarnings) {
        args.push('--legacy-peer-deps')
      }

      const { stdout } = await execa(pm, args, {
        cwd: this.projectDir
      })

      return {
        success: true,
        message: '依赖安装成功',
        output: stdout
      }
    } catch (error) {
      return {
        success: false,
        message: '依赖安装失败',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 删除并重新安装所有依赖
   */
  async reinstall(): Promise<UpdateResult> {
    const pm = await this.detectPackageManager()

    if (this.config.dryRun) {
      return {
        success: true,
        message: '[DRY RUN] 将重新安装所有依赖',
        dryRun: true
      }
    }

    try {
      // 删除 node_modules
      const nodeModulesPath = path.join(this.projectDir, 'node_modules')
      if (await fs.pathExists(nodeModulesPath)) {
        await fs.remove(nodeModulesPath)
      }

      // 删除锁文件（可选）
      if (!this.config.updateLockfile) {
        const lockFiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']
        for (const lockFile of lockFiles) {
          const lockPath = path.join(this.projectDir, lockFile)
          if (await fs.pathExists(lockPath)) {
            await fs.remove(lockPath)
          }
        }
      }

      // 重新安装
      return await this.install()
    } catch (error) {
      throw new DependencyError(
        '重新安装依赖失败',
        'REINSTALL_FAILED',
        error
      )
    }
  }

  /**
   * 创建 package.json 备份
   */
  private async createBackup(): Promise<void> {
    try {
      const packageJsonPath = path.join(this.projectDir, 'package.json')
      await fs.copy(packageJsonPath, this.backupPath)
    } catch (error) {
      console.warn('创建备份失败:', error)
    }
  }

  /**
   * 恢复 package.json 备份
   */
  private async restoreBackup(): Promise<void> {
    try {
      if (await fs.pathExists(this.backupPath)) {
        const packageJsonPath = path.join(this.projectDir, 'package.json')
        await fs.copy(this.backupPath, packageJsonPath, { overwrite: true })
      }
    } catch (error) {
      console.warn('恢复备份失败:', error)
    }
  }

  /**
   * 清理备份
   */
  private async cleanBackup(): Promise<void> {
    try {
      if (await fs.pathExists(this.backupPath)) {
        await fs.remove(this.backupPath)
      }
    } catch (error) {
      console.warn('清理备份失败:', error)
    }
  }

  /**
   * 回滚到备份
   */
  async rollback(): Promise<UpdateResult> {
    try {
      await this.restoreBackup()
      await this.cleanBackup()

      return {
        success: true,
        message: '已回滚到之前的版本'
      }
    } catch (error) {
      return {
        success: false,
        message: '回滚失败',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 执行 dedupe（去重）
   */
  async dedupe(): Promise<UpdateResult> {
    const pm = await this.detectPackageManager()

    if (this.config.dryRun) {
      return {
        success: true,
        message: '[DRY RUN] 将执行依赖去重',
        dryRun: true
      }
    }

    try {
      let args: string[] = []

      switch (pm) {
        case 'npm':
          args = ['dedupe']
          break
        case 'pnpm':
          args = ['dedupe']
          break
        case 'yarn':
          // Yarn 不直接支持 dedupe，使用 install 强制重建
          args = ['install', '--force']
          break
      }

      const { stdout } = await execa(pm, args, {
        cwd: this.projectDir
      })

      return {
        success: true,
        message: '依赖去重成功',
        output: stdout
      }
    } catch (error) {
      return {
        success: false,
        message: '依赖去重失败',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

