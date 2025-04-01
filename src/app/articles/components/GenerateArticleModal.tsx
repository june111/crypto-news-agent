import React, { useState } from 'react';
import { Modal, Form, Select, Input, Tag, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import styles from '../articles.module.css';
import { Article } from '@/types/article';

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
  const handleSubmit = () => {
    if (selectedKeywords.length > 0 && selectedTemplate) {
      // 获取选中的模板
      const template = templates.find(t => t.id === selectedTemplate);
      
      // 生成标题 (使用第一个关键词作为标题的一部分)
      const mainKeyword = selectedKeywords[0];
      const generatedTitle = `关于${mainKeyword}的${template?.category}`;
      
      // 准备文章数据
      const articleData = {
        title: generatedTitle,
        category: template?.category || '区块链',
        keywords: selectedKeywords,
        summary: `使用${template?.title}生成的关于${mainKeyword}的${template?.category}文章`,
        coverImage: COVER_IMAGE, // 使用统一的百度图片链接
        content: '正在生成文章内容...'
      };
      
      // 调用保存回调
      onSave(articleData);
      
      // 重置表单和状态
      resetForm();
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
        style: { borderRadius: '4px' }
      }}
      cancelButtonProps={{ style: { borderRadius: '4px' } }}
    >
      <Form form={form} layout="vertical">
        {/* 选择/输入关键词 */}
        <Form.Item 
          label="关键词" 
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
                {topic.keyword}
                <Tag color="orange" style={{ marginLeft: 8 }}>热度: {topic.popularity}</Tag>
              </Option>
            ))}
          </Select>
          <Text type="secondary" className={styles.modalHelp}>
            输入关键词后回车或逗号分隔，可添加多个关键词
          </Text>
        </Form.Item>
        
        {/* 选择文章模板 */}
        <Form.Item 
          label="文章模板" 
          rules={[{ required: true, message: '请选择文章模板' }]}
          className={styles.modalSection}
        >
          <Select
            placeholder="选择文章模板"
            value={selectedTemplate}
            onChange={handleSelectTemplate}
            style={{ width: '100%' }}
          >
            {templates.map(template => (
              <Option key={template.id} value={template.id}>
                <div>
                  <Text strong>{template.title}</Text>
                  <Tag color="blue" style={{ marginLeft: 8 }}>{template.category}</Tag>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>{template.description}</Text>
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GenerateArticleModal; 