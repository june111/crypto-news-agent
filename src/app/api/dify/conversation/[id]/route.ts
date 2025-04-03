/**
 * Dify对话历史API路由处理程序
 */
import { NextRequest, NextResponse } from 'next/server';
import { DifyChatService } from '@/lib/services/dify';

// 获取对话历史
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取对话ID
    const conversationId = params.id;
    
    // 验证必要参数
    if (!conversationId) {
      return NextResponse.json(
        { error: '缺少必要参数: conversationId' },
        { status: 400 }
      );
    }
    
    // 创建Dify服务实例
    const difyService = new DifyChatService();
    
    // 获取对话历史
    const history = await difyService.getConversationHistory(conversationId);
    
    return NextResponse.json({
      conversationId,
      messages: history,
      success: true,
    });
  } catch (error) {
    console.error('获取Dify对话历史异常:', error);
    
    return NextResponse.json(
      { 
        error: '处理请求时发生错误',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 