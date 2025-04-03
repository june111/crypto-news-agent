/**
 * Dify配置测试路由
 */
import { NextRequest, NextResponse } from 'next/server';
import { DifyConfig } from '@/lib/services/dify/config';

export async function GET(request: NextRequest) {
  try {
    // 获取环境变量中的配置
    const config = {
      apiEndpoint: process.env.DIFY_API_ENDPOINT,
      apiKey: process.env.DIFY_API_KEY,
      appId: process.env.DIFY_APP_ID,
      workflowId: process.env.DIFY_WORKFLOW_ID,
      userId: process.env.DIFY_USER_ID
    };
    
    // 获取DifyConfig中的配置
    const difyConfigValues = {
      apiEndpoint: DifyConfig.DIFY_CONFIG.apiEndpoint,
      apiKey: DifyConfig.getDifyApiKey(),
      appId: DifyConfig.getDifyAppId(),
      fullConfig: DifyConfig.getConfig()
    };
    
    return NextResponse.json({
      success: true,
      env: config,
      difyConfig: difyConfigValues,
      process_env_exists: !!process.env,
      node_env: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('测试Dify配置异常:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: '处理请求时发生错误',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 