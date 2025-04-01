'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
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
  Modal,
  Card,
  Badge,
  Empty,
  Statistic,
  Skeleton,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  CheckOutlined,
  CloseOutlined,
  RobotOutlined,
  SearchOutlined,
  ClearOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FireOutlined,
  ClockCircleOutlined,
  ExportOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import styles from './articles.module.css';
import DashboardLayout from '@/components/DashboardLayout';
import { Article, ArticleStatus, ARTICLE_CATEGORIES } from '@/types/article';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

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

// 获取状态对应的颜色
const getStatusColor = (status: ArticleStatus) => {
  switch (status) {
    case '已发布':
      return 'success';
    case '待审核':
      return 'processing';
    case '不过审':
      return 'error';
    case '发布失败':
      return 'warning';
    default:
      return 'default';
  }
};

// 获取统计数据
const getArticleStats = (articles: Article[]) => {
  const total = articles.length;
  
  // 按状态统计
  const publishedCount = articles.filter(article => article.status === '已发布').length;
  const pendingCount = articles.filter(article => article.status === '待审核').length;
  const rejectedCount = articles.filter(article => article.status === '不过审').length;
  const failedCount = articles.filter(article => article.status === '发布失败').length;
  
  // 按分类统计
  const categoryMap = new Map<string, number>();
  articles.forEach(article => {
    const count = categoryMap.get(article.category) || 0;
    categoryMap.set(article.category, count + 1);
  });
  
  return {
    total,
    publishedCount,
    pendingCount,
    rejectedCount, 
    failedCount,
    categoryMap
  };
};

// 懒加载较大组件
const ArticleTable = lazy(() => import('./components/ArticleTable'));
const ArticleFilters = lazy(() => import('./components/ArticleFilters'));
const StatisticsCards = lazy(() => import('./components/StatisticsCards'));
const GenerateArticleModal = lazy(() => import('./components/GenerateArticleModal'));
const ReviewArticleModal = lazy(() => import('./components/ReviewArticleModal'));

// 防止重复渲染的加载组件
const LoadingComponent = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <Spin size="large" />
    <div style={{ marginTop: '16px' }}>加载中...</div>
  </div>
);

export default function ArticlesPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  
  // 核心状态 - 最小化状态数量
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    title: '',
    date: null,
    keyword: '',
    category: '',
    content: '',
    status: ''
  });
  
  // 弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [articleToReview, setArticleToReview] = useState<string | null>(null);
  
  // 搜索相关状态
  const [titleKeyword, setTitleKeyword] = useState('');
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [keywordSearch, setKeywordSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [contentSearch, setContentSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ArticleStatus | ''>('');
  
  // 生成文章表单状态
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

  // 获取文章列表 - 使用缓存减少不必要的请求
  const fetchArticles = async () => {
    if (dataLoaded && articles.length > 0) {
      console.log('文章数据已加载，跳过重复请求');
      return;
    }
    
    try {
      setLoading(true);
      console.log('开始获取文章列表数据...');
      
      const response = await fetch('/api/articles', {
        headers: {
          'X-Page-Request': '1'
        }
      });
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setArticles(data);
      } else if (data && Array.isArray(data.data)) {
        setArticles(data.data);
      } else {
        console.error('API返回的数据格式不是数组:', data);
        setArticles([]);
      }
      
      setDataLoaded(true);
    } catch (error) {
      console.error('获取文章失败:', error);
      messageApi.error('获取文章列表失败');
      
      if (process.env.NODE_ENV === 'development') {
        import('./mockData').then(module => {
          if (module.default && Array.isArray(module.default)) {
            setArticles(module.default);
            setDataLoaded(true);
          } else {
            setArticles([]);
          }
        }).catch(() => {
          setArticles([]);
        });
      } else {
        setArticles([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // 只在组件挂载时获取一次数据，并在需要时提供手动刷新
  useEffect(() => {
    fetchArticles();
  }, []);

  // 添加手动刷新方法
  const handleRefreshList = () => {
    setDataLoaded(false);
    fetchArticles();
  };

  // 处理筛选变更
  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 清空筛选条件
  const handleClearFilters = () => {
    setFilters({
      title: '',
      date: null,
      keyword: '',
      category: '',
      content: '',
      status: ''
    });
  };

  // 新建文章
  const handleCreateArticle = () => {
    router.push('/articles/edit/new');
  };
  
  // 编辑文章
  const handleEditArticle = (id: string) => {
    router.push(`/articles/edit/${id}`);
  };
  
  // 删除文章
  const handleDeleteArticle = async (id: string) => {
    try {
      await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      
      if (Array.isArray(articles)) {
      setArticles(articles.filter(article => article.id !== id));
      } else {
        console.error('articles 不是数组:', articles);
        setArticles([]);
      }
      
      messageApi.success('文章删除成功');
    } catch (error) {
      console.error('删除文章失败:', error);
      messageApi.error('删除文章失败，请重试');
    }
  };
  
  // 打开生成文章弹窗
  const handleGenerateArticle = () => {
    setIsModalOpen(true);
  };
  
  // 处理弹窗关闭
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  // 保存生成的文章
  const handleSaveGeneratedArticle = (articleData: Partial<Article>) => {
    const newArticle = {
      id: Date.now().toString(),
      title: articleData.title || '新生成文章',
      summary: articleData.summary || '',
      content: articleData.content || '',
      category: articleData.category || '区块链',
      date: new Date().toISOString().split('T')[0],
      coverImage: articleData.coverImage || 'https://img0.baidu.com/it/u=4160253413,3711804954&fm=253&fmt=auto&app=138&f=JPEG?w=708&h=500',
      keywords: articleData.keywords || [],
      status: '待审核' as ArticleStatus,
      createdAt: new Date().toISOString()
    };
    
    if (Array.isArray(articles)) {
      setArticles([newArticle, ...articles]);
    } else {
      console.error('articles 不是数组:', articles);
      setArticles([newArticle]);
    }
    
    messageApi.success('AI文章生成已提交，请稍后查看结果');
    handleCloseModal();
  };
  
  // 处理文章审核
  const handleReviewArticle = (id: string) => {
    setArticleToReview(id);
    setIsReviewModalVisible(true);
  };
  
  // 关闭审核弹窗
  const handleCloseReviewModal = () => {
      setIsReviewModalVisible(false);
      setArticleToReview(null);
  };
      
      // 更新文章状态
  const handleUpdateArticleStatus = (id: string, status: ArticleStatus) => {
    if (Array.isArray(articles)) {
      setArticles(articles.map(article => 
        article.id === id ? { ...article, status } : article
      ));
    } else {
      console.error('articles 不是数组:', articles);
      setArticles([]);
    }
    
    handleCloseReviewModal();
    messageApi.success(`文章已${status}`);
  };
  
  // 通过高性能筛选过滤数据
  const getFilteredArticles = () => {
    if (!Array.isArray(articles)) {
      console.error('articles 不是数组:', articles);
      return [];
    }
    
    return articles.filter(article => {
      if (filters.title && !article.title.toLowerCase().includes(filters.title.toLowerCase())) {
      return false;
    }
    
      if (filters.date && article.date !== filters.date) {
      return false;
    }
    
      if (filters.keyword && !article.keywords.some(keyword => 
        keyword.toLowerCase().includes(filters.keyword.toLowerCase())
    )) {
      return false;
    }
    
      if (filters.category && article.category !== filters.category) {
      return false;
    }
    
      if (filters.content && article.content && !article.content.toLowerCase().includes(filters.content.toLowerCase())) {
      return false;
    }
    
      if (filters.status && article.status !== filters.status) {
      return false;
    }
    
    return true;
  });
  };
  
  // 使用记忆化来提高性能
  const filteredArticles = getFilteredArticles();
  
  // 获取统计信息
  const getStats = () => {
    const total = articles.length;
    const publishedCount = articles.filter(article => article.status === '已发布').length;
    const pendingCount = articles.filter(article => article.status === '待审核').length;
    const rejectedCount = articles.filter(article => article.status === '不过审').length;
    const failedCount = articles.filter(article => article.status === '发布失败').length;
    
    return {
      total,
      publishedCount,
      pendingCount,
      rejectedCount,
      failedCount
    };
  };
  
  return (
    <DashboardLayout>
      {contextHolder}
      
      {/* 页面标题 */}
      <div className={styles.pageHeader}>
        <div>
          <Title level={2} className={styles.pageTitle}>文章管理</Title>
          <Text type="secondary" className={styles.pageDescription}>
            创建、编辑和管理所有状态的文章
      </Text>
        </div>
        
        <div>
          <Space>
            <Button
              onClick={handleRefreshList}
              icon={<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M21 12a9 9 0 01-9 9 9 9 0 01-9-9 9 9 0 019-9 9 9 0 019 9z"></path>
                <path d="M16 12l-4-4-4 4"></path>
                <path d="M12 16V8"></path>
              </svg>}
            >
              刷新
            </Button>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreateArticle}
              size="large"
        >
          新建文章
        </Button>
            
            <Button
              onClick={handleGenerateArticle}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}>
                <path d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 12H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>}
              size="large"
            >
              生成AI文章
            </Button>
          </Space>
        </div>
      </div>
      
      {/* 统计信息 */}
      <Suspense fallback={<LoadingComponent />}>
        <StatisticsCards stats={getStats()} />
      </Suspense>
      
      {/* 筛选区域 */}
      <Suspense fallback={<LoadingComponent />}>
        <ArticleFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          categories={ARTICLE_CATEGORIES}
        />
      </Suspense>
      
      {/* 文章表格 */}
      <Suspense fallback={<LoadingComponent />}>
        <ArticleTable 
          articles={filteredArticles}
        loading={loading}
          onEdit={handleEditArticle}
          onDelete={handleDeleteArticle}
          onReview={handleReviewArticle}
      />
      </Suspense>
      
      {/* 生成文章弹窗 */}
      {isModalOpen && (
        <Suspense fallback={<LoadingComponent />}>
          <GenerateArticleModal
            visible={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveGeneratedArticle}
          />
        </Suspense>
      )}
      
      {/* 审核文章弹窗 */}
      {isReviewModalVisible && articleToReview && (
        <Suspense fallback={<LoadingComponent />}>
          <ReviewArticleModal
            visible={isReviewModalVisible}
            articleId={articleToReview}
            articles={articles}
            onClose={handleCloseReviewModal}
            onUpdateStatus={handleUpdateArticleStatus}
          />
        </Suspense>
      )}
    </DashboardLayout>
  );
}