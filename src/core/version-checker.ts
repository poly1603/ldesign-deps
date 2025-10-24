import pacote from 'pacote'
import semver from 'semver'
import pLimit from 'p-limit'
import type { VersionInfo, UpdateAvailable, ProgressCallback, ParallelConfig } from '../types'
import { NetworkError, DependencyError } from '../types'
import { CacheManager } from './cache-manager'

/**
 * 版本检查器 - 检查依赖版本更新
 */
export class VersionChecker {
  private cache: CacheManager
  private parallelConfig: ParallelConfig

  constructor(
    cache?: CacheManager,
    parallelConfig?: Partial<ParallelConfig>
  ) {
    this.cache = cache || new CacheManager()
    this.parallelConfig = {
      concurrency: 10,
      retries: 3,
      timeout: 30000,
      ...parallelConfig
    }
  }

  /**
   * 获取包的最新版本信息
   */
  async getLatestVersion(packageName: string): Promise<VersionInfo> {
    // 尝试从缓存获取
    const cacheKey = CacheManager.generateKey('version', packageName)
    const cached = this.cache.get<VersionInfo>(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const manifest = await this.fetchWithRetry(() =>
        pacote.manifest(packageName, { fullMetadata: true })
      )

      const versionInfo: VersionInfo = {
        current: manifest.version,
        latest: manifest.version,
        hasUpdate: false
      }

      // 缓存结果
      this.cache.set(cacheKey, versionInfo)

      return versionInfo
    } catch (error) {
      throw new NetworkError(
        `获取 ${packageName} 版本信息失败: ${error instanceof Error ? error.message : String(error)}`,
        `https://registry.npmjs.org/${packageName}`
      )
    }
  }

  /**
   * 获取包的所有版本（包括 beta/alpha）
   */
  async getAllVersions(packageName: string): Promise<VersionInfo> {
    const cacheKey = CacheManager.generateKey('all-versions', packageName)
    const cached = this.cache.get<VersionInfo>(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const manifest = await this.fetchWithRetry(() =>
        pacote.manifest(packageName, { fullMetadata: true })
      )

      const packument = await this.fetchWithRetry(() =>
        pacote.packument(packageName)
      )

      const versions = Object.keys(packument.versions || {})
      const latest = manifest.version

      // 查找最新的 beta 和 alpha 版本
      const betaVersions = versions.filter(v => v.includes('beta')).sort(semver.rcompare)
      const alphaVersions = versions.filter(v => v.includes('alpha')).sort(semver.rcompare)

      const versionInfo: VersionInfo = {
        current: latest,
        latest,
        hasUpdate: false,
        beta: betaVersions[0],
        alpha: alphaVersions[0]
      }

      this.cache.set(cacheKey, versionInfo)
      return versionInfo
    } catch (error) {
      throw new NetworkError(
        `获取 ${packageName} 所有版本失败`,
        `https://registry.npmjs.org/${packageName}`
      )
    }
  }

  /**
   * 检查是否有更新
   */
  async checkUpdate(packageName: string, currentVersion: string): Promise<UpdateAvailable> {
    const cacheKey = CacheManager.generateKey('update', packageName, currentVersion)
    const cached = this.cache.get<UpdateAvailable>(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const manifest = await this.fetchWithRetry(() =>
        pacote.manifest(`${packageName}@latest`)
      )
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
      let breakingChanges = false

      if (hasUpdate) {
        const diff = semver.diff(cleanCurrent, latestVersion)
        if (diff === 'major') {
          updateType = 'major'
          breakingChanges = true
        } else if (diff === 'minor' || diff === 'preminor') {
          updateType = 'minor'
        } else {
          updateType = 'patch'
        }
      }

      const result: UpdateAvailable = {
        packageName,
        currentVersion,
        latestVersion,
        hasUpdate,
        updateType,
        breakingChanges
      }

      this.cache.set(cacheKey, result)
      return result
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
   * 批量检查更新（并行）
   */
  async checkUpdates(
    dependencies: Record<string, string>,
    onProgress?: ProgressCallback
  ): Promise<UpdateAvailable[]> {
    const entries = Object.entries(dependencies)
    const total = entries.length
    const results: UpdateAvailable[] = []

    // 使用 p-limit 控制并发数
    const limit = pLimit(this.parallelConfig.concurrency)

    const tasks = entries.map(([name, version], index) =>
      limit(async () => {
        const result = await this.checkUpdate(name, version)
        results.push(result)

        // 报告进度
        if (onProgress) {
          onProgress({
            current: index + 1,
            total,
            percentage: ((index + 1) / total) * 100,
            message: `正在检查 ${name}...`
          })
        }

        return result
      })
    )

    await Promise.all(tasks)

    return results
  }

  /**
   * 检查过时的依赖
   */
  async checkOutdated(
    dependencies: Record<string, string>
  ): Promise<UpdateAvailable[]> {
    const updates = await this.checkUpdates(dependencies)
    return updates.filter(u => u.hasUpdate)
  }

  /**
   * 按严重程度分组更新
   */
  groupUpdatesBySeverity(updates: UpdateAvailable[]): {
    major: UpdateAvailable[]
    minor: UpdateAvailable[]
    patch: UpdateAvailable[]
  } {
    return {
      major: updates.filter(u => u.updateType === 'major'),
      minor: updates.filter(u => u.updateType === 'minor'),
      patch: updates.filter(u => u.updateType === 'patch')
    }
  }

  /**
   * 带重试的请求
   */
  private async fetchWithRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.parallelConfig.retries || 3
  ): Promise<T> {
    let lastError: Error | null = null

    for (let i = 0; i < retries; i++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('请求超时')), this.parallelConfig.timeout)
        )

        const result = await Promise.race([fn(), timeoutPromise])
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // 最后一次重试失败后不等待
        if (i < retries - 1) {
          // 指数退避
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
        }
      }
    }

    throw new DependencyError(
      '请求失败，已达到最大重试次数',
      'MAX_RETRIES_EXCEEDED',
      lastError
    )
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return this.cache.getStats()
  }
}


