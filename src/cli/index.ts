#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import Table from 'cli-table3'
import { DependencyManager, VersionChecker, DependencyAnalyzer, PackageUpdater } from '../core'

const program = new Command()

program
  .name('ldesign-deps')
  .description('LDesign 依赖管理工具')
  .version('0.1.0')

program
  .command('list')
  .description('列出所有依赖')
  .action(async () => {
    const spinner = ora('正在加载依赖列表...').start()
    
    try {
      const manager = new DependencyManager()
      const deps = await manager.getAllDependencies()
      
      spinner.stop()
      
      const table = new Table({
        head: ['包名', '版本', '类型'],
        colWidths: [40, 20, 20]
      })
      
      Object.values(deps).forEach(dep => {
        table.push([dep.name, dep.version, dep.type])
      })
      
      console.log(table.toString())
      console.log(chalk.green(`\n总计: ${Object.keys(deps).length} 个依赖`))
    } catch (error) {
      spinner.fail(chalk.red('加载失败'))
      console.error(error)
    }
  })

program
  .command('check')
  .description('检查依赖更新')
  .action(async () => {
    const spinner = ora('正在检查更新...').start()
    
    try {
      const manager = new DependencyManager()
      const checker = new VersionChecker()
      
      const deps = await manager.getAllDependencies()
      const depsToCheck = Object.fromEntries(
        Object.values(deps).map(d => [d.name, d.version])
      )
      
      const updates = await checker.checkUpdates(depsToCheck)
      const hasUpdates = updates.filter(u => u.hasUpdate)
      
      spinner.stop()
      
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
    }
  })

program
  .command('analyze')
  .description('分析依赖使用情况')
  .action(async () => {
    const spinner = ora('正在分析依赖...').start()
    
    try {
      const analyzer = new DependencyAnalyzer()
      const analysis = await analyzer.analyze()
      
      spinner.stop()
      
      console.log(chalk.bold('\n📦 依赖分析报告\n'))
      
      if (analysis.unused.length > 0) {
        console.log(chalk.yellow('未使用的依赖:'))
        analysis.unused.forEach(dep => console.log(`  - ${dep}`))
      } else {
        console.log(chalk.green('✓ 没有未使用的依赖'))
      }
      
      console.log()
      
      if (analysis.missing.length > 0) {
        console.log(chalk.red('缺失的依赖:'))
        analysis.missing.forEach(dep => console.log(`  - ${dep}`))
      } else {
        console.log(chalk.green('✓ 没有缺失的依赖'))
      }
    } catch (error) {
      spinner.fail(chalk.red('分析失败'))
      console.error(error)
    }
  })

program
  .command('update <package>')
  .description('更新指定的包')
  .option('-v, --version <version>', '指定版本')
  .action(async (packageName, options) => {
    const spinner = ora(`正在更新 ${packageName}...`).start()
    
    try {
      const updater = new PackageUpdater()
      const result = await updater.updatePackage(packageName, options.version)
      
      if (result.success) {
        spinner.succeed(chalk.green(result.message))
      } else {
        spinner.fail(chalk.red(result.message))
        if (result.error) {
          console.error(chalk.red(result.error))
        }
      }
    } catch (error) {
      spinner.fail(chalk.red('更新失败'))
      console.error(error)
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
      }
    } catch (error) {
      spinner.fail(chalk.red('安装失败'))
      console.error(error)
    }
  })

program.parse()

