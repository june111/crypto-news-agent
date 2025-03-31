/**
 * 语言模型服务
 * 负责创建和管理各种大语言模型实例
 */
import { OpenAI } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { Anthropic } from "@anthropic-ai/sdk";
import { BaseLanguageModel } from "@langchain/core/language_models/base";

// 语言模型类型
export enum LLMType {
  OPENAI = 'openai',
  OPENAI_CHAT = 'openai_chat',
  ANTHROPIC = 'anthropic',
  ANTHROPIC_CLAUDE = 'anthropic_claude',
}

// 模型配置接口
export interface ModelConfig {
  default: string;
  alternatives: string[];
  contextWindow: number;
}

// 模型配置映射
export interface ModelConfigMap {
  [key: string]: ModelConfig;
}

// 模型配置
export const modelConfigs: ModelConfigMap = {
  [LLMType.OPENAI]: {
    default: "gpt-4-turbo",
    alternatives: ["gpt-3.5-turbo", "gpt-4-vision-preview"],
    contextWindow: 128000,
  },
  [LLMType.OPENAI_CHAT]: {
    default: "gpt-4-turbo",
    alternatives: ["gpt-3.5-turbo-0125", "gpt-4-turbo-preview"],
    contextWindow: 128000,
  },
  [LLMType.ANTHROPIC]: {
    default: "claude-3-opus-20240229",
    alternatives: ["claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
    contextWindow: 200000,
  },
  [LLMType.ANTHROPIC_CLAUDE]: {
    default: "claude-3-opus-20240229",
    alternatives: ["claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
    contextWindow: 200000,
  }
};

// 创建OpenAI模型
export function createOpenAIModel(
  modelName = modelConfigs[LLMType.OPENAI].default,
  temperature = 0.7
): OpenAI {
  return new OpenAI({
    modelName,
    temperature,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

// 创建OpenAI Chat模型
export function createOpenAIChatModel(
  modelName = modelConfigs[LLMType.OPENAI_CHAT].default,
  temperature = 0.7
): ChatOpenAI {
  return new ChatOpenAI({
    modelName,
    temperature,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

// 创建Anthropic Claude模型
export function createAnthropicModel(
  modelName = modelConfigs[LLMType.ANTHROPIC].default,
  temperature = 0.7
): ChatAnthropic {
  return new ChatAnthropic({
    modelName,
    temperature,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// 创建Anthropic SDK客户端
export function createAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// 创建默认语言模型
export function createLLM(
  type: LLMType = LLMType.OPENAI_CHAT,
  modelName?: string,
  temperature = 0.7
): BaseLanguageModel {
  switch (type) {
    case LLMType.OPENAI:
      return createOpenAIModel(
        modelName || modelConfigs[LLMType.OPENAI].default, 
        temperature
      );
    case LLMType.OPENAI_CHAT:
      return createOpenAIChatModel(
        modelName || modelConfigs[LLMType.OPENAI_CHAT].default, 
        temperature
      );
    case LLMType.ANTHROPIC:
    case LLMType.ANTHROPIC_CLAUDE:
      return createAnthropicModel(
        modelName || modelConfigs[LLMType.ANTHROPIC].default, 
        temperature
      );
    default:
      return createOpenAIChatModel();
  }
}

// 导出默认的模型实例
export const defaultModel = createLLM();

// 导出所有模型工具
const modelsModule = {
  createLLM,
  createOpenAIModel,
  createOpenAIChatModel,
  createAnthropicModel,
  createAnthropicClient,
  defaultModel,
  LLMType,
  modelConfigs,
};

export default modelsModule; 