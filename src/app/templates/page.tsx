'use client';

import React, { useState, useMemo } from 'react';
import { 
  Input, 
  Button, 
  Card, 
  Typography, 
  Row, 
  Col, 
  Divider, 
  Empty, 
  Space,
  Popconfirm,
  Tag,
  Select,
  Form
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;
const { Option } = Select;

// 模板类型定义
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  createdAt: string;
  usageCount: number;
}

const TemplatesPage = () => {
  const router = useRouter();

  // 模拟模板数据
  const [templates, setTemplates] = useState<Template[]>([
    { 
      id: '1', 
      name: '市场分析模板', 
      description: '适用于加密货币市场分析类文章', 
      category: '分析',
      content: '# {{币种名称}}市场分析报告\n\n## 市场概况\n\n{{币种名称}}目前市值为{{市值}}，24小时交易量为{{交易量}}。\n\n## 价格分析\n\n近期价格表现：{{价格分析}}\n\n## 技术指标\n\n- RSI: {{RSI值}}\n- MACD: {{MACD值}}\n- 布林带: {{布林带情况}}\n\n## 市场情绪\n\n目前市场对{{币种名称}}的总体情绪是{{情绪分析}}。\n\n## 未来展望\n\n基于以上分析，我们预计{{币种名称}}在短期内可能会{{预测结果}}。',
      createdAt: '2025-02-15', 
      usageCount: 28 
    },
    { 
      id: '2', 
      name: '项目介绍模板', 
      description: '用于介绍新的区块链项目和代币', 
      category: '介绍',
      content: '# {{项目名称}}项目介绍\n\n## 项目概述\n\n{{项目名称}}是一个{{项目类型}}项目，主要致力于解决{{问题领域}}问题。\n\n## 核心功能\n\n1. {{功能1}}\n2. {{功能2}}\n3. {{功能3}}\n\n## 技术架构\n\n{{项目名称}}基于{{底层技术}}构建，采用了{{技术特点}}。\n\n## 代币经济模型\n\n代币符号：{{代币符号}}\n总供应量：{{总供应量}}\n分配方案：{{分配方案}}\n\n## 团队背景\n\n项目由{{团队/创始人}}创建，他们拥有{{背景经验}}。\n\n## 发展路线图\n\n{{路线图内容}}',
      createdAt: '2025-02-20', 
      usageCount: 15 
    },
    { 
      id: '3', 
      name: '新闻简报模板', 
      description: '每日加密货币新闻概要', 
      category: '报道',
      content: '# 加密货币市场日报 {{日期}}\n\n## 市场概览\n\n今日加密货币市场整体{{市场表现}}。比特币价格{{比特币价格变动}}，以太坊价格{{以太坊价格变动}}。\n\n## 今日重要新闻\n\n### {{新闻标题1}}\n{{新闻内容1}}\n\n### {{新闻标题2}}\n{{新闻内容2}}\n\n### {{新闻标题3}}\n{{新闻内容3}}\n\n## 监管动态\n\n{{监管新闻}}\n\n## 值得关注的项目\n\n{{项目动态}}\n\n## 市场展望\n\n{{市场预测}}',
      createdAt: '2025-03-01', 
      usageCount: 42 
    },
    { 
      id: '4', 
      name: '技术解析模板', 
      description: '详细解析区块链技术细节', 
      category: '技术',
      content: '# {{技术名称}}技术解析\n\n## 技术背景\n\n{{技术名称}}是{{技术定义和背景}}。\n\n## 核心原理\n\n{{技术原理详解}}\n\n## 关键特性\n\n1. {{特性1}}\n2. {{特性2}}\n3. {{特性3}}\n\n## 技术优势\n\n相比传统方案，{{技术名称}}的优势在于{{优势分析}}。\n\n## 应用场景\n\n{{技术名称}}主要适用于以下场景：\n\n- {{场景1}}\n- {{场景2}}\n- {{场景3}}\n\n## 技术挑战与解决方案\n\n目前{{技术名称}}面临的主要挑战是{{挑战}}，可能的解决方案包括{{解决方案}}。\n\n## 发展前景\n\n{{发展前景分析}}',
      createdAt: '2025-03-10', 
      usageCount: 8 
    }
  ]);
  
  // 搜索状态
  const [searchName, setSearchName] = useState('');
  const [searchCategory, setSearchCategory] = useState<string>('');
  
  // 从现有模板中提取所有唯一分类
  const uniqueCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    templates.forEach((template: Template) => {
      if (template.category) {
        categoriesSet.add(template.category);
      }
    });
    return Array.from(categoriesSet);
  }, [templates]);
  
  // 处理模板名称搜索
  const handleNameSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchName(e.target.value);
  };
  
  // 处理分类搜索
  const handleCategorySearch = (value: string) => {
    setSearchCategory(value);
  };
  
  // 清空搜索
  const handleClearSearch = () => {
    setSearchName('');
    setSearchCategory('');
  };
  
  // 处理添加模板
  const handleAddTemplate = () => {
    router.push('/templates/edit/new');
  };
  
  // 过滤数据 - 同时匹配名称和分类
  const filteredTemplates = templates.filter((template: Template) => {
    const nameMatch = template.name.toLowerCase().includes(searchName.toLowerCase());
    const categoryMatch = !searchCategory || template.category === searchCategory;
    return nameMatch && categoryMatch;
  });
  
  // 按使用次数排序 (降序)
  const sortedTemplates = [...filteredTemplates].sort((a, b) => b.usageCount - a.usageCount);
  
  // 获取分类对应的颜色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case '分析':
        return 'blue';
      case '介绍':
        return 'green';
      case '报道':
        return 'orange';
      case '技术':
        return 'purple';
      case '观点':
        return 'red';
      case '教程':
        return 'cyan';
      default:
        return 'default';
    }
  };
  
  return (
    <DashboardLayout>
      <div style={{ padding: '24px' }}>
        <Title level={2} style={{ marginBottom: '12px' }}>文章模板列表</Title>
        <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '24px' }}>
          管理用于快速创建文章的模板
        </Text>
        
        <Divider />
        
        {/* 搜索条件区域 */}
        <div style={{ 
          backgroundColor: '#f9f9f9',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <Title level={4} style={{ margin: 0 }}>搜索条件</Title>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button onClick={handleClearSearch}>
                清空筛选
              </Button>
              
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTemplate}>
                创建新模板
              </Button>
            </div>
          </div>
          
          {/* 搜索条件网格布局 - 使用Ant Design的Form和Grid */}
          <Form layout="vertical">
            <Row gutter={16}>
              {/* 模板名称搜索 */}
              <Col span={12}>
                <Form.Item label="模板名称">
                  <Input
                    value={searchName}
                    onChange={handleNameSearch}
                    placeholder="输入模板名称搜索..."
                    allowClear
                  />
                </Form.Item>
              </Col>
              
              {/* 文章分类搜索 */}
              <Col span={12}>
                <Form.Item label="文章分类">
                  <Select
                    value={searchCategory}
                    onChange={handleCategorySearch}
                    placeholder="请选择分类"
                    style={{ width: '100%' }}
                    allowClear
                  >
                    {uniqueCategories.map((category: string) => (
                      <Option key={category} value={category}>{category}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
        
        {/* 模板卡片网格 - 使用排序后的数据 */}
        {sortedTemplates.length > 0 ? (
          <Row gutter={[16, 16]}>
            {sortedTemplates.map((template: Template) => (
              <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
                <Card 
                  hoverable
                  title={
                    <Text strong style={{ color: '#1890ff' }}>
                      {template.name}
                    </Text>
                  }
                  style={{ height: '100%' }}
                  extra={
                    <Tag color={getCategoryColor(template.category)}>
                      {template.category}
                    </Tag>
                  }
                >
                  <Text style={{ minHeight: '40px' }}>{template.description}</Text>
                  
                  <div style={{ fontSize: '13px', color: '#888', marginBottom: '15px' }}>
                    <div style={{ marginBottom: '4px' }}>创建时间: {template.createdAt}</div>
                    <div>使用次数: <strong>{template.usageCount}</strong></div>
                  </div>
                  
                  <Space style={{ width: '100%' }}>
                    <Button 
                      type="primary" 
                      icon={<EditOutlined />}
                      onClick={() => router.push(`/templates/edit/${template.id}`)}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确认删除"
                      description={`确定要删除模板"${template.name}"吗？此操作无法撤销。`}
                      onConfirm={() => setTemplates(templates.filter((t: Template) => t.id !== template.id))}
                      okText="确认删除"
                      cancelText="取消"
                      okButtonProps={{ danger: true }}
                    >
                      <Button 
                        danger
                        icon={<DeleteOutlined />}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty 
            description="没有找到匹配的模板" 
            style={{ 
              padding: '24px', 
              backgroundColor: '#f9f9f9',
              borderRadius: '8px'
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default TemplatesPage; 