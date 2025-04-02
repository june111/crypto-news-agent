/**
 * 文章API路由
 * 处理文章的获取和创建请求
 */

import { NextRequest, NextResponse } from 'next/server';
import repositories, { initDatabaseOnce } from '@/lib/db';
import { logInfo, logError } from '@/lib/db/utils/logger';

/**
 * GET /api/articles
 * 获取文章列表
 */
export async function GET(request: NextRequest) {
  try {
    // 获取请求ID用于追踪和连接复用
    const requestId = request.headers.get('x-request-id') || 
                     request.headers.get('x-db-request-id') ||
                     `api-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // 检查请求头，判断是否是页面主动请求而非预加载
    const isPageRequest = request.headers.get('X-Page-Request') === '1';
    const url = new URL(request.url);
    
    // 如果不是页面请求，且没有具体查询参数，则可能是预加载，返回空数据
    if (!isPageRequest && url.search === '') {
      logInfo('预加载文章API请求, 返回空数据', { requestId });
      return NextResponse.json([]);
    }
    
    // 按需初始化数据库 - 传递请求ID确保连接复用
    await initDatabaseOnce(requestId);
    
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
    
    logInfo('处理文章列表请求', { 
      requestId, 
      page, 
      pageSize, 
      filters: { status, category, keyword }
    });
    
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
    logError('获取文章列表失败:', { error });
    return NextResponse.json(
      { 
        message: '获取文章列表失败', 
        error: error instanceof Error ? error.message : '未知错误',
        code: error instanceof Error && 'code' in error ? (error as any).code : undefined,
        detail: error instanceof Error ? error.stack : undefined
      },
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
    // 获取请求ID用于追踪和连接复用
    const requestId = request.headers.get('x-request-id') || 
                     request.headers.get('x-db-request-id') ||
                     `api-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // 按需初始化数据库 - 传递请求ID确保连接复用
    await initDatabaseOnce(requestId);
    
    // 获取请求体
    const body = await request.json();
    
    // 简单验证（标题和内容必须存在）
    if (!body.title || !body.content) {
      return NextResponse.json(
        { 
          message: '文章数据无效，标题和内容为必填项',
          error: '文章数据无效，标题和内容为必填项'
        },
        { status: 400 }
      );
    }
    
    // 验证hot_topic_id是否为有效UUID
    if (body.hot_topic_id && typeof body.hot_topic_id === 'string') {
      // 如果是纯数字，给出明确的错误
      if (/^\d+$/.test(body.hot_topic_id)) {
        return NextResponse.json(
          { 
            message: '热点话题ID格式无效', 
            error: `热点话题ID必须是有效的UUID格式，而不是简单的数字"${body.hot_topic_id}"`,
            code: 'INVALID_UUID_FORMAT',
            detail: `热点话题ID值为 "${body.hot_topic_id}" 不是有效的UUID`
          },
          { status: 400 }
        );
      }
    }
    
    // 验证template_id是否为有效UUID
    if (body.template_id && typeof body.template_id === 'string') {
      // 如果是纯数字，给出明确的错误
      if (/^\d+$/.test(body.template_id)) {
        return NextResponse.json(
          { 
            message: '模板ID格式无效', 
            error: `模板ID必须是有效的UUID格式，而不是简单的数字"${body.template_id}"`,
            code: 'INVALID_UUID_FORMAT',
            detail: `模板ID值为 "${body.template_id}" 不是有效的UUID`
          },
          { status: 400 }
        );
      }
    }
    
    logInfo('创建新文章', { requestId, title: body.title });
    
    // 创建文章
    const article = await repositories.articles.createArticle(body);
    
    // 保存封面图片与文章的关联关系
    if (article && article.id && body.cover_image) {
      try {
        // 查询数据库中是否有与这个图片URL相关的记录
        const images = await repositories.images.getImagesByUrl(body.cover_image);
        
        // 如果找到相关图片，更新它们的article_id
        if (images && images.length > 0) {
          for (const image of images) {
            if (!image.article_id) {
              logInfo('更新图片关联的文章ID', { 
                requestId, 
                imageId: image.id, 
                articleId: article.id 
              });
              await repositories.images.updateImageArticleId(image.id, article.id);
            }
          }
        }
      } catch (imgError) {
        // 捕获图片处理错误，但不影响文章创建的成功响应
        logError('更新图片关联文章ID失败:', { 
          error: imgError, 
          articleId: article.id, 
          coverImage: body.cover_image 
        });
      }
    }
    
    return NextResponse.json(article);
  } catch (error) {
    logError('创建文章失败:', { error });
    
    // 增强错误处理，提供更详细的错误信息
    let errorCode = error instanceof Error && 'code' in error ? (error as any).code : undefined;
    let errorMessage = error instanceof Error ? error.message : '未知错误';
    let errorDetail = error instanceof Error ? error.stack : undefined;
    
    // 针对特定错误类型提供更友好的错误信息
    if (errorCode === '22P02' && errorMessage.includes('uuid')) {
      errorMessage = '提供的UUID格式不正确，请检查热点话题ID、模板ID或其他UUID字段的格式';
      errorDetail = `原始错误: ${errorMessage}\n${errorDetail || ''}`;
    }
    
    return NextResponse.json(
      { 
        message: '创建文章失败', 
        error: errorMessage,
        code: errorCode,
        detail: errorDetail
      },
      { status: 500 }
    );
  }
} 