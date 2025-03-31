/**
 * 数据库测试系统
 * 包含所有数据库仓库的测试功能
 */
import { testConnection } from './test-connection';
import { testTemplates } from './test-templates';
import { testArticles } from './test-articles';
import { testTasks } from './test-tasks';
// 热门话题结构现已匹配实际数据库
import { testHotTopics } from './test-hot-topics';
// 现在需要测试向量嵌入
import { testEmbeddings } from './test-embeddings';
import { fileURLToPath } from 'url';

const runTestConnection = testConnection;
const runTestTemplates = testTemplates;
const runTestArticles = testArticles;
const runTestTasks = testTasks;
// 热门话题结构现已匹配实际数据库
const runTestHotTopics = testHotTopics;
// 现在需要测试向量嵌入
const runTestEmbeddings = testEmbeddings;

/**
 * 运行所有数据库测试
 */
async function runAllTests() {
  console.log('==============================================');
  console.log('开始执行数据库系统集成测试');
  console.log('==============================================');
  
  // 先测试数据库连接
  const connectionResult = await runTestConnection();
  if (!connectionResult) {
    console.error('数据库连接测试失败，无法继续执行其他测试');
    process.exit(1);
  }
  
  // 运行各个仓库的测试
  const testResults = {
    templates: false,
    articles: false,
    tasks: false,
    // 热门话题测试已启用
    hotTopics: false,
    // 现在需要测试向量嵌入
    embeddings: false
  };
  
  // 测试模板仓库
  console.log('\n📝 测试模板仓库...');
  testResults.templates = await runTestTemplates();
  console.log(testResults.templates ? '✅ 模板仓库测试通过' : '❌ 模板仓库测试失败');
  
  // 测试文章仓库
  console.log('\n📰 测试文章仓库...');
  testResults.articles = await runTestArticles();
  console.log(testResults.articles ? '✅ 文章仓库测试通过' : '❌ 文章仓库测试失败');
  
  // 测试AI任务仓库
  console.log('\n🤖 测试AI任务仓库...');
  testResults.tasks = await runTestTasks();
  console.log(testResults.tasks ? '✅ AI任务仓库测试通过' : '❌ AI任务仓库测试失败');
  
  // 测试热门话题仓库
  console.log('\n🔥 测试热门话题仓库...');
  testResults.hotTopics = await runTestHotTopics();
  console.log(testResults.hotTopics ? '✅ 热门话题仓库测试通过' : '❌ 热门话题仓库测试失败');
  
  // 测试嵌入向量仓库
  console.log('\n🧠 测试嵌入向量仓库...');
  testResults.embeddings = await runTestEmbeddings();
  console.log(testResults.embeddings ? '✅ 嵌入向量仓库测试通过' : '❌ 嵌入向量仓库测试失败');
  
  // 显示测试结果统计
  console.log('\n==============================================');
  console.log('测试结果汇总:');
  let passed = 0;
  let failed = 0;
  
  for (const [name, result] of Object.entries(testResults)) {
    if (result) {
      passed++;
      console.log(`✅ ${name} 测试通过`);
    } else {
      failed++;
      console.log(`❌ ${name} 测试失败`);
    }
  }
  
  console.log(`共执行测试: ${passed + failed}`);
  console.log(`通过测试: ${passed}`);
  console.log(`失败测试: ${failed}`);
  console.log('==============================================');
  
  if (failed > 0) {
    console.error('一些测试未通过，请检查日志获取详细信息');
    process.exit(1);
  } else {
    console.log('🎉 所有测试通过！数据库系统运行正常');
  }
}

// 如果直接运行此文件，则执行所有测试
const currentFilePath = typeof import.meta !== 'undefined' ? import.meta.url : '';
if (currentFilePath && currentFilePath === fileURLToPath(import.meta.url)) {
  runAllTests().catch(err => {
    console.error('测试过程中发生未捕获的错误:', err);
    process.exit(1);
  });
}

// 导出测试功能
export const dbTests = {
  testConnection: runTestConnection,
  testTemplates: runTestTemplates,
  testArticles: runTestArticles,
  testTasks: runTestTasks,
  // 热门话题测试已启用
  testHotTopics: runTestHotTopics,
  // 现在需要测试向量嵌入
  testEmbeddings: runTestEmbeddings,
  runAllTests
};

export default dbTests; 