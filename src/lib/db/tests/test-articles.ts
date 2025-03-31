/**
 * 文章仓库测试模块
 * 测试文章仓库的CRUD功能
 */
import db from '../index';
import { v4 as uuidv4 } from 'uuid';

/**
 * 测试文章仓库
 * @returns 测试是否成功
 */
export async function testArticles(): Promise<boolean> {
  try {
    console.log('开始测试文章仓库...');
    
    // 生成测试数据
    const testArticle = {
      title: `测试文章-${uuidv4().substring(0, 8)}`,
      content: '这是一篇用于测试的加密货币文章内容。内容包括比特币和以太坊的最新动态。',
      summary: '比特币和以太坊的最新动态',
      author: '测试用户',
      category: '加密货币',
      keywords: ['比特币', '以太坊', '测试'],
      status: 'draft' as const
    };
    
    // 1. 测试创建文章
    console.log('1. 测试创建文章...');
    const createdArticle = await db.articles.createArticle(testArticle);
    if (!createdArticle || !createdArticle.id) {
      console.error('创建文章失败');
      return false;
    }
    console.log(`创建文章成功，ID: ${createdArticle.id}`);
    
    // 保存文章ID用于后续测试
    const articleId = createdArticle.id;
    
    // 2. 测试获取单个文章
    console.log('2. 测试获取单个文章...');
    const retrievedArticle = await db.articles.getArticleById(articleId);
    if (!retrievedArticle || retrievedArticle.id !== articleId) {
      console.error('获取单个文章失败');
      return false;
    }
    console.log(`获取单个文章成功，标题: ${retrievedArticle.title}`);
    
    // 3. 测试获取所有文章
    console.log('3. 测试获取所有文章...');
    const articlesResult = await db.articles.getAllArticles({
      category: '加密货币',
      page: 1,
      pageSize: 10
    });
    if (!articlesResult || !articlesResult.articles || articlesResult.articles.length === 0) {
      console.error('获取所有文章失败');
      return false;
    }
    console.log(`获取所有文章成功，共 ${articlesResult.articles.length} 个文章`);
    
    // 4. 测试按关键词搜索文章
    console.log('4. 测试按关键词搜索文章...');
    const searchResults = await db.articles.getAllArticles({
      keyword: '比特币',
      category: '加密货币',
      page: 1,
      pageSize: 10
    });
    console.log(`关键词搜索文章成功，找到 ${searchResults.articles.length} 个结果`);
    
    // 5. 测试更新文章
    console.log('5. 测试更新文章...');
    const updateData = {
      title: `${testArticle.title}-已更新`,
      summary: '更新后的文章摘要',
      status: 'published' as const
    };
    
    const updatedArticle = await db.articles.updateArticle(articleId, updateData);
    if (!updatedArticle || updatedArticle.title !== updateData.title) {
      console.error('更新文章失败');
      return false;
    }
    console.log(`更新文章成功，新标题: ${updatedArticle.title}，状态: ${updatedArticle.status}`);
    
    // 6. 测试删除文章
    console.log('6. 测试删除文章...');
    const deleteResult = await db.articles.deleteArticle(articleId);
    if (!deleteResult) {
      console.error('删除文章失败');
      return false;
    }
    console.log('删除文章成功');
    
    // 验证删除成功
    try {
      const checkDeleted = await db.articles.getArticleById(articleId);
      if (checkDeleted) {
        console.error('文章删除验证失败，仍能查询到该文章');
        return false;
      }
    } catch (error) {
      // 错误是预期的，表示文章已被成功删除
      console.log('验证删除成功：文章已不存在', error instanceof Error ? error.message : '未知错误');
    }
    
    console.log('文章仓库测试全部通过！');
    return true;
  } catch (error) {
    console.error('测试文章仓库时发生错误:', error);
    return false;
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testArticles().then(result => {
    if (result) {
      console.log('测试完成');
    } else {
      process.exit(1);
    }
  });
} 