/**
 * Dify工作流状态API路由处理程序
 */
import { NextRequest, NextResponse } from 'next/server';
import { DifyChatService } from '@/lib/services/dify';

/**
 * 获取工作流执行状态
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取工作流ID
    const workflowId = params.id;
    
    // 验证必要参数
    if (!workflowId) {
      return NextResponse.json(
        { error: '缺少必要参数: workflowId' },
        { status: 400 }
      );
    }
    
    // 创建Dify服务实例
    const difyService = new DifyChatService();
    
    // 获取工作流状态
    const result = await difyService.getWorkflowStatus(workflowId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '获取工作流状态失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取工作流状态异常:', error);
    
    return NextResponse.json(
      { 
        error: '处理请求时发生错误',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 