/**
 * 热门趋势话题API路由
 * 获取当前趋势热点话题
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: 获取热门趋势话题
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 验证参数
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: '无效的limit参数' },
        { status: 400 }
      );
    }
    
    // 获取趋势话题
    const topics = await db.hotTopics.getTrendingTopics(limit);
    
    return NextResponse.json({ topics });
  } catch (error) {
    console.error('获取热门趋势话题失败:', error);
    return NextResponse.json(
      { error: '获取热门趋势话题失败' },
      { status: 500 }
    );
  }
} 