/**
 * 模板API路由
 * 处理模板的获取和创建请求
 */

import { NextRequest, NextResponse } from 'next/server';
import repositories, { initDatabaseOnce } from '@/lib/db';
import { logInfo, logError } from '@/lib/db/utils/logger';

/**
 * 获取文章模板列表
 */
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
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '100');
    
    logInfo('获取文章模板', { requestId, category, page, pageSize });
    
    // 获取模板列表，传递正确的参数对象
    const result = await repositories.templates.getAllTemplates({
      page,
      pageSize,
      category,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    
    // 确保result.templates是有效的数组
    if (!result || !result.templates || !Array.isArray(result.templates)) {
      logError('获取到的模板数据格式不正确:', result);
      return NextResponse.json({
        templates: [],
        count: 0,
        total: 0,
        page: page,
        pageSize: pageSize,
        totalPages: 0,
        message: "获取文章模板数据格式异常",
        success: false
      }, { status: 500 });
    }
    
    // 确保模板数据格式一致
    const formattedTemplates = result.templates.map(template => {
      // 使用类型断言确保类型安全
      const typedTemplate = template as {
        id?: string;
        name?: string;
        description?: string;
        category?: string;
        content?: string;
        usage_count?: number;
        created_at?: string;
        updated_at?: string;
      };
      
      // 确保所有必要字段都存在
      return {
        id: typedTemplate.id || '',
        name: typedTemplate.name || '',
        title: typedTemplate.name || '', // 兼容前端可能使用title的情况
        description: typedTemplate.description || '',
        category: typedTemplate.category || '未分类',
        content: typedTemplate.content || '',
        usage_count: typedTemplate.usage_count || 0,
        created_at: typedTemplate.created_at || new Date().toISOString(),
        updated_at: typedTemplate.updated_at || new Date().toISOString()
      };
    });
    
    // 返回模板列表
    return NextResponse.json({
      templates: formattedTemplates,
      count: formattedTemplates.length,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      message: "成功获取文章模板",
      success: true
    });
  } catch (error) {
    logError('获取文章模板列表失败:', { error });
    return NextResponse.json(
      { 
        error: '获取文章模板列表失败',
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
    // 获取请求ID用于追踪和连接复用
    const requestId = request.headers.get('x-request-id') || 
                     request.headers.get('x-db-request-id') ||
                     `api-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                     
    // 确保数据库初始化
    await initDatabaseOnce(requestId);
                     
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

    logInfo('创建新模板', { requestId, templateName: name });

    // 创建新模板，符合接口类型限制
    const template = await repositories.templates.createTemplate({
      name,
      content,
      description: description || '',
      category: category || '未分类'
    });

    if (!template) {
      return NextResponse.json(
        { error: '创建模板失败，服务器内部错误' },
        { status: 500 }
      );
    }

    logInfo('模板创建成功', { requestId, templateId: template.id });
    
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    logError('创建模板失败:', { error });
    return NextResponse.json(
      { 
        error: '创建模板失败',
        message: error instanceof Error ? error.message : '未知错误',
        success: false
      },
      { status: 500 }
    );
  }
} 