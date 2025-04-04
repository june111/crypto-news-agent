/**
 * Dify回调API - 保存生成内容到文章表
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { ArticleStatus } from '@/types/article';

// 初始化Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// 验证环境变量
if (!supabaseUrl || !supabaseKey) {
  logger.error('缺少Supabase配置');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

/**
 * POST处理程序 - 接收Dify回调并保存到文章表
 */
export async function POST(req: NextRequest) {
  try {
    // 获取回调数据
    const callbackData = await req.json();
    
    logger.info('接收到Dify回调数据', { 
      title: callbackData.title, 
      date: callbackData.date 
    });
    
    // 验证必要字段
    if (!callbackData.content || !callbackData.title) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要的内容或标题字段'
      }, { status: 400 });
    }
    
    // 处理图片链接
    const coverImage = callbackData.image && Array.isArray(callbackData.image) && callbackData.image.length > 0 
      ? callbackData.image[0]?.url || 'https://img0.baidu.com/it/u=4160253413,3711804954&fm=253&fmt=auto&app=138&f=JPEG?w=708&h=500'
      : 'https://img0.baidu.com/it/u=4160253413,3711804954&fm=253&fmt=auto&app=138&f=JPEG?w=708&h=500'; // 默认图片
    
    // 从标题中提取可能的关键词
    const possibleKeywords = callbackData.title
      .replace(/[：，。？！""''（）]/g, ' ')
      .split(' ')
      .filter(word => word.length >= 2 && word.length <= 10)
      .slice(0, 5);
    
    // 准备文章数据
    const articleData = {
      id: `article-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: callbackData.title,
      content: callbackData.content,
      summary: callbackData.describe || callbackData.content.substring(0, 200) + '...',
      coverImage: coverImage,
      category: '区块链', // 默认分类，可根据内容进行智能识别
      keywords: possibleKeywords,
      status: '待审核' as ArticleStatus,
      date: callbackData.date ? new Date(callbackData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      source: 'Dify AI',
      isDify: true,
      aiGenerated: true,
      difyResult: callbackData
    };
    
    // 保存到Supabase
    logger.info('准备保存文章到Supabase', { id: articleData.id, title: articleData.title });
    
    // 判断是否使用模拟数据模式
    if (process.env.MOCK_DB === 'true') {
      logger.info('模拟数据模式：文章已保存（模拟）', { id: articleData.id });
      return NextResponse.json({
        success: true,
        message: '文章已保存（模拟模式）',
        article: articleData
      });
    }
    
    // 保存到Supabase
    const { data, error } = await supabase
      .from('articles')
      .insert([articleData])
      .select();
    
    if (error) {
      logger.error('保存文章到Supabase失败', { error: error.message, details: error });
      return NextResponse.json({ 
        success: false, 
        error: `保存文章失败: ${error.message}`
      }, { status: 500 });
    }
    
    logger.info('文章已成功保存到Supabase', { id: articleData.id });
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: '文章已成功保存',
      article: data && Array.isArray(data) && data.length > 0 ? data[0] : articleData
    });
    
  } catch (error: any) {
    // 记录错误日志
    logger.error('处理Dify回调失败', { 
      error: error.message,
      stack: error.stack
    });
    
    // 返回错误响应
    return NextResponse.json({ 
      success: false, 
      error: error.message || '处理回调失败'
    }, { status: 500 });
  }
} 