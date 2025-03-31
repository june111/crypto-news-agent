/**
 * 基本数据库测试模块
 * 测试Supabase连接和基本操作
 */
// 使用ES模块语法导入
import { getSupabaseClient } from '../supabase';

/**
 * 测试Supabase基本操作
 */
async function testBasicOperations() {
  try {
    console.log('开始测试数据库基本操作...');
    
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    
    // 1. 测试连接
    console.log('1. 测试数据库连接...');
    const { data: connectionTestData, error: connectionTestError } = await supabase
      .from('articles')
      .select('id')
      .limit(1);
    
    if (connectionTestError) {
      console.error('数据库连接错误:', connectionTestError.message);
      return false;
    }
    
    console.log(`数据库连接成功，获取到 ${connectionTestData ? connectionTestData.length : 0} 条记录`);
    
    // 如果配置了真实的 Supabase，可以尝试执行更多操作
    
    return true;
  } catch (error) {
    console.error('测试基本操作时发生错误:', error);
    return false;
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testBasicOperations().then(success => {
    if (success) {
      console.log('数据库基本操作测试通过！');
    } else {
      console.error('数据库基本操作测试失败。');
      process.exit(1);
    }
  }).catch(err => {
    console.error('执行测试时发生错误:', err);
    process.exit(1);
  });
}

export { testBasicOperations }; 