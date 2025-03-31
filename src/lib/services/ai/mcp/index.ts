/**
 * 模型上下文协议（MCP）模块
 * 提供更高效的对话管理功能
 */
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage, FunctionMessage } from "@langchain/core/messages";

// 定义消息类型
export enum MCPMessageType {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
  TOOL = "tool"
}

// 定义MCP消息接口
export interface MCPMessage {
  role: MCPMessageType;
  content: string;
  name?: string;
  tool_call_id?: string;
}

// 定义模型类型
export type MCPModelType = "gpt-3.5-turbo" | "gpt-4-turbo" | "claude-3-haiku-20240307" | "claude-3-sonnet-20240229" | "claude-3-opus-20240229";

// 定义上下文配置接口
export interface MCPContextConfig {
  maxTokens?: number;
  temperature?: number;
  truncateStrategy?: "oldest_first" | "newest_first";
}

// LangChain消息转MCP消息
export function convertLangChainMessageToMCP(message: BaseMessage): MCPMessage {
  if (message instanceof SystemMessage) {
    return {
      role: MCPMessageType.SYSTEM,
      content: message.content as string
    };
  } else if (message instanceof HumanMessage) {
    return {
      role: MCPMessageType.USER,
      content: message.content as string
    };
  } else if (message instanceof AIMessage) {
    return {
      role: MCPMessageType.ASSISTANT,
      content: message.content as string
    };
  } else if (message instanceof FunctionMessage) {
    return {
      role: MCPMessageType.TOOL,
      content: message.content as string,
      name: message.name
    };
  } else {
    throw new Error(`Unsupported message type: ${message.constructor.name}`);
  }
}

// MCP消息转LangChain消息
export function convertMCPToLangChainMessage(message: MCPMessage): BaseMessage {
  switch (message.role) {
    case MCPMessageType.SYSTEM:
      return new SystemMessage(message.content);
    case MCPMessageType.USER:
      return new HumanMessage(message.content);
    case MCPMessageType.ASSISTANT:
      return new AIMessage(message.content);
    case MCPMessageType.TOOL:
      if (!message.name) {
        throw new Error("Tool message must have a name");
      }
      return new FunctionMessage(message.content, message.name);
    default:
      throw new Error(`Unsupported message role: ${message.role}`);
  }
}

// 确保系统消息存在
export function ensureSystemMessage(messages: MCPMessage[], defaultSystemPrompt: string): MCPMessage[] {
  const hasSystemMessage = messages.some(msg => msg.role === MCPMessageType.SYSTEM);
  
  if (!hasSystemMessage) {
    return [
      { role: MCPMessageType.SYSTEM, content: defaultSystemPrompt },
      ...messages
    ];
  }
  
  return messages;
}

// 使用MCP生成响应
export async function generateResponseWithMCP(
  messages: MCPMessage[],
  modelType: MCPModelType = "claude-3-sonnet-20240229",
  config: MCPContextConfig = {}
): Promise<string> {
  let model;
  
  if (modelType.startsWith("gpt")) {
    model = new ChatOpenAI({
      modelName: modelType,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens,
    });
  } else if (modelType.startsWith("claude")) {
    model = new ChatAnthropic({
      modelName: modelType,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens,
    });
  } else {
    throw new Error(`Unsupported model type: ${modelType}`);
  }
  
  // 转换为LangChain消息格式
  const langChainMessages = messages.map(convertMCPToLangChainMessage);
  
  const response = await model.invoke(langChainMessages as BaseLanguageModelInput);
  return response.content as string;
}

// MCP上下文管理器类
export class MCPContextManager {
  private messages: MCPMessage[] = [];
  private systemPrompt: string;
  private modelType: MCPModelType;
  private config: MCPContextConfig;
  
  constructor(
    systemPrompt: string,
    modelType: MCPModelType = "claude-3-sonnet-20240229",
    config: MCPContextConfig = {}
  ) {
    this.systemPrompt = systemPrompt;
    this.modelType = modelType;
    this.config = config;
    
    // 初始化系统消息
    this.messages.push({
      role: MCPMessageType.SYSTEM,
      content: systemPrompt
    });
  }
  
  // 添加用户消息
  public addUserMessage(content: string): void {
    this.messages.push({
      role: MCPMessageType.USER,
      content
    });
  }
  
  // 添加助手消息
  public addAssistantMessage(content: string): void {
    this.messages.push({
      role: MCPMessageType.ASSISTANT,
      content
    });
  }
  
  // 添加工具消息
  public addToolMessage(content: string, name: string, toolCallId?: string): void {
    this.messages.push({
      role: MCPMessageType.TOOL,
      content,
      name,
      tool_call_id: toolCallId
    });
  }
  
  // 获取当前消息历史
  public getMessages(): MCPMessage[] {
    return [...this.messages];
  }
  
  // 重置上下文
  public resetContext(): void {
    this.messages = [{
      role: MCPMessageType.SYSTEM,
      content: this.systemPrompt
    }];
  }
  
  // 生成响应
  public async generateResponse(): Promise<string> {
    return generateResponseWithMCP(this.messages, this.modelType, this.config);
  }
}

// 导出MCP相关功能
export const MCPService = {
  MCPMessageType,
  convertLangChainMessageToMCP,
  convertMCPToLangChainMessage,
  ensureSystemMessage,
  generateResponseWithMCP,
  MCPContextManager
};

export default MCPService; 