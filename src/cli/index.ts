#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import Table from 'cli-table3'
import cliProgress from 'cli-progress'
import {
  DependencyManager,
  VersionChecker,
  DependencyAnalyzer,
  PackageUpdater,
  SecurityAuditor,
  DependencyVisualizer,
  WorkspaceManager
} from '../core'
import { InteractiveCLI } from './interactive'

const program = new Command()

program
  .name('ldesign-deps')
  .description('LDesign 依赖管理工具 - 功能强大的依赖管理解决方案')
  .version('0.1.0')

// ============ 基础命令 ============

program
  .command('list')
  .description('列出所有依赖')
  .option('-t, --type <type>', '筛选依赖类型 (dependencies|devDependencies)')
  .option('-s, --search <query>', '搜索依赖')
  .action(async (options) => {
    const spinner = ora('正在加载依赖列表...').start()

    try {
      const manager = new DependencyManager()
      let deps: any

      if (options.type) {
        deps = await manager.getDependenciesByType(options.type)
      } else {
        deps = await manager.getAllDependencies()
      }

      if (options.search) {
        const results = await manager.searchDependencies(options.search)
        deps = Object.fromEntries(results.map(d => [d.name, d]))
      }

      spinner.stop()

      const table = new Table({
        head: ['包名', '版本', '类型'],
        colWidths: [40, 20, 20]
      })

      Object.values(deps).forEach((dep: any) => {
        table.push([dep.name, dep.version, dep.type])
      })

      console.log(table.toString())
      console.log(chalk.green(`\n总计: ${Object.keys(deps).length} 个依赖`))
    } catch (error) {
      spinner.fail(chalk.red('加载失败'))
      console.error(error)
      process.exit(1)
    }
  })

program
  .command('check')
  .description('检查依赖更新')
  .option('--parallel', '并行检查（更快）')
  .option('--show-progress', '显示进度条')
  .action(async (options) => {
    const spinner = ora('正在检查更新...').start()

    try {
      const manager = new DependencyManager()
      const checker = new VersionChecker()

      const deps = await manager.getAllDependencies()
      const depsToCheck = Object.fromEntries(
        Object.values(deps).map((d: any) => [d.name, d.version])
      )

      let updates

      if (options.showProgress) {
        spinner.stop()
        const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
        progressBar.start(Object.keys(depsToCheck).length, 0)

        updates = await checker.checkUpdates(depsToCheck, (progress) => {
          progressBar.update(progress.current)
        })

        progressBar.stop()
      } else {
        updates = await checker.checkUpdates(depsToCheck)
        spinner.stop()
      }

      const hasUpdates = updates.filter(u => u.hasUpdate)

      if (hasUpdates.length === 0) {
        console.log(chalk.green('✓ 所有依赖都是最新版本！'))
        return
      }

      const table = new Table({
        head: ['包名', '当前版本', '最新版本', '更新类型'],
        colWidths: [40, 20, 20, 15]
      })

      hasUpdates.forEach(update => {
        const typeColor =
          update.updateType === 'major' ? chalk.red :
            update.updateType === 'minor' ? chalk.yellow :
              chalk.green

        table.push([
          update.packageName,
          update.currentVersion,
          update.latestVersion,
          typeColor(update.updateType)
        ])
      })

      console.log(table.toString())
      console.log(chalk.yellow(`\n发现 ${hasUpdates.length} 个可更新的依赖`))
    } catch (error) {
      spinner.fail(chalk.red('检查失败'))
      console.error(error)
      process.exit(1)
    }
  })

program
  .command('analyze')
  .description('分析依赖使用情况')
  .option('--no-unused', '不检查未使用的依赖')
  .option('--no-missing', '不检查缺失的依赖')
  .option('--no-duplicates', '不检查重复的依赖')
  .action(async (options) => {
    const spinner = ora('正在分析依赖...').start()

    try {
      const analyzer = new DependencyAnalyzer(process.cwd(), {
        checkUnused: options.unused !== false,
        checkMissing: options.missing !== false,
        checkDuplicates: options.duplicates !== false
      })
      const analysis = await analyzer.analyze()

      spinner.stop()

      const report = analyzer.generateReport(analysis)
      console.log(report)
    } catch (error) {
      spinner.fail(chalk.red('分析失败'))
      console.error(error)
      process.exit(1)
    }
  })

program
  .command('update <package>')
  .description('更新指定的包')
  .option('-v, --version <version>', '指定版本')
  .option('--dry-run', '干运行模式')
  .action(async (packageName, options) => {
    const updater = new PackageUpdater(process.cwd(), {
      dryRun: options.dryRun
    })

    const spinner = ora(`正在更新 ${packageName}...`).start()

    try {
      const result = await updater.updatePackage(packageName, options.version)

      if (result.success) {
        spinner.succeed(chalk.green(result.message))
      } else {
        spinner.fail(chalk.red(result.message))
        if (result.error) {
          console.error(chalk.red(result.error))
        }
        process.exit(1)
      }
    } catch (error) {
      spinner.fail(chalk.red('更新失败'))
      console.error(error)
      process.exit(1)
    }
  })

program
  .command('install')
  .description('安装依赖')
  .action(async () => {
    const spinner = ora('正在安装依赖...').start()

    try {
      const updater = new PackageUpdater()
      const result = await updater.install()

      if (result.success) {
        spinner.succeed(chalk.green(result.message))
      } else {
        spinner.fail(chalk.red(result.message))
        process.exit(1)
      }
    } catch (error) {
      spinner.fail(chalk.red('安装失败'))
      console.error(error)
      process.exit(1)
    }
  })

// ============ 安全审计命令 ============

program
  .command('audit')
  .description('执行安全审计')
  .option('-l, --level <level>', '审计级别 (low|moderate|high|critical)', 'moderate')
  .option('--no-licenses', '不检查许可证')
  .option('--json', '输出 JSON 格式')
  .action(async (options) => {
    const spinner = ora('正在执行安全审计...').start()

    try {
      const auditor = new SecurityAuditor(process.cwd(), {
        auditLevel: options.level,
        checkLicenses: options.licenses !== false
      })

      const result = await auditor.audit()
      spinner.stop()

      if (options.json) {
        console.log(JSON.stringify(result, null, 2))
      } else {
        const report = auditor.generateReport(result)
        console.log(report)
      }

      // 如果有严重或高危漏洞，返回错误码
      if (result.summary.criticalCount > 0 || result.summary.highCount > 0) {
        process.exit(1)
      }
    } catch (error) {
      spinner.fail(chalk.red('审计失败'))
      console.error(error)
      process.exit(1)
    }
  })

// ============ 依赖可视化命令 ============

program
  .command('tree')
  .description('显示依赖树')
  .option('-d, --depth <depth>', '最大深度', '3')
  .action(async (options) => {
    const spinner = ora('正在生成依赖树...').start()

    try {
      const visualizer = new DependencyVisualizer()
      const tree = await visualizer.generateTree(parseInt(options.depth))

      spinner.stop()

      const ascii = await visualizer.exportGraph({
        format: 'ascii',
        depth: parseInt(options.depth)
      })

      console.log(ascii)

      if (tree.circularDependencies.length > 0) {
        console.log(chalk.yellow(`\n⚠️  发现 ${tree.circularDependencies.length} 个循环依赖`))
      }
    } catch (error) {
      spinner.fail(chalk.red('生成依赖树失败'))
      console.error(error)
      process.exit(1)
    }
  })

program
  .command('graph')
  .description('导出依赖图')
  .requiredOption('-f, --format <format>', '导出格式 (json|dot|mermaid|ascii)')
  .option('-o, --output <file>', '输出文件路径')
  .option('-d, --depth <depth>', '最大深度')
  .action(async (options) => {
    const spinner = ora('正在导出依赖图...').start()

    try {
      const visualizer = new DependencyVisualizer()
      const graph = await visualizer.exportGraph({
        format: options.format,
        output: options.output,
        depth: options.depth ? parseInt(options.depth) : undefined
      })

      spinner.succeed(chalk.green('依赖图导出成功'))

      if (!options.output) {
        console.log('\n' + graph)
      } else {
        console.log(chalk.cyan(`已保存到: ${options.output}`))
      }
    } catch (error) {
      spinner.fail(chalk.red('导出失败'))
      console.error(error)
      process.exit(1)
    }
  })

program
  .command('why <package>')
  .description('解释为何安装某个依赖')
  .action(async (packageName) => {
    const spinner = ora(`正在查找 ${packageName} 的依赖路径...`).start()

    try {
      const visualizer = new DependencyVisualizer()
      const paths = await visualizer.findDependencyPath(packageName)

      spinner.stop()

      if (paths.length === 0) {
        console.log(chalk.yellow(`未找到 ${packageName} 的依赖路径`))
        return
      }

      console.log(chalk.bold(`\n${packageName} 被以下路径引用:\n`))

      paths.forEach((path, index) => {
        console.log(chalk.cyan(`${index + 1}. ${path.join(' → ')}`))
      })
    } catch (error) {
      spinner.fail(chalk.red('查找失败'))
      console.error(error)
      process.exit(1)
    }
  })

program
  .command('duplicate')
  .description('检测重复的依赖')
  .action(async () => {
    const spinner = ora('正在检测重复依赖...').start()

    try {
      const analyzer = new DependencyAnalyzer()
      const duplicates = await analyzer.findDuplicates()

      spinner.stop()

      if (duplicates.length === 0) {
        console.log(chalk.green('✓ 没有重复的依赖'))
        return
      }

      const table = new Table({
        head: ['包名', '版本', '位置数'],
        colWidths: [40, 30, 15]
      })

      duplicates.forEach(dup => {
        table.push([
          dup.name,
          dup.versions.join(', '),
          dup.locations.length.toString()
        ])
      })

      console.log(table.toString())
      console.log(chalk.yellow(`\n发现 ${duplicates.length} 个重复的依赖`))
    } catch (error) {
      spinner.fail(chalk.red('检测失败'))
      console.error(error)
      process.exit(1)
    }
  })

program
  .command('outdated')
  .description('列出过时的依赖')
  .action(async () => {
    const spinner = ora('正在检查过时的依赖...').start()

    try {
      const manager = new DependencyManager()
      const checker = new VersionChecker()

      const deps = await manager.getAllDependencies()
      const depsToCheck = Object.fromEntries(
        Object.values(deps).map((d: any) => [d.name, d.version])
      )

      const outdated = await checker.checkOutdated(depsToCheck)

      spinner.stop()

      if (outdated.length === 0) {
        console.log(chalk.green('✓ 所有依赖都是最新的！'))
        return
      }

      const table = new Table({
        head: ['包名', '当前', '最新', '类型', 'Breaking'],
        colWidths: [35, 15, 15, 10, 12]
      })

      outdated.forEach(update => {
        table.push([
          update.packageName,
          update.currentVersion,
          update.latestVersion,
          update.updateType,
          update.breakingChanges ? chalk.red('是') : chalk.green('否')
        ])
      })

      console.log(table.toString())
      console.log(chalk.yellow(`\n${outdated.length} 个依赖过时`))
    } catch (error) {
      spinner.fail(chalk.red('检查失败'))
      console.error(error)
      process.exit(1)
    }
  })

// ============ Monorepo 命令 ============

program
  .command('workspace')
  .description('Monorepo 工作区管理')
  .option('--scan', '扫描工作区')
  .option('--analyze', '分析版本冲突')
  .option('--sync <dep> <version>', '同步依赖版本')
  .action(async (options) => {
    const spinner = ora('正在分析工作区...').start()

    try {
      const wsManager = new WorkspaceManager()

      if (options.scan || (!options.analyze && !options.sync)) {
        const workspace = await wsManager.analyzeWorkspace()
        spinner.stop()

        console.log(chalk.bold(`\n工作区信息:`))
        console.log(`  类型: ${workspace.type}`)
        console.log(`  包数: ${workspace.packages.length}`)
        console.log(`  跨包依赖: ${workspace.crossDependencies.length}`)
        console.log(`  幽灵依赖: ${workspace.phantomDependencies.length}`)

        if (workspace.packages.length > 0) {
          const table = new Table({
            head: ['包名', '版本', '本地依赖', '外部依赖'],
            colWidths: [30, 15, 15, 15]
          })

          workspace.packages.forEach(pkg => {
            table.push([
              pkg.name,
              pkg.version,
              pkg.localDependencies.length.toString(),
              pkg.externalDependencies.length.toString()
            ])
          })

          console.log('\n' + table.toString())
        }
      }

      if (options.analyze) {
        const analysis = await wsManager.analyzeVersionConflicts()
        spinner.stop()

        if (analysis.versionConflicts.length > 0) {
          console.log(chalk.yellow(`\n发现 ${analysis.versionConflicts.length} 个版本冲突:`))

          analysis.versionConflicts.forEach(conflict => {
            console.log(chalk.cyan(`\n  ${conflict.dependency}:`))
            conflict.versions.forEach((packages, version) => {
              console.log(`    ${version}: ${packages.join(', ')}`)
            })
            if (conflict.recommendation) {
              console.log(chalk.gray(`    建议: ${conflict.recommendation}`))
            }
          })
        } else {
          console.log(chalk.green('\n✓ 没有版本冲突'))
        }
      }
    } catch (error) {
      spinner.fail(chalk.red('工作区分析失败'))
      console.error(error)
      process.exit(1)
    }
  })

// ============ 交互式命令 ============

program
  .command('interactive')
  .alias('i')
  .description('交互式模式')
  .action(async () => {
    const interactive = new InteractiveCLI()
    await interactive.interactiveUpdate()
  })

program
  .command('config')
  .description('生成配置文件')
  .action(async () => {
    const interactive = new InteractiveCLI()
    await interactive.generateConfig()
  })

program
  .command('clean')
  .description('清理未使用的依赖（交互式）')
  .action(async () => {
    const interactive = new InteractiveCLI()
    await interactive.removeUnused()
  })

// ============ 其他命令 ============

program
  .command('dedupe')
  .description('去重依赖')
  .option('--dry-run', '干运行模式')
  .action(async (options) => {
    const updater = new PackageUpdater(process.cwd(), {
      dryRun: options.dryRun
    })

    const spinner = ora('正在执行依赖去重...').start()

    try {
      const result = await updater.dedupe()

      if (result.success) {
        spinner.succeed(chalk.green(result.message))
      } else {
        spinner.fail(chalk.red(result.message))
        process.exit(1)
      }
    } catch (error) {
      spinner.fail(chalk.red('去重失败'))
      console.error(error)
      process.exit(1)
    }
  })

program
  .command('reinstall')
  .description('重新安装所有依赖')
  .option('--dry-run', '干运行模式')
  .action(async (options) => {
    const updater = new PackageUpdater(process.cwd(), {
      dryRun: options.dryRun
    })

    const spinner = ora('正在重新安装依赖...').start()

    try {
      const result = await updater.reinstall()

      if (result.success) {
        spinner.succeed(chalk.green(result.message))
      } else {
        spinner.fail(chalk.red(result.message))
        process.exit(1)
      }
    } catch (error) {
      spinner.fail(chalk.red('重新安装失败'))
      console.error(error)
      process.exit(1)
    }
  })

program.parse()
