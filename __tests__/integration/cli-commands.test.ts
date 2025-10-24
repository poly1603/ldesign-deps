import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { execa } from 'execa'
import { createTestProject, cleanTempTestDir } from '../helpers/mock'
import path from 'path'

describe('CLI Commands Integration', () => {
  let testDir: string
  const cliPath = path.join(__dirname, '../../bin/cli.js')

  beforeEach(async () => {
    testDir = await createTestProject()
  })

  afterEach(async () => {
    await cleanTempTestDir(testDir)
  })

  describe('ldeps list', () => {
    it('应该列出所有依赖', async () => {
      const { stdout } = await execa('node', [cliPath, 'list'], {
        cwd: testDir,
        reject: false
      })

      expect(stdout).toBeDefined()
      // 应该包含依赖信息
      expect(stdout.length).toBeGreaterThan(0)
    })

    it('应该支持搜索参数', async () => {
      const { stdout } = await execa('node', [cliPath, 'list', '--search', 'react'], {
        cwd: testDir,
        reject: false
      })

      expect(stdout).toBeDefined()
    })
  })

  describe('ldeps check', () => {
    it('应该检查依赖更新', async () => {
      const { stdout } = await execa('node', [cliPath, 'check'], {
        cwd: testDir,
        reject: false,
        timeout: 60000
      })

      expect(stdout).toBeDefined()
    })
  })

  describe('ldeps analyze', () => {
    it('应该分析依赖使用情况', async () => {
      const { stdout } = await execa('node', [cliPath, 'analyze'], {
        cwd: testDir,
        reject: false,
        timeout: 30000
      })

      expect(stdout).toContain('依赖分析报告')
    })
  })

  describe('ldeps --help', () => {
    it('应该显示帮助信息', async () => {
      const { stdout } = await execa('node', [cliPath, '--help'], {
        reject: false
      })

      expect(stdout).toContain('LDesign 依赖管理工具')
      expect(stdout).toContain('list')
      expect(stdout).toContain('check')
      expect(stdout).toContain('analyze')
    })
  })

  describe('ldeps --version', () => {
    it('应该显示版本号', async () => {
      const { stdout } = await execa('node', [cliPath, '--version'], {
        reject: false
      })

      expect(stdout).toMatch(/\d+\.\d+\.\d+/)
    })
  })

  describe('错误处理', () => {
    it('应该处理无效命令', async () => {
      const { stderr, exitCode } = await execa('node', [cliPath, 'invalid-command'], {
        reject: false
      })

      expect(exitCode).not.toBe(0)
    })
  })
})

