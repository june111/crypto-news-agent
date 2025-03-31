/**
 * LangChain服务
 * 提供基础链和工具功能
 */
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatAnthropic } from "@langchain/anthropic";
import { Document } from "@langchain/core/documents";

// 加密新闻分析模版
export const CRYPTO_NEWS_TEMPLATE = `分析以下加密货币新闻：

{text}

分析要点:
1. 主要涉及的加密货币项目
2. 新闻的主要事件或动向
3. 这一消息对相关加密货币的潜在影响
4. 此消息对整体加密市场的潜在影响

请提供一个结构化的、深入的分析，每个要点300-500字.`;

// 加密货币价格趋势分析模版
export const CRYPTO_PRICE_TEMPLATE = `分析以下{coin}价格走势:

{text}

分析要点:
1. 主要价格变动情况
2. 可能的原因或触发因素
3. 市场反应和情绪
4. 未来短期走势预测

请提供全面分析，每点300-500字.`;

// 生成加密货币新闻模版
export const GENERATE_CRYPTO_NEWS_TEMPLATE = `根据以下主题生成一篇加密货币新闻文章:

主题: {topic}

要求:
1. 文章应有明确的标题
2. 内容应专业、客观、中立
3. 包含适量的加密货币术语和概念解释
4. 文章长度800-1000字
5. 应符合新闻写作风格

请直接生成文章内容.`;

// 定义模型类型
export type ModelType = "claude-3-opus-20240229" | "claude-3-sonnet-20240229" | "claude-3-haiku-20240307";

// 定义提示参数类型
export interface PromptParams {
  [key: string]: string | number;
}

// 定义关键词响应类型
export interface KeywordResponse {
  keywords: string[];
}

// 定义情感分析响应类型
export interface SentimentResponse {
  sentiment: string;
  confidence: number;
  explanation: string;
}

// 定义分类响应类型
export interface ClassificationResponse {
  category: string;
  confidence: number;
  reason: string;
}

// 创建提示模板
export function createPromptTemplate(template: string): PromptTemplate {
  return PromptTemplate.fromTemplate(template);
}

// 创建生成链
export function createGenerationChain(
  template: string | PromptTemplate,
  modelType: ModelType = "claude-3-sonnet-20240229"
) {
  // 获取提示模板
  const promptTemplate = typeof template === 'string' 
    ? createPromptTemplate(template) 
    : template;
  
  // 创建语言模型
  const model = new ChatAnthropic({
    modelName: modelType,
    temperature: 0.7,
  });
  
  // 创建输出解析器
  const outputParser = new StringOutputParser();
  
  // 创建链
  return RunnableSequence.from([
    promptTemplate,
    model,
    outputParser
  ]);
}

// 内容摘要
export async function summarizeContent(content: string, maxLength: number = 150): Promise<string> {
  const template = `
  请为以下内容提供一个简洁明了的摘要，长度不超过${maxLength}个字：
  
  {content}
  
  摘要：
  `;
  
  const chain = createGenerationChain(template);
  const response = await chain.invoke({ content });
  return response.trim();
}

// 内容分类
export async function classifyContent(
  content: string, 
  categories: string[]
): Promise<ClassificationResponse> {
  const template = `
  请将以下内容分类到这些类别中的一个："${categories.join('", "')}"。
  
  内容:
  {content}
  
  分析内容，并以JSON格式返回:
  1. 分类的类别
  2. 置信度(0-1之间的数值)
  3. 分类理由(简短解释)
  
  返回格式:
  {
    "category": "类别名称",
    "confidence": 0.95,
    "reason": "分类理由"
  }
  
  JSON:
  `;
  
  const chain = createGenerationChain(template);
  const response = await chain.invoke({ content });
  
  try {
    return JSON.parse(response.trim()) as ClassificationResponse;
  } catch (error) {
    console.error('解析分类响应失败:', error);
    return {
      category: '未知',
      confidence: 0,
      reason: '响应解析失败'
    };
  }
}

// 情感分析
export async function analyzeSentiment(content: string): Promise<SentimentResponse> {
  const template = `
  请分析以下内容的情感倾向:
  
  {content}
  
  以JSON格式返回:
  1. 情感评估(正面、负面或中性)
  2. 置信度(0-1之间的数值)
  3. 简短解释
  
  返回格式:
  {
    "sentiment": "情感评估",
    "confidence": 0.95,
    "explanation": "解释"
  }
  
  JSON:
  `;
  
  const chain = createGenerationChain(template);
  const response = await chain.invoke({ content });
  
  try {
    return JSON.parse(response.trim()) as SentimentResponse;
  } catch (error) {
    console.error('解析情感分析响应失败:', error);
    return {
      sentiment: '未知',
      confidence: 0,
      explanation: '响应解析失败'
    };
  }
}

// 关键词提取
export async function extractKeywords(content: string, count: number = 5): Promise<string[]> {
  const template = `
  请从以下内容中提取${count}个最重要的关键词:
  
  {content}
  
  以JSON格式返回关键词数组:
  {
    "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"]
  }
  
  JSON:
  `;
  
  const chain = createGenerationChain(template);
  const response = await chain.invoke({ content });
  
  try {
    const result = JSON.parse(response.trim()) as KeywordResponse;
    return result.keywords;
  } catch (error) {
    console.error('解析关键词提取响应失败:', error);
    return [];
  }
}

// 文本转文档
export function textToDocument(text: string): Document {
  return new Document({
    pageContent: text,
    metadata: {}
  });
}

// 导出Langchain相关功能
export const LangchainService = {
  createPromptTemplate,
  createGenerationChain,
  summarizeContent,
  classifyContent,
  analyzeSentiment,
  extractKeywords,
  textToDocument
};

export default LangchainService; 