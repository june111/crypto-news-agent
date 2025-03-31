/**
 * 单个热点话题API路由
 * 处理获取、更新、删除单个热点话题及增加话题搜索量
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { HotTopic } from '@/lib/db/schema';

// GET: 获取单个热点话题
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json(
        { error: '缺少热点话题ID' },
        { status: 400 }
      );
    }

    const topic = await db.hotTopics.getHotTopic(id);
    if (!topic) {
      return NextResponse.json(
        { error: '热点话题不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(topic);
  } catch (error) {
    console.error(`获取热点话题失败:`, error);
    return NextResponse.json(
      { error: '获取热点话题失败' },
      { status: 500 }
    );
  }
}

// PUT: 更新热点话题
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json(
        { error: '缺少热点话题ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { keyword, volume, source, status, date } = body;

    // 构建更新数据
    const updateData: Partial<HotTopic> = {};
    if (keyword !== undefined) updateData.keyword = keyword;
    if (volume !== undefined) updateData.volume = volume;
    if (source !== undefined) updateData.source = source;
    if (status !== undefined) updateData.status = status;
    if (date !== undefined) updateData.date = date;

    // 至少需要一个更新字段
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '未提供任何更新字段' },
        { status: 400 }
      );
    }

    const topic = await db.hotTopics.updateHotTopic(id, updateData);
    if (!topic) {
      return NextResponse.json(
        { error: '热点话题不存在或更新失败' },
        { status: 404 }
      );
    }

    return NextResponse.json(topic);
  } catch (error) {
    console.error(`更新热点话题失败:`, error);
    return NextResponse.json(
      { error: '更新热点话题失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除热点话题
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json(
        { error: '缺少热点话题ID' },
        { status: 400 }
      );
    }

    const success = await db.hotTopics.deleteHotTopic(id);
    if (!success) {
      return NextResponse.json(
        { error: '热点话题不存在或删除失败' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`删除热点话题失败:`, error);
    return NextResponse.json(
      { error: '删除热点话题失败' },
      { status: 500 }
    );
  }
}

// PATCH: 增加热点话题搜索量或设置为趋势/归档
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json(
        { error: '缺少热点话题ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, volume } = body;

    if (!action) {
      return NextResponse.json(
        { error: '缺少操作类型参数' },
        { status: 400 }
      );
    }

    let result;
    let success = false;

    switch (action) {
      case 'increment_volume':
        success = await db.hotTopics.incrementHotTopicVolume(id, volume || 1);
        if (!success) {
          return NextResponse.json(
            { error: '增加热点话题搜索量失败' },
            { status: 500 }
          );
        }
        result = { success: true };
        break;

      case 'mark_trending':
        result = await db.hotTopics.markTopicAsTrending(id);
        if (!result) {
          return NextResponse.json(
            { error: '设置热点话题为趋势失败' },
            { status: 500 }
          );
        }
        break;

      case 'archive':
        result = await db.hotTopics.archiveTopic(id);
        if (!result) {
          return NextResponse.json(
            { error: '归档热点话题失败' },
            { status: 500 }
          );
        }
        break;

      default:
        return NextResponse.json(
          { error: `不支持的操作类型: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`热点话题操作失败:`, error);
    return NextResponse.json(
      { error: '热点话题操作失败' },
      { status: 500 }
    );
  }
} 