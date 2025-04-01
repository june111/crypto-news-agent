/**
 * API请求客户端
 * 统一处理API请求，支持错误处理和请求跟踪
 */
import { logDebug, logInfo, logError } from './db/utils/logger';

/**
 * API响应类型
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  statusCode?: number;
}

/**
 * 统一的API请求选项
 */
export interface ApiClientOptions extends RequestInit {
  skipErrorHandling?: boolean;
  requestId?: string;
}

/**
 * 生成唯一的请求ID
 */
function generateRequestId(): string {
  return `api-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 通用API请求函数
 */
async function apiClient<T = any>(
  endpoint: string, 
  options: ApiClientOptions = {}
): Promise<ApiResponse<T>> {
  // 生成唯一请求ID或使用传入的ID
  const requestId = options.requestId || generateRequestId();
  
  // 默认请求头
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // 添加跟踪ID
  headers.set('x-request-id', requestId);
  
  // 设置用于数据库连接复用的头
  if (options.requestId) {
    headers.set('x-db-request-id', options.requestId);
  }
  
  // 请求开始时间
  const startTime = Date.now();
  
  // 构建完整URL
  const url = endpoint.startsWith('/') 
    ? `/api${endpoint}` 
    : `/api/${endpoint}`;
  
  // 记录请求
  logInfo(`API请求: ${options.method || 'GET'} ${url}`, { 
    requestId, 
    method: options.method || 'GET',
    url
  });
  
  try {
    // 发送请求
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // 解析响应
    let data: any = null;
    let error: string | undefined = undefined;
    
    try {
      data = await response.json();
    } catch (e) {
      error = '无效的JSON响应';
      logError('API解析错误', { 
        requestId, 
        error: e,
        url,
        status: response.status
      });
    }
    
    // 构建结果
    const result: ApiResponse<T> = {
      data: data,
      error: data?.error || error,
      success: response.ok && !error && (data?.success !== false),
      statusCode: response.status
    };
    
    // 记录响应时间
    const duration = Date.now() - startTime;
    
    // 记录请求完成
    if (result.success) {
      logInfo(`API请求成功: ${options.method || 'GET'} ${url}`, { 
        requestId,
        duration,
        status: response.status
      });
    } else {
      logError(`API请求失败: ${options.method || 'GET'} ${url}`, { 
        requestId,
        duration,
        status: response.status,
        error: result.error
      });
    }
    
    return result;
  } catch (error) {
    // 记录网络错误
    const duration = Date.now() - startTime;
    logError(`API网络错误: ${options.method || 'GET'} ${url}`, { 
      requestId,
      duration,
      error
    });
    
    return {
      success: false,
      error: '网络请求失败',
      statusCode: 0
    };
  }
}

/**
 * GET请求
 */
export function get<T = any>(endpoint: string, options: ApiClientOptions = {}): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, { 
    ...options, 
    method: 'GET',
    requestId: options.requestId || headers.get('x-request-id')
  });
}

/**
 * POST请求
 */
export function post<T = any>(endpoint: string, data: any, options: ApiClientOptions = {}): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, { 
    ...options, 
    method: 'POST',
    body: JSON.stringify(data),
    requestId: options.requestId || headers.get('x-request-id')
  });
}

/**
 * PUT请求
 */
export function put<T = any>(endpoint: string, data: any, options: ApiClientOptions = {}): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, { 
    ...options, 
    method: 'PUT',
    body: JSON.stringify(data),
    requestId: options.requestId || headers.get('x-request-id')
  });
}

/**
 * DELETE请求
 */
export function del<T = any>(endpoint: string, options: ApiClientOptions = {}): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, { 
    ...options, 
    method: 'DELETE',
    requestId: options.requestId || headers.get('x-request-id')
  });
}

// 获取当前请求的头信息
function getHeadersObject(): Record<string, string> {
  if (typeof window === 'undefined') {
    // 服务器环境
    return {};
  }
  
  // 客户端环境 - 尝试获取当前请求ID
  return {};
}

// 获取当前请求头
const headers = new Headers(getHeadersObject());

// 导出默认对象
const api = { get, post, put, delete: del };
export default api; 