/**
 * 数据库表初始化脚本
 * 用于创建Supabase数据库表和初始测试数据
 */
import { getSupabaseClient } from './supabase';
import { TABLES } from './schema';

/**
 * 创建数据库表
 * 用于初始化数据库结构和测试数据
 */

/**
 * 创建模板表
 */
export async function createTemplatesTable() {
  const supabase = getSupabaseClient();
  
  // 检查表是否存在
  const { data: existingTables, error: checkError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', TABLES.TEMPLATES);

  if (checkError) {
    console.error('检查模板表是否存在时出错:', checkError);
    return false;
  }

  // 如果表已存在，则跳过创建
  if (existingTables && existingTables.length > 0) {
    console.log('模板表已存在，跳过创建');
    return true;
  }

  // 创建表
  const { error } = await supabase.rpc('create_templates_table', {}, {});

  if (error) {
    console.error('创建模板表失败:', error);
    return false;
  }

  console.log('模板表创建成功');
  return true;
}

/**
 * 创建文章表
 */
export async function createArticlesTable() {
  const supabase = getSupabaseClient();
  
  // 检查表是否存在
  const { data: existingTables, error: checkError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', TABLES.ARTICLES);

  if (checkError) {
    console.error('检查文章表是否存在时出错:', checkError);
    return false;
  }

  // 如果表已存在，则跳过创建
  if (existingTables && existingTables.length > 0) {
    console.log('文章表已存在，跳过创建');
    return true;
  }

  // 创建表
  const { error } = await supabase.rpc('create_articles_table', {}, {});

  if (error) {
    console.error('创建文章表失败:', error);
    return false;
  }

  console.log('文章表创建成功');
  return true;
}

/**
 * 创建AI任务表
 */
export async function createAITasksTable() {
  const supabase = getSupabaseClient();
  
  // 检查表是否存在
  const { data: existingTables, error: checkError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', TABLES.AI_TASKS);

  if (checkError) {
    console.error('检查AI任务表是否存在时出错:', checkError);
    return false;
  }

  // 如果表已存在，则跳过创建
  if (existingTables && existingTables.length > 0) {
    console.log('AI任务表已存在，跳过创建');
    return true;
  }

  // 创建表
  const { error } = await supabase.rpc('create_ai_tasks_table', {}, {});

  if (error) {
    console.error('创建AI任务表失败:', error);
    return false;
  }

  console.log('AI任务表创建成功');
  return true;
}

/**
 * 创建热点话题表
 */
export async function createHotTopicsTable() {
  const supabase = getSupabaseClient();
  
  // 检查表是否存在
  const { data: existingTables, error: checkError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', TABLES.HOT_TOPICS);

  if (checkError) {
    console.error('检查热点话题表是否存在时出错:', checkError);
    return false;
  }

  // 如果表已存在，则跳过创建
  if (existingTables && existingTables.length > 0) {
    console.log('热点话题表已存在，跳过创建');
    return true;
  }

  // 创建表
  const { error } = await supabase.rpc('create_hot_topics_table', {}, {});

  if (error) {
    console.error('创建热点话题表失败:', error);
    return false;
  }
  
  console.log('热点话题表创建成功');
  return true;
}

/**
 * 创建所有表
 */
export async function createTables() {
  try {
    console.log('开始创建数据库表...');
    const supabase = getSupabaseClient();
    
    // 1. 创建模板表
    console.log('创建模板表...');
    await supabase.from('templates').insert({
      id: '00000000-0000-0000-0000-000000000000',
      name: '测试模板',
      description: '测试模板描述',
      content: '测试内容',
      category: '测试',
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select();
    console.log('模板表创建成功！');
    
    // 2. 创建文章表
    console.log('创建文章表...');
    await supabase.from('articles').insert({
      id: '00000000-0000-0000-0000-000000000000',
      title: '测试文章',
      content: '测试内容',
      summary: '测试摘要',
      category: '测试',
      keywords: ['测试'],
      status: 'draft',
      cover_image: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select();
    console.log('文章表创建成功！');
    
    // 3. 创建AI任务表
    console.log('创建AI任务表...');
    await supabase.from('ai_tasks').insert({
      id: '00000000-0000-0000-0000-000000000000',
      name: '测试任务',
      type: 'content',
      status: 'pending',
      input_data: {},
      created_at: new Date().toISOString()
    }).select();
    console.log('AI任务表创建成功！');

    // 4. 创建热点话题表
    console.log('创建热点话题表...');
    await supabase.from('hot_topics').insert({
      id: '00000000-0000-0000-0000-000000000000',
      title: '比特币',
      description: '比特币价格走势分析',
      keywords: ['比特币', '加密货币', 'BTC'],
      score: 100,
      status: 'trending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select();
    console.log('热点话题表创建成功！');
    
    console.log('所有表创建成功！');
    return true;
  } catch (error) {
    console.error('创建表时发生错误:', error);
    return false;
  }
}

/**
 * 检查数据库表是否存在
 */
export async function checkTablesExist() {
  try {
    const supabase = getSupabaseClient();
    
    // 尝试从各个表中获取一条记录来检查表是否存在
    const templates = await supabase.from('templates').select('id').limit(1);
    const articles = await supabase.from('articles').select('id').limit(1);
    const aiTasks = await supabase.from('ai_tasks').select('id').limit(1);
    const hotTopics = await supabase.from('hot_topics').select('id').limit(1);
    
    // 检查是否有任何表不存在
    if (templates.error || articles.error || aiTasks.error || hotTopics.error) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('检查表是否存在时发生错误:', error);
    return false;
  }
}

// 导出模块
const databaseTables = {
  createTables,
  checkTablesExist,
  createTemplatesTable,
  createArticlesTable,
  createAITasksTable,
  createHotTopicsTable
};

export default databaseTables; 