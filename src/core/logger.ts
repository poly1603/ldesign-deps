import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

/**
 * 日志配置
 */
export interface LoggerConfig {
  level: LogLevel
  file?: string
  console: boolean
  timestamp: boolean
  colorize: boolean
}

/**
 * 日志管理器 - 分级日志输出
 */
export class Logger {
  private config: LoggerConfig
  private logFile?: string

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: LogLevel.INFO,
      console: true,
      timestamp: true,
      colorize: true,
      ...config
    }

    if (this.config.file) {
      this.logFile = this.config.file
      this.ensureLogFile()
    }
  }

  /**
   * Debug 日志
   * @param message - 日志消息
   * @param args - 附加参数
   */
  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...args)
  }

  /**
   * Info 日志
   * @param message - 日志消息
   * @param args - 附加参数
   */
  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, ...args)
  }

  /**
   * Warning 日志
   * @param message - 日志消息
   * @param args - 附加参数
   */
  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, ...args)
  }

  /**
   * Error 日志
   * @param message - 日志消息
   * @param error - 错误对象
   * @param args - 附加参数
   */
  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (error) {
      this.log(LogLevel.ERROR, message, error, ...args)
    } else {
      this.log(LogLevel.ERROR, message, ...args)
    }
  }

  /**
   * 核心日志方法
   * @param level - 日志级别
   * @param message - 日志消息
   * @param args - 附加参数
   */
  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (level < this.config.level) {
      return
    }

    const logMessage = this.formatMessage(level, message, ...args)

    // 控制台输出
    if (this.config.console) {
      this.writeToConsole(level, logMessage)
    }

    // 文件输出
    if (this.logFile) {
      this.writeToFile(logMessage)
    }
  }

  /**
   * 格式化日志消息
   * @param level - 日志级别
   * @param message - 日志消息
   * @param args - 附加参数
   * @returns 格式化后的日志字符串
   */
  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    const parts: string[] = []

    // 时间戳
    if (this.config.timestamp) {
      const timestamp = new Date().toISOString()
      parts.push(`[${timestamp}]`)
    }

    // 日志级别
    parts.push(`[${LogLevel[level]}]`)

    // 消息
    parts.push(message)

    // 附加参数
    if (args.length > 0) {
      const argsStr = args
        .map(arg => {
          if (arg instanceof Error) {
            return `\n${arg.stack || arg.message}`
          }
          return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        })
        .join(' ')

      if (argsStr) {
        parts.push(argsStr)
      }
    }

    return parts.join(' ')
  }

  /**
   * 写入控制台
   */
  private writeToConsole(level: LogLevel, message: string): void {
    if (!this.config.colorize) {
      console.log(message)
      return
    }

    let colorizedMessage: string

    switch (level) {
      case LogLevel.DEBUG:
        colorizedMessage = chalk.gray(message)
        break
      case LogLevel.INFO:
        colorizedMessage = chalk.blue(message)
        break
      case LogLevel.WARN:
        colorizedMessage = chalk.yellow(message)
        break
      case LogLevel.ERROR:
        colorizedMessage = chalk.red(message)
        break
      default:
        colorizedMessage = message
    }

    if (level === LogLevel.ERROR) {
      console.error(colorizedMessage)
    } else {
      console.log(colorizedMessage)
    }
  }

  /**
   * 写入文件
   */
  private writeToFile(message: string): void {
    if (!this.logFile) {
      return
    }

    try {
      // 移除 ANSI 颜色代码
      const cleanMessage = message.replace(/\x1b\[[0-9;]*m/g, '')
      fs.appendFileSync(this.logFile, cleanMessage + '\n', 'utf-8')
    } catch (error) {
      // 写入失败不影响主流程
      console.warn('写入日志文件失败:', error)
    }
  }

  /**
   * 确保日志文件存在
   */
  private ensureLogFile(): void {
    if (!this.logFile) {
      return
    }

    try {
      const logDir = path.dirname(this.logFile)
      fs.ensureDirSync(logDir)

      if (!fs.existsSync(this.logFile)) {
        fs.writeFileSync(this.logFile, '', 'utf-8')
      }
    } catch (error) {
      console.warn('创建日志文件失败:', error)
      this.logFile = undefined
    }
  }

  /**
   * 清空日志文件
   */
  clearLogFile(): void {
    if (this.logFile && fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, '', 'utf-8')
    }
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level
  }

  /**
   * 获取日志级别
   */
  getLevel(): LogLevel {
    return this.config.level
  }

  /**
   * 创建子 Logger，添加前缀以区分不同模块的日志
   * @param prefix - 日志前缀标识
   * @returns 新的 Logger 实例，所有日志都会添加指定前缀
   * @example
   * ```ts
   * const mainLogger = new Logger()
   * const moduleLogger = mainLogger.child('MyModule')
   * moduleLogger.info('Hello') // 输出: [MyModule] Hello
   * ```
   */
  child(prefix: string): Logger {
    const childLogger = new Logger(this.config)
    const originalLog = childLogger.log.bind(childLogger)

    // 重写 log 方法，添加前缀
    childLogger.log = (level: LogLevel, message: string, ...args: unknown[]) => {
      originalLog(level, `[${prefix}] ${message}`, ...args)
    }

    return childLogger
  }
}

// 默认全局 logger
export const logger = new Logger()

