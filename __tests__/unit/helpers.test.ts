/**
 * Helpers 工具函数单元测试
 */

import { describe, it, expect } from 'vitest'
import {
  formatBytes,
  formatDuration,
  formatPercentage,
  formatNumber,
  formatRelativeTime,
  truncate,
  formatList,
  camelToKebab,
  kebabToCamel
} from '../../src/helpers/formatting'

import {
  parseVersion,
  compareVersions,
  satisfiesRange,
  getUpdateType,
  parsePackageSpec,
  parseScope,
  safeJsonParse,
  parseCliArgs,
  parseFileSize,
  normalizePackageName
} from '../../src/helpers/parsing'

describe('Formatting Helpers', () => {
  describe('formatBytes', () => {
    it('应该正确格式化字节数', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(1024)).toBe('1.00 KB')
      expect(formatBytes(1048576)).toBe('1.00 MB')
      expect(formatBytes(1073741824)).toBe('1.00 GB')
    })

    it('应该支持自定义小数位数', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB')
      expect(formatBytes(1536, 3)).toBe('1.500 KB')
    })
  })

  describe('formatDuration', () => {
    it('应该正确格式化时间', () => {
      expect(formatDuration(0)).toBe('0s')
      expect(formatDuration(1000)).toBe('1s')
      expect(formatDuration(60000)).toBe('1m')
      expect(formatDuration(3661000)).toBe('1h 1m 1s')
      expect(formatDuration(86400000)).toBe('1d')
    })
  })

  describe('formatPercentage', () => {
    it('应该正确格式化百分比', () => {
      expect(formatPercentage(0.8542)).toBe('85.42%')
      expect(formatPercentage(0.5, 0)).toBe('50%')
      expect(formatPercentage(85.42, 2, false)).toBe('85.42%')
    })
  })

  describe('formatNumber', () => {
    it('应该添加千位分隔符', () => {
      expect(formatNumber(1234567)).toContain('1')
      expect(formatNumber(1234567)).toContain('234')
      expect(formatNumber(1234567)).toContain('567')
    })
  })

  describe('formatRelativeTime', () => {
    it('应该格式化相对时间', () => {
      const now = Date.now()

      expect(formatRelativeTime(now - 60000)).toContain('minute')
      expect(formatRelativeTime(now - 3600000)).toContain('hour')
      expect(formatRelativeTime(now + 86400000)).toContain('day')
    })
  })

  describe('truncate', () => {
    it('应该正确截断字符串', () => {
      expect(truncate('Hello World', 5)).toBe('He...')
      expect(truncate('Hello World', 20)).toBe('Hello World')
      expect(truncate('Hello World', 8, '…')).toBe('Hello…')
    })
  })

  describe('formatList', () => {
    it('应该格式化列表', () => {
      expect(formatList(['apple'])).toBe('apple')
      expect(formatList(['apple', 'banana'])).toBe('apple and banana')
      expect(formatList(['apple', 'banana', 'orange'])).toBe('apple, banana and orange')
      expect(formatList(['A', 'B', 'C'], 'or')).toBe('A, B or C')
    })

    it('应该处理空列表', () => {
      expect(formatList([])).toBe('')
    })
  })

  describe('camelToKebab', () => {
    it('应该转换驼峰到短横线', () => {
      expect(camelToKebab('helloWorld')).toBe('hello-world')
      expect(camelToKebab('myVariableName')).toBe('my-variable-name')
      expect(camelToKebab('HTTPRequest')).toBe('h-t-t-p-request')
    })
  })

  describe('kebabToCamel', () => {
    it('应该转换短横线到驼峰', () => {
      expect(kebabToCamel('hello-world')).toBe('helloWorld')
      expect(kebabToCamel('my-variable-name')).toBe('myVariableName')
    })
  })
})

describe('Parsing Helpers', () => {
  describe('parseVersion', () => {
    it('应该解析语义化版本', () => {
      const v1 = parseVersion('1.2.3')
      expect(v1?.major).toBe(1)
      expect(v1?.minor).toBe(2)
      expect(v1?.patch).toBe(3)

      const v2 = parseVersion('^1.2.3')
      expect(v2?.major).toBe(1)
    })

    it('应该处理无效版本', () => {
      expect(parseVersion('invalid')).toBeNull()
    })
  })

  describe('compareVersions', () => {
    it('应该正确比较版本', () => {
      expect(compareVersions('1.2.3', '1.2.2')).toBe(1)
      expect(compareVersions('1.2.3', '1.2.4')).toBe(-1)
      expect(compareVersions('1.2.3', '1.2.3')).toBe(0)
    })
  })

  describe('satisfiesRange', () => {
    it('应该检查版本范围', () => {
      expect(satisfiesRange('1.2.3', '^1.0.0')).toBe(true)
      expect(satisfiesRange('2.0.0', '^1.0.0')).toBe(false)
      expect(satisfiesRange('1.2.3', '>=1.2.0 <2.0.0')).toBe(true)
    })

    it('应该处理无效输入', () => {
      expect(satisfiesRange('invalid', '^1.0.0')).toBe(false)
    })
  })

  describe('getUpdateType', () => {
    it('应该识别更新类型', () => {
      expect(getUpdateType('1.2.3', '2.0.0')).toBe('major')
      expect(getUpdateType('1.2.3', '1.3.0')).toBe('minor')
      expect(getUpdateType('1.2.3', '1.2.4')).toBe('patch')
      expect(getUpdateType('1.2.3', '1.2.3')).toBe('none')
    })
  })

  describe('parsePackageSpec', () => {
    it('应该解析包规范', () => {
      expect(parsePackageSpec('react@18.0.0')).toEqual({
        name: 'react',
        version: '18.0.0'
      })

      expect(parsePackageSpec('react')).toEqual({
        name: 'react',
        version: undefined
      })

      expect(parsePackageSpec('@vue/cli@5.0.0')).toEqual({
        name: '@vue/cli',
        version: '5.0.0'
      })

      expect(parsePackageSpec('@types/node')).toEqual({
        name: '@types/node',
        version: undefined
      })
    })
  })

  describe('parseScope', () => {
    it('应该解析包作用域', () => {
      expect(parseScope('@vue/cli')).toBe('@vue')
      expect(parseScope('@types/node')).toBe('@types')
      expect(parseScope('react')).toBeNull()
    })
  })

  describe('safeJsonParse', () => {
    it('应该安全解析 JSON', () => {
      expect(safeJsonParse('{"a": 1}', {})).toEqual({ a: 1 })
      expect(safeJsonParse('invalid', {})).toEqual({})
      expect(safeJsonParse('invalid', null)).toBeNull()
    })
  })

  describe('parseCliArgs', () => {
    it('应该解析命令行参数', () => {
      expect(parseCliArgs('--flag value --other')).toEqual(['--flag', 'value', '--other'])
      expect(parseCliArgs('cmd "arg with spaces"')).toEqual(['cmd', 'arg with spaces'])
      expect(parseCliArgs("cmd 'single quotes'")).toEqual(['cmd', 'single quotes'])
    })
  })

  describe('parseFileSize', () => {
    it('应该解析文件大小', () => {
      expect(parseFileSize('10MB')).toBe(10485760)
      expect(parseFileSize('1.5GB')).toBe(1610612736)
      expect(parseFileSize('100KB')).toBe(102400)
    })

    it('应该处理无效输入', () => {
      expect(parseFileSize('invalid')).toBeNull()
    })
  })

  describe('normalizePackageName', () => {
    it('应该标准化包名', () => {
      expect(normalizePackageName('@vue/cli')).toBe('cli')
      expect(normalizePackageName('react')).toBe('react')
      expect(normalizePackageName('@types/node')).toBe('node')
    })
  })
})


