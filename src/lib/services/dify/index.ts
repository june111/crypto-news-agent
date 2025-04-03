/**
 * Dify.ai服务
 * 提供与Dify.ai的API交互功能
 */

import { DifyConfig } from './config';
import { logDebug, logInfo, logError } from '../../db/utils/logger';

// 定义变量参数类型
export interface DifyVariables {
  [key: string]: string | number | boolean | Array<string | number | boolean>;
}

// 定义对话历史记录类型
export interface DifyMessageHistory {
  role: 'user' | 'assistant';
  content: string;
}

// 定义对话请求类型
export interface DifyChatRequest {
  inputs?: DifyVariables;
  query: string;
  response_mode?: 'streaming' | 'blocking';
  conversation_id?: string;
  user?: string;
  files?: string[];
}

// 定义工作流请求类型
export interface DifyWorkflowRequest {
  inputs?: DifyVariables;
  response_mode?: 'streaming' | 'blocking';
  user: string;
  files?: string[];
}

// 定义工作流日志请求参数
export interface DifyWorkflowLogsParams {
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  workflow_id?: string;
  user?: string;
  status?: 'success' | 'error' | 'running';
}

// 定义对话响应类型
export interface DifyResponse {
  id: string;
  answer: string;
  conversation_id: string;
  created_at: number;
  message_id: string;
  metadata?: any;
  success: boolean;
  error?: string;
}

/**
 * Dify聊天服务类
 */
export class DifyChatService {
  private apiKey: string;
  private apiEndpoint: string;
  private appId: string;
  
  constructor() {
    this.apiKey = DifyConfig.getDifyApiKey();
    this.apiEndpoint = DifyConfig.DIFY_CONFIG.apiEndpoint;
    this.appId = DifyConfig.getDifyAppId();
  }
  
  /**
   * 发送对话消息到Dify
   */
  async sendMessage(request: DifyChatRequest): Promise<DifyResponse> {
    try {
      // 构建完整URL
      const url = `${this.apiEndpoint}/chat-messages`;
      
      // 构造请求体
      const body = {
        app_id: this.appId,
        ...request,
      };
      
      // 记录请求
      logInfo('发送请求到Dify API', { 
        appId: this.appId,
        query: request.query,
        inputs: request.inputs,
      });
      
      // 发送请求
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logError('Dify API请求失败', { 
          status: response.status,
          error: errorText,
        });
        
        return {
          id: '',
          answer: '',
          conversation_id: '',
          created_at: Date.now(),
          message_id: '',
          success: false,
          error: `请求失败: ${response.status} ${errorText}`,
        };
      }
      
      const data = await response.json();
      
      // 记录成功响应
      logInfo('收到Dify API响应', { 
        messageId: data.message_id,
        conversationId: data.conversation_id,
      });
      
      return {
        id: data.id || '',
        answer: data.answer || '',
        conversation_id: data.conversation_id || '',
        created_at: data.created_at || Date.now(),
        message_id: data.message_id || '',
        metadata: data.metadata,
        success: true,
      };
    } catch (error) {
      logError('Dify API请求异常', { error });
      
      return {
        id: '',
        answer: '',
        conversation_id: '',
        created_at: Date.now(),
        message_id: '',
        success: false,
        error: `请求异常: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
  
  /**
   * 运行Dify工作流 (Completion应用)
   */
  async runWorkflow(request: DifyWorkflowRequest): Promise<DifyResponse> {
    try {
      // 构建完整URL
      const url = `${this.apiEndpoint}/workflows/run`;
      
      // 记录请求
      logInfo('发送工作流请求到Dify API', { 
        appId: this.appId,
        inputs: request.inputs,
        user: request.user
      });
      
      // 发送请求
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logError('Dify工作流API请求失败', { 
          status: response.status,
          error: errorText,
        });
        
        return {
          id: '',
          answer: '',
          conversation_id: '',
          created_at: Date.now(),
          message_id: '',
          success: false,
          error: `请求失败: ${response.status} ${errorText}`,
        };
      }
      
      const data = await response.json();
      
      // 记录成功响应
      logInfo('收到Dify工作流API响应', { 
        id: data.id,
      });
      
      return {
        id: data.id || '',
        answer: data.answer || '',
        conversation_id: data.conversation_id || '',
        created_at: data.created_at || Date.now(),
        message_id: data.message_id || '',
        metadata: data.metadata,
        success: true,
      };
    } catch (error) {
      logError('Dify工作流API请求异常', { error });
      
      return {
        id: '',
        answer: '',
        conversation_id: '',
        created_at: Date.now(),
        message_id: '',
        success: false,
        error: `请求异常: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
  
  /**
   * 获取工作流执行状态
   */
  async getWorkflowStatus(workflowId: string): Promise<any> {
    try {
      // 构建完整URL
      const url = `${this.apiEndpoint}/workflows/run/${workflowId}`;
      
      // 记录请求
      logInfo('获取工作流状态', { workflowId });
      
      // 发送请求
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logError('获取工作流状态失败', { 
          status: response.status,
          error: errorText,
          workflowId,
        });
        
        return {
          success: false,
          error: `请求失败: ${response.status} ${errorText}`,
        };
      }
      
      const data = await response.json();
      
      // 记录成功响应
      logInfo('获取工作流状态成功', { workflowId });
      
      return {
        ...data,
        success: true,
      };
    } catch (error) {
      logError('获取工作流状态异常', { 
        error,
        workflowId,
      });
      
      return {
        success: false,
        error: `请求异常: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
  
  /**
   * 停止工作流任务
   */
  async stopWorkflowTask(taskId: string): Promise<any> {
    try {
      // 构建完整URL
      const url = `${this.apiEndpoint}/workflows/tasks/${taskId}/stop`;
      
      // 记录请求
      logInfo('停止工作流任务', { taskId });
      
      // 发送请求
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logError('停止工作流任务失败', { 
          status: response.status,
          error: errorText,
          taskId,
        });
        
        return {
          success: false,
          error: `请求失败: ${response.status} ${errorText}`,
        };
      }
      
      const data = await response.json();
      
      // 记录成功响应
      logInfo('停止工作流任务成功', { taskId });
      
      return {
        ...data,
        success: true,
      };
    } catch (error) {
      logError('停止工作流任务异常', { 
        error,
        taskId,
      });
      
      return {
        success: false,
        error: `请求异常: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
  
  /**
   * 获取工作流日志
   */
  async getWorkflowLogs(params: DifyWorkflowLogsParams = {}): Promise<any> {
    try {
      // 构建URL参数
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.workflow_id) queryParams.append('workflow_id', params.workflow_id);
      if (params.user) queryParams.append('user', params.user);
      if (params.status) queryParams.append('status', params.status);
      
      // 构建完整URL - 使用正确的API端点
      const url = `${this.apiEndpoint}/workflows/logs?${queryParams.toString()}`;
      
      // 记录请求
      logInfo('获取工作流日志', { params });
      
      // 发送请求
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logError('获取工作流日志失败', { 
          status: response.status,
          error: errorText,
          params,
        });
        
        return {
          success: false,
          error: `请求失败: ${response.status} ${errorText}`,
        };
      }
      
      const data = await response.json();
      
      // 将返回数据标准化为前端期望的格式
      const formattedData = {
        page: params.page || 1,
        limit: params.limit || 10,
        total: data.total || 0,
        has_more: data.has_more || false,
        data: data.data || [],
        success: true
      };
      
      // 记录成功响应
      logInfo('获取工作流日志成功', { count: formattedData.total });
      
      return formattedData;
    } catch (error) {
      logError('获取工作流日志异常', { 
        error,
        params,
      });
      
      return {
        success: false,
        error: `请求异常: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
  
  /**
   * 获取应用参数
   */
  async getParameters(): Promise<any> {
    try {
      // 构建完整URL
      const url = `${this.apiEndpoint}/parameters`;
      
      // 记录请求
      logInfo('获取应用参数');
      
      // 发送请求
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logError('获取应用参数失败', { 
          status: response.status,
          error: errorText,
        });
        
        return {
          success: false,
          error: `请求失败: ${response.status} ${errorText}`,
        };
      }
      
      const data = await response.json();
      
      // 记录成功响应
      logInfo('获取应用参数成功');
      
      return {
        ...data,
        success: true,
      };
    } catch (error) {
      logError('获取应用参数异常', { error });
      
      return {
        success: false,
        error: `请求异常: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
  
  /**
   * 根据输入变量生成内容
   */
  async generateContent(query: string, inputs?: DifyVariables, conversationId?: string): Promise<DifyResponse> {
    return this.sendMessage({
      query,
      inputs,
      response_mode: 'blocking',
      conversation_id: conversationId,
    });
  }
  
  /**
   * 获取对话历史
   */
  async getConversationHistory(conversationId: string): Promise<DifyMessageHistory[]> {
    try {
      // 构建完整URL
      const url = `${this.apiEndpoint}/conversations/${conversationId}/messages`;
      
      // 发送请求
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logError('获取Dify对话历史失败', { 
          status: response.status,
          error: errorText,
          conversationId,
        });
        
        return [];
      }
      
      const data = await response.json();
      
      // 转换为标准格式
      return (data.data || []).map((message: any) => ({
        role: message.role || 'user',
        content: message.content || '',
      }));
    } catch (error) {
      logError('获取Dify对话历史异常', { 
        error,
        conversationId,
      });
      
      return [];
    }
  }
}

// 创建实例
const difyService = {
  DifyChatService,
  createService: () => new DifyChatService(),
};

export default difyService; 