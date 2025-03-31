/**
 * AI服务入口
 * 组织和导出所有AI相关功能
 */

// 导入和重新导出所有AI服务
import * as models from './models';
import * as mcp from './mcp';
import * as langchain from './langchain';

// 定义变量参数类型
export interface TemplateVariables {
  [key: string]: string | number | boolean | Array<string | number | boolean>;
}

// 文章生成相关功能
export async function generateArticleTitle(keywords: string[], topic: string, style: string = '专业') {
  try {
    // 使用MCP上下文管理器
    const contextManager = new mcp.MCPContextManager(
      "你是一位专业的标题创作者，擅长创作引人注目、准确且吸引人的标题。",
      "claude-3-sonnet-20240229"
    );
    
    const prompt = `
    请基于以下主题和关键词，创建一个吸引人的${style}风格标题：
    
    主题: ${topic}
    关键词: ${keywords.join(', ')}
    
    要求:
    1. 标题应该引人注目且吸引读者点击
    2. 标题应当准确反映主题内容
    3. 标题长度应在15-25个字之间
    4. 风格应当是${style}的
    
    请直接返回标题，不要包含其他解释或引号。
    `;
    
    contextManager.addUserMessage(prompt);
    const title = await contextManager.generateResponse();
    
    return title.trim();
  } catch (error) {
    console.error('生成文章标题失败:', error);
    throw error;
  }
}

// 文章摘要生成功能
export async function generateArticleSummary(content: string, maxLength: number = 150) {
  try {
    return await langchain.summarizeContent(content, maxLength);
  } catch (error) {
    console.error('生成文章摘要失败:', error);
    throw error;
  }
}

// 文章内容生成功能
export async function generateArticleContent(topic: string, keywords: string[], style: string = '专业') {
  try {
    // 使用MCP上下文管理器
    const contextManager = new mcp.MCPContextManager(
      "你是一位加密货币和区块链领域的专业内容创作者，擅长撰写有深度、专业且引人入胜的文章。",
      "claude-3-opus-20240229"
    );
    
    const prompt = `
    请根据以下信息撰写一篇关于加密货币的文章：
    
    主题: ${topic}
    关键词: ${keywords.join(', ')}
    风格: ${style}
    
    要求:
    1. 文章应当有明确的结构，包括引言、主体和结论
    2. 内容应当深入且专业，适合对加密货币有一定了解的读者
    3. 语言应当流畅，逻辑清晰
    4. 文章长度应在800-1200字之间
    5. 使用markdown格式
    
    请直接返回文章内容，不要包含其他解释。
    `;
    
    contextManager.addUserMessage(prompt);
    const content = await contextManager.generateResponse();
    
    return content.trim();
  } catch (error) {
    console.error('生成文章内容失败:', error);
    throw error;
  }
}

// 根据模板生成内容
export async function generateContentFromTemplate(template: string, variables: TemplateVariables) {
  try {
    // 使用MCP上下文管理器
    const contextManager = new mcp.MCPContextManager(
      "你是一位专业的内容创作者，擅长根据模板生成高质量内容。",
      "claude-3-opus-20240229"
    );
    
    // 将变量插入模板中
    let processedTemplate = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g');
      processedTemplate = processedTemplate.replace(
        placeholder, 
        Array.isArray(value) ? value.join(', ') : String(value)
      );
    }
    
    const prompt = `
    请根据以下模板生成内容。模板中的变量已经被替换为相应的值。
    请保持原始格式，并确保内容完整、连贯。
    
    模板内容:
    ${processedTemplate}
    
    请直接返回生成的内容，不要包含其他解释。
    `;
    
    contextManager.addUserMessage(prompt);
    const content = await contextManager.generateResponse();
    
    return content.trim();
  } catch (error) {
    console.error('根据模板生成内容失败:', error);
    throw error;
  }
}

// 关键词提取功能
export async function extractKeywordsFromText(text: string, count: number = 5) {
  try {
    return await langchain.extractKeywords(text, count);
  } catch (error) {
    console.error('提取关键词失败:', error);
    throw error;
  }
}

const aiService = {
  models,
  mcp,
  langchain,
  generateArticleTitle,
  generateArticleSummary,
  generateArticleContent,
  generateContentFromTemplate,
  extractKeywordsFromText
};

export default aiService; 