/**
 * Supabase连接池管理
 * 使用React cache API实现真正的单例模式，解决Next.js路由隔离问题
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { logDebug, logError } from './utils/logger';

// 全局连接单例，确保整个应用只有一个连接实例
// 包括跨路由和API边界的情况
let globalClientInstance: SupabaseClient | null = null;

// 请求级别的连接缓存，防止在同一请求中创建多个连接
const connectionCache: Map<string, SupabaseClient> = new Map();

// 连接尝试计数
let connectionAttempts = 0;
const MAX_ATTEMPTS = 3;

// 定时清理不活跃的连接
const CONNECTION_TIMEOUT = 10 * 60 * 1000; // 10分钟
let lastCleanupTime = Date.now();

/**
 * 基于请求ID获取Supabase客户端
 * 确保同一个请求使用同一个连接
 */
export function getSupabaseClientForRequest(requestId?: string): SupabaseClient | null {
  // 优先使用全局单例
  if (globalClientInstance) {
    logDebug(`使用全局Supabase连接`, { requestId });
    return globalClientInstance;
  }
  
  // 如果没有提供requestId，生成一个新的
  const currentRequestId = requestId || `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // 检查连接缓存中是否已有该请求的连接
  if (connectionCache.has(currentRequestId)) {
    const cachedClient = connectionCache.get(currentRequestId);
    logDebug(`复用已有Supabase连接`, { requestId: currentRequestId });
    return cachedClient || null;
  }
  
  // 创建新连接
  const client = createSupabaseClient(currentRequestId);
  
  // 如果是第一个连接，设置为全局单例
  if (client && !globalClientInstance) {
    globalClientInstance = client;
    logDebug(`设置全局Supabase连接单例`, { requestId: currentRequestId });
  }
  
  // 缓存新创建的连接
  if (client) {
    connectionCache.set(currentRequestId, client);
    
    // 设置超时自动清理
    setTimeout(() => {
      if (connectionCache.has(currentRequestId) && 
          connectionCache.get(currentRequestId) !== globalClientInstance) {
        connectionCache.delete(currentRequestId);
        logDebug(`连接超时清理`, { requestId: currentRequestId });
      }
    }, CONNECTION_TIMEOUT);
    
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
 * 清理长时间未使用的连接，但保留全局单例
 */
function cleanupConnectionCache() {
  const cacheSize = connectionCache.size;
  if (cacheSize > 0) {
    // 保留全局单例连接
    connectionCache.clear();
    // 如果存在全局实例，确保它仍在缓存中
    if (globalClientInstance) {
      connectionCache.set('global-singleton', globalClientInstance);
    }
    logDebug(`执行连接缓存清理，当前缓存大小从 ${cacheSize} 变为 ${connectionCache.size}`);
  }
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
 * 创建Supabase客户端实例
 */
function createSupabaseClient(requestId: string): SupabaseClient | null {
  // 检查环境变量
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 
                      process.env.SUPABASE_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    logDebug('Supabase凭证未配置', { requestId });
    return null;
  }

  // 防止过多的连接尝试
  if (connectionAttempts >= MAX_ATTEMPTS) {
    logDebug('已达到最大连接尝试次数', { requestId });
    return null;
  }

  connectionAttempts++;
  
  try {
    logDebug('创建Supabase连接...', { 
      requestId,
      attempt: connectionAttempts,
      urlPrefix: supabaseUrl.substring(0, 8) + '...',
      keyPrefix: supabaseKey.substring(0, 10) + '...'
    });
    
    // 创建客户端实例，添加请求追踪
    const clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { 
        headers: { 
          'x-connection-id': requestId,
          'x-client-info': 'crypto-news-app'
        }
      },
    });
    
    logDebug('Supabase连接创建成功', { requestId });
    
    // 重置连接尝试计数
    connectionAttempts = 0;
    
    return clientInstance;
  } catch (error) {
    logError('Supabase连接创建失败', { requestId, error });
    return null;
  }
}

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
    logError('数据库健康检查失败', { error });
    return false;
  }
} 