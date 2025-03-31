'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

// 按需导入Ant Design组件
import Input from 'antd/lib/input'; 
import Button from 'antd/lib/button';
import Space from 'antd/lib/space';
import Form from 'antd/lib/form';
import Select from 'antd/lib/select';
import Upload from 'antd/lib/upload';
import Breadcrumb from 'antd/lib/breadcrumb';
import Tag from 'antd/lib/tag';
import Spin from 'antd/lib/spin';
import message from 'antd/lib/message';
import Card from 'antd/lib/card';
import Typography from 'antd/lib/typography';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Tabs from 'antd/lib/tabs';
import Empty from 'antd/lib/empty';
import Divider from 'antd/lib/divider';
import Layout from 'antd/lib/layout';
import { 
  ArrowLeftOutlined,
  SaveOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  UploadOutlined
} from '@ant-design/icons';
import '@wangeditor/editor/dist/css/style.css';
// 懒加载编辑器组件
const Editor = lazy(() => import('@wangeditor/editor-for-react').then(mod => ({ default: mod.Editor })));
const Toolbar = lazy(() => import('@wangeditor/editor-for-react').then(mod => ({ default: mod.Toolbar })));
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';

import { spacing, borderRadius } from '@/styles/theme';
import DashboardLayout from '@/components/DashboardLayout';
import { ArticleStatus, ARTICLE_CATEGORIES } from '@/types/article';
import fetchWithCache from '@/lib/utils/fetchUtils';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Content } = Layout;
const { TabPane } = Tabs;

// 文章数据类型定义
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

// 内容组件
function ArticleEditContent() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // 文章数据状态
  const [keywords, setKeywords] = useState<string[]>([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<ArticleStatus>('待审核');
  const [coverImage, setCoverImage] = useState('');
  
  // 编辑器状态
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const [html, setHtml] = useState('');
  
  // 编辑器配置
  const toolbarConfig: Partial<IToolbarConfig> = {};
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入文章正文内容...',
  };
  
  // 及时销毁编辑器
  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);
  
  // 加载文章数据
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        
        if (id === 'new') {
          // 创建新文章
          setIsLoading(false);
          return;
        }

        // 使用优化的fetch函数获取文章数据
        const article = await fetchWithCache<Article>(`/api/articles/${id}`, {
          useCache: { ttl: 300000 }, // 缓存5分钟
          retry: 2
        });
        
        // 设置表单数据
        form.setFieldsValue({
          title: article.title,
          summary: article.summary,
          category: article.category,
        });
        
        // 设置富文本内容
        setHtml(article.content || '');
        
        // 设置其他状态
        setDate(article.date);
        setKeywords(article.keywords);
        setCoverImage(article.coverImage);
        setStatus(article.status);
        
      } catch (error) {
        console.error('获取文章数据失败:', error);
        messageApi.error('获取文章数据失败');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArticle();
  }, [id, form, messageApi]);
  
  // 封面图片上传前的预览处理
  const beforeUpload = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setCoverImage(reader.result as string);
    };
    // 阻止默认上传行为
    return false;
  };
  
  // 保存文章
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setIsSaving(true);
      
      // 构建文章数据
      const articleData = {
        ...values,
        id: id === 'new' ? undefined : id,
        content: html, // 使用富文本编辑器的HTML内容
        date: date || new Date().toISOString().split('T')[0],
        coverImage,
        keywords,
        status
      };
      
      // 发送API请求
      const url = id === 'new' ? '/api/articles' : `/api/articles/${id}`;
      const method = id === 'new' ? 'POST' : 'PUT';
      
      await fetchWithCache<Article>(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(articleData),
        useCache: false // 保存操作不使用缓存
      });
      
      messageApi.success('文章保存成功');
      
      // 保存成功后延迟返回列表页
      setTimeout(() => {
        router.push('/articles');
      }, 1500);
      
    } catch (error) {
      console.error('保存文章失败:', error);
      messageApi.error('保存文章失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };
  
  // 关键词标签处理
  const handleClose = (removedTag: string) => {
    const newTags = keywords.filter(tag => tag !== removedTag);
    setKeywords(newTags);
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = () => {
    if (inputValue && keywords.indexOf(inputValue) === -1) {
      setKeywords([...keywords, inputValue]);
    }
    setInputVisible(false);
    setInputValue('');
  };
  
  return (
    <>
      {contextHolder}
      
      {/* 面包屑导航 */}
      <Breadcrumb
        items={[
          { title: <a onClick={() => router.push('/articles')}>文章列表</a> },
          { title: id === 'new' ? '创建新文章' : '编辑文章' }
        ]}
        style={{ marginBottom: '16px' }}
      />
      
      {/* 页面标题 */}
      <Title level={2} style={{ marginBottom: spacing.lg }}>{id === 'new' ? '创建文章' : '编辑文章'}</Title>
      
      <Content>
        <Card bordered={false} style={{ marginBottom: spacing.lg }}>
          <Form
            form={form}
            layout="vertical"
            name="articleForm"
            requiredMark={false}
            disabled={isLoading}
          >
            <Row gutter={24}>
              {/* 左侧表单 */}
              <Col span={12}>
                {/* 文章ID */}
                {id !== 'new' && (
                  <Form.Item label="文章ID">
                    <Input value={id} disabled />
                  </Form.Item>
                )}
                
                {/* 标题 */}
                <Form.Item 
                  name="title" 
                  label="标题" 
                  rules={[{ required: true, message: '请输入文章标题' }]}
                >
                  <Input placeholder="输入文章标题..." />
                </Form.Item>
                
                {/* 封面图 */}
                <Form.Item label="封面图">
                  <Upload
                    listType="picture-card"
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    maxCount={1}
                  >
                    {coverImage ? (
                      <Image 
                        src={coverImage} 
                        alt="封面预览" 
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>上传封面</div>
                      </div>
                    )}
                  </Upload>
                  
                  <Input 
                    placeholder="或输入图片URL" 
                    value={coverImage}
                    onChange={e => setCoverImage(e.target.value)}
                    style={{ marginTop: spacing.sm }}
                  />
                </Form.Item>
                
                {/* 文章分类 */}
                <Form.Item
                  name="category"
                  label="文章分类"
                  rules={[{ required: true, message: '请选择文章分类' }]}
                >
                  <Select placeholder="选择文章分类">
                    {ARTICLE_CATEGORIES.map(category => (
                      <Option key={category} value={category}>{category}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              {/* 右侧表单 */}
              <Col span={12}>
                {/* 日期 */}
                <Form.Item label="日期">
                  <Input 
                    disabled 
                    value={date || new Date().toISOString().split('T')[0]} 
                  />
                </Form.Item>
                
                {/* 状态 */}
                <Form.Item label="状态">
                  <Tag color={
                    status === '已发布' ? 'success' : 
                    status === '待审核' ? 'processing' : 
                    status === '不过审' ? 'error' : 
                    status === '发布失败' ? 'warning' : 'default'
                  }>
                    {status}
                  </Tag>
                </Form.Item>
                
                {/* 关键词 */}
                <Form.Item label="关键词">
                  <Space size={[0, 8]} wrap>
                    {keywords.map((tag) => (
                      <Tag 
                        key={tag} 
                        closable 
                        onClose={() => handleClose(tag)}
                        style={{ marginBottom: 8 }}
                      >
                        {tag}
                      </Tag>
                    ))}
                    {inputVisible ? (
                      <Input
                        type="text"
                        size="small"
                        style={{ width: 78 }}
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleInputConfirm}
                        onPressEnter={handleInputConfirm}
                        autoFocus
                      />
                    ) : (
                      <Tag 
                        onClick={showInput} 
                        style={{ background: '#f5f5f5', borderStyle: 'dashed' }}
                      >
                        <PlusOutlined /> 添加关键词
                      </Tag>
                    )}
                  </Space>
                </Form.Item>
                
                {/* 摘要 */}
                <Form.Item
                  name="summary"
                  label="摘要"
                  rules={[{ required: true, message: '请输入文章摘要' }]}
                >
                  <TextArea 
                    placeholder="输入文章摘要..." 
                    autoSize={{ minRows: 3, maxRows: 5 }}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Divider />
            
            {/* 文章正文 */}
            <Form.Item
              label="正文内容"
              rules={[{ required: true, message: '请输入正文内容' }]}
            >
              <Tabs defaultActiveKey="editor">
                <TabPane tab={<span><EditOutlined />编辑</span>} key="editor">
                  <div style={{ border: '1px solid #d9d9d9', borderRadius: borderRadius.sm }}>
                    <Toolbar
                      editor={editor}
                      defaultConfig={toolbarConfig}
                      mode="default"
                      style={{ borderBottom: '1px solid #d9d9d9' }}
                    />
                    <Editor
                      defaultConfig={editorConfig}
                      value={html}
                      onCreated={setEditor}
                      onChange={(editor) => setHtml(editor.getHtml())}
                      mode="default"
                      style={{ height: '500px', overflowY: 'hidden' }}
                    />
                  </div>
                </TabPane>
                <TabPane tab={<span><EyeOutlined />预览</span>} key="preview">
                  <div 
                    style={{ 
                      minHeight: '500px', 
                      border: '1px solid #d9d9d9', 
                      borderRadius: borderRadius.sm,
                      padding: spacing.lg
                    }}
                  >
                    {html ? (
                      <div dangerouslySetInnerHTML={{ __html: html }} />
                    ) : (
                      <Empty description="暂无内容" />
                    )}
                  </div>
                </TabPane>
              </Tabs>
            </Form.Item>
            
            {/* 操作按钮 */}
            <Form.Item>
              <Space>
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => router.push('/articles')}
                >
                  返回列表
                </Button>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={handleSave}
                  loading={isSaving}
                >
                  保存
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </>
  );
}

// 主页面组件 - 包含Suspense边界
export default function ArticleEditPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}><Spin size="large" tip="加载中..." /></div>}>
        <ArticleEditContent />
      </Suspense>
    </DashboardLayout>
  );
} 