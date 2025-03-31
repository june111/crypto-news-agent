/**
 * 模板API路由
 * 处理模板的获取和创建请求
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: 获取模板列表，支持分页、筛选和排序
export async function GET(request: NextRequest) {
  try {
    // 从URL参数中获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const category = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // 参数校验
    if (isNaN(page) || isNaN(pageSize) || page < 1 || pageSize < 1) {
      return NextResponse.json(
        { error: '无效的分页参数' },
        { status: 400 }
      );
    }

    // 获取模板列表
    const result = await db.templates.getAllTemplates({
      page,
      pageSize,
      category,
      sortBy,
      sortOrder
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取模板列表失败:', error);
    return NextResponse.json(
      { error: '获取模板列表失败' },
      { status: 500 }
    );
  }
}

// POST: 创建新模板
export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const body = await request.json();
    const { name, content, description, category } = body;

    // 验证必填字段
    if (!name || !content) {
      return NextResponse.json(
        { error: '模板名称和内容为必填项' },
        { status: 400 }
      );
    }

    // 创建新模板，符合接口类型限制
    const template = await db.templates.createTemplate({
      name,
      content,
      description,
      category
      // 移除不符合类型定义的变量
      // variables
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('创建模板失败:', error);
    return NextResponse.json(
      { error: '创建模板失败' },
      { status: 500 }
    );
  }
} 