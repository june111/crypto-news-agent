/**
 * Dify应用参数API路由处理程序
 */
import { NextRequest, NextResponse } from 'next/server';
import { DifyChatService } from '@/lib/services/dify';

/**
 * 获取应用参数
 */
export async function GET() {
  try {
    // 创建Dify服务实例
    const difyService = new DifyChatService();
    
    // 获取应用参数
    const result = await difyService.getParameters();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '获取应用参数失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取应用参数异常:', error);
    
    return NextResponse.json(
      { 
        error: '处理请求时发生错误',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 