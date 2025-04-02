'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { notification, Spin, message } from 'antd';
import ArticleForm from '../components/ArticleForm';
import LoadingScreen from '../components/LoadingScreen';
import DashboardLayout from '@/components/DashboardLayout';
import { isValidUUID } from '@/utils/uuid';

interface ArticleData {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  tags: string[];
  status: 'draft' | 'published';
  category: string;
  author: string;
  templateId?: string;
  hotTopicId?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  
  const [messageApi, contextHolder] = message.useMessage();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 用于管理定时器的Refs
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 初始化时获取文章数据
  useEffect(() => {
    async function fetchArticle() {
      try {
        setLoading(true);
        
        // 如果是新建文章
        if (id === 'new') {
          setArticle({
            id: 'new',
            title: '',
            summary: '',
            content: '',
            coverImage: '',
            tags: [],
            status: 'draft',
            category: '',
            author: '',
          });
          return;
        }
        
        // 否则获取现有文章
        const response = await fetch(`/api/articles/${id}`);
        
        if (!response.ok) {
          throw new Error('获取文章失败');
        }
        
        const data = await response.json();
        
        // 转换数据格式，使其与表单匹配
        setArticle({
          id: data.id,
          title: data.title || '',
          summary: data.summary || '',
          content: data.content || '',
          coverImage: data.cover_image || '',
          tags: data.keywords || [],
          status: mapStatusFromApi(data.status),
          category: data.category || '',
          author: data.author || '',
          templateId: data.template_id || undefined,
          hotTopicId: data.hot_topic_id || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          publishedAt: data.published_at
        });
      } catch (err) {
        console.error('获取文章错误:', err);
        setError('无法加载文章数据，请重试');
        notification.error({
          message: '加载失败',
          description: '无法获取文章数据，请稍后重试'
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchArticle();
  }, [id]);
  
  // 将API状态映射到前端状态
  const mapStatusFromApi = (apiStatus: string): 'draft' | 'published' => {
    const statusMap: Record<string, 'draft' | 'published'> = {
      'draft': 'draft',
      'pending': 'draft',
      'published': 'published',
      'rejected': 'draft',
      'failed': 'draft',
      'unpublished': 'draft'
    };
    
    return statusMap[apiStatus] || 'draft';
  }
  
  // 将前端状态映射到API状态
  const mapStatusToApi = (frontendStatus: 'draft' | 'published', isPendingReview: boolean = false): string => {
    if (isPendingReview) return 'pending';
    return frontendStatus === 'published' ? 'published' : 'draft';
  }
  
  // 保存文章
  const handleSave = async (data: ArticleData) => {
    // 清除可能存在的旧定时器
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    try {
      const isNew = data.id === 'new';
      const url = isNew ? '/api/articles' : `/api/articles/${data.id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      // 使用UUID工具验证热点话题ID
      let validatedHotTopicId = data.hotTopicId;
      if (validatedHotTopicId) {
        // 检查是否是有效的UUID
        if (!isValidUUID(validatedHotTopicId)) {
          // 如果不是有效的UUID，但是数字格式，尝试查找对应的热点话题ID
          if (/^\d+$/.test(validatedHotTopicId)) {
            console.warn('热点话题ID不是有效的UUID格式，而是一个数字:', validatedHotTopicId);
            // 这里可以选择抛出错误，或者将其设为null
            throw new Error(`热点话题ID必须是有效的UUID格式，而不是简单的数字"${validatedHotTopicId}"`);
          }
          console.warn('热点话题ID不是有效的UUID格式，将设为null', validatedHotTopicId);
          validatedHotTopicId = null;
        }
      }
      
      // 准备API数据
      const apiData = {
        title: data.title,
        summary: data.summary,
        content: data.content,
        cover_image: data.coverImage,
        keywords: data.tags,
        status: mapStatusToApi(data.status),
        category: data.category,
        author: data.author,
        template_id: data.templateId,
        hot_topic_id: validatedHotTopicId
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });
      
      // 获取响应内容
      const responseData = await response.json();
      
      if (!response.ok) {
        // 提取详细错误信息
        const errorDetail = responseData.error || responseData.message || '未知错误';
        const errorCode = responseData.code || '';
        const errorStack = responseData.detail ? `\n调用栈: ${responseData.detail}` : '';
        
        console.error('API错误详情:', {
          status: response.status,
          statusText: response.statusText,
          errorDetail,
          errorCode,
          errorStack,
          responseData
        });
        
        throw new Error(`保存文章失败: ${errorDetail}${errorCode ? ` (错误码: ${errorCode})` : ''}${
          process.env.NODE_ENV === 'development' ? errorStack : ''
        }`);
      }
      
      // 保存成功后直接显示消息
      messageApi.success({
        content: isNew ? '文章已成功创建！' : '文章已成功保存！',
        duration: 1,
        style: { zIndex: 1100 } // 确保toast显示在loading之上
      });
      
      // 直接跳转到文章列表页，不使用定时器
      router.push('/articles');
      
      return responseData; // 返回响应数据，以便其他函数使用
    } catch (err) {
      console.error('保存文章错误:', err);
      
      // 显示详细错误信息，强制设置duration为较长时间确保用户能看到
      notification.error({
        message: '保存失败',
        description: err instanceof Error ? err.message : '保存文章时发生未知错误，请重试',
        duration: 5,  // 从10秒改为5秒
        style: { whiteSpace: 'pre-line', wordBreak: 'break-word' }  // 支持换行和文本换行
      });
      
      throw err; // 重新抛出错误，以便调用者可以处理
    }
  };
  
  // 发布文章
  const handlePublish = async (data: ArticleData) => {
    try {
      // 保存文章时设置已发布状态
      const articleWithPublishedStatus = {
        ...data,
        status: 'published' as const
      };
      
      await handleSave(articleWithPublishedStatus);
      
      // 删除重复的成功通知，因为handleSave已经显示了通知
    } catch (err) {
      console.error('发布文章错误:', err);
      
      // 由handleSave处理错误提示
      throw err;
    }
  };
  
  // 添加一个提交审核的函数
  const handleSubmitForReview = async (data: ArticleData) => {
    // 清除可能存在的旧定时器
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    try {
      const isNew = data.id === 'new';
      const url = isNew ? '/api/articles' : `/api/articles/${data.id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      // 使用UUID工具验证热点话题ID
      let validatedHotTopicId = data.hotTopicId;
      if (validatedHotTopicId) {
        // 检查是否是有效的UUID
        if (!isValidUUID(validatedHotTopicId)) {
          // 如果不是有效的UUID，但是数字格式，尝试查找对应的热点话题ID
          if (/^\d+$/.test(validatedHotTopicId)) {
            console.warn('热点话题ID不是有效的UUID格式，而是一个数字:', validatedHotTopicId);
            // 这里可以选择抛出错误，或者将其设为null
            throw new Error(`热点话题ID必须是有效的UUID格式，而不是简单的数字"${validatedHotTopicId}"`);
          }
          console.warn('热点话题ID不是有效的UUID格式，将设为null', validatedHotTopicId);
          validatedHotTopicId = null;
        }
      }
      
      // 准备API数据
      const apiData = {
        title: data.title,
        summary: data.summary,
        content: data.content,
        cover_image: data.coverImage,
        keywords: data.tags,
        status: 'pending', // 直接使用字符串，不通过mapStatusToApi
        category: data.category,
        author: data.author,
        template_id: data.templateId,
        hot_topic_id: validatedHotTopicId
      };
      
      // 发送请求
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '提交审核失败');
      }
      
      const responseData = await response.json();
      
      // 显示成功消息
      messageApi.success({
        content: '文章已提交审核！',
        duration: 1
      });
      
      // 直接跳转到文章列表页，不使用定时器
      router.push('/articles');
      
      return responseData;
    } catch (err) {
      console.error('提交审核错误:', err);
      
      notification.error({
        message: '提交审核失败',
        description: err instanceof Error ? err.message : '提交审核时发生未知错误，请重试',
        duration: 5
      });
      
      throw err;
    }
  };
  
  // 返回文章列表
  const handleCancel = () => {
    router.push('/articles');
  };
  
  // 清理定时器
  useEffect(() => {
    // 组件卸载时清理所有定时器
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, []);
  
  return (
    <DashboardLayout>
      {contextHolder}
      {loading ? (
        <LoadingScreen tip="加载文章中..." />
      ) : error || !article ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>出错了</h2>
          <p>{error || '无法加载文章'}</p>
          <button 
            onClick={() => router.push('/articles')}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            返回文章列表
          </button>
        </div>
      ) : (
        <ArticleForm
          initialData={article}
          onSave={handleSave}
          onPublish={handlePublish}
          onCancel={handleCancel}
          onSubmitForReview={handleSubmitForReview}
        />
      )}
    </DashboardLayout>
  );
} 