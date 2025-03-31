/**
 * 文章API路由
 * 处理文章的获取和创建请求
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Article } from '@/lib/db/schema';

// GET: 获取文章列表
export async function GET(request: NextRequest) {
  try {
    // 从URL参数中获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const keyword = searchParams.get('keyword') || '';
    const dateStr = searchParams.get('date') || '';
    
    let startDate: string | undefined;
    if (dateStr) {
      startDate = `${dateStr}`;
    }
    
    // 获取文章列表
    const result = await db.articles.getAllArticles({
      page,
      pageSize,
      status: status as 'draft' | 'pending' | 'published' | 'rejected' | 'failed' | undefined,
      category,
      keyword,
      startDate
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取文章列表失败:', error);
    return NextResponse.json(
      { error: '获取文章列表失败' },
      { status: 500 }
    );
  }
}

// POST: 创建新文章
export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const body = await request.json() as Partial<Article>;
    
    // 创建新文章
    const article = await db.articles.createArticle(body);
    
    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('创建文章失败:', error);
    return NextResponse.json(
      { error: '创建文章失败' },
      { status: 500 }
    );
  }
} 