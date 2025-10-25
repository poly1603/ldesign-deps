/**
 * 依赖管理工具错误代码枚举
 * @module constants/error-codes
 */

/**
 * 错误代码枚举
 */
export enum DepsErrorCode {
  // 缓存相关错误 (1xx)
  /** 缓存初始化失败 */
  CACHE_INIT_FAILED = 'CACHE_INIT_FAILED',
  /** 缓存读取失败 */
  CACHE_READ_FAILED = 'CACHE_READ_FAILED',
  /** 缓存写入失败 */
  CACHE_WRITE_FAILED = 'CACHE_WRITE_FAILED',
  /** 缓存持久化失败 */
  CACHE_PERSIST_FAILED = 'CACHE_PERSIST_FAILED',

  // 解析相关错误 (2xx)
  /** JSON 解析失败 */
  PARSE_JSON_FAILED = 'PARSE_JSON_FAILED',
  /** YAML 解析失败 */
  PARSE_YAML_FAILED = 'PARSE_YAML_FAILED',
  /** Package.json 解析失败 */
  PARSE_PACKAGE_JSON_FAILED = 'PARSE_PACKAGE_JSON_FAILED',
  /** 配置文件解析失败 */
  PARSE_CONFIG_FAILED = 'PARSE_CONFIG_FAILED',

  // 网络相关错误 (3xx)
  /** 网络请求失败 */
  NETWORK_REQUEST_FAILED = 'NETWORK_REQUEST_FAILED',
  /** 网络超时 */
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  /** 无法连接到 Registry */
  NETWORK_REGISTRY_UNAVAILABLE = 'NETWORK_REGISTRY_UNAVAILABLE',

  // 依赖管理错误 (4xx)
  /** 依赖不存在 */
  DEPENDENCY_NOT_FOUND = 'DEPENDENCY_NOT_FOUND',
  /** 依赖已存在 */
  DEPENDENCY_ALREADY_EXISTS = 'DEPENDENCY_ALREADY_EXISTS',
  /** 依赖版本冲突 */
  DEPENDENCY_VERSION_CONFLICT = 'DEPENDENCY_VERSION_CONFLICT',
  /** 依赖循环引用 */
  DEPENDENCY_CIRCULAR = 'DEPENDENCY_CIRCULAR',

  // 工作区相关错误 (5xx)
  /** 不是工作区项目 */
  WORKSPACE_NOT_FOUND = 'WORKSPACE_NOT_FOUND',
  /** 工作区分析失败 */
  WORKSPACE_ANALYSIS_FAILED = 'WORKSPACE_ANALYSIS_FAILED',
  /** 工作区包扫描失败 */
  WORKSPACE_SCAN_FAILED = 'WORKSPACE_SCAN_FAILED',

  // 安全审计错误 (6xx)
  /** 安全审计失败 */
  AUDIT_FAILED = 'AUDIT_FAILED',
  /** NPM Audit 执行失败 */
  NPM_AUDIT_FAILED = 'NPM_AUDIT_FAILED',
  /** 许可证检查失败 */
  LICENSE_CHECK_FAILED = 'LICENSE_CHECK_FAILED',

  // 文件系统错误 (7xx)
  /** 文件不存在 */
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  /** 文件读取失败 */
  FILE_READ_FAILED = 'FILE_READ_FAILED',
  /** 文件写入失败 */
  FILE_WRITE_FAILED = 'FILE_WRITE_FAILED',
  /** 目录创建失败 */
  DIR_CREATE_FAILED = 'DIR_CREATE_FAILED',

  // 包管理器错误 (8xx)
  /** 包管理器检测失败 */
  PACKAGE_MANAGER_DETECTION_FAILED = 'PACKAGE_MANAGER_DETECTION_FAILED',
  /** 包安装失败 */
  PACKAGE_INSTALL_FAILED = 'PACKAGE_INSTALL_FAILED',
  /** 包更新失败 */
  PACKAGE_UPDATE_FAILED = 'PACKAGE_UPDATE_FAILED',
  /** 包删除失败 */
  PACKAGE_REMOVE_FAILED = 'PACKAGE_REMOVE_FAILED',

  // 通用错误 (9xx)
  /** 未知错误 */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  /** 操作被取消 */
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
  /** 无效的参数 */
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',
  /** 操作超时 */
  OPERATION_TIMEOUT = 'OPERATION_TIMEOUT',
}

/**
 * 错误严重程度级别
 */
export enum ErrorSeverity {
  /** 低 - 可以继续运行 */
  LOW = 'low',
  /** 中 - 功能受限但可以继续 */
  MEDIUM = 'medium',
  /** 高 - 严重影响功能但可以恢复 */
  HIGH = 'high',
  /** 致命 - 无法继续运行 */
  CRITICAL = 'critical',
}

/**
 * 错误代码到严重程度的映射
 */
export const ERROR_SEVERITY_MAP: Record<DepsErrorCode, ErrorSeverity> = {
  // 缓存错误 - 低
  [DepsErrorCode.CACHE_INIT_FAILED]: ErrorSeverity.LOW,
  [DepsErrorCode.CACHE_READ_FAILED]: ErrorSeverity.LOW,
  [DepsErrorCode.CACHE_WRITE_FAILED]: ErrorSeverity.LOW,
  [DepsErrorCode.CACHE_PERSIST_FAILED]: ErrorSeverity.LOW,

  // 解析错误 - 高
  [DepsErrorCode.PARSE_JSON_FAILED]: ErrorSeverity.HIGH,
  [DepsErrorCode.PARSE_YAML_FAILED]: ErrorSeverity.HIGH,
  [DepsErrorCode.PARSE_PACKAGE_JSON_FAILED]: ErrorSeverity.CRITICAL,
  [DepsErrorCode.PARSE_CONFIG_FAILED]: ErrorSeverity.MEDIUM,

  // 网络错误 - 中
  [DepsErrorCode.NETWORK_REQUEST_FAILED]: ErrorSeverity.MEDIUM,
  [DepsErrorCode.NETWORK_TIMEOUT]: ErrorSeverity.MEDIUM,
  [DepsErrorCode.NETWORK_REGISTRY_UNAVAILABLE]: ErrorSeverity.HIGH,

  // 依赖管理错误 - 高
  [DepsErrorCode.DEPENDENCY_NOT_FOUND]: ErrorSeverity.HIGH,
  [DepsErrorCode.DEPENDENCY_ALREADY_EXISTS]: ErrorSeverity.MEDIUM,
  [DepsErrorCode.DEPENDENCY_VERSION_CONFLICT]: ErrorSeverity.HIGH,
  [DepsErrorCode.DEPENDENCY_CIRCULAR]: ErrorSeverity.HIGH,

  // 工作区错误 - 中
  [DepsErrorCode.WORKSPACE_NOT_FOUND]: ErrorSeverity.MEDIUM,
  [DepsErrorCode.WORKSPACE_ANALYSIS_FAILED]: ErrorSeverity.MEDIUM,
  [DepsErrorCode.WORKSPACE_SCAN_FAILED]: ErrorSeverity.MEDIUM,

  // 安全审计错误 - 高
  [DepsErrorCode.AUDIT_FAILED]: ErrorSeverity.HIGH,
  [DepsErrorCode.NPM_AUDIT_FAILED]: ErrorSeverity.MEDIUM,
  [DepsErrorCode.LICENSE_CHECK_FAILED]: ErrorSeverity.MEDIUM,

  // 文件系统错误 - 高
  [DepsErrorCode.FILE_NOT_FOUND]: ErrorSeverity.HIGH,
  [DepsErrorCode.FILE_READ_FAILED]: ErrorSeverity.HIGH,
  [DepsErrorCode.FILE_WRITE_FAILED]: ErrorSeverity.HIGH,
  [DepsErrorCode.DIR_CREATE_FAILED]: ErrorSeverity.HIGH,

  // 包管理器错误 - 高
  [DepsErrorCode.PACKAGE_MANAGER_DETECTION_FAILED]: ErrorSeverity.HIGH,
  [DepsErrorCode.PACKAGE_INSTALL_FAILED]: ErrorSeverity.HIGH,
  [DepsErrorCode.PACKAGE_UPDATE_FAILED]: ErrorSeverity.HIGH,
  [DepsErrorCode.PACKAGE_REMOVE_FAILED]: ErrorSeverity.HIGH,

  // 通用错误
  [DepsErrorCode.UNKNOWN_ERROR]: ErrorSeverity.MEDIUM,
  [DepsErrorCode.OPERATION_CANCELLED]: ErrorSeverity.LOW,
  [DepsErrorCode.INVALID_ARGUMENT]: ErrorSeverity.HIGH,
  [DepsErrorCode.OPERATION_TIMEOUT]: ErrorSeverity.MEDIUM,
}


