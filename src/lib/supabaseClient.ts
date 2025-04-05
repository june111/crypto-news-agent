/**
 * 兼容层
 * 提供向后兼容的Supabase客户端接口
 * 推荐直接使用src/lib/db/client.ts中的函数
 */
import { 
  supabase, 
  getSupabaseClient as getSupabaseClientImpl, 
  getSupabaseClientForRequest 
} from './db/client';

// 导出默认客户端实例
export { supabase };

// 获取单例客户端实例
export function getSupabaseClient() {
  return supabase;
}

// 创建带有请求ID的Supabase客户端，用于跟踪API请求
export function getSupabaseClientWithRequestId(requestId: string) {
  return getSupabaseClientForRequest(requestId);
} 