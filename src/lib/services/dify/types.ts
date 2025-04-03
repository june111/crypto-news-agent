/**
 * Dify.ai服务类型定义
 */

// 定义变量参数类型
export interface DifyVariables {
  [key: string]: string | number | boolean | Array<string | number | boolean> | null;
}

// 定义对话历史记录类型
export interface DifyMessageHistory {
  id?: string;
  createdAt?: string;
  role: 'user' | 'assistant';
  content: string;
}

// Dify内容生成请求参数
export interface DifyContentGenerationParams {
  query?: string;
  inputs?: DifyVariables & {
    title?: string;
    content?: string;
  };
  title?: string;
  content?: string;
  conversationId?: string;
  user?: string;
  responseMode?: 'blocking' | 'streaming';
}

// Dify内容模板
export interface DifyContentTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  requiredVariables: string[];
  category?: string;
  createdAt?: number;
  updatedAt?: number;
}

// Dify内容类型
export enum DifyContentType {
  ARTICLE = 'article',
  SUMMARY = 'summary',
  TITLE = 'title',
  CUSTOM = 'custom',
}

// Dify内容生成结果
export interface DifyContentResult {
  content: string;
  conversationId: string;
  messageId: string;
  success: boolean;
  error?: string;
  metadata?: any;
}

// 工作流运行参数接口
export interface DifyWorkflowRunParams {
  inputs: {
    topic?: string;
    type?: string;
    describe?: string | null;
    content?: string | null;
    title?: string | null;
    template?: string | null;
    [key: string]: any;
  };
  files?: any[];
  userId?: string;
  workflowId?: string;
}

// 工作流运行结果接口
export interface DifyWorkflowRunResult {
  success: boolean;
  error?: string;
  workflowRunId: string;
  result: any;
} 