/**
 * 数据库总入口
 * 只导出必要的函数，减少不必要的引用
 */
import { getSupabaseClient } from './supabase';
import { TABLES } from './schema';
import repositories from './repositories';

// 数据库初始化状态
let isDatabaseInitialized = false;

// 按需加载数据库
const initDatabaseOnce = async () => {
  // 防止重复初始化
  if (isDatabaseInitialized) {
    return;
  }
  
  try {
    // 获取客户端
    const supabase = getSupabaseClient();
    console.log('数据库模块初始化中...');
    
    // 动态导入初始化函数，减少首次加载体积
    const { initDatabase } = await import('./supabase');
    await initDatabase();
    
    // 设置已初始化标志
    isDatabaseInitialized = true;
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

// 导出所需函数和常量
export {
  getSupabaseClient,
  initDatabaseOnce,
  TABLES
};

// 导出仓库
export default repositories; 