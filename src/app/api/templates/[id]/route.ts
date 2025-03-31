/**
 * 模板详情API路由
 * 处理单个模板的获取、更新和删除请求
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// 提取模板ID的工具函数
function extractTemplateId(params: { id: string }) {
  return params.id;
}

// GET: 获取单个模板
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const templateId = extractTemplateId(resolvedParams);
    
    // 获取模板
    const template = await db.templates.getTemplateById(templateId);
    
    if (!template) {
      return NextResponse.json(
        { error: '模板不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('获取模板失败:', error);
    return NextResponse.json(
      { error: '获取模板失败' },
      { status: 500 }
    );
  }
}

// PUT: 更新模板
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const templateId = extractTemplateId(resolvedParams);
    const body = await request.json();
    
    // 验证模板是否存在
    const existingTemplate = await db.templates.getTemplateById(templateId);
    if (!existingTemplate) {
      return NextResponse.json(
        { error: '模板不存在' },
        { status: 404 }
      );
    }
    
    // 更新模板
    const updatedTemplate = await db.templates.updateTemplate(templateId, body);
    
    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('更新模板失败:', error);
    return NextResponse.json(
      { error: '更新模板失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除模板
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const templateId = extractTemplateId(resolvedParams);
    
    // 验证模板是否存在
    const existingTemplate = await db.templates.getTemplateById(templateId);
    if (!existingTemplate) {
      return NextResponse.json(
        { error: '模板不存在' },
        { status: 404 }
      );
    }
    
    // 删除模板
    const success = await db.templates.deleteTemplate(templateId);
    
    if (!success) {
      return NextResponse.json(
        { error: '删除模板失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除模板失败:', error);
    return NextResponse.json(
      { error: '删除模板失败' },
      { status: 500 }
    );
  }
}

// PATCH: 增加模板使用次数
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json(
        { error: '缺少模板ID' },
        { status: 400 }
      );
    }

    const template = await db.templates.incrementTemplateUsage(id);
    return NextResponse.json(template);
  } catch (error) {
    console.error(`增加模板使用次数失败:`, error);
    return NextResponse.json(
      { error: '增加模板使用次数失败' },
      { status: 500 }
    );
  }
} 