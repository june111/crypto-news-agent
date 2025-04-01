'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import NextHead from 'next/head';

// 导入CSS模块
import styles from '../../articles.module.css';

// 核心组件立即导入 - 绝对最小化导入数量
import { 
  Button, Form, message, Layout, Input, Select,
  Spin, Space, Divider, Breadcrumb, Card
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/DashboardLayout';
import fetchWithCache from '@/lib/utils/fetchUtils';
import { ArticleStatus, ARTICLE_CATEGORIES } from '@/types/article';

// 基础UI元素
const { Content } = Layout;
const { TextArea } = Input;
const { Option } = Select;

// 超级懒加载富文本编辑器 - 只在真正需要时加载
// 使用独立chunk避免影响主bundle
const RichTextEditor = dynamic(
  () => import('./components/RichTextEditor').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className={styles.editorContainer}>
        <div className={styles.editor} style={{minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <Spin size="large" tip="正在加载编辑器..." />
        </div>
      </div>
    )
  }
);

// 核心组件预加载
const LoadingComponent = () => (
  <div style={{ textAlign: 'center', padding: '40px 0' }}>
    <Spin size="large" />
    <div style={{ marginTop: '16px' }}>加载中...</div>
  </div>
);

// 文章数据类型
interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  date: string;
  coverImage: string;
  keywords: string[];
  status: ArticleStatus;
  createdAt: string;
}

// 简化的标签组件
const TagDisplay = ({ 
  tags = [], 
  onAdd, 
  onRemove 
}: { 
  tags: string[], 
  onAdd: (tag: string) => void, 
  onRemove: (tag: string) => void 
}) => {
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = () => {
    if (inputValue && !tags.includes(inputValue)) {
      onAdd(inputValue);
    }
    setInputVisible(false);
    setInputValue('');
  };
  
  // 加载Tag组件
  const [Tag, setTag] = useState<any>(null);
  
  useEffect(() => {
    // 动态导入，但只导入一次
    import('antd/lib/tag').then(module => {
      setTag(() => module.default);
    });
  }, []);
  
  if (!Tag) {
    return <Spin size="small" />;
  }
  
  return (
    <div className={styles.tagContainer}>
      {tags.map(tag => (
        <Tag
          key={tag}
          closable
          onClose={() => onRemove(tag)}
          style={{ marginBottom: '8px' }}
        >
          {tag}
        </Tag>
      ))}
      
      {inputVisible ? (
        <Input
          type="text"
          size="small"
          className={styles.tagInput}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputConfirm}
          onPressEnter={handleInputConfirm}
          autoFocus
        />
      ) : (
        <Tag 
          onClick={() => setInputVisible(true)}
          style={{ cursor: 'pointer' }}
        >
          <PlusOutlined /> 添加关键词
        </Tag>
      )}
    </div>
  );
};

// 简化图片上传组件
const ImageUploader = ({ 
  coverImage, 
  setCoverImage 
}: { 
  coverImage: string, 
  setCoverImage: (url: string) => void 
}) => {
  const [Upload, setUpload] = useState<any>(null);
  const [Image, setImage] = useState<any>(null);
  
  useEffect(() => {
    // 只导入一次组件
    Promise.all([
      import('antd/lib/upload').then(mod => setUpload(() => mod.default)),
      import('next/image').then(mod => setImage(() => mod.default))
    ]);
  }, []);
  
  const beforeUpload = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setCoverImage(reader.result as string);
    };
    return false;
  };
  
  if (!Upload || !Image) {
    return (
      <div className={styles.uploadButton}>
        <Spin />
        <div style={{ marginTop: 8 }}>加载中...</div>
      </div>
    );
  }
  
  return (
    <Upload
      name="coverImage"
      listType="picture-card"
      showUploadList={false}
      beforeUpload={beforeUpload}
      accept="image/*"
    >
      {coverImage ? (
        <div className={styles.previewImage}>
          <Image
            src={coverImage}
            alt="封面图"
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
      ) : (
        <div className={styles.uploadButton}>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传封面</div>
        </div>
      )}
    </Upload>
  );
};

// 标题组件
const SectionTitle = ({ children }: { children: React.ReactNode }) => {
  const [Title, setTitle] = useState<any>(null);
  
  useEffect(() => {
    import('antd/lib/typography/Title').then(
      mod => setTitle(() => mod.default)
    );
  }, []);
  
  if (!Title) {
    return <div style={{ height: '24px', marginBottom: '16px' }}>{children}</div>;
  }
  
  return <Title level={5}>{children}</Title>;
};

// 内容组件 - 使用React.memo减少重渲染
const ArticleEditContent = React.memo(() => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
  // 核心状态
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<ArticleStatus>('待审核');
  const [coverImage, setCoverImage] = useState('');
  const [html, setHtml] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false); // 记录数据是否已加载
  
  // Row和Col组件状态
  const [Row, setRow] = useState<any>(null);
  const [Col, setCol] = useState<any>(null);
  const [Title, setTitle] = useState<any>(null);
  
  // 加载布局组件
  useEffect(() => {
    Promise.all([
      import('antd/lib/row').then(mod => setRow(() => mod.default)),
      import('antd/lib/col').then(mod => setCol(() => mod.default)),
      import('antd/lib/typography/Title').then(mod => setTitle(() => mod.default))
    ]);
  }, []);
  
  // 阻止不必要的API请求
  useEffect(() => {
    // 使用性能标记记录页面加载
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark('edit-page-loaded');
    }
  }, []);
  
  // 页面标题计算
  const pageTitle = useMemo(() => isNew ? '创建文章' : '编辑文章', [isNew]);
  
  // 加载文章数据
  useEffect(() => {
    const fetchArticle = async () => {
      // 如果数据已加载且不是新建文章，则跳过重复请求
      if (dataLoaded && !isNew) {
        console.log('文章数据已加载，跳过重复获取');
        return;
      }

      try {
        setIsLoading(true);
        console.log(`开始获取文章数据，ID: ${id}, 是否新建: ${isNew}`);
        
        if (isNew) {
          // 确保新建文章时清空所有状态
          setHtml('');
          setDate('');
          setKeywords([]);
          setCoverImage('');
          setStatus('待审核');
          
          // 重置表单
          form.resetFields();
          
          setIsLoading(false);
          setDataLoaded(true); // 标记数据已加载
          return;
        }

        // 使用优化的请求 - 添加防止缓存的时间戳
        // 同时使用AbortController以便必要时终止请求
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
        
        // 添加自定义头，表示这是真实页面请求而非预加载
        const article = await fetchWithCache<Article>(`/api/articles/${id}?_t=${Date.now()}`, {
          useCache: { ttl: 300000 }, // 缓存5分钟
          retry: 1, // 减少重试次数
          signal: controller.signal,
          headers: {
            'X-Page-Request': '1' // 表明这是用户主动发起的请求，而非预加载
          }
        });
        
        clearTimeout(timeoutId);
        
        form.setFieldsValue({
          title: article.title,
          summary: article.summary,
          category: article.category,
        });
        
        setHtml(article.content || '');
        setDate(article.date);
        setKeywords(article.keywords || []);
        setCoverImage(article.coverImage || '');
        setStatus(article.status);
        
        setDataLoaded(true); // 标记数据已加载成功
        
      } catch (error) {
        // 只记录非中止错误
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('获取文章数据失败:', error);
          messageApi.error('获取文章数据失败');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArticle();
  }, [id, isNew, form, messageApi, dataLoaded]);
  
  // 添加手动刷新方法
  const handleRefreshArticle = () => {
    setDataLoaded(false); // 重置数据加载状态
    // 下一个渲染周期会触发useEffect重新加载数据
  };
  
  // 保存文章 - 使用防抖
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setIsSaving(true);
      
      const articleData = {
        ...values,
        id: isNew ? undefined : id,
        content: html,
        date: date || new Date().toISOString().split('T')[0],
        coverImage,
        keywords,
        status
      };
      
      const url = isNew ? '/api/articles' : `/api/articles/${id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      // 使用防抖优化 - 避免重复请求
      const controller = new AbortController();
      
      await fetchWithCache<Article>(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Page-Request': '1' // 添加标识，表明这是真实请求
        },
        body: JSON.stringify(articleData),
        useCache: false,
        signal: controller.signal
      });
      
      messageApi.success('文章保存成功');
      
      setTimeout(() => {
        router.push('/articles');
      }, 1500);
      
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
      console.error('保存文章失败:', error);
      messageApi.error('保存文章失败，请重试');
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // 标签操作
  const handleAddTag = (tag: string) => {
    setKeywords([...keywords, tag]);
  };
  
  const handleRemoveTag = (tag: string) => {
    setKeywords(keywords.filter(t => t !== tag));
  };
  
  return (
    <>
      {/* 自定义头部元素优化资源请求 */}
      <NextHead>
        <link rel="preload" href="/api/articles" as="fetch" crossOrigin="anonymous" />
        <meta name="robots" content="noindex" /> {/* 阻止爬虫索引，减少资源请求 */}
      </NextHead>
      
      <Content className={styles.container}>
      {contextHolder}
      
        {/* 面包屑 */}
      <Breadcrumb
        items={[
            { title: <a onClick={() => router.push('/articles')}>文章列表</a> },
            { title: pageTitle }
          ]}
          className={styles.breadcrumb}
        />
        
        {/* 标题区 */}
        <div className={styles.pageHeader}>
          <div className={styles.title}>
            {Title ? (
              <Title level={2}>{pageTitle}</Title>
            ) : (
              <h2>{pageTitle}</h2>
            )}
          </div>
          
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => router.push('/articles')}
              disabled={isSaving}
            >
              返回
            </Button>
            <Button
              onClick={handleRefreshArticle}
              disabled={isSaving || isLoading}
              icon={
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              }
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={isSaving ? <Spin className={styles.savingSpinner} size="small" /> : <SaveOutlined />} 
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving}
            >
              保存文章
            </Button>
          </Space>
        </div>
        
        <Divider />
        
        {/* 主内容 */}
        <Card loading={isLoading}>
          <Form
            form={form}
            layout="vertical"
            disabled={isLoading || isSaving}
          >
            {Row && Col ? (
            <Row gutter={24}>
                <Col xs={24} md={16}>
                  {/* 基本信息区域 */}
                  <div className={styles.section}>
                <Form.Item 
                  name="title" 
                      label="文章标题"
                  rules={[{ required: true, message: '请输入文章标题' }]}
                      className={styles.formItem}
                >
                  <Input placeholder="输入文章标题..." />
                </Form.Item>
                
                    <Form.Item
                      name="summary"
                      label="文章摘要"
                      rules={[{ required: true, message: '请输入文章摘要' }]}
                      className={styles.formItem}
                    >
                      <TextArea placeholder="输入文章摘要..." rows={4} />
                </Form.Item>
                
                <Form.Item
                  name="category"
                  label="文章分类"
                  rules={[{ required: true, message: '请选择文章分类' }]}
                      className={styles.formItem}
                >
                  <Select placeholder="选择文章分类">
                    {ARTICLE_CATEGORIES.map(category => (
                      <Option key={category} value={category}>{category}</Option>
                    ))}
                  </Select>
                </Form.Item>
                  </div>
                  
                  {/* 文章内容 */}
                  <div className={styles.section}>
                    <div style={{ marginBottom: '16px' }}>
                      <SectionTitle>文章内容</SectionTitle>
                    </div>
                    
                    <Suspense fallback={<LoadingComponent />}>
                      <RichTextEditor
                        initialValue={html}
                        onChange={setHtml}
                      />
                    </Suspense>
                  </div>
                </Col>
                
                <Col xs={24} md={8}>
                  {/* 封面图 */}
                  <div className={styles.section}>
                    <div style={{ marginBottom: '16px' }}>
                      <SectionTitle>封面图</SectionTitle>
                    </div>
                    
                    <ImageUploader 
                      coverImage={coverImage}
                      setCoverImage={setCoverImage}
                    />
                  </div>
                  
                  {/* 关键词标签 */}
                  <div className={styles.section}>
                    <div style={{ marginBottom: '16px' }}>
                      <SectionTitle>关键词</SectionTitle>
                    </div>
                    
                    <TagDisplay 
                      tags={keywords}
                      onAdd={handleAddTag}
                      onRemove={handleRemoveTag}
                    />
                  </div>
                </Col>
              </Row>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>加载布局组件...</div>
              </div>
            )}
          </Form>
        </Card>
      </Content>
    </>
  );
});

ArticleEditContent.displayName = 'ArticleEditContent';

// 主页面组件
export default function ArticleEditPage() {
  return (
    <DashboardLayout>
      <ArticleEditContent />
    </DashboardLayout>
  );
} 