import { useState, useEffect, useCallback } from 'react';
import { cacheData, getCachedData, clearCache } from '@/util/cache';

interface UseCachedFetchOptions<T> {
  initialData?: T;
  ttlInSeconds?: number;
  disabled?: boolean;
  fetchOptions?: RequestInit;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseCachedFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
  isCached: boolean;
}

/**
 * 带缓存的数据获取hook
 * 自动缓存请求结果，减少重复请求
 */
export function useCachedFetch<T>(
  url: string,
  options: UseCachedFetchOptions<T> = {}
): UseCachedFetchResult<T> {
  const {
    initialData = null,
    ttlInSeconds = 300,
    disabled = false,
    fetchOptions,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(!disabled);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);

  // 获取数据函数
  const fetchData = useCallback(async (skipCache = false): Promise<void> => {
    if (disabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 如果不跳过缓存，首先尝试从缓存中获取
      if (!skipCache) {
        const cachedData = getCachedData<T>(url);
        if (cachedData) {
          setData(cachedData);
          setIsCached(true);
          setLoading(false);
          onSuccess?.(cachedData);
          return;
        }
      }

      // 如果缓存中没有数据或已过期，则从远程获取
      setIsCached(false);
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`);
      }

      const result = await response.json();

      // 将获取的数据存储到缓存中
      cacheData<T>(url, result, ttlInSeconds);

      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [url, disabled, fetchOptions, ttlInSeconds, onSuccess, onError]);

  // 清除此URL的缓存并重新获取数据
  const refetch = useCallback(async (): Promise<void> => {
    await fetchData(true); // 跳过缓存
  }, [fetchData]);

  // 只清除缓存，不重新获取
  const clearUrlCache = useCallback((): void => {
    clearCache(url);
  }, [url]);

  // 首次渲染时获取数据
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, disabled]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache: clearUrlCache,
    isCached
  };
} 