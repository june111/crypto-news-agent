/**
 * 数据库总入口
 * 只导出必要的函数，减少不必要的引用
 */
import { getSupabaseClient } from './supabase';
import { TABLES } from './schema';
import repositories from './repositories';
import { logDebug, logError, logInfo, logWarning } from './utils/logger';

// 数据库初始化状态
let isDatabaseInitialized = false;
let isInitializing = false;

// 按需加载数据库 - 优化为单例初始化
const initDatabaseOnce = async (requestId?: string) => {
  // 防止并发初始化
  if (isInitializing) {
    logDebug('数据库初始化已在进行中，等待完成...', { requestId });
    // 等待初始化完成
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return;
  }
  
  // 防止重复初始化
  if (isDatabaseInitialized) {
    logDebug('数据库已经初始化，跳过', { requestId });
    return;
  }
  
  try {
    isInitializing = true;
    
    // 获取客户端，传递请求ID以复用连接
    // 如果已经存在连接，会复用现有连接
    const supabase = getSupabaseClient(requestId);
    
    if (!supabase) {
      throw new Error('无法获取数据库连接');
    }
    
    logInfo('数据库模块初始化中...', { requestId });
    
    // 动态导入初始化函数，减少首次加载体积
    const { initDatabase } = await import('./supabase');
    const initResult = await initDatabase(requestId);
    
    if (!initResult) {
      logWarning('数据库初始化返回失败状态，但将继续使用', { requestId });
    }
    
    // 设置已初始化标志
    isDatabaseInitialized = true;
    logInfo('数据库初始化完成', { requestId });
  } catch (error) {
    logError('数据库初始化失败:', { error, requestId });
    throw error;
  } finally {
    isInitializing = false;
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