/**
 * 客户端数据缓存系统
 * 提供简单但有效的内存缓存机制，减少重复API请求
 */

// 缓存条目类型
type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
  lastAccessed: number; // 添加最后访问时间用于LRU策略
};

// 全局缓存配置
const MAX_CACHE_SIZE = 100; // 最大缓存条目数量
const DEFAULT_TTL = 300; // 默认过期时间（秒）

// 全局缓存实例
const memoryCache = new Map<string, CacheEntry<any>>();

// 将数据存储到缓存中
export function cacheData<T>(key: string, data: T, ttlInSeconds = DEFAULT_TTL): void {
  const now = Date.now();
  
  // 检查缓存是否已满，如果已满则进行LRU淘汰
  if (memoryCache.size >= MAX_CACHE_SIZE && !memoryCache.has(key)) {
    evictLeastRecentlyUsed();
  }
  
  memoryCache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttlInSeconds * 1000,
    lastAccessed: now
  });
  
  // 记录缓存操作，便于开发调试
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Cache] Stored: ${key}, Expires in ${ttlInSeconds}s`);
  }
}

// LRU淘汰策略：移除最近最少使用的缓存项
function evictLeastRecentlyUsed(): void {
  let oldestKey: string | null = null;
  let oldestAccessTime = Infinity;
  
  // 使用兼容性更好的方式迭代Map
  memoryCache.forEach((entry, key) => {
    if (entry.lastAccessed < oldestAccessTime) {
      oldestAccessTime = entry.lastAccessed;
      oldestKey = key;
    }
  });
  
  if (oldestKey) {
    memoryCache.delete(oldestKey);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache] LRU Eviction: ${oldestKey}`);
    }
  }
}

// 从缓存中检索数据
export function getCachedData<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  
  if (!entry) {
    return null;
  }
  
  // 检查缓存是否过期
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache] Expired: ${key}`);
    }
    
    return null;
  }
  
  // 更新最后访问时间
  entry.lastAccessed = Date.now();
  
  if (process.env.NODE_ENV === 'development') {
    const remainingTime = Math.floor((entry.expiresAt - Date.now()) / 1000);
    console.log(`[Cache] Hit: ${key}, Expires in ${remainingTime}s`);
  }
  
  return entry.data;
}

// 清除整个缓存或特定键
export function clearCache(key?: string): void {
  if (key) {
    memoryCache.delete(key);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache] Cleared: ${key}`);
    }
  } else {
    memoryCache.clear();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache] Cleared all entries`);
    }
  }
}

// 获取当前缓存大小
export function getCacheSize(): number {
  return memoryCache.size;
}

// 获取所有缓存的键
export function getCacheKeys(): string[] {
  return Array.from(memoryCache.keys());
}

// 检查缓存中是否存在有效的键
export function hasCachedData(key: string): boolean {
  const entry = memoryCache.get(key);
  
  if (!entry) {
    return false;
  }
  
  // 检查缓存是否过期
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return false;
  }
  
  // 更新最后访问时间
  entry.lastAccessed = Date.now();
  
  return true;
}

// 为缓存键添加前缀，防止命名冲突
export function createCacheKey(base: string, params?: Record<string, any>): string {
  if (!params) {
    return `cache:${base}`;
  }
  
  // 将参数对象转换为排序后的查询字符串
  const paramsString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('&');
  
  return `cache:${base}?${paramsString}`;
} 