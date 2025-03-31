/**
 * 嵌入向量仓库
 * 处理文本嵌入的数据库操作
 */
import { getSupabaseClient } from '../supabase';
import { safeQuery } from '../utils/queryBuilder';

// 嵌入向量接口
export interface Embedding {
  id?: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
  article_id?: string;
  created_at?: string;
}

// 向量搜索结果接口
export interface EmbeddingSearchResult {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  article_id?: string;
  similarity: number;
}

/**
 * 存储嵌入向量
 */
export async function storeEmbedding(embedding: Embedding): Promise<Embedding> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await safeQuery(supabase
    .from('embeddings'))
    .insert(embedding)
    .select("*")
    .single();
  
  if (error) {
    console.error('存储嵌入向量失败:', error);
    throw new Error(`存储嵌入向量失败: ${(error as Error).message}`);
  }
  
  return data as Embedding;
}

/**
 * 批量存储嵌入向量
 */
export async function storeEmbeddings(embeddings: Embedding[]): Promise<number> {
  const supabase = getSupabaseClient();
  
  const { error } = await safeQuery(supabase
    .from('embeddings'))
    .insert(embeddings);
  
  if (error) {
    console.error('批量存储嵌入向量失败:', error);
    throw new Error(`批量存储嵌入向量失败: ${(error as Error).message}`);
  }
  
  return embeddings.length;
}

/**
 * 获取嵌入向量
 */
export async function getEmbedding(embeddingId: string): Promise<Embedding | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await safeQuery(supabase
    .from('embeddings')
    .select('*'))
    .eq('id', embeddingId)
    .single();
  
  if (error) {
    console.error('获取嵌入向量失败:', error);
    return null;
  }
  
  return data as Embedding;
}

/**
 * 获取文章的所有嵌入向量
 */
export async function getArticleEmbeddings(articleId: string): Promise<Embedding[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await safeQuery(supabase
    .from('embeddings')
    .select('*'))
    .eq('article_id', articleId);
  
  if (error) {
    console.error('获取文章嵌入向量失败:', error);
    return [];
  }
  
  return (data || []) as Embedding[];
}

/**
 * 删除嵌入向量
 */
export async function deleteEmbedding(embeddingId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  const { error } = await safeQuery(supabase
    .from('embeddings'))
    .delete()
    .eq('id', embeddingId);
  
  if (error) {
    console.error('删除嵌入向量失败:', error);
    return false;
  }
  
  return true;
}

/**
 * 删除文章的所有嵌入向量
 */
export async function deleteArticleEmbeddings(articleId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  const { error } = await safeQuery(supabase
    .from('embeddings'))
    .delete()
    .eq('article_id', articleId);
  
  if (error) {
    console.error('删除文章嵌入向量失败:', error);
    return false;
  }
  
  return true;
}

/**
 * 相似度搜索
 */
export async function similaritySearch(
  queryEmbedding: number[],
  threshold: number = 0.75,
  limit: number = 5
): Promise<EmbeddingSearchResult[]> {
  const supabase = getSupabaseClient();
  
  // 将查询向量转换为Postgres向量格式
  const postgresVector = `[${queryEmbedding.join(',')}]`;
  
  // 使用数据库函数进行向量搜索
  const { data, error } = await supabase.rpc(
    'match_embeddings',
    {
      query_embedding: postgresVector,
      match_threshold: threshold,
      match_count: limit
    }
  );
  
  if (error) {
    console.error('相似度搜索失败:', error);
    return [];
  }
  
  return data || [];
}

const embeddingsRepository = {
  storeEmbedding,
  storeEmbeddings,
  getEmbedding,
  getArticleEmbeddings,
  deleteEmbedding,
  deleteArticleEmbeddings,
  similaritySearch
};

export default embeddingsRepository; 