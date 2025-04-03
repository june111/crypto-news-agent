/**
 * Dify工作流运行API路由
 */
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { logger } from '@/lib/logger';

/**
 * POST处理程序 - 运行工作流
 */
export async function POST(req: NextRequest) {
  try {
    const requestData = await req.json();
    
    // 验证必要的输入参数
    if (!requestData.inputs) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要的inputs参数'
      }, { status: 400 });
    }
    
    // 获取必要的环境变量
    const apiEndpoint = process.env.DIFY_API_ENDPOINT;
    const apiKey = process.env.DIFY_API_KEY;
    const userId = requestData.user_id || process.env.DIFY_USER_ID;
    const appId = process.env.DIFY_APP_ID;
    const workflowId = requestData.workflow_id || process.env.DIFY_WORKFLOW_ID;
    
    if (!apiEndpoint || !apiKey || !appId || !workflowId) {
      logger.error('缺少Dify API配置', { apiEndpoint, appId, workflowId });
      return NextResponse.json({ 
        success: false, 
        error: 'Dify API配置不完整'
      }, { status: 500 });
    }

    // 构建回调URL
    const callbackUrl = new URL('/api/dify/callback', req.url).toString();
    logger.info(`设置回调URL: ${callbackUrl}`);

    // 准备请求参数
    const payload = {
      inputs: {
        ...requestData.inputs,
        "sys.user_id": userId,
        "sys.app_id": appId,
        "sys.workflow_id": workflowId,
        "sys.workflow_run_id": `run-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      },
      callback_url: callbackUrl // 添加回调URL
    };
    
    // 发送请求到Dify API
    const response = await axios.post(
      `${apiEndpoint}/workflows/run`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // 返回结果
    return NextResponse.json({
      success: true,
      workflow_run_id: response.data.workflow_run_id || payload.inputs["sys.workflow_run_id"],
      result: response.data.result || null,
      callback_url: callbackUrl
    });
    
  } catch (error: any) {
    // 记录错误日志
    logger.error('运行Dify工作流失败', { 
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    // 返回错误响应
    return NextResponse.json({ 
      success: false, 
      error: error.message || '运行工作流失败'
    }, { status: error.response?.status || 500 });
  }
} 