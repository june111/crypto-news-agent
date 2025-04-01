/**
 * 文章API路由
 * 处理文章的获取和创建请求
 */

import { NextRequest, NextResponse } from 'next/server';
import repositories, { initDatabaseOnce } from '@/lib/db';

/**
 * GET /api/articles
 * 获取文章列表
 */
export async function GET(request: NextRequest) {
  try {
    // 检查请求头，判断是否是页面主动请求而非预加载
    const isPageRequest = request.headers.get('X-Page-Request') === '1';
    const url = new URL(request.url);
    
    // 如果不是页面请求，且没有具体查询参数，则可能是预加载，返回空数据
    if (!isPageRequest && url.search === '') {
      console.log('预加载文章API请求, 返回空数据');
      return NextResponse.json([]);
    }
    
    // 按需初始化数据库
    await initDatabaseOnce();
    
    // 提取URL查询参数
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 10;
    const status = url.searchParams.get('status') || undefined;
    const category = url.searchParams.get('category') || undefined;
    const keyword = url.searchParams.get('keyword') || undefined;
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;
    const sortBy = url.searchParams.get('sortField') || undefined;
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;
    
    // 查询数据
    const result = await repositories.articles.getAllArticles({
      page,
      pageSize, 
      status,
      category,
      keyword,
      startDate,
      endDate,
      sortBy,
      sortOrder
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取文章列表失败:', error);
    return NextResponse.json(
      { message: '获取文章列表失败', error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles
 * 创建新文章
 */
export async function POST(request: NextRequest) {
  try {
    // 按需初始化数据库
    await initDatabaseOnce();
    
    // 获取请求体
    const body = await request.json();
    
    // 简单验证（标题和内容必须存在）
    if (!body.title || !body.content) {
      return NextResponse.json(
        { message: '文章数据无效，标题和内容为必填项' },
        { status: 400 }
      );
    }
    
    // 创建文章
    const article = await repositories.articles.createArticle(body);
    
    return NextResponse.json(article);
  } catch (error) {
    console.error('创建文章失败:', error);
    return NextResponse.json(
      { message: '创建文章失败', error: (error as Error).message },
      { status: 500 }
    );
  }
} 