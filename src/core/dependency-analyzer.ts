import depcheck from 'depcheck'
import { execa } from 'execa'
import type { DependencyAnalysis, DuplicateDependency, AnalyzeConfig } from '../types'
import { DependencyError } from '../types'

/**
 * 依赖分析器 - 分析项目依赖使用情况
 */
export class DependencyAnalyzer {
  private config: AnalyzeConfig

  constructor(
    private projectDir: string = process.cwd(),
    config?: Partial<AnalyzeConfig>
  ) {
    this.config = {
      checkUnused: true,
      checkMissing: true,
      checkDuplicates: true,
      ignorePatterns: [
        'dist',
        'build',
        'coverage',
        'node_modules',
        '.git',
        '**/*.test.ts',
        '**/*.spec.ts',
        '__tests__',
        'tests'
      ],
      depth: Infinity,
      ...config
    }
  }

  /**
   * 分析依赖
   */
  async analyze(): Promise<DependencyAnalysis> {
    try {
      const options = {
        ignoreBinPackage: false,
        skipMissing: !this.config.checkMissing,
        ignorePatterns: this.config.ignorePatterns
      }

      const results = await depcheck(this.projectDir, options)

      const unused = this.config.checkUnused ? Object.keys(results.dependencies) : []
      const missing = this.config.checkMissing ? Object.keys(results.missing) : []
      const duplicates = this.config.checkDuplicates ? await this.findDuplicates() : []

      return {
        unused,
        missing,
        invalidFiles: results.invalidFiles,
        invalidDirs: results.invalidDirs,
        usingDependencies: results.using,
        duplicates
      }
    } catch (error) {
      throw new DependencyError(
        '依赖分析失败',
        'ANALYSIS_FAILED',
        error
      )
    }
  }

  /**
   * 快速分析（使用缓存）
   */
  async quickAnalyze(): Promise<Partial<DependencyAnalysis>> {
    try {
      // 快速检查，只分析表层依赖
      const options = {
        ignoreBinPackage: true,
        skipMissing: true,
        ignorePatterns: [...this.config.ignorePatterns, '**/*.d.ts']
      }

      const results = await depcheck(this.projectDir, options)

      return {
        unused: Object.keys(results.dependencies),
        missing: [],
        usingDependencies: results.using
      }
    } catch (error) {
      throw new DependencyError(
        '快速分析失败',
        'QUICK_ANALYSIS_FAILED',
        error
      )
    }
  }

  /**
   * 获取未使用的依赖
   */
  async getUnusedDependencies(): Promise<string[]> {
    const analysis = await this.analyze()
    return analysis.unused
  }

  /**
   * 获取缺失的依赖
   */
  async getMissingDependencies(): Promise<string[]> {
    const analysis = await this.analyze()
    return analysis.missing
  }

  /**
   * 查找重复的依赖
   */
  async findDuplicates(): Promise<DuplicateDependency[]> {
    try {
      // 使用 npm list 查找重复依赖
      const { stdout } = await execa('npm', ['list', '--json', '--all'], {
        cwd: this.projectDir,
        reject: false
      })

      const listResult = JSON.parse(stdout)
      const versionMap = new Map<string, Set<string>>()
      const locationMap = new Map<string, Map<string, string[]>>()

      // 递归提取所有依赖
      const extractDeps = (deps: any, path: string = '') => {
        if (!deps) return

        for (const [name, info] of Object.entries<any>(deps)) {
          const version = info.version || 'unknown'
          const location = path ? `${path} > ${name}` : name

          if (!versionMap.has(name)) {
            versionMap.set(name, new Set())
            locationMap.set(name, new Map())
          }

          versionMap.get(name)!.add(version)

          const versions = locationMap.get(name)!
          if (!versions.has(version)) {
            versions.set(version, [])
          }
          versions.get(version)!.push(location)

          if (info.dependencies) {
            extractDeps(info.dependencies, location)
          }
        }
      }

      extractDeps(listResult.dependencies)

      // 找出有多个版本的依赖
      const duplicates: DuplicateDependency[] = []

      for (const [name, versions] of versionMap.entries()) {
        if (versions.size > 1) {
          const locations: string[] = []
          const versionArray = Array.from(versions)

          const locMap = locationMap.get(name)!
          for (const version of versionArray) {
            locations.push(...(locMap.get(version) || []))
          }

          duplicates.push({
            name,
            versions: versionArray,
            locations
          })
        }
      }

      return duplicates
    } catch (error) {
      console.warn('查找重复依赖失败:', error)
      return []
    }
  }

  /**
   * 分析依赖使用详情
   */
  async analyzeUsageDetails(): Promise<Record<string, { files: string[]; count: number }>> {
    const analysis = await this.analyze()
    const details: Record<string, { files: string[]; count: number }> = {}

    for (const [dep, files] of Object.entries(analysis.usingDependencies)) {
      details[dep] = {
        files: Array.isArray(files) ? files : [],
        count: Array.isArray(files) ? files.length : 0
      }
    }

    return details
  }

  /**
   * 生成分析报告
   */
  generateReport(analysis: DependencyAnalysis): string {
    const lines: string[] = []

    lines.push('='.repeat(60))
    lines.push('依赖分析报告')
    lines.push('='.repeat(60))
    lines.push('')

    // 未使用的依赖
    if (analysis.unused.length > 0) {
      lines.push(`未使用的依赖 (${analysis.unused.length}):`)
      analysis.unused.forEach(dep => {
        lines.push(`  - ${dep}`)
      })
      lines.push('')
    } else {
      lines.push('✓ 没有未使用的依赖')
      lines.push('')
    }

    // 缺失的依赖
    if (analysis.missing.length > 0) {
      lines.push(`缺失的依赖 (${analysis.missing.length}):`)
      analysis.missing.forEach(dep => {
        lines.push(`  - ${dep}`)
      })
      lines.push('')
    } else {
      lines.push('✓ 没有缺失的依赖')
      lines.push('')
    }

    // 重复的依赖
    if (analysis.duplicates && analysis.duplicates.length > 0) {
      lines.push(`重复的依赖 (${analysis.duplicates.length}):`)
      analysis.duplicates.forEach(dup => {
        lines.push(`  ${dup.name}:`)
        dup.versions.forEach(version => {
          lines.push(`    - ${version}`)
        })
      })
      lines.push('')
    } else if (this.config.checkDuplicates) {
      lines.push('✓ 没有重复的依赖')
      lines.push('')
    }

    lines.push('='.repeat(60))

    return lines.join('\n')
  }
}


