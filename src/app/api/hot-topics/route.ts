/**
 * 热点话题API路由
 * 处理获取和创建热点话题的请求
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { HotTopicFilter } from '@/lib/db/repositories/hotTopicsRepository';

// GET: 获取热点话题列表
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source') || '';
    const minVolume = searchParams.get('minVolume') ? parseInt(searchParams.get('minVolume')!) : undefined;
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    
    // 构建过滤条件
    const filter: HotTopicFilter = {};
    
    if (source) filter.source = source;
    if (minVolume !== undefined) filter.minVolume = minVolume;
    
    if (startDate || endDate) {
      filter.dateRange = {};
      if (startDate) filter.dateRange.start = startDate;
      if (endDate) filter.dateRange.end = endDate;
    }
    
    // 获取热点话题
    const topics = await db.hotTopics.getAllHotTopics(filter);
    
    // 将旧版数据结构转换为新版数据结构
    const formattedTopics = topics.map(topic => {
      // 处理旧版API可能的字段名不一致问题
      const oldTopic = topic as any; // 使用any类型断言处理旧版数据结构
      return {
        id: topic.id,
        keyword: topic.keyword || oldTopic.title || '', // 支持旧版title字段
        volume: typeof topic.volume !== 'undefined' ? topic.volume : (oldTopic.score || 0), // 支持旧版score字段
        source: topic.source || '',
        date: topic.created_at ? new Date(topic.created_at).toISOString().split('T')[0] : '',
        created_at: topic.created_at || new Date().toISOString(),
        updated_at: topic.updated_at || new Date().toISOString(),
        related_articles: topic.related_articles || []
      };
    });
    
    return NextResponse.json({ topics: formattedTopics });
  } catch (error) {
    console.error('获取热点话题列表失败:', error);
    return NextResponse.json(
      { error: '获取热点话题列表失败' },
      { status: 500 }
    );
  }
}

// POST: 创建新热点话题
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, volume, source } = body;
    
    console.log('接收到热点话题创建请求:', { keyword, volume, source });
    
    // 验证必填字段
    if (!keyword) {
      return NextResponse.json(
        { error: '关键词为必填项' },
        { status: 400 }
      );
    }
    
    // 创建热点话题
    const now = new Date().toISOString();
    const topic = await db.hotTopics.createHotTopic({
      keyword,
      volume: Number(volume),
      source,
      created_at: now,
      updated_at: now,
      related_articles: []
    });
    
    if (!topic) {
      console.error('创建热点话题失败，db.hotTopics.createHotTopic返回null');
      return NextResponse.json(
        { error: '创建热点话题失败' },
        { status: 500 }
      );
    }
    
    console.log('热点话题创建成功:', topic);
    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error('创建热点话题失败:', error);
    return NextResponse.json(
      { error: '创建热点话题失败' },
      { status: 500 }
    );
  }
} 