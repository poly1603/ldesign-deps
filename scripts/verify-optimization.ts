/**
 * 验证优化实施脚本
 * 检查代码质量、类型安全和性能优化是否正确实施
 */

import fs from 'fs-extra'
import path from 'path'
import { glob } from 'fast-glob'

interface ValidationResult {
  name: string
  passed: boolean
  message: string
  details?: string[]
}

const results: ValidationResult[] = []

/**
 * 检查是否存在 any 类型使用
 */
async function checkNoAnyTypes(): Promise<ValidationResult> {
  const sourceFiles = await glob('src/**/*.ts', {
    ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
  })

  const anyUsages: string[] = []

  for (const file of sourceFiles) {
    const content = await fs.readFile(file, 'utf-8')
    const lines = content.split('\n')

    lines.forEach((line, index) => {
      // 检测 any 类型使用（排除注释）
      if (
        /:\s*any\b/.test(line) &&
        !line.trim().startsWith('//') &&
        !line.trim().startsWith('*')
      ) {
        anyUsages.push(`${file}:${index + 1} - ${line.trim()}`)
      }
    })
  }

  return {
    name: '类型安全检查',
    passed: anyUsages.length === 0,
    message: anyUsages.length === 0
      ? '✅ 未发现 any 类型使用'
      : `❌ 发现 ${anyUsages.length} 处 any 类型使用`,
    details: anyUsages.length > 0 ? anyUsages : undefined,
  }
}

/**
 * 检查是否存在直接 console 调用
 */
async function checkNoDirectConsole(): Promise<ValidationResult> {
  const sourceFiles = await glob('src/**/*.ts', {
    ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
  })

  const consoleUsages: string[] = []

  for (const file of sourceFiles) {
    const content = await fs.readFile(file, 'utf-8')
    const lines = content.split('\n')

    lines.forEach((line, index) => {
      // 检测 console.* 使用（排除注释）
      if (
        /console\.(log|warn|error|info|debug)/.test(line) &&
        !line.trim().startsWith('//') &&
        !line.trim().startsWith('*')
      ) {
        consoleUsages.push(`${file}:${index + 1} - ${line.trim()}`)
      }
    })
  }

  return {
    name: '日志统一检查',
    passed: consoleUsages.length === 0,
    message: consoleUsages.length === 0
      ? '✅ 未发现直接 console 调用'
      : `❌ 发现 ${consoleUsages.length} 处 console 调用`,
    details: consoleUsages.length > 0 ? consoleUsages : undefined,
  }
}

/**
 * 检查 JSDoc 覆盖率
 */
async function checkJSDocCoverage(): Promise<ValidationResult> {
  const sourceFiles = await glob('src/core/**/*.ts', {
    ignore: ['**/index.ts', '**/*.test.ts', '**/node_modules/**'],
  })

  let totalFunctions = 0
  let documentedFunctions = 0
  const undocumented: string[] = []

  for (const file of sourceFiles) {
    const content = await fs.readFile(file, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // 检测函数定义
      if (
        /^\s*(public|private|protected)?\s*(static)?\s*(async)?\s*\w+\s*\(/
          .test(line) ||
        /^\s*(export\s+)?(async\s+)?function\s+\w+/.test(line)
      ) {
        totalFunctions++

        // 检查前面几行是否有 JSDoc
        let hasJSDoc = false
        for (let j = Math.max(0, i - 10); j < i; j++) {
          if (lines[j].includes('/**')) {
            hasJSDoc = true
            break
          }
        }

        if (hasJSDoc) {
          documentedFunctions++
        } else {
          undocumented.push(`${file}:${i + 1} - ${line.trim()}`)
        }
      }
    }
  }

  const coverage = totalFunctions > 0
    ? (documentedFunctions / totalFunctions) * 100
    : 100

  return {
    name: 'JSDoc 覆盖率检查',
    passed: coverage >= 80,
    message: `${coverage >= 80 ? '✅' : '❌'} JSDoc 覆盖率: ${coverage.toFixed(1)}% (${documentedFunctions}/${totalFunctions})`,
    details: coverage < 80 ? undocumented.slice(0, 10) : undefined,
  }
}

/**
 * 检查必需文件是否存在
 */
async function checkRequiredFiles(): Promise<ValidationResult> {
  const requiredFiles = [
    'src/constants/error-codes.ts',
    'src/constants/index.ts',
    'src/helpers/formatting.ts',
    'src/helpers/parsing.ts',
    'src/helpers/index.ts',
    'src/core/dependency-lock-manager.ts',
    'src/core/dependency-history-tracker.ts',
    'CHANGELOG.md',
    'MIGRATION_GUIDE.md',
    'docs/QUICK_START_CN.md',
    'docs/BEST_PRACTICES_CN.md',
  ]

  const missing: string[] = []

  for (const file of requiredFiles) {
    if (!(await fs.pathExists(file))) {
      missing.push(file)
    }
  }

  return {
    name: '必需文件检查',
    passed: missing.length === 0,
    message: missing.length === 0
      ? '✅ 所有必需文件都存在'
      : `❌ 缺少 ${missing.length} 个文件`,
    details: missing.length > 0 ? missing : undefined,
  }
}

/**
 * 检查 TypeScript 配置
 */
async function checkTypeScriptConfig(): Promise<ValidationResult> {
  const tsconfigPath = 'tsconfig.json'
  const tsconfig = await fs.readJSON(tsconfigPath)

  const requiredOptions = {
    strict: true,
    noUncheckedIndexedAccess: true,
    noImplicitOverride: true,
  }

  const missing: string[] = []

  for (const [key, value] of Object.entries(requiredOptions)) {
    if (tsconfig.compilerOptions[key] !== value) {
      missing.push(`${key}: ${value}`)
    }
  }

  return {
    name: 'TypeScript 配置检查',
    passed: missing.length === 0,
    message: missing.length === 0
      ? '✅ TypeScript 严格模式已启用'
      : `❌ 缺少 ${missing.length} 个配置`,
    details: missing.length > 0 ? missing : undefined,
  }
}

/**
 * 检查 package.json scripts
 */
async function checkPackageScripts(): Promise<ValidationResult> {
  const pkg = await fs.readJSON('package.json')

  const requiredScripts = [
    'build:watch',
    'test:coverage',
    'test:watch',
    'type-check:watch',
    'clean:cache',
    'prepack',
    'prepublishOnly',
  ]

  const missing: string[] = []

  for (const script of requiredScripts) {
    if (!pkg.scripts[script]) {
      missing.push(script)
    }
  }

  return {
    name: 'Package Scripts 检查',
    passed: missing.length === 0,
    message: missing.length === 0
      ? '✅ 所有推荐的 scripts 都已添加'
      : `⚠️ 缺少 ${missing.length} 个推荐 script`,
    details: missing.length > 0 ? missing : undefined,
  }
}

/**
 * 运行所有验证
 */
async function runValidation() {
  console.log('🔍 开始验证优化实施情况...\n')
  console.log('='.repeat(60))
  console.log('')

  // 运行所有检查
  results.push(await checkNoAnyTypes())
  results.push(await checkNoDirectConsole())
  results.push(await checkJSDocCoverage())
  results.push(await checkRequiredFiles())
  results.push(await checkTypeScriptConfig())
  results.push(await checkPackageScripts())

  // 输出结果
  console.log('验证结果:\n')

  let passCount = 0
  let failCount = 0

  results.forEach((result) => {
    console.log(`${result.message}`)

    if (result.details && result.details.length > 0) {
      console.log('  详情:')
      result.details.slice(0, 5).forEach((detail) => {
        console.log(`    - ${detail}`)
      })
      if (result.details.length > 5) {
        console.log(`    ... 还有 ${result.details.length - 5} 项`)
      }
    }

    console.log('')

    if (result.passed) {
      passCount++
    } else {
      failCount++
    }
  })

  console.log('='.repeat(60))
  console.log('')
  console.log(`总计: ${results.length} 项检查`)
  console.log(`通过: ${passCount} 项`)
  console.log(`失败: ${failCount} 项`)
  console.log('')

  if (failCount === 0) {
    console.log('🎉 所有验证通过！优化实施成功！')
    process.exit(0)
  } else {
    console.log('⚠️ 部分验证未通过，请检查上述问题。')
    process.exit(1)
  }
}

// 运行验证
runValidation().catch((error) => {
  console.error('验证过程出错:', error)
  process.exit(1)
})


