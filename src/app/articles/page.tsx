'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Table, 
  Input, 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Select,
  Form,
  DatePicker,
  Popconfirm,
  message,
  Tooltip,
  Row,
  Col,
  Divider,
  Modal
} from 'antd';
import { 
  PlusOutlined, 
  CheckOutlined,
  CloseOutlined,
  RobotOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import { fontSizes, spacing, borderRadius } from '@/styles/theme';
import DashboardLayout from '@/components/DashboardLayout';
import { Article, ArticleStatus, ARTICLE_CATEGORIES } from '@/types/article';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

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

// 状态选项
const STATUS_OPTIONS: ArticleStatus[] = ['待审核', '已发布', '不过审', '发布失败'];

export default function ArticlesPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  
  // 列表数据状态
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // 搜索相关状态
  const [titleKeyword, setTitleKeyword] = useState('');
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [keywordSearch, setKeywordSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [contentSearch, setContentSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ArticleStatus | ''>('');
  
  // 生成文章表单状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // 审核弹窗状态
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [articleToReview, setArticleToReview] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  
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

  // 获取文章列表
  const fetchArticles = async () => {
    try {
      setLoading(true);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 生成测试数据
      const mockArticles = [
        { 
          id: '1', 
          title: '比特币价格分析：突破关键阻力位后有望延续上涨趋势，分析师预计未来三个月将进一步上行', 
          date: '2023-03-29', 
          coverImage: 'https://via.placeholder.com/150x100?text=BTC',
          keywords: ['比特币', '价格分析', '阻力位'],
          summary: '本文分析了比特币近期价格走势，突破重要阻力位意味着什么',
          category: '比特币',
          status: '已发布' as ArticleStatus,
          content: '比特币近期价格突破关键阻力位，技术面显示上涨趋势明显...',
          createdAt: '2023-03-29'
        },
        { 
          id: '2', 
          title: '以太坊2.0：新功能详解', 
          date: '2023-03-28', 
          coverImage: 'https://via.placeholder.com/150x100?text=ETH',
          keywords: ['以太坊', '以太坊2.0', '区块链'],
          summary: '深入解析以太坊2.0带来的新功能及其对生态系统的影响',
          category: '以太坊',
          status: '已发布' as ArticleStatus,
          content: '以太坊2.0将带来质押、分片等重要功能，提高网络吞吐量...',
          createdAt: '2023-03-28'
        },
        { 
          id: '3', 
          title: '去中心化金融的未来趋势', 
          date: '2023-03-27', 
          coverImage: 'https://via.placeholder.com/150x100?text=DeFi',
          keywords: ['DeFi', '去中心化金融', '趋势'],
          summary: '探讨去中心化金融的发展趋势及未来可能的发展方向',
          category: 'DeFi',
          status: '待审核' as ArticleStatus,
          content: '去中心化金融正改变传统金融格局，流动性挖矿、收益聚合等创新不断涌现...',
          createdAt: '2023-03-27'
        },
        { 
          id: '4', 
          title: 'NFT市场动态：本周热门交易', 
          date: '2023-03-26', 
          coverImage: 'https://via.placeholder.com/150x100?text=NFT',
          keywords: ['NFT', '交易', '市场分析'],
          summary: '回顾本周NFT市场热门交易及市场动态',
          category: 'NFT',
          status: '已发布' as ArticleStatus,
          content: 'NFT市场本周交易量突破1亿美元，多个蓝筹项目价格创新高...',
          createdAt: '2023-03-26'
        },
        { 
          id: '5', 
          title: '比特币减半对市场的影响分析', 
          date: '2023-03-25', 
          coverImage: 'https://via.placeholder.com/150x100?text=BTC',
          keywords: ['比特币', '减半', '市场影响'],
          summary: '深入分析比特币减半机制对加密货币市场的长期和短期影响',
          category: '比特币',
          status: '不过审' as ArticleStatus,
          content: '比特币减半将使挖矿奖励降低，历史数据显示减半后价格往往会上涨...',
          createdAt: '2023-03-25'
        },
        // 添加更多数据用于测试分页
        ...Array.from({ length: 15 }, (_, i) => {
          const statuses: ArticleStatus[] = ['待审核', '已发布', '不过审', '发布失败'];
          const status = statuses[i % statuses.length] as ArticleStatus;
          const category = ARTICLE_CATEGORIES[i % ARTICLE_CATEGORIES.length];
          
          return {
            id: `${i + 6}`,
            title: `加密货币市场分析 ${i + 1}`,
            date: new Date(2023, 2, 24 - i).toISOString().split('T')[0],
            coverImage: `https://via.placeholder.com/150x100?text=CRYPTO${i+1}`,
            keywords: ['加密货币', '市场分析', `关键词${i+1}`],
            summary: `这是加密货币市场分析文章${i+1}的摘要，包含市场动态和预测。`,
            category,
            status,
            content: `这是文章${i+1}的正文内容，详细分析了加密货币市场的最新动态和投资机会...`,
            createdAt: new Date(2023, 2, 24 - i).toISOString()
          };
        })
      ];
      
      setArticles(mockArticles);
      
    } catch (error) {
      console.error('获取文章失败:', error);
      messageApi.error('获取文章列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载文章数据
  useEffect(() => {
    fetchArticles();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 处理标题变化
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleKeyword(e.target.value);
  };

  // 处理日期变化
  const handleDateChange = (date: dayjs.Dayjs | null) => {
    setSelectedDate(date);
  };

  // 处理关键词搜索变化
  const handleKeywordSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeywordSearch(e.target.value);
  };

  // 处理分类变化
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  // 处理正文搜索变化
  const handleContentSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContentSearch(e.target.value);
  };

  // 处理状态变化
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value as ArticleStatus | '');
  };

  // 处理清空筛选
  const handleClearFilters = () => {
    setTitleKeyword('');
    setSelectedDate(null);
    setKeywordSearch('');
    setSelectedCategory('');
    setContentSearch('');
    setSelectedStatus('');
  };

  // 新建文章
  const handleCreateArticle = () => {
    router.push('/articles/edit/new');
  };
  
  // 生成文章
  const handleGenerateArticle = () => {
    setIsModalOpen(true);
  };
  
  // 关闭生成文章弹窗
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedKeywords([]);
    setSelectedTemplate('');
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
  
  // 处理保存生成文章
  const handleSaveGeneratedArticle = () => {
    if (selectedKeywords.length > 0 && selectedTemplate) {
      const newId = (Math.max(...articles.map(a => parseInt(a.id))) + 1).toString();
      const today = new Date().toISOString().split('T')[0];
      
      // 获取选中的模板
      const template = templates.find(t => t.id === selectedTemplate);
      
      // 生成标题 (使用第一个关键词作为标题的一部分)
      const mainKeyword = selectedKeywords[0];
      const generatedTitle = `关于${mainKeyword}的${template?.category}`;
      
      setArticles([
        { 
          id: newId,
          title: generatedTitle,
          date: today,
          coverImage: `https://via.placeholder.com/150x100?text=${mainKeyword}`,
          keywords: selectedKeywords,
          summary: `使用${template?.title}生成的关于${mainKeyword}的${template?.category}文章`,
          category: template?.category || '区块链', // 直接使用模板的category作为文章分类
          status: '待审核', // 默认状态
          content: '正在生成文章内容...',
          createdAt: today
        },
        ...articles
      ]);
      
      messageApi.success('AI文章生成已提交，请稍后查看结果');
      handleCloseModal();
    } else {
      if (!selectedKeywords.length) {
        messageApi.error('请至少选择一个关键词');
      } else if (!selectedTemplate) {
        messageApi.error('请选择一个文章模板');
      }
    }
  };
  
  // 删除文章
  const handleDeleteArticle = async (id: string) => {
    try {
      // 在真实环境中，这里应该发送删除请求
      // await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      setArticles(articles.filter(article => article.id !== id));
      messageApi.success('文章删除成功');
    } catch (error) {
      console.error('删除文章失败:', error);
      messageApi.error('删除文章失败，请重试');
    }
  };
  
  // 处理审核操作
  const handleReview = (id: string) => {
    setArticleToReview(id);
    setIsReviewModalVisible(true);
  };
  
  // 处理审核通过
  const handleApprove = async () => {
    try {
      setIsReviewing(true);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新文章状态
      setArticles(articles.map(article => 
        article.id === articleToReview 
          ? { ...article, status: '已发布' as ArticleStatus } 
          : article
      ));
      
      messageApi.success('文章已通过审核并发布');
      setIsReviewModalVisible(false);
      setArticleToReview(null);
    } catch (error) {
      console.error('审核失败:', error);
      messageApi.error('审核操作失败，请重试');
    } finally {
      setIsReviewing(false);
    }
  };
  
  // 处理审核拒绝
  const handleReject = async () => {
    try {
      setIsReviewing(true);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新文章状态
      setArticles(articles.map(article => 
        article.id === articleToReview 
          ? { ...article, status: '不过审' as ArticleStatus } 
          : article
      ));
      
      messageApi.warning('文章已被标记为不通过审核');
      setIsReviewModalVisible(false);
      setArticleToReview(null);
    } catch (error) {
      console.error('审核失败:', error);
      messageApi.error('审核操作失败，请重试');
    } finally {
      setIsReviewing(false);
    }
  };
  
  // 处理重新发送
  const handleResend = async (id: string) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新文章状态
      setArticles(articles.map(article => 
        article.id === id 
          ? { ...article, status: '待审核' as ArticleStatus } 
          : article
      ));
      
      messageApi.success('文章已重新提交，等待审核');
    } catch (error) {
      console.error('重新发送失败:', error);
      messageApi.error('操作失败，请重试');
    }
  };
  
  // 编辑文章
  const handleEditArticle = (id: string) => {
    router.push(`/articles/edit/${id}`);
  };
  
  // 过滤文章
  const filteredArticles = articles.filter(article => {
    // 标题筛选
    if (titleKeyword && !article.title.toLowerCase().includes(titleKeyword.toLowerCase())) {
      return false;
    }
    
    // 日期筛选
    if (selectedDate && article.date !== selectedDate.format('YYYY-MM-DD')) {
      return false;
    }
    
    // 关键词筛选
    if (keywordSearch && !article.keywords.some(keyword => 
      keyword.toLowerCase().includes(keywordSearch.toLowerCase())
    )) {
      return false;
    }
    
    // 分类筛选
    if (selectedCategory && article.category !== selectedCategory) {
      return false;
    }
    
    // 正文筛选
    if (contentSearch && article.content && !article.content.toLowerCase().includes(contentSearch.toLowerCase())) {
      return false;
    }
    
    // 状态筛选
    if (selectedStatus && article.status !== selectedStatus) {
      return false;
    }
    
    return true;
  });
  
  // 表格列定义
  const columns: ColumnsType<Article> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: {
        showTitle: false,
      },
      render: (title: string) => (
        <Tooltip title={title} placement="topLeft" styles={{ root: { maxWidth: '500px' } }}>
          <div style={{ 
            maxWidth: '300px', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}>
            {title}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '封面图',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 100,
      render: (coverImage: string) => (
        <div style={{ position: 'relative', width: '80px', height: '50px' }}>
          <Image 
            src={coverImage} 
            alt="封面"
            fill
            style={{ objectFit: 'cover', borderRadius: '4px' }}
          />
        </div>
      ),
    },
    {
      title: '关键词',
      dataIndex: 'keywords',
      key: 'keywords',
      width: 180,
      render: (keywords: string[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {keywords.slice(0, 3).map((keyword: string, index: number) => (
            <span key={index} style={{ 
              background: '#f0f0f0', 
              color: '#595959', 
              padding: '2px 8px', 
              borderRadius: '10px', 
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}>
              {keyword}
            </span>
          ))}
          {keywords.length > 3 && (
            <span style={{ 
              color: '#8c8c8c',
              fontSize: '12px',
              padding: '2px 4px'
            }}>
              +{keywords.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      title: '文章分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ArticleStatus) => (
        <Tag color={
          status === '已发布' ? 'success' : 
          status === '待审核' ? 'processing' : 
          status === '不过审' ? 'error' : 
          status === '发布失败' ? 'warning' : 'default'
        }>
          {status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_: unknown, record: Article) => (
        <Space size="small">
          <Button 
            size="small"
            onClick={() => handleEditArticle(record.id)}
          >
            编辑
          </Button>
          
          <Popconfirm
            title="确认删除"
            description={`确定要删除文章"${record.title.length > 30 ? record.title.slice(0, 30) + '...' : record.title}"吗？此操作无法撤销。`}
            onConfirm={() => handleDeleteArticle(record.id)}
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small">
              删除
            </Button>
          </Popconfirm>
          
          {record.status === '待审核' && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => handleReview(record.id)}
            >
              审核
            </Button>
          )}
          
          {record.status === '发布失败' && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => handleResend(record.id)}
            >
              重发
            </Button>
          )}
        </Space>
      ),
    },
  ];
  
  return (
    <DashboardLayout>
      {contextHolder}
      
      <Title level={2} style={{ marginBottom: spacing.sm }}>文章列表</Title>
      <Text type="secondary" style={{ fontSize: fontSizes.lg, display: 'block', marginBottom: spacing.xl }}>
        管理所有状态的文章
      </Text>
      
      <Divider />
      
      {/* 搜索条件区域 */}
      <div style={{ 
        backgroundColor: '#f9f9f9',
        padding: spacing.lg,
        borderRadius: borderRadius.md,
        marginBottom: spacing.xl,
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: spacing.md
        }}>
          <Title level={4} style={{ margin: 0 }}>搜索条件</Title>
          
          <div style={{ display: 'flex', gap: spacing.md }}>
            <Button onClick={handleClearFilters}>
              清空筛选
            </Button>
            
            <Button type="primary" icon={<RobotOutlined />} onClick={handleGenerateArticle}>
              生成文章
            </Button>
          </div>
        </div>
        
        {/* 搜索条件网格布局 */}
        <Form layout="vertical">
          <Row gutter={16}>
            {/* 标题搜索 */}
            <Col span={8}>
              <Form.Item label="标题">
                <Input
                  value={titleKeyword}
                  onChange={handleTitleChange}
                  placeholder="输入标题关键词..."
                />
              </Form.Item>
            </Col>
            
            {/* 日期搜索 */}
            <Col span={8}>
              <Form.Item label="日期">
                <DatePicker
                  value={selectedDate}
                  onChange={handleDateChange}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            
            {/* 关键词搜索 */}
            <Col span={8}>
              <Form.Item label="关键词">
                <Input
                  value={keywordSearch}
                  onChange={handleKeywordSearchChange}
                  placeholder="输入关键词..."
                />
              </Form.Item>
            </Col>
            
            {/* 文章分类搜索 */}
            <Col span={8}>
              <Form.Item label="文章分类">
                <Select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  placeholder="请选择分类"
                  style={{ width: '100%' }}
                  allowClear
                >
                  {ARTICLE_CATEGORIES.map((category) => (
                    <Option key={category} value={category}>{category}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            {/* 正文搜索 */}
            <Col span={8}>
              <Form.Item label="正文">
                <Input
                  value={contentSearch}
                  onChange={handleContentSearchChange}
                  placeholder="输入正文关键词..."
                />
              </Form.Item>
            </Col>
            
            {/* 状态搜索 */}
            <Col span={8}>
              <Form.Item label="状态">
                <Select
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  placeholder="请选择状态"
                  style={{ width: '100%' }}
                  allowClear
                >
                  {STATUS_OPTIONS.map((status) => (
                    <Option key={status} value={status}>{status}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
      
      {/* 操作按钮 */}
      <div style={{ marginBottom: spacing.md, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreateArticle}
        >
          新建文章
        </Button>
      </div>
      
      {/* 表格部分 */}
      <Table
        dataSource={filteredArticles}
        columns={columns}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `共 ${total} 条数据`,
        }}
        scroll={{ x: 1300 }}
        bordered
        size="middle"
        loading={loading}
      />
      
      {/* 生成文章弹窗 */}
      <Modal
        open={isModalOpen}
        title="生成AI文章"
        onCancel={handleCloseModal}
        onOk={handleSaveGeneratedArticle}
        okText="提交生成"
        cancelText="取消"
        okButtonProps={{ disabled: !(selectedKeywords.length > 0 && selectedTemplate) }}
      >
        <Form form={form} layout="vertical">
          {/* 选择/输入关键词 */}
          <Form.Item 
            label="关键词" 
            rules={[{ required: true, message: '请选择至少一个关键词' }]}
          >
            <Select
              mode="tags"
              placeholder="输入或选择关键词，回车添加多个关键词"
              value={selectedKeywords}
              onChange={handleKeywordsChange}
              style={{ width: '100%' }}
              tokenSeparators={[',']}
              optionFilterProp="children"
              onInputKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                  const inputValue = (e.target as HTMLInputElement).value.trim();
                  if (inputValue && !hotTopics.some(topic => topic.keyword === inputValue)) {
                    handleAddKeyword(inputValue);
                  }
                }
              }}
            >
              {hotTopics.map(topic => (
                <Option key={topic.keyword} value={topic.keyword}>
                  {topic.keyword} (热度: {topic.popularity})
                </Option>
              ))}
            </Select>
            <Text type="secondary" style={{ fontSize: fontSizes.sm, display: 'block', marginTop: '4px' }}>
              输入关键词后回车或逗号分隔，可添加多个关键词
            </Text>
          </Form.Item>
          
          {/* 选择文章模板 */}
          <Form.Item 
            label="文章模板" 
            rules={[{ required: true, message: '请选择文章模板' }]}
          >
            <Select
              placeholder="选择文章模板"
              value={selectedTemplate}
              onChange={handleSelectTemplate}
              style={{ width: '100%' }}
            >
              {templates.map(template => (
                <Option key={template.id} value={template.id}>
                  {template.title} - {template.description}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 审核弹窗 */}
      <Modal
        open={isReviewModalVisible}
        title="文章审核"
        onCancel={() => setIsReviewModalVisible(false)}
        footer={null}
      >
        <Paragraph style={{ marginBottom: spacing.lg }}>
          请选择审核操作:
        </Paragraph>
        
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center' }}>
          <Button 
            type="primary" 
            icon={<CheckOutlined />}
            onClick={handleApprove}
            loading={isReviewing}
          >
            通过审核
          </Button>
          
          <Button 
            danger
            icon={<CloseOutlined />}
            onClick={handleReject}
            loading={isReviewing}
          >
            拒绝通过
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}