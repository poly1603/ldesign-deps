/**
 * 格式化工具函数
 * @module helpers/formatting
 */

/**
 * 格式化文件大小
 * @param bytes - 字节数
 * @param decimals - 小数位数，默认 2
 * @returns 格式化后的大小字符串
 * @example
 * ```ts
 * formatBytes(1024) // '1.00 KB'
 * formatBytes(1048576) // '1.00 MB'
 * formatBytes(1234567890) // '1.15 GB'
 * ```
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * 格式化持续时间
 * @param ms - 毫秒数
 * @returns 格式化后的持续时间字符串
 * @example
 * ```ts
 * formatDuration(1000) // '1s'
 * formatDuration(60000) // '1m'
 * formatDuration(3661000) // '1h 1m 1s'
 * ```
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const parts: string[] = []

  if (days > 0) parts.push(`${days}d`)
  if (hours % 24 > 0) parts.push(`${hours % 24}h`)
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`)
  if (seconds % 60 > 0) parts.push(`${seconds % 60}s`)

  return parts.length > 0 ? parts.join(' ') : '0s'
}

/**
 * 格式化百分比
 * @param value - 值（0-1 或 0-100）
 * @param decimals - 小数位数，默认 2
 * @param isDecimal - 是否为小数形式（0-1），默认 true
 * @returns 格式化后的百分比字符串
 * @example
 * ```ts
 * formatPercentage(0.8542) // '85.42%'
 * formatPercentage(85.42, 2, false) // '85.42%'
 * formatPercentage(0.5, 0) // '50%'
 * ```
 */
export function formatPercentage(value: number, decimals = 2, isDecimal = true): string {
  const percent = isDecimal ? value * 100 : value
  return `${percent.toFixed(decimals)}%`
}

/**
 * 格式化数字，添加千位分隔符
 * @param num - 数字
 * @param locale - 语言环境，默认 'en-US'
 * @returns 格式化后的数字字符串
 * @example
 * ```ts
 * formatNumber(1234567) // '1,234,567'
 * formatNumber(1234567.89) // '1,234,567.89'
 * formatNumber(1234567, 'zh-CN') // '1,234,567'
 * ```
 */
export function formatNumber(num: number, locale = 'en-US'): string {
  return num.toLocaleString(locale)
}

/**
 * 格式化相对时间
 * @param timestamp - 时间戳（毫秒）
 * @returns 相对时间字符串
 * @example
 * ```ts
 * formatRelativeTime(Date.now() - 60000) // '1 minute ago'
 * formatRelativeTime(Date.now() - 3600000) // '1 hour ago'
 * formatRelativeTime(Date.now() + 86400000) // 'in 1 day'
 * ```
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = timestamp - now
  const absDiff = Math.abs(diff)

  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  const isPast = diff < 0

  let value: number
  let unit: string

  if (years > 0) {
    value = years
    unit = 'year'
  } else if (months > 0) {
    value = months
    unit = 'month'
  } else if (days > 0) {
    value = days
    unit = 'day'
  } else if (hours > 0) {
    value = hours
    unit = 'hour'
  } else if (minutes > 0) {
    value = minutes
    unit = 'minute'
  } else {
    value = seconds
    unit = 'second'
  }

  const plural = value !== 1 ? 's' : ''

  return isPast
    ? `${value} ${unit}${plural} ago`
    : `in ${value} ${unit}${plural}`
}

/**
 * 截断字符串
 * @param str - 字符串
 * @param maxLength - 最大长度
 * @param ellipsis - 省略符号，默认 '...'
 * @returns 截断后的字符串
 * @example
 * ```ts
 * truncate('Hello World', 5) // 'He...'
 * truncate('Hello World', 20) // 'Hello World'
 * truncate('Hello World', 8, '…') // 'Hello…'
 * ```
 */
export function truncate(str: string, maxLength: number, ellipsis = '...'): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * 格式化列表为人类可读的字符串
 * @param items - 项目列表
 * @param conjunction - 连接词，默认 'and'
 * @returns 格式化后的字符串
 * @example
 * ```ts
 * formatList(['apple']) // 'apple'
 * formatList(['apple', 'banana']) // 'apple and banana'
 * formatList(['apple', 'banana', 'orange']) // 'apple, banana and orange'
 * formatList(['A', 'B', 'C'], 'or') // 'A, B or C'
 * ```
 */
export function formatList(items: string[], conjunction = 'and'): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`

  const last = items[items.length - 1]
  const rest = items.slice(0, -1)
  return `${rest.join(', ')} ${conjunction} ${last}`
}

/**
 * 将驼峰命名转换为短横线命名
 * @param str - 驼峰命名字符串
 * @returns 短横线命名字符串
 * @example
 * ```ts
 * camelToKebab('helloWorld') // 'hello-world'
 * camelToKebab('myVariableName') // 'my-variable-name'
 * ```
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * 将短横线命名转换为驼峰命名
 * @param str - 短横线命名字符串
 * @returns 驼峰命名字符串
 * @example
 * ```ts
 * kebabToCamel('hello-world') // 'helloWorld'
 * kebabToCamel('my-variable-name') // 'myVariableName'
 * ```
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}


