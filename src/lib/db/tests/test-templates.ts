/**
 * 模板仓库测试模块
 * 测试模板仓库的CRUD功能
 */
import db from '../index';
import { v4 as uuidv4 } from 'uuid';

/**
 * 测试模板仓库
 * @returns 测试是否成功
 */
export async function testTemplates(): Promise<boolean> {
  try {
    console.log('开始测试模板仓库...');
    
    // 生成测试数据
    const testTemplate = {
      name: `测试模板-${uuidv4().substring(0, 8)}`,
      content: '这是一个用于测试的内容模板。\n可以包含占位符。',
      description: '用于自动化测试的模板',
      category: '加密货币'
    };
    
    // 1. 测试创建模板
    console.log('1. 测试创建模板...');
    const createdTemplate = await db.templates.createTemplate(testTemplate);
    if (!createdTemplate || !createdTemplate.id) {
      console.error('创建模板失败');
      return false;
    }
    console.log(`创建模板成功，ID: ${createdTemplate.id}`);
    
    // 保存模板ID用于后续测试
    const templateId = createdTemplate.id;
    
    // 2. 测试获取单个模板
    console.log('2. 测试获取单个模板...');
    const retrievedTemplate = await db.templates.getTemplateById(templateId);
    if (!retrievedTemplate || retrievedTemplate.id !== templateId) {
      console.error('获取单个模板失败');
      return false;
    }
    console.log(`获取单个模板成功，名称: ${retrievedTemplate.name}`);
    
    // 3. 测试获取所有模板
    console.log('3. 测试获取所有模板...');
    const templatesResult = await db.templates.getAllTemplates({
      category: '加密货币',
      page: 1,
      pageSize: 10
    });
    if (!templatesResult || !templatesResult.templates || templatesResult.templates.length === 0) {
      console.error('获取所有模板失败');
      return false;
    }
    console.log(`获取所有模板成功，共 ${templatesResult.templates.length} 个模板`);
    
    // 4. 测试更新模板
    console.log('4. 测试更新模板...');
    const updateData = {
      name: `${testTemplate.name}-已更新`,
      description: '这是更新后的描述'
    };
    
    const updatedTemplate = await db.templates.updateTemplate(templateId, updateData);
    if (!updatedTemplate || updatedTemplate.name !== updateData.name) {
      console.error('更新模板失败');
      return false;
    }
    console.log(`更新模板成功，新名称: ${updatedTemplate.name}`);
    
    // 5. 测试增加模板使用次数
    console.log('5. 测试增加模板使用次数...');
    const incrementResult = await db.templates.incrementTemplateUsage(templateId);
    if (!incrementResult) {
      console.error('增加模板使用次数失败');
      return false;
    }
    console.log(`增加模板使用次数成功，当前使用次数: ${incrementResult.usage_count}`);
    
    // 6. 测试删除模板
    console.log('6. 测试删除模板...');
    const deleteResult = await db.templates.deleteTemplate(templateId);
    if (!deleteResult) {
      console.error('删除模板失败');
      return false;
    }
    console.log('删除模板成功');
    
    // 验证删除成功
    try {
      const checkDeleted = await db.templates.getTemplateById(templateId);
      if (checkDeleted) {
        console.error('模板删除验证失败，仍能查询到该模板');
        return false;
      }
    } catch (error) {
      console.log('验证删除成功：模板已不存在', error instanceof Error ? error.message : '未知错误');
    }
    
    console.log('模板仓库测试全部通过！');
    return true;
  } catch (error) {
    console.error('测试模板仓库时发生错误:', error);
    return false;
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testTemplates().then(result => {
    if (result) {
      console.log('测试完成');
    } else {
      process.exit(1);
    }
  });
} 