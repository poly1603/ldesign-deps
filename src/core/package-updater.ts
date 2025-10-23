import { execa } from 'execa'
import fs from 'fs-extra'
import path from 'path'
import type { UpdateResult } from '../types'

/**
 * 包更新器 - 更新项目依赖
 */
export class PackageUpdater {
  constructor(private projectDir: string = process.cwd()) {}
  
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
    
    try {
      const { stdout } = await execa(pm, ['add', `${packageName}${versionSpec}`], {
        cwd: this.projectDir
      })
      
      return {
        success: true,
        packageName,
        message: `成功更新 ${packageName}`,
        output: stdout
      }
    } catch (error) {
      return {
        success: false,
        packageName,
        message: `更新 ${packageName} 失败`,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
  
  /**
   * 批量更新包
   */
  async updatePackages(packages: Array<{ name: string; version?: string }>): Promise<UpdateResult[]> {
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
    
    try {
      const { stdout } = await execa(pm, ['install'], {
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
}

