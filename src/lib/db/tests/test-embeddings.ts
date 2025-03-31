/**
 * 向量嵌入仓库测试模块
 * 测试向量嵌入仓库的CRUD功能
 */
import db from '../index';
import { v4 as uuidv4 } from 'uuid';

/**
 * 生成随机向量
 * @param dim 向量维度
 * @returns 随机向量
 */
function generateRandomVector(dim: number = 1536): number[] {
  return Array.from({ length: dim }, () => Math.random() * 2 - 1);
}

/**
 * 测试向量嵌入仓库
 * @returns 测试是否成功
 */
export async function testEmbeddings(): Promise<boolean> {
  try {
    console.log('开始测试向量嵌入仓库...');
    
    // 先创建一篇文章，以获取有效的文章ID
    console.log('创建测试文章...');
    const testArticle = {
      title: `测试嵌入文章-${uuidv4().substring(0, 8)}`,
      content: '这是一篇用于测试向量嵌入的文章内容。',
      summary: '测试向量嵌入的文章',
      author: '测试用户',
      category: '加密货币',
      keywords: ['测试', '向量嵌入'],
      status: 'draft' as const
    };
    
    const createdArticle = await db.articles.createArticle(testArticle);
    if (!createdArticle || !createdArticle.id) {
      console.error('创建测试文章失败，无法继续嵌入测试');
      return false;
    }
    
    console.log(`创建测试文章成功，ID: ${createdArticle.id}`);
    const articleId = createdArticle.id;
    
    // 生成测试数据
    const testEmbedding = {
      content: '这是一段用于测试的内容片段，用于生成向量嵌入。',
      embedding: generateRandomVector(),
      metadata: { source: 'test', category: 'cryptocurrency' },
      article_id: articleId // 使用刚刚创建的文章ID
    };
    
    // 1. 测试创建向量嵌入
    console.log('1. 测试创建向量嵌入...');
    const createdEmbedding = await db.embeddings.storeEmbedding(testEmbedding);
    if (!createdEmbedding || !createdEmbedding.id) {
      console.error('创建向量嵌入失败');
      return false;
    }
    console.log(`创建向量嵌入成功，ID: ${createdEmbedding.id}`);
    
    // 保存嵌入ID用于后续测试
    const embeddingId = createdEmbedding.id;
    
    // 2. 测试获取单个向量嵌入
    console.log('2. 测试获取单个向量嵌入...');
    const retrievedEmbedding = await db.embeddings.getEmbedding(embeddingId);
    if (!retrievedEmbedding || retrievedEmbedding.id !== embeddingId) {
      console.error('获取单个向量嵌入失败');
      return false;
    }
    console.log(`获取单个向量嵌入成功，内容: ${retrievedEmbedding.content}`);
    
    // 3. 测试获取文章相关的所有向量嵌入
    console.log('3. 测试获取文章相关的所有向量嵌入...');
    const articleEmbeddings = await db.embeddings.getArticleEmbeddings(articleId);
    if (!articleEmbeddings || articleEmbeddings.length === 0) {
      console.error('获取文章相关的所有向量嵌入失败');
      return false;
    }
    console.log(`获取文章相关的所有向量嵌入成功，共 ${articleEmbeddings.length} 个嵌入`);
    
    // 4. 测试向量相似度查询
    console.log('4. 测试向量相似度查询...');
    const queryVector = generateRandomVector();
    const similarEmbeddings = await db.embeddings.similaritySearch(queryVector, 0.5, 5);
    console.log(`向量相似度查询成功，找到 ${similarEmbeddings.length} 个相似嵌入`);
    
    // 5. 测试删除向量嵌入
    console.log('5. 测试删除向量嵌入...');
    const deleteResult = await db.embeddings.deleteEmbedding(embeddingId);
    if (!deleteResult) {
      console.error('删除向量嵌入失败');
      return false;
    }
    console.log('删除向量嵌入成功');
    
    // 6. 测试删除文章相关的所有向量嵌入
    console.log('6. 测试删除文章相关的所有向量嵌入...');
    // 先创建另一个向量嵌入用于测试
    const anotherEmbedding = {
      content: '这是另一段用于测试的内容片段。',
      embedding: generateRandomVector(),
      metadata: { source: 'test', category: 'cryptocurrency' },
      article_id: articleId // 使用相同的文章ID
    };
    
    await db.embeddings.storeEmbedding(anotherEmbedding);
    
    const deleteByContentResult = await db.embeddings.deleteArticleEmbeddings(articleId);
    if (!deleteByContentResult) {
      console.error('删除文章相关的所有向量嵌入失败');
      return false;
    }
    console.log('删除文章相关的所有向量嵌入成功');
    
    // 7. 清理测试文章
    console.log('7. 清理测试文章...');
    await db.articles.deleteArticle(articleId);
    console.log('清理测试文章成功');
    
    console.log('向量嵌入仓库测试全部通过！');
    return true;
  } catch (error) {
    console.error('测试向量嵌入仓库时发生错误:', error);
    return false;
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testEmbeddings().then(result => {
    if (result) {
      console.log('测试完成');
    } else {
      process.exit(1);
    }
  });
} 