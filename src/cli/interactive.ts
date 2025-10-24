import inquirer from 'inquirer'
import chalk from 'chalk'
import boxen from 'boxen'
import type { UpdateAvailable, DepsConfig } from '../types'
import { DependencyManager, VersionChecker, PackageUpdater } from '../core'

/**
 * 交互式 CLI 辅助工具
 */
export class InteractiveCLI {
  private manager: DependencyManager
  private checker: VersionChecker
  private updater: PackageUpdater

  constructor(private projectDir: string = process.cwd()) {
    this.manager = new DependencyManager(projectDir)
    this.checker = new VersionChecker()
    this.updater = new PackageUpdater(projectDir)
  }

  /**
   * 交互式更新依赖
   */
  async interactiveUpdate(): Promise<void> {
    console.log(chalk.cyan('🔍 正在检查依赖更新...'))

    const deps = await this.manager.getAllDependencies()
    const depsToCheck = Object.fromEntries(
      Object.values(deps).map(d => [d.name, d.version])
    )

    const updates = await this.checker.checkUpdates(depsToCheck)
    const availableUpdates = updates.filter(u => u.hasUpdate)

    if (availableUpdates.length === 0) {
      console.log(chalk.green('✨ 所有依赖都是最新版本！'))
      return
    }

    // 按类型分组
    const grouped = this.checker.groupUpdatesBySeverity(availableUpdates)

    // 显示更新摘要
    this.displayUpdateSummary(grouped)

    // 选择要更新的依赖
    const selected = await this.selectUpdates(availableUpdates)

    if (selected.length === 0) {
      console.log(chalk.yellow('未选择任何依赖进行更新'))
      return
    }

    // 确认更新
    const confirmed = await this.confirmUpdate(selected)

    if (!confirmed) {
      console.log(chalk.yellow('已取消更新'))
      return
    }

    // 执行更新
    await this.executeUpdates(selected)
  }

  /**
   * 显示更新摘要
   */
  private displayUpdateSummary(grouped: {
    major: UpdateAvailable[]
    minor: UpdateAvailable[]
    patch: UpdateAvailable[]
  }): void {
    const summary: string[] = []

    summary.push(chalk.bold('可用更新:'))
    summary.push('')

    if (grouped.major.length > 0) {
      summary.push(chalk.red(`  主版本更新 (${grouped.major.length}): 可能包含破坏性变更`))
    }

    if (grouped.minor.length > 0) {
      summary.push(chalk.yellow(`  次版本更新 (${grouped.minor.length}): 新功能`))
    }

    if (grouped.patch.length > 0) {
      summary.push(chalk.green(`  补丁更新 (${grouped.patch.length}): 问题修复`))
    }

    console.log('\n' + boxen(summary.join('\n'), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    }))
  }

  /**
   * 选择要更新的依赖
   */
  private async selectUpdates(
    updates: UpdateAvailable[]
  ): Promise<UpdateAvailable[]> {
    const choices = updates.map(update => {
      const colorFn =
        update.updateType === 'major' ? chalk.red :
          update.updateType === 'minor' ? chalk.yellow :
            chalk.green

      const label = `${update.packageName}: ${update.currentVersion} → ${update.latestVersion}`
      const badge = update.breakingChanges ? chalk.red('[BREAKING]') : ''

      return {
        name: `${colorFn(label)} ${badge}`,
        value: update,
        checked: update.updateType === 'patch' // 默认选中补丁更新
      }
    })

    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: '选择要更新的依赖:',
        choices,
        pageSize: 15
      }
    ])

    return selected
  }

  /**
   * 确认更新
   */
  private async confirmUpdate(selected: UpdateAvailable[]): Promise<boolean> {
    console.log('\n' + chalk.bold('将更新以下依赖:'))
    selected.forEach(update => {
      console.log(`  ${chalk.cyan(update.packageName)}: ${update.currentVersion} → ${update.latestVersion}`)
    })

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: '确认更新？',
        default: true
      }
    ])

    return confirmed
  }

  /**
   * 执行更新
   */
  private async executeUpdates(updates: UpdateAvailable[]): Promise<void> {
    console.log(chalk.cyan('\n开始更新...'))

    for (const update of updates) {
      console.log(`\n正在更新 ${chalk.cyan(update.packageName)}...`)

      const result = await this.updater.updatePackage(
        update.packageName,
        update.latestVersion
      )

      if (result.success) {
        console.log(chalk.green(`✓ ${result.message}`))
      } else {
        console.log(chalk.red(`✗ ${result.message}`))
        if (result.error) {
          console.log(chalk.gray(`  错误: ${result.error}`))
        }
      }
    }

    console.log(chalk.green('\n✨ 更新完成！'))
  }

  /**
   * 交互式生成配置文件
   */
  async generateConfig(): Promise<void> {
    console.log(chalk.cyan('📝 配置 @ldesign/deps'))

    const config = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'cacheEnabled',
        message: '启用缓存？',
        default: true
      },
      {
        type: 'number',
        name: 'cacheTtl',
        message: '缓存有效期（秒）:',
        default: 3600,
        when: (answers) => answers.cacheEnabled
      },
      {
        type: 'list',
        name: 'cacheStrategy',
        message: '缓存策略:',
        choices: ['lru', 'lfu', 'fifo'],
        default: 'lru',
        when: (answers) => answers.cacheEnabled
      },
      {
        type: 'confirm',
        name: 'checkUnused',
        message: '检查未使用的依赖？',
        default: true
      },
      {
        type: 'confirm',
        name: 'checkMissing',
        message: '检查缺失的依赖？',
        default: true
      },
      {
        type: 'confirm',
        name: 'checkDuplicates',
        message: '检查重复的依赖？',
        default: true
      },
      {
        type: 'list',
        name: 'auditLevel',
        message: '安全审计级别:',
        choices: ['low', 'moderate', 'high', 'critical'],
        default: 'moderate'
      },
      {
        type: 'confirm',
        name: 'checkLicenses',
        message: '检查许可证兼容性？',
        default: true
      }
    ])

    const depsConfig: DepsConfig = {
      cache: config.cacheEnabled ? {
        enabled: true,
        ttl: config.cacheTtl * 1000,
        maxSize: 1000,
        strategy: config.cacheStrategy
      } : undefined,
      analyze: {
        checkUnused: config.checkUnused,
        checkMissing: config.checkMissing,
        checkDuplicates: config.checkDuplicates,
        ignorePatterns: []
      },
      security: {
        auditLevel: config.auditLevel,
        checkLicenses: config.checkLicenses,
        allowedLicenses: [],
        blockedLicenses: [],
        ignoreVulnerabilities: []
      }
    }

    // 保存配置
    const fs = await import('fs-extra')
    const path = await import('path')
    const configPath = path.join(this.projectDir, '.depsrc.json')

    await fs.writeJSON(configPath, depsConfig, { spaces: 2 })

    console.log(chalk.green(`\n✓ 配置已保存到 ${configPath}`))
  }

  /**
   * 交互式删除未使用的依赖
   */
  async removeUnused(): Promise<void> {
    const { DependencyAnalyzer } = await import('../core')
    const analyzer = new DependencyAnalyzer(this.projectDir)

    console.log(chalk.cyan('🔍 正在分析未使用的依赖...'))

    const analysis = await analyzer.analyze()

    if (analysis.unused.length === 0) {
      console.log(chalk.green('✨ 没有未使用的依赖！'))
      return
    }

    console.log(chalk.yellow(`\n发现 ${analysis.unused.length} 个未使用的依赖:`))
    analysis.unused.forEach(dep => {
      console.log(`  - ${dep}`)
    })

    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: '选择要删除的依赖:',
        choices: analysis.unused.map(dep => ({
          name: dep,
          value: dep,
          checked: true
        }))
      }
    ])

    if (selected.length === 0) {
      console.log(chalk.yellow('未选择任何依赖进行删除'))
      return
    }

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: `确认删除 ${selected.length} 个依赖？`,
        default: false
      }
    ])

    if (!confirmed) {
      console.log(chalk.yellow('已取消删除'))
      return
    }

    console.log(chalk.cyan('\n开始删除...'))

    await this.manager.removeDependencies(selected)

    console.log(chalk.green(`\n✓ 已删除 ${selected.length} 个未使用的依赖`))
  }
}

