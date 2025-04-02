/**
 * 文章详情API路由
 * 处理单个文章的获取、更新和删除请求
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { isValidUUID } from '@/utils/uuid';

// 提取文章ID的工具函数
function extractArticleId(params: { id: string }) {
  return params.id;
}

// GET: 获取单个文章
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const articleId = extractArticleId(resolvedParams);
    
    // 获取文章
    const article = await db.articles.getArticleById(articleId);
    
    if (!article) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(article);
  } catch (error) {
    console.error('获取文章失败:', error);
    return NextResponse.json(
      { 
        error: '获取文章失败',
        message: error instanceof Error ? error.message : '未知错误',
        code: error instanceof Error && 'code' in error ? (error as any).code : undefined,
        detail: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PUT: 更新文章
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const articleId = extractArticleId(resolvedParams);
    const body = await request.json();
    
    // 验证文章是否存在
    const existingArticle = await db.articles.getArticleById(articleId);
    if (!existingArticle) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
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
      
      // 确保是有效的UUID
      if (!isValidUUID(body.hot_topic_id)) {
        return NextResponse.json(
          { 
            message: '热点话题ID格式无效', 
            error: `提供的热点话题ID不是有效的UUID格式: "${body.hot_topic_id}"`,
            code: 'INVALID_UUID_FORMAT'
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
      
      // 确保是有效的UUID
      if (!isValidUUID(body.template_id)) {
        return NextResponse.json(
          { 
            message: '模板ID格式无效', 
            error: `提供的模板ID不是有效的UUID格式: "${body.template_id}"`,
            code: 'INVALID_UUID_FORMAT'
          },
          { status: 400 }
        );
      }
    }
    
    // 更新文章
    const updatedArticle = await db.articles.updateArticle(articleId, body);
    
    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error('更新文章失败:', error);
    
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
        error: '更新文章失败', 
        message: errorMessage,
        code: errorCode,
        detail: errorDetail
      },
      { status: 500 }
    );
  }
}

// DELETE: 删除文章
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const articleId = extractArticleId(resolvedParams);
    
    // 验证文章是否存在
    const existingArticle = await db.articles.getArticleById(articleId);
    if (!existingArticle) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      );
    }
    
    // 删除文章
    const success = await db.articles.deleteArticle(articleId);
    
    if (!success) {
      return NextResponse.json(
        { error: '删除文章失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除文章失败:', error);
    
    // 增强错误处理，提供更详细的错误信息
    let errorCode = error instanceof Error && 'code' in error ? (error as any).code : undefined;
    let errorMessage = error instanceof Error ? error.message : '未知错误';
    let errorDetail = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: '删除文章失败',
        message: errorMessage,
        code: errorCode,
        detail: errorDetail
      },
      { status: 500 }
    );
  }
} 