/**
 * 数据库连接测试模块
 * 测试Supabase连接是否正常工作
 */
// 使用ES模块语法导入
import { getSupabaseClient } from '../supabase';

/**
 * 测试数据库连接
 * @returns 连接是否成功
 */
async function testConnection() {
  try {
    console.log('测试数据库连接...');
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('articles').select('id').limit(1);
    
    if (error) {
      console.error('数据库连接错误:', error.message);
      return false;
    }
    
    console.log('数据库连接成功！');
    console.log(`验证查询返回了 ${data ? data.length : 0} 条记录`);
    
    return true;
  } catch (error) {
    console.error('测试数据库连接时发生未捕获的错误:', error);
    return false;
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testConnection().then(success => {
    if (success) {
      console.log('数据库连接测试通过！');
    } else {
      console.error('数据库连接测试失败，请检查配置。');
      process.exit(1);
    }
  }).catch(err => {
    console.error('执行测试时发生错误:', err);
    process.exit(1);
  });
}

export { testConnection }; 