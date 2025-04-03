/**
 * Dify工作流日志API路由处理程序
 */
import { NextRequest, NextResponse } from 'next/server';
import { DifyChatService } from '@/lib/services/dify';
import { DifyWorkflowLogsParams } from '@/lib/services/dify';

/**
 * 获取工作流日志
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;
    const workflowId = searchParams.get('workflow_id') || undefined;
    const user = searchParams.get('user') || undefined;
    const status = (searchParams.get('status') as 'success' | 'error' | 'running') || undefined;
    
    console.log('获取工作流日志请求:', {
      page, limit, startDate, endDate, workflowId, user, status
    });
    
    // 构建参数对象
    const params: DifyWorkflowLogsParams = {
      page,
      limit,
      start_date: startDate,
      end_date: endDate,
      workflow_id: workflowId,
      user,
      status,
    };
    
    // 创建Dify服务实例
    const difyService = new DifyChatService();
    
    // 获取工作流日志
    const result = await difyService.getWorkflowLogs(params);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '获取工作流日志失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取工作流日志异常:', error);
    
    return NextResponse.json(
      { 
        error: '处理请求时发生错误',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 