import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from './runtimeConfig';

// 获取运行时配置的环境变量
const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseAnonKey();

// 判断是否使用模拟模式
const useMockMode = process.env.MOCK_DB === 'true' || !supabaseUrl || !supabaseKey;

// 创建Supabase客户端
export const supabase = useMockMode 
  ? createMockClient() 
  : createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });

// 返回模拟客户端，用于没有Supabase配置时
function createMockClient() {
  console.log('使用模拟Supabase客户端，上传功能将不可用');
  
  // 模拟Supabase客户端API
  return {
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
    // 其他API可以根据需要添加
  };
}

// 获取单例客户端实例
export function getSupabaseClient() {
  return supabase;
}

// 创建带有请求ID的Supabase客户端，用于跟踪API请求
export function getSupabaseClientWithRequestId(requestId: string) {
  if (useMockMode) {
    return supabase;
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        'x-request-id': requestId
      }
    }
  });
} 