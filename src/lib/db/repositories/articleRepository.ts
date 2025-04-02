/**
 * 文章数据仓库
 * 处理文章相关的数据库操作
 */
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from '../supabase';
import { Article, TABLES } from '../schema';
import { safeQuery } from '../utils/queryBuilder';
import { isValidUUID } from '@/utils/uuid';

/**
 * 获取所有文章
 */
export async function getAllArticles(options: {
  page?: number;
  pageSize?: number;
  status?: string;
  category?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const {
    page = 1,
    pageSize = 10,
    status,
    category,
    keyword,
    startDate,
    endDate,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options;

  const supabase = getSupabaseClient();
  
  let query = safeQuery(supabase
    .from(TABLES.ARTICLES)
    .select('*', { count: 'exact' }));
  
  // 应用过滤条件
  if (status) {
    query = query.eq('status', status);
  }
  
  if (category) {
    query = query.eq('category', category);
  }
  
  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,summary.ilike.%${keyword}%`);
  }
  
  if (startDate && endDate) {
    query = query
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`);
  }
  
  // 应用排序和分页
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  query = query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to);
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('获取文章列表失败:', error);
    throw error;
  }
  
  return {
    articles: data as Article[],
    total: count || 0,
    page,
    pageSize
  };
}

/**
 * 根据ID获取单篇文章
 */
export async function getArticleById(id: string) {
  const supabase = getSupabaseClient();
  
  // 验证文章ID格式
  if (!isValidUUID(id)) {
    throw new Error(`文章ID"${id}"不是有效的UUID格式。`);
  }
  
  const { data, error } = await safeQuery(supabase
    .from(TABLES.ARTICLES)
    .select('*'))
    .eq('id', id)
    .single();
  
  if (error) {
    // 处理404错误，提供更友好的消息
    if ('code' in error && error.code === 'PGRST116') {
      throw new Error(`文章ID"${id}"不存在或已被删除。`);
    }
    console.error(`获取文章(ID: ${id})失败:`, error);
    throw error;
  }
  
  return data as Article;
}

/**
 * 创建新文章
 */
export async function createArticle(articleData: Partial<Article>) {
  const supabase = getSupabaseClient();
  
  const now = new Date().toISOString();
  
  // 生成文章ID - 这个ID由后端生成，增强安全性
  const articleId = uuidv4();
  
  // --- 关联ID的验证 ---
  
  // 验证热点话题ID
  if (articleData.hot_topic_id) {
    // 1. 格式验证
    if (!isValidUUID(articleData.hot_topic_id)) {
      // 如果是纯数字，给出更明确的错误信息
      if (/^\d+$/.test(articleData.hot_topic_id)) {
        throw new Error(`热点话题ID"${articleData.hot_topic_id}"不是有效的UUID格式，而是一个数字。请选择有效的热点话题。`);
      }
      throw new Error(`热点话题ID"${articleData.hot_topic_id}"不是有效的UUID格式。请选择有效的热点话题。`);
    }
    
    // 2. 存在性验证 - 确认该ID在热点话题表中存在
    const { data: hotTopic, error: hotTopicError } = await safeQuery(supabase
      .from(TABLES.HOT_TOPICS)
      .select('id'))
      .eq('id', articleData.hot_topic_id)
      .single();
    
    if (hotTopicError || !hotTopic) {
      console.error('热点话题ID验证失败:', hotTopicError || '未找到对应热点话题');
      throw new Error(`热点话题ID"${articleData.hot_topic_id}"不存在或已被删除，请选择其他热点话题。`);
    }
  }
  
  // 验证模板ID
  if (articleData.template_id) {
    // 1. 格式验证
    if (!isValidUUID(articleData.template_id)) {
      // 如果是纯数字，给出更明确的错误信息
      if (/^\d+$/.test(articleData.template_id)) {
        throw new Error(`模板ID"${articleData.template_id}"不是有效的UUID格式，而是一个数字。请选择有效的模板。`);
      }
      throw new Error(`模板ID"${articleData.template_id}"不是有效的UUID格式。请选择有效的模板。`);
    }
    
    // 2. 存在性验证 - 确认该ID在模板表中存在
    const { data: template, error: templateError } = await safeQuery(supabase
      .from(TABLES.TEMPLATES)
      .select('id'))
      .eq('id', articleData.template_id)
      .single();
    
    if (templateError || !template) {
      console.error('模板ID验证失败:', templateError || '未找到对应模板');
      throw new Error(`模板ID"${articleData.template_id}"不存在或已被删除，请选择其他模板。`);
    }
  }
  
  // 准备文章数据 - 使用后端生成的ID
  const article: Partial<Article> = {
    id: articleId,
    ...articleData,
    created_at: now,
    updated_at: now
  };
  
  // 创建文章
  try {
    const { data, error } = await safeQuery(supabase
      .from(TABLES.ARTICLES))
      .insert(article)
      .select("*")
      .single();
    
    if (error) {
      console.error('创建文章失败:', error);
      throw error;
    }
    
    return data as Article;
  } catch (error) {
    console.error('创建文章数据库操作失败:', error);
    // 为特定错误类型提供更明确的错误消息
    if (error instanceof Error) {
      // 检查PostgreSQL错误码
      if ('code' in error && (error as any).code === '22P02') {
        if (String(error).includes('uuid')) {
          // 如果是UUID格式错误，添加更多诊断信息
          console.error('UUID字段格式错误:', {
            热点话题ID: articleData.hot_topic_id,
            模板ID: articleData.template_id
          });
          throw new Error(`数据库UUID格式错误: ${String(error)}。请确保所有ID字段都是有效的UUID格式。`);
        }
      }
    }
    throw error;
  }
}

/**
 * 更新文章
 */
export async function updateArticle(id: string, articleData: Partial<Article>) {
  const supabase = getSupabaseClient();
  
  // 验证文章ID是否存在
  if (!isValidUUID(id)) {
    throw new Error(`文章ID"${id}"不是有效的UUID格式。`);
  }
  
  // 先检查文章是否存在
  const { data: existingArticle, error: existingArticleError } = await safeQuery(supabase
    .from(TABLES.ARTICLES)
    .select('id'))
    .eq('id', id)
    .single();
  
  if (existingArticleError || !existingArticle) {
    console.error(`更新文章失败: 文章ID(${id})不存在`, existingArticleError);
    throw new Error(`文章ID"${id}"不存在或已被删除，无法更新。`);
  }
  
  // --- 关联ID的验证 ---
  
  // 验证热点话题ID
  if (articleData.hot_topic_id) {
    // 1. 格式验证
    if (!isValidUUID(articleData.hot_topic_id)) {
      // 如果是纯数字，给出更明确的错误信息
      if (/^\d+$/.test(articleData.hot_topic_id)) {
        throw new Error(`热点话题ID"${articleData.hot_topic_id}"不是有效的UUID格式，而是一个数字。请选择有效的热点话题。`);
      }
      throw new Error(`热点话题ID"${articleData.hot_topic_id}"不是有效的UUID格式。请选择有效的热点话题。`);
    }
    
    // 2. 存在性验证 - 确认该ID在热点话题表中存在
    const { data: hotTopic, error: hotTopicError } = await safeQuery(supabase
      .from(TABLES.HOT_TOPICS)
      .select('id'))
      .eq('id', articleData.hot_topic_id)
      .single();
    
    if (hotTopicError || !hotTopic) {
      console.error('热点话题ID验证失败:', hotTopicError || '未找到对应热点话题');
      throw new Error(`热点话题ID"${articleData.hot_topic_id}"不存在或已被删除，请选择其他热点话题。`);
    }
  }
  
  // 验证模板ID
  if (articleData.template_id) {
    // 1. 格式验证
    if (!isValidUUID(articleData.template_id)) {
      // 如果是纯数字，给出更明确的错误信息
      if (/^\d+$/.test(articleData.template_id)) {
        throw new Error(`模板ID"${articleData.template_id}"不是有效的UUID格式，而是一个数字。请选择有效的模板。`);
      }
      throw new Error(`模板ID"${articleData.template_id}"不是有效的UUID格式。请选择有效的模板。`);
    }
    
    // 2. 存在性验证 - 确认该ID在模板表中存在
    const { data: template, error: templateError } = await safeQuery(supabase
      .from(TABLES.TEMPLATES)
      .select('id'))
      .eq('id', articleData.template_id)
      .single();
    
    if (templateError || !template) {
      console.error('模板ID验证失败:', templateError || '未找到对应模板');
      throw new Error(`模板ID"${articleData.template_id}"不存在或已被删除，请选择其他模板。`);
    }
  }
  
  // 准备更新数据
  const updateData = {
    ...articleData,
    updated_at: new Date().toISOString()
  };
  
  // 更新文章
  try {
    const { data, error } = await safeQuery(supabase
      .from(TABLES.ARTICLES))
      .update(updateData)
      .eq('id', id)
      .select("*")
      .single();
    
    if (error) {
      console.error(`更新文章(ID: ${id})失败:`, error);
      throw error;
    }
    
    return data as Article;
  } catch (error) {
    console.error(`更新文章(ID: ${id})数据库操作失败:`, error);
    // 为特定错误类型提供更明确的错误消息
    if (error instanceof Error) {
      // 检查PostgreSQL错误码
      if ('code' in error && (error as any).code === '22P02') {
        if (String(error).includes('uuid')) {
          console.error('UUID字段格式错误:', {
            热点话题ID: articleData.hot_topic_id,
            模板ID: articleData.template_id
          });
          throw new Error(`数据库UUID格式错误: ${String(error)}。请确保所有ID字段都是有效的UUID格式。`);
        }
      }
    }
    throw error;
  }
}

/**
 * 删除文章
 */
export async function deleteArticle(id: string) {
  const supabase = getSupabaseClient();
  
  // 验证文章ID格式
  if (!isValidUUID(id)) {
    throw new Error(`文章ID"${id}"不是有效的UUID格式。`);
  }
  
  // 先验证文章是否存在
  const { data: existingArticle, error: existingError } = await safeQuery(supabase
    .from(TABLES.ARTICLES)
    .select('id'))
    .eq('id', id)
    .single();
  
  if (existingError || !existingArticle) {
    throw new Error(`文章ID"${id}"不存在或已被删除，无法执行删除操作。`);
  }
  
  const { error } = await safeQuery(supabase
    .from(TABLES.ARTICLES))
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`删除文章(ID: ${id})失败:`, error);
    throw error;
  }
  
  return true;
}

const articleRepository = {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
};

export default articleRepository; 