'use client';

import React, { useState, useEffect } from 'react';
import { Input, Button, Space, Card, notification, Select, DatePicker, Typography, Spin, message, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import FormField from './FormField';
import RichTextEditor from './RichTextEditor';
import ImageUploader from './ImageUploader';
import TagDisplay from './TagDisplay';
import SectionTitle from './SectionTitle';
import FullscreenLoading from './FullscreenLoading';
import { ARTICLE_CATEGORIES } from '@/types/article';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

// 文章模板类型
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  usage_count: number;
}

// 添加热点话题类型定义
// 文章模板类型下面添加：
// 热点话题类型
interface HotTopic {
  id: string;
  keyword: string;
  volume: number;
  trend?: string;
  created_at: string;
}

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

interface ArticleFormProps {
  initialData: ArticleData;
  onSave: (data: ArticleData) => Promise<void>;
  onPublish?: (data: ArticleData) => Promise<void>;
  onCancel: () => void;
  onSubmitForReview?: (data: ArticleData) => Promise<void>;
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

/**
 * 文章编辑表单组件
 */
export default function ArticleForm({
  initialData,
  onSave,
  onPublish,
  onCancel,
  onSubmitForReview
}: ArticleFormProps) {
  // 文章数据状态
  const [articleData, setArticleData] = useState<ArticleData>(initialData);
  
  // 表单验证错误状态
  const [errors, setErrors] = useState<Partial<Record<keyof ArticleData, string>>>({});
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  
  // 数据是否有更改
  const [isDirty, setIsDirty] = useState(false);
  
  // 使用message API
  const [messageApi, contextHolder] = message.useMessage();

  // 模板列表
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  // 热点话题列表
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [loadingHotTopics, setLoadingHotTopics] = useState(false);
  
  // 添加各个按钮的loading状态
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false);
  
  // 在state部分添加刷新状态
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 加载模板数据
  useEffect(() => {
    async function fetchTemplates() {
      try {
        setLoadingTemplates(true);
        console.log('正在获取文章模板数据...');
        
        // 首先检查本地缓存
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
              setLoadingTemplates(false);
              return;
            }
          }
        }
        
        // 如果没有缓存或缓存已过期，则从API获取
        const response = await fetch('/api/templates', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Page-Request': '1',
            'X-Request-ID': `templates-${Date.now()}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`获取模板失败: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log('模板API响应数据:', responseData);
        
        if (responseData && responseData.templates && Array.isArray(responseData.templates)) {
          console.log('成功获取文章模板:', responseData.templates.length);
          const formattedTemplates = responseData.templates.map((t: any) => ({
            id: t.id,
            name: t.title || t.name || '未命名模板',
            description: t.description || '',
            category: t.category || '未分类',
            usage_count: t.usage_count || 0
          }));
          setTemplates(formattedTemplates);
          console.log('已设置模板数据:', formattedTemplates);
          
          // 保存到本地缓存
          try {
            safeLocalStorage.setItem('templatesCache', JSON.stringify(formattedTemplates));
            safeLocalStorage.setItem('templatesCacheTime', Date.now().toString());
          } catch (e) {
            console.warn('缓存模板数据失败:', e);
          }
        } else {
          console.warn('模板数据格式不符合预期:', responseData);
          setTemplates([]);
        }
      } catch (error) {
        console.error('获取模板列表失败:', error);
        notification.error({
          message: '获取模板失败',
          description: error instanceof Error ? error.message : '无法加载文章模板，将无法使用模板功能',
          duration: 5
        });
      } finally {
        setLoadingTemplates(false);
      }
    }
    
    fetchTemplates();
  }, []);
  
  // 加载热点话题数据
  useEffect(() => {
    async function fetchHotTopics() {
      try {
        setLoadingHotTopics(true);
        console.log('正在获取热点话题数据...');
        
        // 首先检查本地缓存
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
              setLoadingHotTopics(false);
              return;
            }
          }
        }
        
        // 如果没有缓存或缓存已过期，则从API获取
        const response = await fetch('/api/hot-topics', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Page-Request': '1',
            'X-Request-ID': `hot-topics-${Date.now()}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`获取热点话题失败: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log('热点话题API响应数据:', responseData);
        
        if (responseData && responseData.topics && Array.isArray(responseData.topics)) {
          console.log('成功获取热点话题:', responseData.topics.length);
          const formattedTopics = responseData.topics.map((t: any) => ({
            id: t.id,
            keyword: t.keyword || t.title || '未命名话题',
            volume: t.volume || t.popularity || t.score || 0,
            trend: t.trend || (t.change_rate > 0 ? 'up' : t.change_rate < 0 ? 'down' : 'stable'),
            created_at: t.created_at || new Date().toISOString()
          }));
          setHotTopics(formattedTopics);
          console.log('已设置热点话题数据:', formattedTopics);
          
          // 保存到本地缓存
          try {
            // 限制数据大小，最多缓存100条热点话题
            const limitedTopics = formattedTopics.slice(0, 100);
            
            // 估算数据大小，如果超过1MB则不缓存
            const dataString = JSON.stringify(limitedTopics);
            if (dataString.length > 1024 * 1024) {
              console.warn('热点话题数据过大，跳过本地缓存');
            } else {
              safeLocalStorage.setItem('hotTopicsCache', dataString);
              safeLocalStorage.setItem('hotTopicsCacheTime', Date.now().toString());
            }
          } catch (e) {
            console.warn('缓存热点话题数据失败:', e);
          }
        } else {
          console.warn('热点话题数据格式不符合预期:', responseData);
          setHotTopics([]);
        }
      } catch (error) {
        console.error('获取热点话题列表失败:', error);
        notification.error({
          message: '获取热点话题失败',
          description: error instanceof Error ? error.message : '无法加载热点话题，将无法使用热点话题功能',
          duration: 5
        });
      } finally {
        setLoadingHotTopics(false);
      }
    }
    
    fetchHotTopics();
  }, []);
  
  // 监听初始数据变化
  useEffect(() => {
    setArticleData(initialData);
    setIsDirty(false);
  }, [initialData]);
  
  // 处理表单字段变更
  const handleChange = (field: keyof ArticleData, value: any) => {
    setArticleData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
    
    setIsDirty(true);
  };
  
  // 添加标签
  const handleAddTag = (tag: string) => {
    if (!tag || articleData.tags.includes(tag)) return;
    
    setArticleData(prev => ({
      ...prev,
      tags: [...prev.tags, tag]
    }));
    
    setIsDirty(true);
  };
  
  // 删除标签
  const handleRemoveTag = (tag: string) => {
    setArticleData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
    
    setIsDirty(true);
  };
  
  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ArticleData, string>> = {};
    
    if (!articleData.title.trim()) {
      newErrors.title = '标题不能为空';
    }
    
    if (!articleData.summary.trim()) {
      newErrors.summary = '摘要不能为空';
    }
    
    if (!articleData.content.trim()) {
      newErrors.content = '正文内容不能为空';
    }

    if (!articleData.category) {
      newErrors.category = '分类不能为空';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 获取表单数据
  const getFormData = () => ({
    ...articleData
  });
  
  // 处理保存草稿
  const handleSaveDraft = async () => {
    try {
      // 验证表单
      if (!validateForm()) return;
      
      // 设置loading状态
      setIsSaving(true);
      
      // 获取表单数据
      const formData = getFormData();
      
      // 调用保存函数
      await onSave({
        ...formData,
        status: 'draft' as const
      });
    } catch (error) {
      console.error('保存草稿错误:', error);
    } finally {
      // 无论成功或失败，都重置loading状态
      setIsSaving(false);
    }
  };
  
  // 处理发布
  const handlePublish = async () => {
    try {
      // 验证表单
      if (!validateForm()) return;
      
      // 设置loading状态
      setIsPublishing(true);
      
      // 获取表单数据
      const formData = getFormData();
      
      // 调用发布函数
      await onPublish({
        ...formData,
        status: 'published' as const
      });
    } catch (error) {
      console.error('发布文章错误:', error);
    } finally {
      // 无论成功或失败，都重置loading状态
      setIsPublishing(false);
    }
  };
  
  // 处理提交审核
  const handleSubmitForReview = async () => {
    try {
      // 验证表单
      if (!validateForm()) return;
      
      // 设置loading状态
      setIsSubmittingForReview(true);
      
      // 获取表单数据
      const formData = getFormData();
      
      // 调用提交审核函数
      await onSubmitForReview(formData);
    } catch (error) {
      console.error('提交审核错误:', error);
    } finally {
      // 无论成功或失败，都重置loading状态
      setIsSubmittingForReview(false);
    }
  };
  
  // 获取状态显示文本
  const getStatusText = (status: 'draft' | 'published') => {
    const statusMap = {
      draft: '草稿',
      published: '已发布'
    };
    return statusMap[status] || '草稿';
  };
  
  // 添加刷新数据的函数
  const handleRefreshData = async () => {
    try {
      setIsRefreshing(true);
      
      // 清除本地缓存
      safeLocalStorage.removeItem('hotTopicsCache');
      safeLocalStorage.removeItem('hotTopicsCacheTime');
      safeLocalStorage.removeItem('templatesCache');
      safeLocalStorage.removeItem('templatesCacheTime');
      
      // 重新获取热点话题
      setLoadingHotTopics(true);
      try {
        const response = await fetch('/api/hot-topics', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Page-Request': '1',
            'X-Request-ID': `hot-topics-refresh-${Date.now()}`,
            'X-Cache-Bust': Date.now().toString()
          }
        });
        
        if (!response.ok) {
          throw new Error('刷新热点话题失败');
        }
        
        const responseData = await response.json();
        
        if (responseData && responseData.topics && Array.isArray(responseData.topics)) {
          const formattedTopics = responseData.topics.map((t: any) => ({
            id: t.id,
            keyword: t.keyword || t.title || '未命名话题',
            volume: t.volume || t.popularity || t.score || 0,
            trend: t.trend || (t.change_rate > 0 ? 'up' : t.change_rate < 0 ? 'down' : 'stable'),
            created_at: t.created_at || new Date().toISOString()
          }));
          setHotTopics(formattedTopics);
        }
      } catch (error) {
        console.error('刷新热点话题失败:', error);
        messageApi.error('刷新热点话题失败');
      } finally {
        setLoadingHotTopics(false);
      }
      
      // 重新获取模板
      setLoadingTemplates(true);
      try {
        const response = await fetch('/api/templates', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Page-Request': '1',
            'X-Request-ID': `templates-refresh-${Date.now()}`,
            'X-Cache-Bust': Date.now().toString()
          }
        });
        
        if (!response.ok) {
          throw new Error('刷新模板列表失败');
        }
        
        const responseData = await response.json();
        
        if (responseData && responseData.templates && Array.isArray(responseData.templates)) {
          const formattedTemplates = responseData.templates.map((t: any) => ({
            id: t.id,
            name: t.title || t.name || '未命名模板',
            description: t.description || '',
            category: t.category || '未分类',
            usage_count: t.usage_count || 0
          }));
          setTemplates(formattedTemplates);
        }
      } catch (error) {
        console.error('刷新模板列表失败:', error);
        messageApi.error('刷新模板列表失败');
      } finally {
        setLoadingTemplates(false);
      }
      
      messageApi.success('数据已刷新');
    } catch (error) {
      console.error('刷新数据失败:', error);
      messageApi.error('刷新数据失败');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <>
      {contextHolder}
      {isLoading && <FullscreenLoading visible={isLoading} text="保存中..." />}
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <SectionTitle level={2}>编辑文章</SectionTitle>
          <Button 
            type="default" 
            icon={<ReloadOutlined />} 
            onClick={handleRefreshData} 
            loading={isRefreshing}
          >
            刷新数据
          </Button>
        </div>
        
        <Card style={{ marginBottom: '24px' }}>
          <FormField 
            label="文章标题" 
            required 
            tooltip="标题应简洁明了，能够概括文章主要内容"
            error={errors.title}
          >
            <Input 
              placeholder="请输入文章标题" 
              value={articleData.title}
              onChange={e => handleChange('title', e.target.value)}
              maxLength={100}
              showCount
              disabled={articleData.status === 'published'}
            />
          </FormField>
          
          <FormField 
            label="文章摘要" 
            required
            tooltip="摘要是对文章内容的简短描述，将显示在文章列表中"
            error={errors.summary}
          >
            <TextArea 
              placeholder="请输入文章摘要" 
              value={articleData.summary}
              onChange={e => handleChange('summary', e.target.value)}
              maxLength={300}
              showCount
              autoSize={{ minRows: 3, maxRows: 6 }}
              disabled={articleData.status === 'published'}
            />
          </FormField>
          
          <FormField 
            label="封面图片"
            tooltip="封面图片将显示在文章列表和文章详情页顶部"
          >
            <ImageUploader 
              coverImage={articleData.coverImage} 
              setCoverImage={(url) => handleChange('coverImage', url)} 
              disabled={articleData.status === 'published'}
              articleId={articleData.id !== 'new' ? articleData.id : undefined}
            />
          </FormField>
          
          <FormField 
            label="文章标签"
            tooltip="标签用于分类文章，便于用户查找相关内容"
          >
            <TagDisplay 
              tags={articleData.tags}
              onAdd={articleData.status === 'published' ? undefined : handleAddTag}
              onRemove={articleData.status === 'published' ? undefined : handleRemoveTag}
              disabled={articleData.status === 'published'}
            />
          </FormField>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <FormField
              label="文章分类"
              required
              tooltip="选择文章所属的分类"
              error={errors.category}
            >
              <Select
                placeholder="请选择文章分类"
                value={articleData.category}
                onChange={value => handleChange('category', value)}
                style={{ width: '100%' }}
                disabled={articleData.status === 'published'}
              >
                {ARTICLE_CATEGORIES.map(category => (
                  <Option key={category} value={category}>{category}</Option>
                ))}
              </Select>
            </FormField>
            
            <FormField
              label="文章作者"
              tooltip="填写文章作者姓名或笔名"
            >
              <Input
                placeholder="请输入作者姓名（选填）"
                value={articleData.author || ''}
                onChange={e => handleChange('author', e.target.value)}
                disabled={articleData.status === 'published'}
              />
            </FormField>

            <FormField
              label="热点话题"
              tooltip="选择文章关联的热点话题"
            >
              <Select
                placeholder={loadingHotTopics ? "加载热点话题中..." : "请选择热点话题（选填）"}
                value={articleData.hotTopicId}
                onChange={value => handleChange('hotTopicId', value)}
                style={{ width: '100%' }}
                allowClear
                disabled={articleData.status === 'published' || loadingHotTopics}
                loading={loadingHotTopics}
                notFoundContent={loadingHotTopics ? <Spin size="small" /> : "暂无热点话题"}
                showSearch
                filterOption={(input, option) => 
                  (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
                }
                optionLabelProp="label"
              >
                {hotTopics.map(topic => (
                  <Option 
                    key={topic.id} 
                    value={topic.id}
                    label={`${topic.keyword} (热度: ${topic.volume})`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{topic.keyword}</span>
                      <span style={{ 
                        color: topic.trend === 'up' ? '#52c41a' : topic.trend === 'down' ? '#f5222d' : '#1890ff',
                        fontWeight: 'bold'
                      }}>
                        热度: {topic.volume}
                      </span>
                    </div>
                  </Option>
                ))}
              </Select>
              {hotTopics.length === 0 && !loadingHotTopics && (
                <div style={{marginTop: 8, color: '#ff4d4f'}}>
                  未找到任何热点话题，请确认API是否正常工作
                </div>
              )}
            </FormField>

            <FormField
              label="模板"
              tooltip="选择文章使用的模板"
            >
              <Select
                placeholder={loadingTemplates ? "加载模板中..." : "请选择文章模板（选填）"}
                value={articleData.templateId}
                onChange={value => handleChange('templateId', value)}
                style={{ width: '100%' }}
                allowClear
                disabled={articleData.status === 'published' || loadingTemplates}
                loading={loadingTemplates}
                notFoundContent={loadingTemplates ? <Spin size="small" /> : "暂无模板"}
                showSearch
                filterOption={(input, option) => 
                  (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
                }
                optionLabelProp="label"
              >
                {templates.map(template => (
                  <Option 
                    key={template.id} 
                    value={template.id}
                    label={`${template.name} (${template.category})`}
                  >
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold' }}>{template.name}</span>
                        <Tag color="blue">{template.category}</Tag>
                      </div>
                      {template.description && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#666', 
                          marginTop: '4px',
                          lineHeight: '1.4',
                          maxHeight: '36px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {template.description}
                        </div>
                      )}
                      {template.usage_count > 0 && (
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                          已使用次数: {template.usage_count}
                        </div>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>
              {templates.length === 0 && !loadingTemplates && (
                <div style={{marginTop: 8, color: '#ff4d4f'}}>
                  未找到任何模板，请确认API是否正常工作
                </div>
              )}
            </FormField>

            <FormField
              label="日期信息"
              tooltip="文章的创建、更新和发布日期"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <Text type="secondary">创建日期: </Text>
                  <Text>{articleData.createdAt ? dayjs(articleData.createdAt).format('YYYY-MM-DD HH:mm:ss') : '尚未创建'}</Text>
                </div>
                {articleData.updatedAt && (
                  <div>
                    <Text type="secondary">更新日期: </Text>
                    <Text>{dayjs(articleData.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
                  </div>
                )}
                {articleData.publishedAt && (
                  <div>
                    <Text type="secondary">发布日期: </Text>
                    <Text>{dayjs(articleData.publishedAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
                  </div>
                )}
              </div>
            </FormField>

            <FormField
              label="文章状态"
              tooltip="文章当前的发布状态"
            >
              <div>
                <Select 
                  value={articleData.status} 
                  disabled
                  style={{ width: '100%' }}
                >
                  <Option value="draft">草稿</Option>
                  <Option value="published">已发布</Option>
                </Select>
              </div>
            </FormField>
          </Space>
        </Card>
        
        <Card title="文章正文" style={{ marginBottom: '24px' }}>
          <FormField 
            label="正文内容"
            required
            error={errors.content}
          >
            <RichTextEditor 
              value={articleData.content}
              onChange={(html) => handleChange('content', html)}
              readOnly={articleData.status === 'published'}
            />
          </FormField>
        </Card>
        
        <div style={{ 
          marginTop: '24px', 
          display: 'flex', 
          justifyContent: 'space-between',
          position: 'sticky',
          bottom: '24px',
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
          zIndex: 10
        }}>
          <Button onClick={onCancel}>
            取消
          </Button>
          
          <Space>
            {isDirty && articleData.status !== 'published' && (
              <span style={{ color: '#faad14', marginRight: '16px' }}>
                文章已修改，请保存
              </span>
            )}
            
            <Button
              type="default"
              onClick={handleSaveDraft}
              disabled={articleData.status === 'published'}
              loading={isSaving}
            >
              保存草稿
            </Button>
            
            {onSubmitForReview && articleData.status !== 'published' && (
              <Button
                type="primary"
                ghost
                onClick={handleSubmitForReview}
                loading={isSubmittingForReview}
              >
                提交审核
              </Button>
            )}
            
            {onPublish && articleData.status !== 'published' && (
              <Button
                type="primary"
                onClick={handlePublish}
                loading={isPublishing}
              >
                发布
              </Button>
            )}
            
            {articleData.status === 'published' && (
              <span style={{ color: '#52c41a' }}>
                <Text strong>此文章已发布，不可编辑</Text>
              </span>
            )}
          </Space>
        </div>
      </div>
    </>
  );
} 