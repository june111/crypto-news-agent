/**
 * Dify API路由处理程序
 */
import { NextRequest, NextResponse } from 'next/server';
import { DifyChatService } from '@/lib/services/dify';
import { DifyContentResult, DifyVariables } from '@/lib/services/dify/types';

// 处理内容生成请求
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { query, inputs, title, content, user } = body;
    
    // 验证用户参数
    if (!user) {
      return NextResponse.json(
        { error: '缺少必要参数: user' },
        { status: 400 }
      );
    }
    
    // 确保有标题参数
    if (!title && !inputs?.title) {
      return NextResponse.json(
        { error: '缺少必要参数: title' },
        { status: 400 }
      );
    }
    
    // 创建Dify服务实例
    const difyService = new DifyChatService();
    
    // 发送请求到Dify工作流API
    const response = await difyService.runWorkflow({
      inputs: {
        ...(inputs as DifyVariables),
        title: title || inputs?.title,
        content: content || query || inputs?.content || ''
      },
      user: user,
      response_mode: 'blocking'
    });
    
    // 格式化响应数据
    const result: DifyContentResult = {
      content: response.answer,
      conversationId: response.conversation_id || '',
      messageId: response.message_id || response.id || '',
      success: response.success,
      error: response.error,
      metadata: response.metadata,
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Dify API处理异常:', error);
    
    return NextResponse.json(
      { 
        error: '处理请求时发生错误',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 处理健康检查请求
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'dify-api',
    timestamp: new Date().toISOString(),
  });
} 