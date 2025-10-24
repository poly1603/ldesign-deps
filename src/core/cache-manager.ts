import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import type { CacheEntry, CacheConfig, CacheStats } from '../types'

/**
 * 智能缓存管理器 - 缓存依赖检查结果，提升性能
 */
export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map()
  private config: CacheConfig
  private persistPath: string
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    size: 0,
    maxSize: 0
  }

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      enabled: true,
      ttl: 3600000, // 1小时
      maxSize: 1000,
      strategy: 'lru',
      ...config
    }

    this.stats.maxSize = this.config.maxSize
    this.persistPath = this.config.persistPath || path.join(os.tmpdir(), 'ldesign-deps-cache.json')

    if (this.config.enabled) {
      this.load()
    }
  }

  /**
   * 获取缓存值
   */
  get<T>(key: string): T | null {
    if (!this.config.enabled) {
      return null
    }

    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // 检查是否过期
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.size = this.cache.size
      this.updateHitRate()
      return null
    }

    // 更新命中次数
    entry.hits++
    this.stats.hits++
    this.updateHitRate()

    return entry.value as T
  }

  /**
   * 设置缓存值
   */
  set<T>(key: string, value: T, ttl?: number): void {
    if (!this.config.enabled) {
      return
    }

    // 检查缓存大小限制
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evict()
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl,
      hits: 0
    }

    this.cache.set(key, entry)
    this.stats.size = this.cache.size
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key)
    this.stats.size = this.cache.size
    return result
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    if (!this.config.enabled) {
      return false
    }

    const entry = this.cache.get(key)
    if (!entry) {
      return false
    }

    // 检查是否过期
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.stats.size = this.cache.size
      return false
    }

    return true
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
    this.stats.size = 0
    this.stats.hits = 0
    this.stats.misses = 0
    this.stats.hitRate = 0
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * 持久化缓存到磁盘
   */
  async persist(): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    try {
      const data = Array.from(this.cache.entries())
      await fs.writeJSON(this.persistPath, data, { spaces: 2 })
    } catch (error) {
      // 持久化失败不影响主流程
      console.warn('缓存持久化失败:', error)
    }
  }

  /**
   * 从磁盘加载缓存
   */
  async load(): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    try {
      if (await fs.pathExists(this.persistPath)) {
        const data = await fs.readJSON(this.persistPath)
        this.cache = new Map(data)

        // 清理过期缓存
        this.cleanExpired()
        this.stats.size = this.cache.size
      }
    } catch (error) {
      // 加载失败不影响主流程，清空缓存
      this.cache.clear()
      console.warn('缓存加载失败:', error)
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanExpired(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * 缓存淘汰策略
   */
  private evict(): void {
    switch (this.config.strategy) {
      case 'lru':
        this.evictLRU()
        break
      case 'lfu':
        this.evictLFU()
        break
      case 'fifo':
        this.evictFIFO()
        break
    }
  }

  /**
   * LRU 淘汰策略 - 最近最少使用
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * LFU 淘汰策略 - 最不常使用
   */
  private evictLFU(): void {
    let leastUsedKey: string | null = null
    let leastHits = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits
        leastUsedKey = key
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
    }
  }

  /**
   * FIFO 淘汰策略 - 先进先出
   */
  private evictFIFO(): void {
    const firstKey = this.cache.keys().next().value
    if (firstKey) {
      this.cache.delete(firstKey)
    }
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  /**
   * 生成缓存键
   */
  static generateKey(...parts: string[]): string {
    return parts.join(':')
  }
}

