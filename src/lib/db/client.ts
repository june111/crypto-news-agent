/**
 * 统一Supabase客户端管理模块
 * 提供客户端创建、连接池管理和模拟客户端功能
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { getDatabaseConfig, isUsingMockMode, isDebugMode } from './config';

// 全局单例客户端，确保整个应用只有一个连接实例
let globalClientInstance: SupabaseClient | null = null;

// 请求级别的连接缓存
const connectionCache: Map<string, SupabaseClient> = new Map();

// 存储定时器ID的映射，用于清理
const connectionTimers: Map<string, NodeJS.Timeout> = new Map();

// 连接尝试计数
let connectionAttempts = 0;
const MAX_ATTEMPTS = 3;

// 定时清理不活跃的连接
const CONNECTION_TIMEOUT = 10 * 60 * 1000; // 10分钟
let lastCleanupTime = Date.now();

/**
 * 创建模拟客户端，用于开发和测试
 */
function createMockClient() {
  console.log('使用模拟Supabase客户端，某些功能将受限');
  
  // 确保全局存储初始化
  if (typeof global !== 'undefined' && !global.__mockStorage) {
    global.__mockStorage = {
      articles: [
        { id: 'art-mock-1', title: '模拟文章1', status: 'published' },
        { id: 'art-mock-2', title: '模拟文章2', status: 'draft' }
      ],
      templates: [
        { id: 'tpl-mock-1', name: '模拟模板1', usage_count: 5 },
        { id: 'tpl-mock-2', name: '模拟模板2', usage_count: 3 }
      ],
      ai_tasks: [
        { id: 'task-mock-1', type: 'summary', status: 'completed' },
        { id: 'task-mock-2', type: 'content', status: 'pending' }
      ],
      hot_topics: [
        { id: 'topic-mock-1', title: '模拟热门话题1', score: 90 },
        { id: 'topic-mock-2', title: '模拟热门话题2', score: 70 }
      ]
    };
  }

  // 基础模拟客户端实现
  const mockClient = {
    // 模拟storage功能
    storage: {
      from: (bucket: string) => ({
        upload: () => ({
          data: { path: `mock-path-${Date.now()}` },
          error: null
        }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://mock-storage.example.com/${bucket}/${path}` }
        }),
        list: () => ({
          data: [],
          error: null
        }),
        remove: () => ({
          data: null,
          error: null
        })
      })
    },
    // 扩展其他需要的功能
    from: (table: string) => {
      // 更完整的模拟数据库实现可以在此扩展...
      return {
        select: () => ({ /* ... */ }),
        insert: () => ({ /* ... */ }),
        // 其他方法...
      };
    }
  };
  
  return mockClient;
}

/**
 * 创建真实的Supabase客户端实例
 */
function createSupabaseClient(requestId: string): SupabaseClient | null {
  const config = getDatabaseConfig();
  
  // 检查是否应该使用模拟模式
  if (config.useMockMode) {
    return createMockClient() as unknown as SupabaseClient;
  }
  
  // 防止过多的连接尝试
  if (connectionAttempts >= MAX_ATTEMPTS) {
    console.log('已达到最大连接尝试次数');
    return null;
  }

  connectionAttempts++;
  
  try {
    if (isDebugMode()) {
      console.log('创建Supabase连接...', { 
        requestId,
        attempt: connectionAttempts
      });
    }
    
    // 创建客户端实例，添加请求追踪
    const clientInstance = createClient(config.supabaseUrl, 
      config.supabaseServiceKey || config.supabaseAnonKey, {
      auth: { persistSession: false },
      global: { 
        headers: { 
          'x-connection-id': requestId,
          'x-client-info': 'crypto-news-app'
        }
      },
    });
    
    if (isDebugMode()) {
      console.log('Supabase连接创建成功', { requestId });
    }
    
    // 重置连接尝试计数
    connectionAttempts = 0;
    
    return clientInstance;
  } catch (error) {
    console.error('Supabase连接创建失败', { requestId, error });
    return null;
  }
}

/**
 * 清理长时间未使用的连接，但保留全局单例
 */
function cleanupConnectionCache() {
  const cacheSize = connectionCache.size;
  if (cacheSize > 0) {
    // 清理所有定时器
    connectionTimers.forEach((timerId) => {
      clearTimeout(timerId);
    });
    connectionTimers.clear();
    
    // 保留全局单例连接
    connectionCache.clear();
    // 如果存在全局实例，确保它仍在缓存中
    if (globalClientInstance) {
      connectionCache.set('global-singleton', globalClientInstance);
    }
    
    if (isDebugMode()) {
      console.log(`执行连接缓存清理，当前缓存大小从 ${cacheSize} 变为 ${connectionCache.size}`);
    }
  }
}

/**
 * 基于请求ID获取Supabase客户端
 * 确保同一个请求使用同一个连接
 */
export function getSupabaseClientForRequest(requestId?: string): SupabaseClient | null {
  // 优先使用全局单例
  if (globalClientInstance) {
    return globalClientInstance;
  }
  
  // 如果没有提供requestId，生成一个新的
  const currentRequestId = requestId || `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // 检查连接缓存中是否已有该请求的连接
  if (connectionCache.has(currentRequestId)) {
    return connectionCache.get(currentRequestId) || null;
  }
  
  // 创建新连接
  const client = createSupabaseClient(currentRequestId);
  
  // 如果是第一个连接，设置为全局单例
  if (client && !globalClientInstance) {
    globalClientInstance = client;
  }
  
  // 缓存新创建的连接
  if (client) {
    connectionCache.set(currentRequestId, client);
    
    // 清除已有定时器(如果存在)
    if (connectionTimers.has(currentRequestId)) {
      clearTimeout(connectionTimers.get(currentRequestId));
      connectionTimers.delete(currentRequestId);
    }
    
    // 设置超时自动清理
    const timerId = setTimeout(() => {
      if (connectionCache.has(currentRequestId) && 
          connectionCache.get(currentRequestId) !== globalClientInstance) {
        connectionCache.delete(currentRequestId);
      }
      // 清理定时器引用
      connectionTimers.delete(currentRequestId);
    }, CONNECTION_TIMEOUT);
    
    // 存储定时器ID以便后续清理
    connectionTimers.set(currentRequestId, timerId);
    
    // 定期清理整个缓存
    const now = Date.now();
    if (now - lastCleanupTime > CONNECTION_TIMEOUT) {
      cleanupConnectionCache();
      lastCleanupTime = now;
    }
  }
  
  return client;
}

/**
 * 使用React cache API获取Supabase客户端
 * 优先使用全局单例来确保真正的单一实例模式
 */
export const getSupabaseClient = cache((requestId?: string) => {
  // 优先使用全局连接实例
  if (globalClientInstance) {
    return globalClientInstance;
  }
  
  // 如果请求ID存在，尝试获取该请求的缓存连接
  if (requestId && connectionCache.has(requestId)) {
    return connectionCache.get(requestId) || null;
  }
  
  const effectiveRequestId = requestId || 
    `global-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // 否则创建新连接
  const client = createSupabaseClient(effectiveRequestId);
  
  // 设置为全局单例
  if (client && !globalClientInstance) {
    globalClientInstance = client;
  }
  
  return client;
});

/**
 * 导出默认客户端实例（单例模式）
 * 用于简单场景
 */
export const supabase = getSupabaseClient();

/**
 * 执行数据库健康检查
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  
  try {
    const { error } = await client.from('articles').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('数据库健康检查失败', { error });
    return false;
  }
} 