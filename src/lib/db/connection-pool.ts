/**
 * Supabase连接池管理
 * 使用React cache API实现真正的单例模式，解决Next.js路由隔离问题
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { logDebug } from './utils/logger';

// 连接尝试计数
let connectionAttempts = 0;
const MAX_ATTEMPTS = 3;

// 使用React cache API实现真正的单例模式
export const getSupabaseClient = cache(() => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
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
    logDebug('Supabase连接创建失败', { requestId, error });
    return null;
  }
});

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
    logDebug('数据库健康检查失败', { error });
    return false;
  }
} 