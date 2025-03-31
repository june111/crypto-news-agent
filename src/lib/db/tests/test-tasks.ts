/**
 * AI任务仓库测试模块
 * 测试AI任务仓库的CRUD功能
 */
import db from '../index';
import { v4 as uuidv4 } from 'uuid';

/**
 * 测试AI任务仓库
 * @returns 测试是否成功
 */
export async function testTasks(): Promise<boolean> {
  try {
    console.log('开始测试AI任务仓库...');
    
    // 生成测试数据
    const testTask = {
      name: `测试AI任务-${uuidv4().substring(0, 8)}`,
      type: 'summary' as const,  // 使用schema中定义的枚举类型
      status: 'pending' as const
    };
    
    // 1. 测试创建AI任务
    console.log('1. 测试创建AI任务...');
    const createdTask = await db.aiTasks.createAITask(testTask);
    if (!createdTask || !createdTask.id) {
      console.error('创建AI任务失败');
      return false;
    }
    console.log(`创建AI任务成功，ID: ${createdTask.id}`);
    
    // 保存任务ID用于后续测试
    const taskId = createdTask.id;
    
    // 2. 测试获取单个AI任务
    console.log('2. 测试获取单个AI任务...');
    const retrievedTask = await db.aiTasks.getAITaskById(taskId);
    if (!retrievedTask || retrievedTask.id !== taskId) {
      console.error('获取单个AI任务失败');
      return false;
    }
    console.log(`获取单个AI任务成功，类型: ${retrievedTask.type}`);
    
    // 3. 测试获取所有AI任务
    console.log('3. 测试获取所有AI任务...');
    const tasksResult = await db.aiTasks.getAllAITasks({
      status: 'pending',
      page: 1,
      pageSize: 10
    });
    if (!tasksResult || !tasksResult.tasks || tasksResult.tasks.length === 0) {
      console.error('获取所有AI任务失败');
      return false;
    }
    console.log(`获取所有AI任务成功，共 ${tasksResult.tasks.length} 个任务`);
    
    // 4. 测试更新AI任务状态为处理中
    console.log('4. 测试更新AI任务状态为处理中...');
    const processingTask = await db.aiTasks.startProcessingAITask(taskId);
    if (!processingTask || processingTask.status !== 'processing') {
      console.error('更新AI任务状态为处理中失败');
      return false;
    }
    console.log(`更新AI任务状态为处理中成功，当前状态: ${processingTask.status}`);
    
    // 5. 测试完成AI任务
    console.log('5. 测试完成AI任务...');
    const resultData = {
      result: '这是由AI生成的加密货币市场摘要，包含关键市场趋势和分析结果。',
      processing_time: 2.5
    };
    
    const completedTask = await db.aiTasks.completeAITask(taskId, resultData);
    if (!completedTask || completedTask.status !== 'completed') {
      console.error('完成AI任务失败');
      return false;
    }
    console.log(`完成AI任务成功，状态: ${completedTask.status}`);
    
    // 6. 测试删除AI任务
    console.log('6. 测试删除AI任务...');
    const deleteResult = await db.aiTasks.deleteAITask(taskId);
    if (!deleteResult) {
      console.error('删除AI任务失败');
      return false;
    }
    console.log('删除AI任务成功');
    
    // 验证删除成功
    try {
      const checkDeleted = await db.aiTasks.getAITaskById(taskId);
      if (checkDeleted) {
        console.error('AI任务删除验证失败，仍能查询到该任务');
        return false;
      }
    } catch (error) {
      // 错误是预期的，表示任务已被成功删除
      console.log('验证删除成功：AI任务已不存在', error instanceof Error ? error.message : '未知错误');
    }
    
    console.log('AI任务仓库测试全部通过！');
    return true;
  } catch (error) {
    console.error('测试AI任务仓库时发生错误:', error);
    return false;
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testTasks().then(result => {
    if (result) {
      console.log('测试完成');
    } else {
      process.exit(1);
    }
  });
} 