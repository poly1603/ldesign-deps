import depcheck from 'depcheck'
import type { DependencyAnalysis } from '../types'

/**
 * 依赖分析器 - 分析项目依赖使用情况
 */
export class DependencyAnalyzer {
  constructor(private projectDir: string = process.cwd()) { }

  /**
   * 分析依赖
   */
  async analyze(): Promise<DependencyAnalysis> {
    const options = {
      ignoreBinPackage: false,
      skipMissing: false,
      ignorePatterns: [
        'dist',
        'build',
        'coverage',
        'node_modules',
        '.git'
      ]
    }

    const results = await depcheck(this.projectDir, options)

    return {
      unused: Object.keys(results.dependencies),
      missing: Object.keys(results.missing),
      invalidFiles: results.invalidFiles,
      invalidDirs: results.invalidDirs,
      usingDependencies: results.using
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
}


