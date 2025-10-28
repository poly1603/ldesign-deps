export { DependencyManager } from './dependency-manager'
export { VersionChecker } from './version-checker'
export { DependencyAnalyzer } from './dependency-analyzer'
export { PackageUpdater } from './package-updater'
export { CacheManager } from './cache-manager'
export { SecurityAuditor } from './security-auditor'
export { DependencyVisualizer } from './dependency-visualizer'
export { WorkspaceManager } from './workspace-manager'
export { ConfigLoader } from './config-loader'
export { Logger, LogLevel } from './logger'
export { DependencyLockManager, type LockedDependency } from './dependency-lock-manager'
export { DependencyHistoryTracker, type DependencyChange, type DependencyHistory, type ChangeType } from './dependency-history-tracker'

// 新增功能模块 (v0.3.0)
export { DependencyHealthScorer, type HealthScorerConfig } from './dependency-health-scorer'
export { PerformanceMonitor, type PerformanceMonitorConfig } from './performance-monitor'
export { NotificationManager } from './notification-manager'
export { DependencyCostAnalyzer, type CostAnalyzerConfig } from './dependency-cost-analyzer'
export { DependencyAlternativesFinder, type AlternativesFinderConfig } from './dependency-alternatives-finder'


