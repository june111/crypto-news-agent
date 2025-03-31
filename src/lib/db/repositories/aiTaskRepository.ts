/**
 * AI任务数据仓库
 * 处理AI任务相关的数据库操作
 */
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from '../supabase';
import { AITask, TABLES } from '../schema';
import { safeQuery } from '../utils/queryBuilder';

/**
 * 获取所有AI任务
 */
export async function getAllAITasks(options: {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
}) {
  const {
    page = 1,
    pageSize = 10,
    status,
    type
  } = options;

  const supabase = getSupabaseClient();
  
  let query = safeQuery(supabase
    .from(TABLES.AI_TASKS)
    .select('*', { count: 'exact' }));
  
  // 应用过滤条件
  if (status) {
    query = query.eq('status', status);
  }
  
  if (type) {
    query = query.eq('type', type);
  }
  
  // 应用排序和分页
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  query = query
    .order('created_at', { ascending: false })
    .range(from, to);
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('获取AI任务列表失败:', error);
    throw error;
  }
  
  return {
    tasks: data as AITask[],
    total: count || 0,
    page,
    pageSize
  };
}

/**
 * 根据ID获取单个AI任务
 */
export async function getAITaskById(id: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await safeQuery(supabase
    .from(TABLES.AI_TASKS)
    .select('*'))
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`获取AI任务(ID: ${id})失败:`, error);
    throw error;
  }
  
  return data as AITask;
}

/**
 * 创建新AI任务
 */
export async function createAITask(taskData: Partial<AITask>) {
  const supabase = getSupabaseClient();
  
  const now = new Date().toISOString();
  const task: Partial<AITask> = {
    id: uuidv4(),
    status: 'pending',
    ...taskData,
    created_at: now
  };
  
  const { data, error } = await safeQuery(supabase
    .from(TABLES.AI_TASKS))
    .insert(task)
    .select("*")
    .single();
  
  if (error) {
    console.error('创建AI任务失败:', error);
    throw error;
  }
  
  return data as AITask;
}

/**
 * 更新AI任务
 */
export async function updateAITask(id: string, taskData: Partial<AITask>) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await safeQuery(supabase
    .from(TABLES.AI_TASKS))
    .update(taskData)
    .eq('id', id)
    .select("*")
    .single();
  
  if (error) {
    console.error(`更新AI任务(ID: ${id})失败:`, error);
    throw error;
  }
  
  return data as AITask;
}

/**
 * 删除AI任务
 */
export async function deleteAITask(id: string) {
  const supabase = getSupabaseClient();
  
  const { error } = await safeQuery(supabase
    .from(TABLES.AI_TASKS))
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`删除AI任务(ID: ${id})失败:`, error);
    throw error;
  }
  
  return true;
}

/**
 * 将任务标记为完成
 */
export async function completeAITask(id: string, resultData: Record<string, unknown>) {
  const supabase = getSupabaseClient();
  
  const now = new Date().toISOString();
  
  const { data, error } = await safeQuery(supabase
    .from(TABLES.AI_TASKS))
    .update({
      status: 'completed',
      completed_at: now,
      result: resultData
    })
    .eq('id', id)
    .select("*")
    .single();
  
  if (error) {
    console.error(`标记AI任务(ID: ${id})为完成状态失败:`, error);
    throw error;
  }
  
  return data as AITask;
}

/**
 * 将任务标记为处理中
 */
export async function startProcessingAITask(id: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await safeQuery(supabase
    .from(TABLES.AI_TASKS))
    .update({
      status: 'processing'
    })
    .eq('id', id)
    .select("*")
    .single();
  
  if (error) {
    console.error(`标记AI任务(ID: ${id})为处理中状态失败:`, error);
    throw error;
  }
  
  return data as AITask;
}

/**
 * 将任务标记为失败
 */
export async function failAITask(id: string, errorInfo: Record<string, unknown>) {
  const supabase = getSupabaseClient();
  
  const now = new Date().toISOString();
  
  const { data, error } = await safeQuery(supabase
    .from(TABLES.AI_TASKS))
    .update({
      status: 'failed',
      completed_at: now,
      error: errorInfo
    })
    .eq('id', id)
    .select("*")
    .single();
  
  if (error) {
    console.error(`标记AI任务(ID: ${id})为失败状态失败:`, error);
    throw error;
  }
  
  return data as AITask;
}

const aiTaskRepository = {
  getAllAITasks,
  getAITaskById,
  createAITask,
  updateAITask,
  deleteAITask,
  completeAITask,
  startProcessingAITask,
  failAITask
};

export default aiTaskRepository; 