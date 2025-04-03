/**
 * Dify停止工作流任务API路由处理程序
 */
import { NextRequest, NextResponse } from 'next/server';
import { DifyChatService } from '@/lib/services/dify';

/**
 * 停止工作流任务
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取任务ID
    const taskId = params.id;
    
    // 验证必要参数
    if (!taskId) {
      return NextResponse.json(
        { error: '缺少必要参数: taskId' },
        { status: 400 }
      );
    }
    
    // 创建Dify服务实例
    const difyService = new DifyChatService();
    
    // 停止工作流任务
    const result = await difyService.stopWorkflowTask(taskId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '停止工作流任务失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('停止工作流任务异常:', error);
    
    return NextResponse.json(
      { 
        error: '处理请求时发生错误',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 