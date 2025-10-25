/**
 * 解析工具函数
 * @module helpers/parsing
 */

import semver from 'semver'

/**
 * 解析语义化版本号
 * @param version - 版本字符串
 * @returns 解析后的版本对象，解析失败返回 null
 * @example
 * ```ts
 * parseVersion('^1.2.3') // { major: 1, minor: 2, patch: 3, ... }
 * parseVersion('invalid') // null
 * ```
 */
export function parseVersion(version: string): semver.SemVer | null {
  try {
    const cleaned = version.replace(/^[\^~>=<]+/, '')
    return semver.parse(cleaned)
  } catch {
    return null
  }
}

/**
 * 比较两个版本号
 * @param v1 - 版本 1
 * @param v2 - 版本 2
 * @returns 1 表示 v1 > v2，-1 表示 v1 < v2，0 表示相等
 * @example
 * ```ts
 * compareVersions('1.2.3', '1.2.2') // 1
 * compareVersions('1.2.3', '1.2.4') // -1
 * compareVersions('1.2.3', '1.2.3') // 0
 * ```
 */
export function compareVersions(v1: string, v2: string): number {
  return semver.compare(semver.coerce(v1) || '0.0.0', semver.coerce(v2) || '0.0.0')
}

/**
 * 检查版本是否满足范围
 * @param version - 版本号
 * @param range - 版本范围
 * @returns 是否满足范围
 * @example
 * ```ts
 * satisfiesRange('1.2.3', '^1.0.0') // true
 * satisfiesRange('2.0.0', '^1.0.0') // false
 * satisfiesRange('1.2.3', '>=1.2.0 <2.0.0') // true
 * ```
 */
export function satisfiesRange(version: string, range: string): boolean {
  try {
    return semver.satisfies(version, range)
  } catch {
    return false
  }
}

/**
 * 获取版本更新类型
 * @param from - 当前版本
 * @param to - 目标版本
 * @returns 更新类型：'major' | 'minor' | 'patch' | 'none'
 * @example
 * ```ts
 * getUpdateType('1.2.3', '2.0.0') // 'major'
 * getUpdateType('1.2.3', '1.3.0') // 'minor'
 * getUpdateType('1.2.3', '1.2.4') // 'patch'
 * getUpdateType('1.2.3', '1.2.3') // 'none'
 * ```
 */
export function getUpdateType(from: string, to: string): 'major' | 'minor' | 'patch' | 'none' {
  const diff = semver.diff(from, to)

  if (!diff) return 'none'
  if (diff.includes('major') || diff === 'premajor') return 'major'
  if (diff.includes('minor') || diff === 'preminor') return 'minor'
  if (diff.includes('patch') || diff === 'prepatch') return 'patch'

  return 'none'
}

/**
 * 解析包名和版本
 * @param spec - 包规范字符串，如 'react@18.0.0' 或 'react'
 * @returns 解析结果 { name, version }
 * @example
 * ```ts
 * parsePackageSpec('react@18.0.0') // { name: 'react', version: '18.0.0' }
 * parsePackageSpec('react') // { name: 'react', version: undefined }
 * parsePackageSpec('@scope/package@1.0.0') // { name: '@scope/package', version: '1.0.0' }
 * ```
 */
export function parsePackageSpec(spec: string): { name: string; version?: string } {
  // 处理作用域包 @scope/package@version
  const scopedMatch = spec.match(/^(@[^/]+\/[^@]+)(?:@(.+))?$/)
  if (scopedMatch) {
    return {
      name: scopedMatch[1],
      version: scopedMatch[2],
    }
  }

  // 处理普通包 package@version
  const match = spec.match(/^([^@]+)(?:@(.+))?$/)
  if (match) {
    return {
      name: match[1],
      version: match[2],
    }
  }

  return { name: spec }
}

/**
 * 解析 npm 包的作用域
 * @param packageName - 包名
 * @returns 作用域名称，如果没有作用域返回 null
 * @example
 * ```ts
 * parseScope('@vue/cli') // '@vue'
 * parseScope('react') // null
 * parseScope('@types/node') // '@types'
 * ```
 */
export function parseScope(packageName: string): string | null {
  const match = packageName.match(/^(@[^/]+)\//)
  return match ? match[1] : null
}

/**
 * 解析 JSON 字符串，带错误处理
 * @param jsonString - JSON 字符串
 * @param fallback - 解析失败时的默认值
 * @returns 解析结果或默认值
 * @example
 * ```ts
 * safeJsonParse('{"a": 1}') // { a: 1 }
 * safeJsonParse('invalid', {}) // {}
 * safeJsonParse('invalid', null) // null
 * ```
 */
export function safeJsonParse<T = unknown>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T
  } catch {
    return fallback
  }
}

/**
 * 解析命令行参数字符串
 * @param str - 命令行参数字符串
 * @returns 参数数组
 * @example
 * ```ts
 * parseCliArgs('--flag value --other') // ['--flag', 'value', '--other']
 * parseCliArgs('cmd "arg with spaces"') // ['cmd', 'arg with spaces']
 * ```
 */
export function parseCliArgs(str: string): string[] {
  const args: string[] = []
  let current = ''
  let inQuotes = false
  let quoteChar = ''

  for (let i = 0; i < str.length; i++) {
    const char = str[i]

    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true
      quoteChar = char
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false
      quoteChar = ''
    } else if (char === ' ' && !inQuotes) {
      if (current) {
        args.push(current)
        current = ''
      }
    } else {
      current += char
    }
  }

  if (current) {
    args.push(current)
  }

  return args
}

/**
 * 解析环境变量字符串
 * @param str - 环境变量字符串，格式：KEY=value
 * @returns 解析结果对象
 * @example
 * ```ts
 * parseEnvString('NODE_ENV=production DEBUG=true')
 * // { NODE_ENV: 'production', DEBUG: 'true' }
 * ```
 */
export function parseEnvString(str: string): Record<string, string> {
  const result: Record<string, string> = {}
  const pairs = str.split(/\s+/)

  for (const pair of pairs) {
    const [key, ...valueParts] = pair.split('=')
    if (key && valueParts.length > 0) {
      result[key] = valueParts.join('=')
    }
  }

  return result
}

/**
 * 解析文件大小字符串
 * @param sizeStr - 文件大小字符串，如 '10MB', '1.5GB'
 * @returns 字节数，解析失败返回 null
 * @example
 * ```ts
 * parseFileSize('10MB') // 10485760
 * parseFileSize('1.5GB') // 1610612736
 * parseFileSize('invalid') // null
 * ```
 */
export function parseFileSize(sizeStr: string): number | null {
  const match = sizeStr.match(/^([\d.]+)\s*([KMGT]?B)$/i)
  if (!match) return null

  const value = parseFloat(match[1])
  const unit = match[2].toUpperCase()

  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  }

  return value * (multipliers[unit] || 1)
}

/**
 * 标准化包名（移除作用域）
 * @param packageName - 包名
 * @returns 标准化后的包名
 * @example
 * ```ts
 * normalizePackageName('@vue/cli') // 'cli'
 * normalizePackageName('react') // 'react'
 * normalizePackageName('@types/node') // 'node'
 * ```
 */
export function normalizePackageName(packageName: string): string {
  return packageName.replace(/^@[^/]+\//, '')
}


