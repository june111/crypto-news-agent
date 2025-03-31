/**
 * 热点话题搜索API路由
 * 支持关键词搜索热点话题
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: 搜索热点话题
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    
    // 验证参数
    if (!query) {
      return NextResponse.json(
        { error: '搜索关键词不能为空' },
        { status: 400 }
      );
    }
    
    // 获取所有热点话题
    const allTopics = await db.hotTopics.getAllHotTopics();
    
    // 在服务端进行过滤
    const matchedTopics = allTopics.filter(topic => {
      const title = topic.title || '';
      const description = topic.description || '';
      
      // 匹配标题或描述
      return (
        title.toLowerCase().includes(query.toLowerCase()) ||
        description.toLowerCase().includes(query.toLowerCase())
      );
    });
    
    return NextResponse.json({ topics: matchedTopics });
  } catch (error) {
    console.error('搜索热点话题失败:', error);
    return NextResponse.json(
      { error: '搜索热点话题失败' },
      { status: 500 }
    );
  }
} 