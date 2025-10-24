import fs from 'fs-extra'
import path from 'path'
import type { DepsConfig } from '../types'
import { ParseError } from '../types'

/**
 * 配置加载器 - 加载和合并配置文件
 */
export class ConfigLoader {
  private configCache: DepsConfig | null = null

  constructor(private projectDir: string = process.cwd()) { }

  /**
   * 加载配置
   */
  async loadConfig(): Promise<DepsConfig> {
    if (this.configCache) {
      return this.configCache
    }

    const configs: Partial<DepsConfig>[] = []

    // 1. 尝试加载 .depsrc.json
    const jsonConfig = await this.loadJSONConfig()
    if (jsonConfig) {
      configs.push(jsonConfig)
    }

    // 2. 尝试加载 .depsrc.js
    const jsConfig = await this.loadJSConfig()
    if (jsConfig) {
      configs.push(jsConfig)
    }

    // 3. 尝试从 package.json 加载
    const pkgConfig = await this.loadPackageJsonConfig()
    if (pkgConfig) {
      configs.push(pkgConfig)
    }

    // 4. 合并配置（后面的覆盖前面的）
    const mergedConfig = this.mergeConfigs(configs)

    // 5. 验证配置
    const validatedConfig = this.validateConfig(mergedConfig)

    this.configCache = validatedConfig
    return validatedConfig
  }

  /**
   * 加载 JSON 配置文件
   */
  private async loadJSONConfig(): Promise<Partial<DepsConfig> | null> {
    const configPath = path.join(this.projectDir, '.depsrc.json')

    if (!(await fs.pathExists(configPath))) {
      return null
    }

    try {
      return await fs.readJSON(configPath)
    } catch (error) {
      throw new ParseError(
        `解析 .depsrc.json 失败: ${error instanceof Error ? error.message : String(error)}`,
        configPath
      )
    }
  }

  /**
   * 加载 JS 配置文件
   */
  private async loadJSConfig(): Promise<Partial<DepsConfig> | null> {
    const configPath = path.join(this.projectDir, '.depsrc.js')

    if (!(await fs.pathExists(configPath))) {
      return null
    }

    try {
      // 动态导入 JS 配置
      const module = await import(configPath)
      return module.default || module
    } catch (error) {
      throw new ParseError(
        `加载 .depsrc.js 失败: ${error instanceof Error ? error.message : String(error)}`,
        configPath
      )
    }
  }

  /**
   * 从 package.json 加载配置
   */
  private async loadPackageJsonConfig(): Promise<Partial<DepsConfig> | null> {
    const pkgPath = path.join(this.projectDir, 'package.json')

    if (!(await fs.pathExists(pkgPath))) {
      return null
    }

    try {
      const pkg = await fs.readJSON(pkgPath)
      return pkg.ldesignDeps || pkg.deps || null
    } catch (error) {
      return null
    }
  }

  /**
   * 合并多个配置
   */
  private mergeConfigs(configs: Partial<DepsConfig>[]): DepsConfig {
    const defaultConfig: DepsConfig = {
      cache: {
        enabled: true,
        ttl: 3600000, // 1 hour
        maxSize: 1000,
        strategy: 'lru'
      },
      analyze: {
        checkUnused: true,
        checkMissing: true,
        checkDuplicates: true,
        ignorePatterns: []
      },
      update: {
        interactive: false,
        dryRun: false,
        saveExact: false,
        updateLockfile: true,
        ignorePeerWarnings: false,
        concurrency: 5
      },
      security: {
        auditLevel: 'moderate',
        checkLicenses: true,
        allowedLicenses: [],
        blockedLicenses: [],
        ignoreVulnerabilities: []
      },
      workspace: {
        enabled: false,
        syncVersions: false,
        checkPhantom: true
      },
      ignore: []
    }

    // 深度合并配置
    let result = { ...defaultConfig }

    for (const config of configs) {
      result = this.deepMerge(result, config)
    }

    return result
  }

  /**
   * 深度合并对象
   */
  private deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target }

    for (const key in source) {
      const sourceValue = source[key]
      const targetValue = result[key]

      if (sourceValue === undefined) {
        continue
      }

      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        result[key] = this.deepMerge(targetValue, sourceValue) as any
      } else {
        result[key] = sourceValue as any
      }
    }

    return result
  }

  /**
   * 验证配置
   */
  private validateConfig(config: DepsConfig): DepsConfig {
    // 验证缓存配置
    if (config.cache) {
      if (config.cache.ttl < 0) {
        config.cache.ttl = 3600000
      }
      if (config.cache.maxSize < 1) {
        config.cache.maxSize = 1000
      }
      if (!['lru', 'lfu', 'fifo'].includes(config.cache.strategy)) {
        config.cache.strategy = 'lru'
      }
    }

    // 验证安全配置
    if (config.security) {
      const validLevels = ['low', 'moderate', 'high', 'critical']
      if (!validLevels.includes(config.security.auditLevel)) {
        config.security.auditLevel = 'moderate'
      }
    }

    // 验证更新配置
    if (config.update) {
      if (config.update.concurrency < 1) {
        config.update.concurrency = 5
      }
    }

    return config
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.configCache = null
  }

  /**
   * 获取默认配置
   */
  static getDefaultConfig(): DepsConfig {
    return {
      cache: {
        enabled: true,
        ttl: 3600000,
        maxSize: 1000,
        strategy: 'lru'
      },
      analyze: {
        checkUnused: true,
        checkMissing: true,
        checkDuplicates: true,
        ignorePatterns: []
      },
      update: {
        interactive: false,
        dryRun: false,
        saveExact: false,
        updateLockfile: true,
        ignorePeerWarnings: false,
        concurrency: 5
      },
      security: {
        auditLevel: 'moderate',
        checkLicenses: true,
        allowedLicenses: [],
        blockedLicenses: [],
        ignoreVulnerabilities: []
      },
      workspace: {
        enabled: false,
        syncVersions: false,
        checkPhantom: true
      },
      ignore: []
    }
  }
}

