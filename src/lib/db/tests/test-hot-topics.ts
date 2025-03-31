/**
 * 热门话题仓库测试模块
 * 测试热门话题仓库的CRUD功能和评分管理
 */
import db from '../index';
import { v4 as uuidv4 } from 'uuid';

/**
 * 测试热门话题仓库
 * @returns 测试是否成功
 */
export async function testHotTopics(): Promise<boolean> {
  try {
    console.log('开始测试热门话题仓库...');
    
    // 生成测试数据
    const testHotTopic = {
      title: `测试热门话题-${uuidv4().substring(0, 8)}`,
      description: '这是一个用于测试的热门话题描述',
      keywords: ['比特币', '以太坊', '测试'],
      category: '加密货币',
      score: 75,
      status: 'active' as 'active' | 'archived' | 'trending'
    };
    
    // 1. 测试创建热门话题
    console.log('1. 测试创建热门话题...');
    const createdTopic = await db.hotTopics.createHotTopic(testHotTopic);
    if (!createdTopic || !createdTopic.id) {
      console.error('创建热门话题失败');
      return false;
    }
    console.log(`创建热门话题成功，ID: ${createdTopic.id}`);
    
    // 保存话题ID用于后续测试
    const topicId = createdTopic.id;
    
    // 2. 测试获取单个热门话题
    console.log('2. 测试获取单个热门话题...');
    const retrievedTopic = await db.hotTopics.getHotTopic(topicId);
    if (!retrievedTopic || retrievedTopic.id !== topicId) {
      console.error('获取单个热门话题失败');
      return false;
    }
    console.log(`获取单个热门话题成功，标题: ${retrievedTopic.title}`);
    
    // 3. 测试获取所有热门话题
    console.log('3. 测试获取所有热门话题...');
    const allTopics = await db.hotTopics.getAllHotTopics();
    if (!allTopics || allTopics.length === 0) {
      console.error('获取所有热门话题失败');
      return false;
    }
    console.log(`获取所有热门话题成功，共 ${allTopics.length} 个话题`);
    
    // 4. 测试更新热门话题
    console.log('4. 测试更新热门话题...');
    const updateData = {
      title: `${testHotTopic.title}-已更新`,
      description: '这是更新后的热门话题描述'
    };
    
    const updatedTopic = await db.hotTopics.updateHotTopic(topicId, updateData);
    if (!updatedTopic || updatedTopic.title !== updateData.title) {
      console.error('更新热门话题失败');
      return false;
    }
    console.log(`更新热门话题成功，新标题: ${updatedTopic.title}`);
    
    // 5. 测试增加热门话题评分
    console.log('5. 测试增加热门话题评分...');
    const incrementResult = await db.hotTopics.incrementHotTopicScore(topicId, 10);
    if (!incrementResult) {
      console.error('增加热门话题评分失败');
      return false;
    }
    
    // 再次获取热门话题，验证分数已更新
    const topicAfterIncrement = await db.hotTopics.getHotTopic(topicId);
    if (!topicAfterIncrement || topicAfterIncrement.score !== 85) { // 原来75 + 10 = 85
      console.error('热门话题评分未正确更新');
      return false;
    }
    console.log(`增加热门话题评分成功，当前评分: ${topicAfterIncrement.score}`);
    
    // 6. 测试标记热门话题为趋势
    console.log('6. 测试标记热门话题为趋势...');
    const trendingTopic = await db.hotTopics.markTopicAsTrending(topicId);
    if (!trendingTopic || trendingTopic.status !== 'trending') {
      console.error('标记热门话题为趋势失败');
      return false;
    }
    console.log(`标记热门话题为趋势成功，当前状态: ${trendingTopic.status}`);
    
    // 7. 测试获取趋势热门话题
    console.log('7. 测试获取趋势热门话题...');
    const trendingTopics = await db.hotTopics.getTrendingTopics(5);
    if (!trendingTopics || trendingTopics.length === 0) {
      console.error('获取趋势热门话题失败');
      return false;
    }
    console.log(`获取趋势热门话题成功，共 ${trendingTopics.length} 个话题`);
    
    // 8. 测试归档热门话题
    console.log('8. 测试归档热门话题...');
    const archivedTopic = await db.hotTopics.archiveTopic(topicId);
    if (!archivedTopic || archivedTopic.status !== 'archived') {
      console.error('归档热门话题失败');
      return false;
    }
    console.log(`归档热门话题成功，当前状态: ${archivedTopic.status}`);
    
    // 9. 测试删除热门话题
    console.log('9. 测试删除热门话题...');
    const deleteResult = await db.hotTopics.deleteHotTopic(topicId);
    if (!deleteResult) {
      console.error('删除热门话题失败');
      return false;
    }
    console.log('删除热门话题成功');
    
    // 验证删除成功
    const checkDeleted = await db.hotTopics.getHotTopic(topicId);
    if (checkDeleted) {
      console.error('热门话题删除验证失败，仍能查询到该话题');
      return false;
    } else {
      console.log('验证删除成功：热门话题已不存在');
    }
    
    console.log('热门话题仓库测试全部通过！');
    return true;
  } catch (error) {
    console.error('测试热门话题仓库时发生错误:', error);
    return false;
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testHotTopics().then(result => {
    if (result) {
      console.log('测试完成');
    } else {
      process.exit(1);
    }
  });
} 