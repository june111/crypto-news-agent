/**
 * 数据库入口文件
 * 导出所有数据库相关功能
 */

// 导入仓库模块
import repositories from './repositories';

// 重新导出Supabase客户端
export { getSupabaseClient } from './supabase';

// 导出schema中的TABLES常量
export { TABLES } from './schema';

// 导出创建表工具
export * from './createTables';

// 不再直接导出仓库中的具体实现
// 而是通过repositories访问各个仓库
// export * from './repositories';

// 默认导出所有仓库
export default repositories; 