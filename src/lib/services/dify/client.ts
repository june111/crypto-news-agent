/**
 * Dify客户端服务
 * 前端使用的Dify API客户端
 */
import api from '@/lib/api-client';
import { 
  DifyContentGenerationParams, 
  DifyContentResult, 
  DifyVariables,
  DifyMessageHistory,
  DifyWorkflowRunParams,
  DifyWorkflowRunResult 
} from './types';

/**
 * 生成随机用户ID
 */
function generateUserId(): string {
  return `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Dify客户端服务类
 */
export class DifyClient {
  // 存储用户ID
  private static userId: string = generateUserId();
  
  /**
   * 生成内容
   */
  static async generateContent(params: DifyContentGenerationParams): Promise<DifyContentResult> {
    try {
      // 添加用户ID和确保标题存在
      const requestParams = {
        ...params,
        user: params.user || this.userId,
        title: params.inputs?.title || '默认标题' // 确保标题字段存在
      };
      
      const response = await api.post('/dify', requestParams);
      
      if (!response.success) {
        return {
          content: '',
          conversationId: '',
          messageId: '',
          success: false,
          error: response.error || '请求失败',
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Dify客户端生成内容异常:', error);
      
      return {
        content: '',
        conversationId: '',
        messageId: '',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * 运行工作流
   */
  static async runWorkflow(params: DifyWorkflowRunParams): Promise<DifyWorkflowRunResult> {
    try {
      // 准备请求参数，添加系统必要的参数
      const requestParams = {
        inputs: {
          ...params.inputs,
          "sys.files": params.files || [],
        },
        user_id: params.userId || process.env.DIFY_USER_ID || this.userId,
        workflow_id: params.workflowId || process.env.DIFY_WORKFLOW_ID,
      };
      
      // 发送请求到后端API
      const response = await api.post('/dify/workflow/run', requestParams);
      
      if (!response.success) {
        console.error('运行工作流失败:', response.error);
        return {
          success: false,
          error: response.error || '运行工作流失败',
          workflowRunId: '',
          result: null
        };
      }
      
      return {
        success: true,
        workflowRunId: response.data.workflow_run_id || '',
        result: response.data.result || null
      };
    } catch (error) {
      console.error('运行工作流异常:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        workflowRunId: '',
        result: null
      };
    }
  }
  
  /**
   * 获取对话历史
   */
  static async getConversationHistory(conversationId: string): Promise<DifyMessageHistory[]> {
    try {
      const response = await api.get(`/dify/conversation/${conversationId}`);
      
      if (!response.success) {
        console.error('获取对话历史失败:', response.error);
        return [];
      }
      
      return response.data.messages || [];
    } catch (error) {
      console.error('获取对话历史异常:', error);
      return [];
    }
  }
  
  /**
   * 使用模板生成内容
   */
  static async generateFromTemplate(
    template: string,
    variables: DifyVariables,
    title: string = '模板生成内容'
  ): Promise<DifyContentResult> {
    // 将变量插入模板中
    let processedTemplate = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g');
      processedTemplate = processedTemplate.replace(
        placeholder, 
        Array.isArray(value) ? value.join(', ') : String(value)
      );
    }
    
    // 使用处理后的模板作为查询
    return this.generateContent({
      query: processedTemplate,
      inputs: {
        template: processedTemplate,
        ...variables,
        title: title // 确保标题字段存在
      },
      user: this.userId
    });
  }
  
  /**
   * 获取工作流执行状态
   */
  static async getWorkflowStatus(workflowId: string): Promise<any> {
    try {
      const response = await api.get(`/dify/workflow/${workflowId}`);
      
      if (!response.success) {
        console.error('获取工作流状态失败:', response.error);
        return { success: false, error: response.error };
      }
      
      return response.data;
    } catch (error) {
      console.error('获取工作流状态异常:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
  
  /**
   * 停止工作流任务
   */
  static async stopWorkflowTask(taskId: string): Promise<any> {
    try {
      const response = await api.post(`/dify/workflow/task/${taskId}/stop`, {});
      
      if (!response.success) {
        console.error('停止工作流任务失败:', response.error);
        return { success: false, error: response.error };
      }
      
      return response.data;
    } catch (error) {
      console.error('停止工作流任务异常:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
  
  /**
   * 获取工作流日志列表
   */
  static async getWorkflowLogs(params: {
    page?: number; 
    limit?: number;
    startDate?: string;
    endDate?: string;
    workflowId?: string;
    user?: string;
    status?: 'success' | 'error' | 'running';
  } = {}): Promise<{
    success: boolean;
    page: number;
    limit: number;
    total: number;
    data: any[];
    error?: string;
  }> {
    try {
      // 构建查询参数
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.startDate) queryParams.append('start_date', params.startDate);
      if (params.endDate) queryParams.append('end_date', params.endDate);
      if (params.workflowId) queryParams.append('workflow_id', params.workflowId);
      if (params.user) queryParams.append('user', params.user);
      if (params.status) queryParams.append('status', params.status);
      
      // 发送请求到后端API
      const response = await api.get(`/dify/workflow/logs?${queryParams.toString()}`);
      
      // 标准化返回结构，确保data是数组
      const result = {
        success: false,
        page: params.page || 1,
        limit: params.limit || 10,
        total: 0,
        data: [] as any[],
        error: ''
      };
      
      if (response.success) {
        // 确保返回安全的数据结构
        result.success = true;
        
        // 从响应中获取数据
        const responseData = response.data || {};
        
        // 提取分页信息
        if (typeof responseData.page === 'number') {
          result.page = responseData.page;
        }
        
        if (typeof responseData.limit === 'number') {
          result.limit = responseData.limit;
        }
        
        if (typeof responseData.total === 'number') {
          result.total = responseData.total;
        }
        
        // 确保data是数组
        if (responseData.data && Array.isArray(responseData.data)) {
          result.data = responseData.data;
        } else if (Array.isArray(responseData)) {
          result.data = responseData;
        }
      } else {
        result.error = response.error || '获取工作流日志失败';
      }
      
      return result;
    } catch (error) {
      console.error('获取工作流日志异常:', error);
      return {
        success: false,
        page: params.page || 1,
        limit: params.limit || 10,
        total: 0,
        data: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * 获取应用参数
   */
  static async getParameters(): Promise<any> {
    try {
      const response = await api.get('/dify/parameters');
      
      if (!response.success) {
        console.error('获取应用参数失败:', response.error);
        return { success: false, error: response.error };
      }
      
      return response.data;
    } catch (error) {
      console.error('获取应用参数异常:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
}

export default DifyClient; 