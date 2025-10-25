import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli/index.ts',
    'src/core/index.ts',
    'src/types/index.ts',
    'src/constants/index.ts',
    'src/helpers/index.ts'
  ],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: [
    '@ldesign/kit',
    'pacote',
    'semver',
    'depcheck',
    'p-limit',
    'cli-progress',
    'fast-glob'
  ]
})


