/**
 * 文章数据仓库
 * 处理文章相关的数据库操作
 */
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from '../supabase';
import { Article, TABLES } from '../schema';
import { safeQuery } from '../utils/queryBuilder';

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
  
  const { data, error } = await safeQuery(supabase
    .from(TABLES.ARTICLES)
    .select('*'))
    .eq('id', id)
    .single();
  
  if (error) {
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
  const article: Partial<Article> = {
    id: uuidv4(),
    ...articleData,
    created_at: now,
    updated_at: now,
    // 这些字段在实际数据库中不存在
    // view_count: 0,
    // usage_count: 0
  };
  
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
}

/**
 * 更新文章
 */
export async function updateArticle(id: string, articleData: Partial<Article>) {
  const supabase = getSupabaseClient();
  
  const updateData = {
    ...articleData,
    updated_at: new Date().toISOString()
  };
  
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
}

/**
 * 删除文章
 */
export async function deleteArticle(id: string) {
  const supabase = getSupabaseClient();
  
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