/**
 * 统一的API请求客户端
 * 提供更一致和可追踪的API请求方式
 */
import { logError, logDebug } from './db/utils/logger';

/**
 * API响应类型
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * 统一的API请求选项
 */
export interface ApiClientOptions extends RequestInit {
  skipErrorHandling?: boolean;
}

/**
 * 生成唯一的请求ID
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 执行API请求
 * @param endpoint API端点（不包含/api/前缀）
 * @param options 请求选项
 * @returns 响应数据
 */
export async function apiClient<T = unknown>(
  endpoint: string, 
  options: ApiClientOptions = {}
): Promise<ApiResponse<T>> {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // 构建完整URL
  const url = endpoint.startsWith('/') 
    ? `/api${endpoint}` 
    : `/api/${endpoint}`;
  
  // 准备请求头
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('x-request-id', requestId);
  headers.set('x-page-request', '1');
  
  // 完整请求配置
  const config: RequestInit = {
    ...options,
    headers,
  };
  
  // 记录请求开始
  logDebug(`API请求开始: ${options.method || 'GET'} ${url}`, { requestId });
  
  try {
    // 发送请求
    const response = await fetch(url, config);
    const duration = Date.now() - startTime;
    
    // 获取响应内容
    let responseData: any;
    const responseText = await response.text();
    
    try {
      // 尝试解析JSON响应
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      // 如果不是有效的JSON
      logError(`API响应不是有效的JSON: ${url}`, { 
        requestId, 
        responseText: responseText.substring(0, 100) 
      });
      
      return { 
        success: false, 
        error: `服务器返回了无效的数据格式 (${response.status})` 
      };
    }
    
    // 根据状态码处理响应
    if (!response.ok && !options.skipErrorHandling) {
      const errorMessage = responseData.error || `请求失败 (${response.status})`;
      logError(`API请求失败: ${url}`, { 
        requestId, 
        status: response.status,
        error: errorMessage,
        duration 
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
    
    // 记录请求成功
    logDebug(`API请求成功: ${url}`, { 
      requestId, 
      status: response.status,
      duration 
    });
    
    // 返回成功响应
    return {
      data: responseData,
      success: true
    };
  } catch (error) {
    // 处理网络错误等
    const errorMessage = error instanceof Error ? error.message : '网络请求失败';
    
    logError(`API请求异常: ${url}`, { 
      requestId, 
      error, 
      duration: Date.now() - startTime 
    });
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * GET请求
 */
export function get<T = unknown>(endpoint: string, options: ApiClientOptions = {}) {
  return apiClient<T>(endpoint, { 
    ...options, 
    method: 'GET' 
  });
}

/**
 * POST请求
 */
export function post<T = unknown>(endpoint: string, data: unknown, options: ApiClientOptions = {}) {
  return apiClient<T>(endpoint, { 
    ...options, 
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * PUT请求
 */
export function put<T = unknown>(endpoint: string, data: unknown, options: ApiClientOptions = {}) {
  return apiClient<T>(endpoint, { 
    ...options, 
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * DELETE请求
 */
export function del<T = unknown>(endpoint: string, options: ApiClientOptions = {}) {
  return apiClient<T>(endpoint, { 
    ...options, 
    method: 'DELETE' 
  });
}

// 默认导出所有方法
export default {
  get,
  post,
  put,
  delete: del,
  request: apiClient
}; 