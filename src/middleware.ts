import { NextResponse, NextRequest } from 'next/server';

/**
 * 中间件 - 提高网站性能和缓存控制
 */
export function middleware(request: NextRequest) {
  // 创建响应对象
  const response = NextResponse.next();
  
  // 设置性能相关的头部
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  // 针对静态资源添加缓存控制
  const { pathname } = request.nextUrl;
  if (
    pathname.includes('/_next/') || // Next.js静态资源
    pathname.includes('/images/') || // 图片
    pathname.endsWith('.ico') || // 图标
    pathname.endsWith('.svg')    // SVG文件
  ) {
    // 为静态资源添加强缓存 (1小时)
    response.headers.set('Cache-Control', 'public, max-age=3600, immutable');
  } else if (pathname.startsWith('/api/') && request.headers.get('x-preload')) {
    // 预加载API请求添加特殊的缓存控制
    response.headers.set('Cache-Control', 'public, max-age=60');
  }
  
  return response;
}

// 只匹配这些路径
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 