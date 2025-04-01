import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 全局中间件
 * 用于添加请求ID、缓存控制和性能跟踪
 */
export function middleware(request: NextRequest) {
  // 生成唯一请求ID
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // 准备新的请求头
  const headers = new Headers(request.headers);
  headers.set('x-request-id', requestId);
  
  // 为API路由设置专门的缓存控制
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // 阻止浏览器缓存API响应
    headers.set('Cache-Control', 'no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // 添加性能监控头
    headers.set('x-request-start', Date.now().toString());
    headers.set('x-request-path', request.nextUrl.pathname);
    
    // 为数据库连接复用添加请求ID
    headers.set('x-db-request-id', requestId);
  }
  
  // 继续请求处理，但使用修改后的请求头
  const response = NextResponse.next({
    request: {
      headers
    }
  });
  
  // 设置响应头以支持客户端请求跟踪
  response.headers.set('x-response-id', requestId);
  
  return response;
}

// 配置中间件适用的路由
export const config = {
  matcher: [
    // 应用于所有API路由
    '/api/:path*',
    // 应用于主要页面路由
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}; 