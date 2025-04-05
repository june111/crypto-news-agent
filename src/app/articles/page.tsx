'use client';

import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, 
  Space, 
  Typography, 
  Select,
  message,
  Empty,
  Skeleton,
  Spin,
  Card
} from 'antd';
import { 
  PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import styles from './articles.module.css';
import DashboardLayout from '@/components/DashboardLayout';
import { Article, ArticleStatus, ARTICLE_CATEGORIES } from '@/types/article';
import useI18n from '@/hooks/useI18n';

const { Title, Text } = Typography;
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
const STATUS_OPTIONS: ArticleStatus[] = ['草稿', '待审核', '已发布', '不过审', '发布失败', '已下架'];

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
    case '草稿':
      return 'cyan';
    case '已下架':
      return 'default';
    default:
      return 'default';
  }
};

// 懒加载较大组件
const ArticleTable = lazy(() => import('./components/ArticleTable'));
const ArticleFilters = lazy(() => import('./components/ArticleFilters'));
const StatisticsCards = lazy(() => import('./components/StatisticsCards'));
const GenerateArticleModal = lazy(() => import('./components/GenerateArticleModal'));
const ReviewArticleModal = lazy(() => import('./components/ReviewArticleModal'));

// 加载组件
const LoadingComponent = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <Spin size="large" />
    <div style={{ marginTop: '16px' }}>加载中...</div>
  </div>
);

// ArticleTable属性定义
interface ArticleTableProps {
  articles: Article[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReview: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onResend: (id: string) => void;
  onTakeDown: (id: string) => void;
}

// 安全访问localStorage的辅助函数
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn(`无法设置localStorage项 ${key}`);
      }
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

export default function ArticlesPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const { t } = useI18n();
  
  // 核心状态
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [hotTopicsLoaded, setHotTopicsLoaded] = useState<boolean>(false);
  const [templatesLoaded, setTemplatesLoaded] = useState<boolean>(false);
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
  
  // 热点话题和模板列表状态
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // 封装错误处理的通用函数
  const handleApiError = (error: any, message: string) => {
    messageApi.error(error instanceof Error ? error.message : message);
  };

  // 将API状态映射到前端状态
  const mapStatusFromApi = (apiStatus: string): string => {
    switch (apiStatus) {
      case 'draft':
        return '草稿';
      case 'pending':
        return '待审核';
      case 'published':
        return '已发布';
      case 'rejected':
        return '不过审';
      case 'failed':
        return '发布失败';
      case 'unpublished':
        return '已下架';
      default:
        return '草稿';
    }
  };

  // 获取文章列表
  const fetchArticles = async () => {
    if (dataLoaded && articles.length > 0) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/articles', {
        method: 'GET',
        headers: {
          'X-Page-Request': '1',
          'Content-Type': 'application/json'
        }
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || '获取文章列表失败');
      }
      
      // 格式化日期
      const formattedData = Array.isArray(responseData.articles) ? responseData.articles.map((article: any) => ({
        ...article,
        date: article.created_at ? new Date(article.created_at).toISOString().split('T')[0] : '',
        updatedAt: article.updated_at || article.created_at,
        status: mapStatusFromApi(article.status),
        keywords: article.keywords || [],
        coverImage: article.cover_image || '',
        hotTopicId: article.hot_topic_id || null,
        hotTopicName: article.hot_topic ? article.hot_topic.keyword : ''
      })) : [];
      
      setArticles(formattedData);
      setDataLoaded(true);
    } catch (error) {
      handleApiError(error, '获取文章列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取热点话题列表
  const fetchHotTopics = async () => {
    if (hotTopicsLoaded && hotTopics.length > 0) return;
    
    try {
      // 检查缓存
      const cachedData = safeLocalStorage.getItem('hotTopicsCache');
      const cachedTime = safeLocalStorage.getItem('hotTopicsCacheTime');
      
      if (cachedData && cachedTime) {
        const cacheAge = Date.now() - parseInt(cachedTime);
        if (cacheAge < 30 * 60 * 1000) { // 30分钟有效期
          const parsedData = JSON.parse(cachedData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setHotTopics(parsedData);
            setHotTopicsLoaded(true);
            return;
          }
        }
      }
      
      const response = await fetch('/api/hot-topics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Cache-Bust': Date.now().toString()
        }
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || '获取热点话题列表失败');
      }
      
      let topics = [];
      if (Array.isArray(responseData.topics)) {
        topics = responseData.topics.map((topic: any) => ({
          id: topic.id,
          keyword: topic.keyword,
          popularity: topic.popularity || 0,
          date: topic.created_at ? new Date(topic.created_at).toISOString().split('T')[0] : ''
        }));
        
        setHotTopics(topics);
        
        // 保存到本地缓存
        safeLocalStorage.setItem('hotTopicsCache', JSON.stringify(topics));
        safeLocalStorage.setItem('hotTopicsCacheTime', Date.now().toString());
      } else {
        // 默认值
        setHotTopics([
          { id: '123e4567-e89b-12d3-a456-426614174001', keyword: '比特币', popularity: 89, date: '2023-03-29' },
          { id: '123e4567-e89b-12d3-a456-426614174002', keyword: '以太坊', popularity: 76, date: '2023-03-28' }
        ]);
      }
      
      setHotTopicsLoaded(true);
    } catch (error) {
      handleApiError(error, '获取热点话题列表失败');
      
      // 加载失败时使用默认数据
      setHotTopics([
        { id: '123e4567-e89b-12d3-a456-426614174001', keyword: '比特币', popularity: 89, date: '2023-03-29' },
        { id: '123e4567-e89b-12d3-a456-426614174002', keyword: '以太坊', popularity: 76, date: '2023-03-28' }
      ]);
      setHotTopicsLoaded(true);
    }
  };
  
  // 获取文章模板列表
  const fetchTemplates = async () => {
    if (templatesLoaded && templates.length > 0) return;
    
    try {
      // 检查缓存
      const cachedData = safeLocalStorage.getItem('templatesCache');
      const cachedTime = safeLocalStorage.getItem('templatesCacheTime');
      
      if (cachedData && cachedTime) {
        const cacheAge = Date.now() - parseInt(cachedTime);
        if (cacheAge < 60 * 60 * 1000) { // 1小时有效期
          const parsedData = JSON.parse(cachedData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setTemplates(parsedData);
            setTemplatesLoaded(true);
            return;
          }
        }
      }
      
      const response = await fetch('/api/templates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Cache-Bust': Date.now().toString()
        }
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || '获取文章模板列表失败');
      }
      
      let templateData = [];
      if (Array.isArray(responseData.templates)) {
        templateData = responseData.templates.map((template: any) => ({
          id: template.id,
          title: template.title || '',
          description: template.description || '',
          category: template.category || '未分类'
        }));
        
        setTemplates(templateData);
        
        // 保存到本地缓存
        safeLocalStorage.setItem('templatesCache', JSON.stringify(templateData));
        safeLocalStorage.setItem('templatesCacheTime', Date.now().toString());
      } else {
        // 默认值
        setTemplates([
          { id: 'a23e4567-e89b-12d3-a456-426614174001', title: '价格分析模板', description: '用于分析加密货币价格走势', category: '分析' },
          { id: 'a23e4567-e89b-12d3-a456-426614174002', title: '项目介绍模板', description: '介绍区块链项目的功能和特点', category: '介绍' }
        ]);
      }
      
      setTemplatesLoaded(true);
    } catch (error) {
      handleApiError(error, '获取文章模板列表失败');
      
      // 加载失败时使用默认数据
      setTemplates([
        { id: 'a23e4567-e89b-12d3-a456-426614174001', title: '价格分析模板', description: '用于分析加密货币价格走势', category: '分析' },
        { id: 'a23e4567-e89b-12d3-a456-426614174002', title: '项目介绍模板', description: '介绍区块链项目的功能和特点', category: '介绍' }
      ]);
      setTemplatesLoaded(true);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchArticles();
    fetchHotTopics();
    fetchTemplates();
  }, []);

  // 手动刷新方法
  const handleRefreshList = () => {
    setDataLoaded(false);
    setHotTopicsLoaded(false);
    setTemplatesLoaded(false);
    
    // 清除本地缓存
    safeLocalStorage.removeItem('hotTopicsCache');
    safeLocalStorage.removeItem('hotTopicsCacheTime');
    safeLocalStorage.removeItem('templatesCache');
    safeLocalStorage.removeItem('templatesCacheTime');
    
    // 重新获取所有数据
    fetchArticles();
    fetchHotTopics();
    fetchTemplates();
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
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || '删除文章失败');
      }
      
      // 删除成功后更新列表
      setArticles(articles.filter(article => article.id !== id));
      messageApi.success('文章已成功删除');
    } catch (error) {
      handleApiError(error, '删除文章失败，请重试');
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
      createdAt: new Date().toISOString(),
      source: articleData.source || '本地模板',
      difyMessageId: articleData.difyMessageId || '',
      difyConversationId: articleData.difyConversationId || '',
      isDify: !!articleData.difyMessageId,
      aiGenerated: true
    };
    
    // 将新文章添加到列表中
    setArticles(prevArticles => [newArticle, ...prevArticles]);
    
    messageApi.success(articleData.difyMessageId 
      ? 'Dify AI文章生成已提交，请稍后查看结果' 
      : 'AI文章生成已提交，请稍后查看结果');
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
    setArticles(prevArticles => 
      prevArticles.map(article => article.id === id ? { ...article, status } : article)
    );
    
    handleCloseReviewModal();
    messageApi.success(`文章已${status}`);
  };
  
  // 通过高性能筛选过滤数据
  const getFilteredArticles = () => {
    return articles.filter(article => {
      if (filters.title && !article.title.toLowerCase().includes(filters.title.toLowerCase())) {
        return false;
      }
      
      if (filters.date && article.date !== filters.date) {
        return false;
      }
      
      if (filters.keyword && !(
        article.keywords && 
        Array.isArray(article.keywords) && 
        article.keywords.some(keyword => 
          keyword && typeof keyword === 'string' && 
          keyword.toLowerCase().includes(filters.keyword.toLowerCase())
        )
      )) {
        return false;
      }
      
      if (filters.category && article.category !== filters.category) {
        return false;
      }
      
      if (filters.content && article.content && 
          !article.content.toLowerCase().includes(filters.content.toLowerCase())) {
        return false;
      }
      
      if (filters.status && article.status !== filters.status) {
        return false;
      }
      
      return true;
    });
  };
  
  const filteredArticles = useMemo(() => getFilteredArticles(), [articles, filters]);
  
  // 处理文章审核通过
  const handleApproveArticle = async (id: string) => {
    try {
      // 更新前端状态
      setArticles(prevArticles => 
        prevArticles.map(article => article.id === id ? { ...article, status: '已发布' as ArticleStatus } : article)
      );
      
      messageApi.success('文章已通过审核并发布');
    } catch (error) {
      handleApiError(error, '审核文章失败，请重试');
    }
  };

  // 处理文章审核不通过
  const handleRejectArticle = async (id: string) => {
    try {
      setArticles(prevArticles =>
        prevArticles.map(article => article.id === id ? { ...article, status: '不过审' as ArticleStatus } : article)
      );
      
      messageApi.success('文章已被标记为不通过');
    } catch (error) {
      handleApiError(error, '审核文章失败，请重试');
    }
  };

  // 处理文章重新发布
  const handleResendArticle = async (id: string) => {
    try {
      setArticles(prevArticles => 
        prevArticles.map(article => article.id === id ? { ...article, status: '待审核' as ArticleStatus } : article)
      );
      
      messageApi.success('文章已重新提交发布');
    } catch (error) {
      handleApiError(error, '重新发布文章失败，请重试');
    }
  };
  
  // 处理文章下架操作
  const handleTakeDownArticle = async (id: string) => {
    try {
      setArticles(prevArticles => 
        prevArticles.map(article => article.id === id ? { ...article, status: '已下架' as ArticleStatus } : article)
      );
      
      messageApi.success('文章已下架');
    } catch (error) {
      handleApiError(error, '下架文章失败，请重试');
    }
  };
  
  // 渲染文章列表
  const renderArticles = () => {
    if (loading) {
      return <Skeleton active paragraph={{ rows: 10 }} />;
    }
    
    if (filteredArticles.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>
              {Object.values(filters).some(Boolean)
                ? '没有找到匹配条件的文章'
                : '暂无文章，点击上方按钮创建或生成新文章'}
            </span>
          }
        />
      );
    }
    
    return (
      <ArticleTable 
        articles={filteredArticles}
        loading={false}
        onEdit={handleEditArticle}
        onDelete={handleDeleteArticle}
        onReview={handleReviewArticle}
        onApprove={handleApproveArticle}
        onReject={handleRejectArticle}
        onResend={handleResendArticle}
        onTakeDown={handleTakeDownArticle}
      />
    );
  };
  
  // 获取统计信息
  const getStats = () => {
    const total = articles.length;
    const publishedCount = articles.filter(article => article.status === '已发布').length;
    const pendingCount = articles.filter(article => article.status === '待审核').length;
    const rejectedCount = articles.filter(article => article.status === '不过审').length;
    const failedCount = articles.filter(article => article.status === '发布失败').length;
    const unpublishedCount = articles.filter(article => article.status === '已下架').length;
    const draftCount = articles.filter(article => article.status === '草稿').length;
    
    return {
      total,
      publishedCount,
      pendingCount,
      rejectedCount,
      failedCount,
      unpublishedCount,
      draftCount
    };
  };
  
  return (
    <DashboardLayout>
      {contextHolder}
      
      {/* 页面标题 */}
      <div className={styles.pageHeader}>
        <div>
          <Title level={2} className={styles.pageTitle}>{t('articles.title')}</Title>
          <Text type="secondary" className={styles.pageDescription}>
            {t('articles.description')}
          </Text>
        </div>
        
        <div>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreateArticle}
              size="large"
            >
              {t('articles.createArticle')}
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
              {t('articles.generateArticle')}
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
      
      {/* 文章列表 */}
      <Card className={styles.articlesContainer}>
        {renderArticles()}
      </Card>
      
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