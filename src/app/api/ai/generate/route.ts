/**
 * AI生成内容API路由
 * 提供各种AI内容生成功能，包括基于模板生成内容
 */

import { NextRequest, NextResponse } from 'next/server';
import AIService from '@/lib/services/ai';
import db from '@/lib/db';

// POST: 生成AI内容
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type) {
      return NextResponse.json(
        { error: '缺少类型参数' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'article_title':
        if (!data.keywords || !data.topic) {
          return NextResponse.json(
            { error: '生成标题需要提供keywords和topic参数' },
            { status: 400 }
          );
        }
        
        result = await AIService.generateArticleTitle(
          data.keywords,
          data.topic,
          data.style
        );
        break;

      case 'article_content':
        if (!data.topic || !data.keywords) {
          return NextResponse.json(
            { error: '生成文章需要提供topic和keywords参数' },
            { status: 400 }
          );
        }
        
        result = await AIService.generateArticleContent(
          data.topic,
          data.keywords,
          data.style
        );
        break;

      case 'article_summary':
        if (!data.content) {
          return NextResponse.json(
            { error: '生成摘要需要提供content参数' },
            { status: 400 }
          );
        }
        
        result = await AIService.generateArticleSummary(
          data.content,
          data.maxLength
        );
        break;

      case 'extract_keywords':
        if (!data.text) {
          return NextResponse.json(
            { error: '提取关键词需要提供text参数' },
            { status: 400 }
          );
        }
        
        result = await AIService.extractKeywordsFromText(
          data.text,
          data.count
        );
        break;

      case 'template_content':
        if (!data.templateId && !data.template) {
          return NextResponse.json(
            { error: '基于模板生成内容需要提供templateId或template参数' },
            { status: 400 }
          );
        }
        
        if (!data.variables) {
          return NextResponse.json(
            { error: '基于模板生成内容需要提供variables参数' },
            { status: 400 }
          );
        }

        let template;
        // 如果提供了模板ID，从数据库获取模板并增加使用次数
        if (data.templateId) {
          template = await db.templates.getTemplateById(data.templateId);
          if (!template) {
            return NextResponse.json(
              { error: '未找到指定的模板' },
              { status: 404 }
            );
          }
          
          // 异步增加模板使用次数，不等待结果
          db.templates.incrementTemplateUsage(data.templateId)
            .catch(error => console.error(`增加模板使用次数失败: ${error}`));
          
          result = await AIService.generateContentFromTemplate(
            template.content,
            data.variables
          );
        } else {
          // 直接使用提供的模板内容
          result = await AIService.generateContentFromTemplate(
            data.template,
            data.variables
          );
        }
        break;

      default:
        return NextResponse.json(
          { error: `不支持的生成类型: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI内容生成失败:', error);
    return NextResponse.json(
      { error: '内容生成失败' },
      { status: 500 }
    );
  }
} 