/**
 * 热点话题API路由
 * 处理获取和创建热点话题的请求
 */

import { NextRequest, NextResponse } from 'next/server';
import db, { initDatabaseOnce } from '@/lib/db';
import { HotTopicFilter } from '@/lib/db/repositories/hotTopicsRepository';
import { logInfo, logError } from '@/lib/db/utils/logger';

// GET: 获取热点话题列表
export async function GET(request: NextRequest) {
  try {
    // 获取请求ID用于追踪和连接复用
    const requestId = request.headers.get('x-request-id') || 
                     request.headers.get('x-db-request-id') ||
                     `api-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // 确保数据库初始化
    await initDatabaseOnce(requestId);
    
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
    
    logInfo('获取热点话题', { requestId, filter });
    
    // 获取热点话题
    const topics = await db.hotTopics.getAllHotTopics(filter);
    
    logInfo('热点话题原始数据', { count: topics.length, sample: topics.slice(0, 2) });
    
    if (topics.length === 0) {
      logInfo('从Supabase获取的热点话题为空', { requestId });
    }
    
    // 将旧版数据结构转换为新版数据结构
    const formattedTopics = topics.map(topic => {
      // 处理旧版API可能的字段名不一致问题
      const oldTopic = topic as any; // 使用any类型断言处理旧版数据结构
      
      // 确保volume字段始终为数字类型
      let volume = typeof topic.volume !== 'undefined' ? Number(topic.volume) : 0;
      
      // 尝试从可能的替代字段获取热度值
      if (volume === 0) {
        if (typeof oldTopic.score !== 'undefined') volume = Number(oldTopic.score);
        else if (typeof oldTopic.popularity !== 'undefined') volume = Number(oldTopic.popularity);
      }
      
      const formattedTopic = {
        id: topic.id,
        keyword: topic.keyword || oldTopic.title || '', // 支持旧版title字段
        volume: volume, // 确保为数字类型
        source: topic.source || '',
        date: topic.created_at ? new Date(topic.created_at).toISOString().split('T')[0] : '',
        created_at: topic.created_at || new Date().toISOString(),
        updated_at: topic.updated_at || new Date().toISOString(),
        related_articles: topic.related_articles || []
      };
      
      // 如果volume为NaN或undefined，设为0
      if (isNaN(formattedTopic.volume)) {
        console.warn(`话题 ${formattedTopic.keyword} 的热度值无效，设为0`);
        formattedTopic.volume = 0;
      }
      
      return formattedTopic;
    });
    
    logInfo('热点话题获取成功', { 
      requestId, 
      count: formattedTopics.length,
      sample: formattedTopics.slice(0, 2)
    });
    
    // 设置响应头，指定字符编码为UTF-8
    return new NextResponse(
      JSON.stringify({ 
        topics: formattedTopics,
        message: "成功获取热点话题",
        count: formattedTopics.length,
        success: true
      }, null, 2), 
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
  } catch (error) {
    logError('获取热点话题列表失败:', { error });
    return NextResponse.json(
      { 
        error: '获取热点话题列表失败',
        message: error instanceof Error ? error.message : '未知错误',
        topics: [],
        success: false
      },
      { status: 500 }
    );
  }
}

// POST: 创建新热点话题
export async function POST(request: NextRequest) {
  try {
    // 获取请求ID用于追踪和连接复用
    const requestId = request.headers.get('x-request-id') || 
                     request.headers.get('x-db-request-id') ||
                     `api-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // 确保数据库初始化
    await initDatabaseOnce(requestId);
    
    const body = await request.json();
    const { keyword, volume, source } = body;
    
    logInfo('接收到热点话题创建请求:', { requestId, keyword, volume, source });
    
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
      logError('创建热点话题失败，db.hotTopics.createHotTopic返回null', { requestId });
      return NextResponse.json(
        { error: '创建热点话题失败' },
        { status: 500 }
      );
    }
    
    logInfo('热点话题创建成功:', { requestId, topicId: topic.id });
    
    // 设置响应头，指定字符编码为UTF-8
    return new NextResponse(
      JSON.stringify(topic, null, 2),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
  } catch (error) {
    logError('创建热点话题失败:', { error });
    return NextResponse.json(
      { error: '创建热点话题失败' },
      { status: 500 }
    );
  }
} 