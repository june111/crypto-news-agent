'use client';

import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
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
import { isValidUUID } from '@/utils/uuid';

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

// 添加ArticleTable需要的处理函数
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
        console.warn(`无法设置localStorage项 ${key}:`, e);
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
  
  // 核心状态 - 最小化状态数量
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
  
  // 热点话题和模板列表状态
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // 获取文章列表 - 使用Supabase API
  const fetchArticles = async () => {
    if (dataLoaded && articles.length > 0) {
      console.log('文章数据已加载，跳过重复请求');
      return;
    }
    
    try {
      setLoading(true);
      console.log('开始获取文章列表数据...');
      
      const response = await fetch('/api/articles', {
        method: 'GET',
        headers: {
          'X-Page-Request': '1',
          'Content-Type': 'application/json'
        }
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        const errorDetail = responseData.error || responseData.message || '未知错误';
        const errorCode = responseData.code || '';
        console.error('获取文章列表失败详情:', {
          status: response.status,
          statusText: response.statusText,
          errorDetail,
          errorCode,
          responseData
        });
        throw new Error(`获取文章列表失败: ${errorDetail}${errorCode ? ` (错误码: ${errorCode})` : ''}`);
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
      // 获取统计信息
      const stats = getArticleStats(formattedData);
      console.log('文章统计:', stats);
    } catch (error) {
      console.error('获取文章列表失败:', error);
      messageApi.error({
        content: error instanceof Error ? error.message : '获取文章列表失败，请重试',
        duration: 10,
        style: { whiteSpace: 'pre-line', wordBreak: 'break-word' }
      });
    } finally {
      setLoading(false);
    }
  };

  // API状态映射到前端状态
  const mapStatusFromApi = (apiStatus: string): ArticleStatus => {
    const statusMap: Record<string, ArticleStatus> = {
      'draft': '草稿',
      'pending': '待审核',
      'published': '已发布',
      'rejected': '不过审',
      'failed': '发布失败',
      'unpublished': '已下架'
    };
    
    return statusMap[apiStatus] || '草稿';
  };

  // 获取热点话题列表
  const fetchHotTopics = async () => {
    // 1. 首先检查已加载状态
    if (hotTopicsLoaded && hotTopics.length > 0) {
      console.log('热点话题数据已加载，跳过重复请求');
      return;
    }
    
    // 2. 检查本地缓存，如果存在且未过期则使用缓存
    try {
      const cachedData = safeLocalStorage.getItem('hotTopicsCache');
      const cachedTime = safeLocalStorage.getItem('hotTopicsCacheTime');
      
      if (cachedData && cachedTime) {
        // 检查缓存是否过期（30分钟有效期）
        const cacheAge = Date.now() - parseInt(cachedTime);
        if (cacheAge < 30 * 60 * 1000) { // 30分钟有效期
          const parsedData = JSON.parse(cachedData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            console.log('使用缓存的热点话题数据', parsedData.length);
            setHotTopics(parsedData);
            setHotTopicsLoaded(true);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('读取热点话题缓存失败:', e);
      // 忽略缓存错误，继续获取新数据
    }
    
    // 3. 缓存不存在或已过期，从API获取数据
    try {
      console.log('开始获取热点话题列表数据...');
      
      const response = await fetch('/api/hot-topics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Cache-Bust': Date.now().toString() // 避免浏览器缓存
        }
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        const errorDetail = responseData.error || responseData.message || '未知错误';
        const errorCode = responseData.code || '';
        console.error('获取热点话题列表失败详情:', {
          status: response.status,
          statusText: response.statusText,
          errorDetail,
          errorCode,
          responseData
        });
        throw new Error(`获取热点话题列表失败: ${errorDetail}${errorCode ? ` (错误码: ${errorCode})` : ''}`);
      }
      
      let topics = [];
      if (Array.isArray(responseData.topics)) {
        topics = responseData.topics.map((topic: any) => ({
          id: topic.id,
          keyword: topic.keyword,
          popularity: topic.popularity || 0,
          date: topic.created_at ? new Date(topic.created_at).toISOString().split('T')[0] : ''
        }));
        
        // 更新状态
        setHotTopics(topics);
        
        // 保存到本地缓存
        try {
          safeLocalStorage.setItem('hotTopicsCache', JSON.stringify(topics));
          safeLocalStorage.setItem('hotTopicsCacheTime', Date.now().toString());
        } catch (e) {
          console.warn('缓存热点话题失败:', e);
        }
      } else {
        console.warn('热点话题响应数据格式不符合预期:', responseData);
        // 如果API未返回预期数据，临时使用默认值
        setHotTopics([
          { id: '123e4567-e89b-12d3-a456-426614174001', keyword: '比特币', popularity: 89, date: '2023-03-29' },
          { id: '123e4567-e89b-12d3-a456-426614174002', keyword: '以太坊', popularity: 76, date: '2023-03-28' }
        ]);
      }
      
      setHotTopicsLoaded(true);
    } catch (error) {
      console.error('获取热点话题列表失败:', error);
      messageApi.error({
        content: error instanceof Error ? error.message : '获取热点话题列表失败，将使用默认数据',
        duration: 5
      });
      
      // 加载失败时使用默认数据，确保UI可用
      setHotTopics([
        { id: '123e4567-e89b-12d3-a456-426614174001', keyword: '比特币', popularity: 89, date: '2023-03-29' },
        { id: '123e4567-e89b-12d3-a456-426614174002', keyword: '以太坊', popularity: 76, date: '2023-03-28' }
      ]);
      setHotTopicsLoaded(true);
    }
  };
  
  // 获取文章模板列表
  const fetchTemplates = async () => {
    // 1. 首先检查已加载状态
    if (templatesLoaded && templates.length > 0) {
      console.log('文章模板数据已加载，跳过重复请求');
      return;
    }
    
    // 2. 检查本地缓存，如果存在且未过期则使用缓存
    try {
      const cachedData = safeLocalStorage.getItem('templatesCache');
      const cachedTime = safeLocalStorage.getItem('templatesCacheTime');
      
      if (cachedData && cachedTime) {
        // 检查缓存是否过期（1小时有效期）
        const cacheAge = Date.now() - parseInt(cachedTime);
        if (cacheAge < 60 * 60 * 1000) { // 1小时有效期
          const parsedData = JSON.parse(cachedData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            console.log('使用缓存的模板数据', parsedData.length);
            setTemplates(parsedData);
            setTemplatesLoaded(true);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('读取模板缓存失败:', e);
      // 忽略缓存错误，继续获取新数据
    }
    
    // 3. 缓存不存在或已过期，从API获取数据
    try {
      console.log('开始获取文章模板列表数据...');
      
      const response = await fetch('/api/templates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Cache-Bust': Date.now().toString() // 避免浏览器缓存
        }
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        const errorDetail = responseData.error || responseData.message || '未知错误';
        const errorCode = responseData.code || '';
        console.error('获取文章模板列表失败详情:', {
          status: response.status,
          statusText: response.statusText,
          errorDetail,
          errorCode,
          responseData
        });
        throw new Error(`获取文章模板列表失败: ${errorDetail}${errorCode ? ` (错误码: ${errorCode})` : ''}`);
      }
      
      let templateData = [];
      if (Array.isArray(responseData.templates)) {
        templateData = responseData.templates.map((template: any) => ({
          id: template.id,
          title: template.title || '',
          description: template.description || '',
          category: template.category || '未分类'
        }));
        
        // 更新状态
        setTemplates(templateData);
        
        // 保存到本地缓存
        try {
          safeLocalStorage.setItem('templatesCache', JSON.stringify(templateData));
          safeLocalStorage.setItem('templatesCacheTime', Date.now().toString());
        } catch (e) {
          console.warn('缓存模板数据失败:', e);
        }
      } else {
        console.warn('文章模板响应数据格式不符合预期:', responseData);
        // 如果API未返回预期数据，临时使用默认值
        setTemplates([
          { id: 'a23e4567-e89b-12d3-a456-426614174001', title: '价格分析模板', description: '用于分析加密货币价格走势', category: '分析' },
          { id: 'a23e4567-e89b-12d3-a456-426614174002', title: '项目介绍模板', description: '介绍区块链项目的功能和特点', category: '介绍' }
        ]);
      }
      
      setTemplatesLoaded(true);
    } catch (error) {
      console.error('获取文章模板列表失败:', error);
      messageApi.error({
        content: error instanceof Error ? error.message : '获取文章模板列表失败，将使用默认数据',
        duration: 5
      });
      
      // 加载失败时使用默认数据，确保UI可用
      setTemplates([
        { id: 'a23e4567-e89b-12d3-a456-426614174001', title: '价格分析模板', description: '用于分析加密货币价格走势', category: '分析' },
        { id: 'a23e4567-e89b-12d3-a456-426614174002', title: '项目介绍模板', description: '介绍区块链项目的功能和特点', category: '介绍' }
      ]);
      setTemplatesLoaded(true);
    }
  };

  // 只在组件挂载时获取一次数据，并在需要时提供手动刷新
  useEffect(() => {
    fetchArticles();
    fetchHotTopics();
    fetchTemplates();
  }, []);

  // 添加手动刷新方法
  const handleRefreshList = () => {
    // 清除加载状态标记
    setDataLoaded(false);
    setHotTopicsLoaded(false);
    setTemplatesLoaded(false);
    
    // 清除本地缓存，确保获取最新数据
    try {
      safeLocalStorage.removeItem('hotTopicsCache');
      safeLocalStorage.removeItem('hotTopicsCacheTime');
      safeLocalStorage.removeItem('templatesCache');
      safeLocalStorage.removeItem('templatesCacheTime');
    } catch (e) {
      console.warn('清除缓存失败:', e);
    }
    
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
        const errorDetail = responseData.error || responseData.message || '未知错误';
        const errorCode = responseData.code || '';
        console.error('删除文章失败详情:', {
          status: response.status,
          statusText: response.statusText,
          errorDetail,
          errorCode,
          responseData
        });
        throw new Error(`删除文章失败: ${errorDetail}${errorCode ? ` (错误码: ${errorCode})` : ''}`);
      }
      
      // 删除成功后更新列表
      setArticles(articles.filter(article => article.id !== id));
      messageApi.success('文章已成功删除');
    } catch (error) {
      console.error('删除文章失败:', error);
      messageApi.error({
        content: error instanceof Error ? error.message : '删除文章失败，请重试',
        duration: 5,
        style: { whiteSpace: 'pre-line', wordBreak: 'break-word' }
      });
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
      // 添加Dify相关字段
      source: articleData.source || '本地模板',
      difyMessageId: articleData.difyMessageId || '',
      difyConversationId: articleData.difyConversationId || '',
      // 如果是Dify生成的，记录下来
      isDify: !!articleData.difyMessageId,
      aiGenerated: true
    };
    
    // 将新文章添加到列表中
    setArticles(prevArticles => {
      if (!Array.isArray(prevArticles)) {
        console.error('articles 不是数组:', prevArticles);
        return [newArticle];
      }
      return [newArticle, ...prevArticles];
    });
    
    const successMessage = articleData.difyMessageId 
      ? 'Dify AI文章生成已提交，请稍后查看结果' 
      : 'AI文章生成已提交，请稍后查看结果';
    
    messageApi.success(successMessage);
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
    setArticles(prevArticles => {
      if (!Array.isArray(prevArticles)) {
        console.error('articles 不是数组:', prevArticles);
        return [];
      }
      return prevArticles.map(article => 
        article.id === id ? { ...article, status } : article
      );
    });
    
    handleCloseReviewModal();
    messageApi.success(`文章已${status}`);
  };
  
  // 通过高性能筛选过滤数据
  const getFilteredArticles = () => {
    if (!Array.isArray(articles)) {
      console.error('articles 不是数组，无法过滤:', articles);
      return [];
    }
    
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
        article.keywords.length > 0 && 
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
      
      if (filters.content && article.content && typeof article.content === 'string' && 
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
      // TODO: 添加API调用以更新文章状态为"已发布"
      // 未来需要调用发布API，现在暂时只更新前端状态
      setArticles(prevArticles => {
        if (!Array.isArray(prevArticles)) {
          console.error('articles 不是数组:', prevArticles);
          return [];
        }
        return prevArticles.map(article => 
          article.id === id ? { ...article, status: '已发布' as ArticleStatus } : article
        );
      });
      
      messageApi.success('文章已通过审核并发布');
    } catch (error) {
      console.error('审核文章失败:', error);
      messageApi.error({
        content: error instanceof Error ? error.message : '审核文章失败，请重试',
        duration: 5
      });
    }
  };

  // 处理文章审核不通过
  const handleRejectArticle = async (id: string) => {
    try {
      // TODO: 添加API调用以更新文章状态为"不过审"
      // 目前简单更新前端状态
      setArticles(prevArticles => {
        if (!Array.isArray(prevArticles)) {
          console.error('articles 不是数组:', prevArticles);
          return [];
        }
        return prevArticles.map(article => 
          article.id === id ? { ...article, status: '不过审' as ArticleStatus } : article
        );
      });
      
      messageApi.success('文章已被标记为不通过');
    } catch (error) {
      console.error('审核文章失败:', error);
      messageApi.error({
        content: error instanceof Error ? error.message : '审核文章失败，请重试',
        duration: 5
      });
    }
  };

  // 处理文章重新发布
  const handleResendArticle = async (id: string) => {
    try {
      // TODO: 添加API调用以重新发布文章
      // 目前简单更新前端状态
      setArticles(prevArticles => {
        if (!Array.isArray(prevArticles)) {
          console.error('articles 不是数组:', prevArticles);
          return [];
        }
        return prevArticles.map(article => 
          article.id === id ? { ...article, status: '待审核' as ArticleStatus } : article
        );
      });
      
      messageApi.success('文章已重新提交发布');
    } catch (error) {
      console.error('重新发布文章失败:', error);
      messageApi.error({
        content: error instanceof Error ? error.message : '重新发布文章失败，请重试',
        duration: 5
      });
    }
  };
  
  // 处理文章下架操作
  const handleTakeDownArticle = async (id: string) => {
    try {
      // TODO: 添加API调用以更新文章状态为"已下架"
      // 目前简单更新前端状态
      setArticles(prevArticles => {
        if (!Array.isArray(prevArticles)) {
          console.error('articles 不是数组:', prevArticles);
          return [];
        }
        return prevArticles.map(article => 
          article.id === id ? { ...article, status: '已下架' as ArticleStatus } : article
        );
      });
      
      messageApi.success('文章已下架');
    } catch (error) {
      console.error('下架文章失败:', error);
      messageApi.error({
        content: error instanceof Error ? error.message : '下架文章失败，请重试',
        duration: 5
      });
    }
  };
  
  // 渲染文章列表
  const renderArticles = () => {
    if (loading) {
      return (
        <Skeleton active paragraph={{ rows: 10 }} />
      );
    }
    
    if (!Array.isArray(filteredArticles)) {
      console.error('filteredArticles 不是有效数组:', filteredArticles);
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="文章数据格式错误，请刷新页面重试"
        />
      );
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
    if (!articles || !Array.isArray(articles)) {
      console.error('articles 不是有效数组，无法获取统计信息:', articles);
      return {
        total: 0,
        publishedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        failedCount: 0,
        unpublishedCount: 0,
        draftCount: 0
      };
    }
    
    const total = articles.length;
    const publishedCount = articles.filter(article => article && article.status === '已发布').length;
    const pendingCount = articles.filter(article => article && article.status === '待审核').length;
    const rejectedCount = articles.filter(article => article && article.status === '不过审').length;
    const failedCount = articles.filter(article => article && article.status === '发布失败').length;
    const unpublishedCount = articles.filter(article => article && article.status === '已下架').length;
    const draftCount = articles.filter(article => article && article.status === '草稿').length;
    
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
          <Title level={2} className={styles.pageTitle}>文章管理</Title>
          <Text type="secondary" className={styles.pageDescription}>
            创建、编辑和管理所有状态的文章
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
      
      {/* 文章列表 - 使用新的组件级加载效果 */}
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