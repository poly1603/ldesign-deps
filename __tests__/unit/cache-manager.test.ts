import { describe, it, expect, beforeEach } from 'vitest'
import { CacheManager } from '../../src/core/cache-manager'

describe('CacheManager', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager({ enabled: true, ttl: 1000, maxSize: 10 })
  })

  describe('set and get', () => {
    it('应该能设置和获取缓存', () => {
      cache.set('key1', 'value1')
      const value = cache.get<string>('key1')
      expect(value).toBe('value1')
    })

    it('应该返回 null 当缓存不存在', () => {
      const value = cache.get('non-existent')
      expect(value).toBeNull()
    })

    it('应该支持不同类型的值', () => {
      cache.set('string', 'test')
      cache.set('number', 42)
      cache.set('object', { foo: 'bar' })
      cache.set('array', [1, 2, 3])

      expect(cache.get('string')).toBe('test')
      expect(cache.get('number')).toBe(42)
      expect(cache.get('object')).toEqual({ foo: 'bar' })
      expect(cache.get('array')).toEqual([1, 2, 3])
    })
  })

  describe('has', () => {
    it('应该正确检测缓存是否存在', () => {
      cache.set('key1', 'value1')
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('non-existent')).toBe(false)
    })
  })

  describe('delete', () => {
    it('应该能删除缓存', () => {
      cache.set('key1', 'value1')
      expect(cache.has('key1')).toBe(true)

      cache.delete('key1')
      expect(cache.has('key1')).toBe(false)
    })
  })

  describe('clear', () => {
    it('应该能清空所有缓存', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      cache.clear()

      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(false)
    })
  })

  describe('TTL', () => {
    it('应该在 TTL 过期后返回 null', async () => {
      const shortTtlCache = new CacheManager({ enabled: true, ttl: 100, maxSize: 10 })
      shortTtlCache.set('key1', 'value1')

      expect(shortTtlCache.get('key1')).toBe('value1')

      // 等待 TTL 过期
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(shortTtlCache.get('key1')).toBeNull()
    })
  })

  describe('统计信息', () => {
    it('应该正确记录命中和未命中', () => {
      cache.set('key1', 'value1')

      cache.get('key1') // hit
      cache.get('key1') // hit
      cache.get('non-existent') // miss

      const stats = cache.getStats()
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBeCloseTo(0.667, 2)
    })

    it('应该正确记录缓存大小', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      const stats = cache.getStats()
      expect(stats.size).toBe(2)
    })
  })

  describe('缓存淘汰', () => {
    it('应该在达到最大大小时淘汰缓存', () => {
      const smallCache = new CacheManager({
        enabled: true,
        maxSize: 3,
        strategy: 'lru'
      })

      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')
      smallCache.set('key3', 'value3')
      smallCache.set('key4', 'value4') // 应该触发淘汰

      const stats = smallCache.getStats()
      expect(stats.size).toBeLessThanOrEqual(3)
    })
  })

  describe('generateKey', () => {
    it('应该生成正确的键', () => {
      const key1 = CacheManager.generateKey('a', 'b', 'c')
      expect(key1).toBe('a:b:c')

      const key2 = CacheManager.generateKey('test')
      expect(key2).toBe('test')
    })
  })
})

