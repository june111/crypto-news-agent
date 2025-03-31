/**
 * 文章详情API路由
 * 处理单个文章的获取、更新和删除请求
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

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
      { error: '获取文章失败' },
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
    
    // 更新文章
    const updatedArticle = await db.articles.updateArticle(articleId, body);
    
    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error('更新文章失败:', error);
    return NextResponse.json(
      { error: '更新文章失败' },
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
    return NextResponse.json(
      { error: '删除文章失败' },
      { status: 500 }
    );
  }
} 