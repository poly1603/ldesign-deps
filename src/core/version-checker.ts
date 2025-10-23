import pacote from 'pacote'
import semver from 'semver'
import type { VersionInfo, UpdateAvailable } from '../types'

/**
 * 版本检查器 - 检查依赖版本更新
 */
export class VersionChecker {
  /**
   * 获取包的最新版本信息
   */
  async getLatestVersion(packageName: string): Promise<VersionInfo> {
    try {
      const manifest = await pacote.manifest(packageName)
      return {
        current: manifest.version,
        latest: manifest.version,
        hasUpdate: false
      }
    } catch (error) {
      throw new Error(`获取 ${packageName} 版本信息失败: ${error}`)
    }
  }

  /**
   * 检查是否有更新
   */
  async checkUpdate(packageName: string, currentVersion: string): Promise<UpdateAvailable> {
    try {
      const manifest = await pacote.manifest(`${packageName}@latest`)
      const latestVersion = manifest.version

      // 清理版本号（移除 ^, ~, >= 等前缀）
      const cleanCurrent = semver.clean(currentVersion)

      if (!cleanCurrent) {
        return {
          packageName,
          currentVersion,
          latestVersion,
          hasUpdate: false,
          updateType: 'none'
        }
      }

      const hasUpdate = semver.gt(latestVersion, cleanCurrent)
      let updateType: 'major' | 'minor' | 'patch' | 'none' = 'none'

      if (hasUpdate) {
        const diff = semver.diff(cleanCurrent, latestVersion)
        if (diff === 'major') updateType = 'major'
        else if (diff === 'minor' || diff === 'preminor') updateType = 'minor'
        else updateType = 'patch'
      }

      return {
        packageName,
        currentVersion,
        latestVersion,
        hasUpdate,
        updateType
      }
    } catch (error) {
      return {
        packageName,
        currentVersion,
        latestVersion: currentVersion,
        hasUpdate: false,
        updateType: 'none',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 批量检查更新
   */
  async checkUpdates(dependencies: Record<string, string>): Promise<UpdateAvailable[]> {
    const results: UpdateAvailable[] = []

    for (const [name, version] of Object.entries(dependencies)) {
      const result = await this.checkUpdate(name, version)
      results.push(result)
    }

    return results
  }
}


