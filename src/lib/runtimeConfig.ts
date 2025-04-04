/**
 * 运行时配置
 * 提供一种安全获取配置的方式，同时处理构建时环境变量不可用的问题
 */

// 定义全局配置类型
interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
  }
}

// 声明全局Window类型扩展
declare global {
  interface Window {
    appConfig?: AppConfig
  }
}

/**
 * 获取Supabase URL
 * 优先级: process.env > window.appConfig > 硬编码默认值
 */
export function getSupabaseUrl(): string {
  // 服务端
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || 
           'https://ogfhdqvpiuyvnpxtrytc.supabase.co';
  }
  
  // 客户端
  return process.env.NEXT_PUBLIC_SUPABASE_URL || 
         (window.appConfig?.supabase?.url || 'https://ogfhdqvpiuyvnpxtrytc.supabase.co');
}

/**
 * 获取Supabase匿名密钥
 * 优先级: process.env > window.appConfig > 硬编码默认值
 */
export function getSupabaseAnonKey(): string {
  // 服务端
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
           'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZmhkcXZwaXV5dm5weHRyeXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTk5NDMsImV4cCI6MjA1ODg5NTk0M30.ND9VlhWkrNLKJ85LKOg8H9b1JlA-5AyNk0ETxoOgFUs';
  }
  
  // 客户端
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
         (window.appConfig?.supabase?.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZmhkcXZwaXV5dm5weHRyeXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMTk5NDMsImV4cCI6MjA1ODg5NTk0M30.ND9VlhWkrNLKJ85LKOg8H9b1JlA-5AyNk0ETxoOgFUs');
} 