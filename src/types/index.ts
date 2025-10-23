export interface PackageJson {
  name?: string
  version?: string
  description?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  [key: string]: any
}

export interface DependencyInfo {
  name: string
  version: string
  type: string
}

export interface VersionInfo {
  current: string
  latest: string
  hasUpdate: boolean
}

export interface UpdateAvailable {
  packageName: string
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  updateType: 'major' | 'minor' | 'patch' | 'none'
  error?: string
}

export interface DependencyAnalysis {
  unused: string[]
  missing: string[]
  invalidFiles: Record<string, any>
  invalidDirs: Record<string, any>
  usingDependencies: Record<string, string[]>
}

export interface UpdateResult {
  success: boolean
  packageName?: string
  message: string
  output?: string
  error?: string
}

