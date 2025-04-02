/**
 * 模板API路由
 * 处理模板的获取和创建请求
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: 获取模板列表，支持分页、筛选和排序
export async function GET(request: NextRequest) {
  try {
    // 获取请求ID用于追踪和连接复用
    const requestId = request.headers.get('x-request-id') || 
                     request.headers.get('x-db-request-id') ||
                     `api-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
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
        { 
          error: '无效的分页参数',
          templates: [],
          success: false 
        },
        { status: 400 }
      );
    }

    console.log(`获取模板列表，参数: page=${page}, pageSize=${pageSize}, category=${category}, sortBy=${sortBy}, sortOrder=${sortOrder}`);

    // 获取模板列表
    const result = await db.templates.getAllTemplates({
      page,
      pageSize,
      category,
      sortBy,
      sortOrder
    });

    console.log(`获取到 ${result.templates.length} 个模板，总计: ${result.total}`);
    
    if (result.templates.length > 0) {
      console.log('模板示例:', result.templates.slice(0, 2));
    } else {
      console.log('未找到任何模板');
    }

    // 确保一致的响应格式
    return NextResponse.json({
      templates: result.templates,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      success: true,
      message: "成功获取模板"
    });
  } catch (error) {
    console.error('获取模板列表失败:', error);
    return NextResponse.json(
      { 
        error: '获取模板列表失败', 
        message: error instanceof Error ? error.message : '未知错误',
        templates: [],
        success: false
      },
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