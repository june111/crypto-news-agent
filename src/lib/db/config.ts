/**
 * 统一数据库配置管理模块
 * 提供所有数据库相关配置和环境变量管理
 */

// 配置获取接口
export interface DatabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string | null;
  useMockMode: boolean;
  debugMode: boolean;
}

/**
 * 获取数据库配置
 * 统一处理所有环境变量和配置逻辑
 */
export function getDatabaseConfig(): DatabaseConfig {
  // 获取Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     process.env.SUPABASE_URL || 
                     '';
  
  // 获取客户端密钥（匿名密钥）
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                         process.env.SUPABASE_ANON_KEY || 
                         '';
  
  // 获取服务端密钥（具有更高权限）
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 
                            process.env.SUPABASE_KEY || 
                            null;
  
  // 判断是否使用模拟模式
  const useMockMode = process.env.MOCK_DB === 'true' || 
                     (process.env.NODE_ENV === 'test' && !supabaseUrl) || 
                     (process.env.NODE_ENV === 'development' && !supabaseUrl && process.env.USE_MOCK_DATA === 'true') ||
                     (!supabaseUrl || !supabaseAnonKey);
  
  // 判断是否启用调试模式
  const debugMode = process.env.DEBUG_SUPABASE === 'true';
  
  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceKey,
    useMockMode,
    debugMode
  };
}

/**
 * 获取Supabase URL
 * 保留向后兼容性
 */
export function getSupabaseUrl(): string {
  return getDatabaseConfig().supabaseUrl;
}

/**
 * 获取Supabase匿名密钥
 * 保留向后兼容性
 */
export function getSupabaseAnonKey(): string {
  return getDatabaseConfig().supabaseAnonKey;
}

/**
 * 获取Supabase服务密钥
 * 保留向后兼容性
 */
export function getSupabaseServiceKey(): string | null {
  return getDatabaseConfig().supabaseServiceKey;
}

/**
 * 检查是否使用模拟模式
 */
export function isUsingMockMode(): boolean {
  return getDatabaseConfig().useMockMode;
}

/**
 * 是否启用调试模式
 */
export function isDebugMode(): boolean {
  return getDatabaseConfig().debugMode;
} 