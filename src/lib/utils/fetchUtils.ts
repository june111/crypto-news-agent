/**
 * 优化的fetch工具函数
 * 包含缓存机制和错误处理
 */

// 内存缓存存储
const cache = new Map();

// 缓存设置
interface CacheOptions {
  ttl?: number; // 缓存生存时间（毫秒）
  key?: string; // 自定义缓存键
}

// 请求选项
interface FetchOptions extends RequestInit {
  useCache?: CacheOptions | boolean; // 缓存选项
  retry?: number; // 重试次数
  timeout?: number; // 超时时间（毫秒）
}

/**
 * 增强的fetch函数
 * @param url 请求URL
 * @param options 请求选项
 * @returns 请求结果
 */
export async function fetchWithCache<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    useCache: cacheOptions = false,
    retry = 0,
    timeout = 8000,
    ...fetchOptions
  } = options;

  // 处理缓存
  if (cacheOptions) {
    const cacheKey = typeof cacheOptions === 'object' && cacheOptions.key
      ? cacheOptions.key
      : url + JSON.stringify(fetchOptions);

    // 检查缓存中是否有有效数据
    const cachedItem = cache.get(cacheKey);
    if (cachedItem) {
      const { data, timestamp } = cachedItem;
      const ttl = typeof cacheOptions === 'object' && cacheOptions.ttl ? cacheOptions.ttl : 60000;
      
      // 如果缓存未过期，返回缓存数据
      if (Date.now() - timestamp < ttl) {
        return data;
      } else {
        // 缓存过期，删除它
        cache.delete(cacheKey);
      }
    }
  }

  // 设置超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    // 尝试fetch请求
    const response = await attemptFetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    }, retry);
    
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 如果需要缓存，存储结果
    if (cacheOptions) {
      const cacheKey = typeof cacheOptions === 'object' && cacheOptions.key
        ? cacheOptions.key
        : url + JSON.stringify(fetchOptions);
        
      cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    }
    
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 带重试的fetch请求
 */
async function attemptFetch(
  url: string,
  options: RequestInit,
  retries: number
): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries <= 0) throw error;
    
    // 指数退避策略
    const delay = Math.min(1000 * (2 ** (3 - retries)), 3000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return attemptFetch(url, options, retries - 1);
  }
}

export default fetchWithCache; 