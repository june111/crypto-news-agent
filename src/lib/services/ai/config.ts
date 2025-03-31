/**
 * AI服务配置
 */

// 默认模型配置
export const DEFAULT_SETTINGS = {
  // OpenAI配置
  openai: {
    model: 'gpt-4-turbo',
    temperature: 0.7,
    topP: 1,
    maxTokens: 4000,
  },
  
  // Anthropic配置
  anthropic: {
    model: 'claude-3-opus-20240229',
    temperature: 0.7,
    maxTokens: 4000,
  },
  
  // 数据来源权重
  sourceWeights: {
    news: 0.3,
    social: 0.2,
    technical: 0.3,
    market: 0.2,
  },
  
  // 内容生成设置
  generation: {
    defaultStyle: '专业',
    titleLength: {
      min: 15,
      max: 25,
    },
    summaryLength: {
      min: 100,
      max: 150,
    },
    contentLength: {
      min: 500,
      max: 1200,
    },
  },
};

// 获取API密钥
export function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.warn('OpenAI API密钥未设置');
  }
  return key || '';
}

export function getAnthropicKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.warn('Anthropic API密钥未设置');
  }
  return key || '';
}

// 内容类别定义
export const CONTENT_CATEGORIES = [
  '区块链',
  '比特币',
  '以太坊',
  '加密货币',
  '去中心化金融',
  '非同质化代币',
  '元宇宙',
  '数字资产',
  '加密监管',
  '技术创新',
];

// 风格定义
export const CONTENT_STYLES = [
  '专业',
  '教学',
  '分析',
  '新闻',
  '简洁',
];

// 内容状态
export const CONTENT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  FAILED: 'failed',
};

// 检查API密钥是否有效
export function hasValidAPIKeys(): boolean {
  return !!(getOpenAIKey() || getAnthropicKey());
}

// 导出配置对象
export const AIConfig = {
  DEFAULT_SETTINGS,
  getOpenAIKey,
  getAnthropicKey,
  CONTENT_CATEGORIES,
  CONTENT_STYLES,
  CONTENT_STATUS,
  hasValidAPIKeys,
};

export default AIConfig; 