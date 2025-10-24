import type { PackageJson } from '../../src/types'

/**
 * 创建 Mock Package.json
 */
export function createMockPackageJson(overrides?: Partial<PackageJson>): PackageJson {
  return {
    name: 'test-package',
    version: '1.0.0',
    dependencies: {
      'react': '^18.0.0',
      'vue': '^3.0.0'
    },
    devDependencies: {
      'typescript': '^5.0.0',
      'vitest': '^1.0.0'
    },
    ...overrides
  }
}

/**
 * Mock npm registry 响应
 */
export function mockNpmRegistry() {
  return {
    'react': {
      version: '18.2.0',
      name: 'react',
      dist: {
        shasum: 'abc123',
        tarball: 'https://registry.npmjs.org/react/-/react-18.2.0.tgz'
      }
    },
    'vue': {
      version: '3.3.4',
      name: 'vue',
      dist: {
        shasum: 'def456',
        tarball: 'https://registry.npmjs.org/vue/-/vue-3.3.4.tgz'
      }
    }
  }
}

/**
 * Mock 依赖分析结果
 */
export function mockDepcheckResult() {
  return {
    dependencies: {
      'unused-package': []
    },
    devDependencies: {},
    missing: {
      'missing-package': ['src/index.ts']
    },
    using: {
      'react': ['src/app.tsx'],
      'vue': ['src/main.ts']
    },
    invalidFiles: {},
    invalidDirs: {}
  }
}

/**
 * 创建临时测试目录
 */
export async function createTempTestDir(): Promise<string> {
  const fs = await import('fs-extra')
  const path = await import('path')
  const os = await import('os')

  const tmpDir = path.join(os.tmpdir(), `ldesign-deps-test-${Date.now()}`)
  await fs.ensureDir(tmpDir)

  return tmpDir
}

/**
 * 清理临时测试目录
 */
export async function cleanTempTestDir(dir: string): Promise<void> {
  const fs = await import('fs-extra')
  await fs.remove(dir)
}

/**
 * 在临时目录中创建测试项目
 */
export async function createTestProject(packageJson?: PackageJson): Promise<string> {
  const fs = await import('fs-extra')
  const path = await import('path')

  const tmpDir = await createTempTestDir()
  const pkg = packageJson || createMockPackageJson()

  await fs.writeJSON(path.join(tmpDir, 'package.json'), pkg, { spaces: 2 })

  // 创建一些测试文件
  await fs.writeFile(
    path.join(tmpDir, 'index.ts'),
    `import React from 'react'\nexport default React`
  )

  return tmpDir
}

