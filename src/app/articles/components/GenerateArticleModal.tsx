'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Tag, Typography, Spin, message } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import styles from '../articles.module.css';
import { Article } from '@/types/article';
import { DifyClient } from '@/lib/services/dify/client';

// 统一使用百度图片链接
const COVER_IMAGE = "https://img0.baidu.com/it/u=4160253413,3711804954&fm=253&fmt=auto&app=138&f=JPEG?w=708&h=500";

// 模拟热点关键词类型定义
interface HotTopic {
  id: string;
  keyword: string;
  popularity: number;
  date: string;
}

// 文章模板类型定义
interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
}

interface GenerateArticleModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (articleData: Partial<Article>) => void;
}

const { Option } = Select;
const { Text } = Typography;

const GenerateArticleModal: React.FC<GenerateArticleModalProps> = ({
  visible,
  onClose,
  onSave
}) => {
  const [form] = Form.useForm();
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [difyParams, setDifyParams] = useState<any>(null);
  const [difyLoading, setDifyLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  
  // 模拟热点关键词数据
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([
    { id: '1', keyword: '比特币', popularity: 89, date: '2023-03-29' },
    { id: '2', keyword: '以太坊', popularity: 76, date: '2023-03-28' },
    { id: '3', keyword: '区块链', popularity: 65, date: '2023-03-27' },
    { id: '4', keyword: 'NFT', popularity: 58, date: '2023-03-26' },
    { id: '5', keyword: 'DeFi', popularity: 52, date: '2023-03-25' }
  ]);
  
  // 模拟文章模板数据
  const [templates] = useState<Template[]>([
    { id: '1', title: '价格分析模板', description: '用于分析加密货币价格走势', category: '分析' },
    { id: '2', title: '项目介绍模板', description: '介绍区块链项目的功能和特点', category: '介绍' },
    { id: '3', title: '市场动态模板', description: '报道加密货币市场的最新动态', category: '报道' },
    { id: '4', title: '技术解析模板', description: '深入解析区块链技术细节', category: '技术' }
  ]);

  // 获取Dify参数
  useEffect(() => {
    if (visible && !difyParams) {
      fetchDifyParameters();
    }
  }, [visible]);

  // 获取Dify参数
  const fetchDifyParameters = async () => {
    try {
      setDifyLoading(true);
      const result = await DifyClient.getParameters();
      if (result.success) {
        setDifyParams(result);
        console.log('Dify参数:', result);
      } else {
        message.error('无法获取Dify参数: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('获取Dify参数异常:', error);
      message.error('获取Dify参数失败');
    } finally {
      setDifyLoading(false);
    }
  };
  
  // 处理关键词变化
  const handleKeywordsChange = (values: string[]) => {
    setSelectedKeywords(values);
  };
  
  // 添加关键词
  const handleAddKeyword = (inputValue: string) => {
    const newKeyword = {
      id: (hotTopics.length + 1).toString(),
      keyword: inputValue,
      popularity: Math.floor(Math.random() * 40) + 10, // 10-50的随机热度
      date: new Date().toISOString().split('T')[0]
    };
    
    setHotTopics([...hotTopics, newKeyword]);
    setSelectedKeywords([...selectedKeywords, inputValue]);
  };
  
  // 处理选择模板
  const handleSelectTemplate = (value: string) => {
    setSelectedTemplate(value);
  };
  
  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // 验证关键词和模板已选择
      if (selectedKeywords.length === 0 || !selectedTemplate) {
        message.warning('请至少选择一个关键词和模板');
        setLoading(false);
        return;
      }

      // 获取选中的模板
      const template = templates.find(t => t.id === selectedTemplate);
      
      // 生成标题 (使用第一个关键词作为标题的一部分)
      const mainKeyword = selectedKeywords[0];
      const generatedTitle = `关于${mainKeyword}的${template?.category || '分析'}`;

      // 使用Dify工作流API生成内容
      const workflowResult = await DifyClient.runWorkflow({
        inputs: {
          topic: mainKeyword, // 关键词映射到topic
          type: 'content', // 固定为content类型
          title: generatedTitle,
          template: template?.title || '默认模板', // 模板映射到template
          describe: `生成一篇关于${mainKeyword}的${template?.category || '分析'}文章，包含详细内容`,
          content: null
        }
      });

      if (workflowResult.success) {
        // 准备文章数据
        const content = typeof workflowResult.result === 'string' 
          ? workflowResult.result 
          : workflowResult.result?.content || '正在生成中...';

        const articleData = {
          title: generatedTitle,
          category: template?.category || '区块链',
          keywords: selectedKeywords,
          summary: `使用Dify AI生成的关于${mainKeyword}的${template?.category || '分析'}文章`,
          coverImage: COVER_IMAGE,
          content: content,
          source: 'Dify AI',
          difyWorkflowRunId: workflowResult.workflowRunId,
          difyResult: workflowResult.result
        };
        
        // 调用保存回调
        onSave(articleData);
        
        // 重置表单和状态
        resetForm();
        
        messageApi.success('文章生成请求已提交，正在处理中');
      } else {
        message.error('生成内容失败: ' + (workflowResult.error || '未知错误'));
      }
    } catch (error) {
      console.error('生成文章异常:', error);
      message.error('生成文章失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 重置表单和状态
  const resetForm = () => {
    form.resetFields();
    setSelectedKeywords([]);
    setSelectedTemplate('');
  };
  
  // 关闭时清理
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  return (
    <Modal
      open={visible}
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <RobotOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          生成AI文章
        </div>
      }
      onCancel={handleClose}
      onOk={handleSubmit}
      okText="提交生成"
      cancelText="取消"
      okButtonProps={{ 
        disabled: !(selectedKeywords.length > 0 && selectedTemplate),
        type: 'primary',
        style: { borderRadius: '4px' },
        loading: loading
      }}
      cancelButtonProps={{ style: { borderRadius: '4px' } }}
    >
      {contextHolder}
      <Form form={form} layout="vertical">
        {/* 任务类型标识 - 固定为content */}
        <div className={styles.modalSection}>
          <Tag color="blue">任务类型: content</Tag>
        </div>
        
        {/* 选择/输入关键词 - 映射到topic */}
        <Form.Item 
          label="关键词 (topic)" 
          rules={[{ required: true, message: '请选择至少一个关键词' }]}
          className={styles.modalSection}
        >
          <Select
            mode="tags"
            placeholder="输入或选择关键词，回车添加多个关键词"
            value={selectedKeywords}
            onChange={handleKeywordsChange}
            style={{ width: '100%' }}
            tokenSeparators={[',']}
            optionFilterProp="children"
            listHeight={200}
            onInputKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                const inputElement = e.target as HTMLInputElement;
                if (inputElement.value) {
                  const inputValue = inputElement.value.trim();
                  if (inputValue && !hotTopics.some(topic => topic.keyword === inputValue)) {
                    handleAddKeyword(inputValue);
                  }
                }
              }
            }}
          >
            {hotTopics.map(topic => (
              <Option key={topic.keyword} value={topic.keyword}>
                <div style={{ padding: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text strong>{topic.keyword}</Text>
                  <Tag color="orange">热度: {topic.popularity}</Tag>
                </div>
              </Option>
            ))}
          </Select>
          <Text type="secondary" className={styles.modalHelp}>
            输入关键词后回车或逗号分隔，可添加多个关键词
          </Text>
        </Form.Item>
        
        {/* 选择文章模板 - 映射到template */}
        <Form.Item 
          label="文章模板 (template)" 
          rules={[{ required: true, message: '请选择文章模板' }]}
          className={styles.modalSection}
        >
          <Select
            placeholder="选择文章模板"
            value={selectedTemplate}
            onChange={handleSelectTemplate}
            style={{ width: '100%' }}
            optionLabelProp="label"
            listHeight={200}
          >
            {templates.map(template => (
              <Option 
                key={template.id} 
                value={template.id}
                label={template.title}
              >
                <div style={{ padding: '4px 0' }}>
                  <Text strong>{template.title}</Text>
                  <Tag color="blue" style={{ marginLeft: 8 }}>{template.category}</Tag>
                </div>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  {template.description}
                </Text>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Dify参数加载状态 */}
        {difyLoading && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <Spin tip="加载Dify参数中..." />
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default GenerateArticleModal; 