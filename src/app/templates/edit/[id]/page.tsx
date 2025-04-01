'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// 基础组件立即导入
import { Spin, Form, message, Button, Space, Breadcrumb, Divider } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/DashboardLayout';
import fetchWithCache, { clearCache } from '@/lib/utils/fetchUtils';

// 导入CSS模块
import styles from '../../template.module.css';

// 懒加载非关键组件 - 使用直接导入避免类型错误
const Card = dynamic(() => import('antd/lib/card'), { ssr: false });
const Input = dynamic(() => import('antd/lib/input'), { ssr: false });
const Popconfirm = dynamic(() => import('antd/lib/popconfirm'), { ssr: false });

// 单独导入Typography组件以避免类型错误
const Typography = dynamic(() => import('antd/lib/typography'), { ssr: false });
const TextArea = dynamic(() => import('antd/lib/input/TextArea'), { ssr: false });
const DynamicTitle = dynamic(() => import('antd/lib/typography/Title'), { ssr: false });
const DynamicText = dynamic(() => import('antd/lib/typography/Text'), { ssr: false });

// 组件加载前显示的骨架
const LoadingComponent = () => (
  <div className={styles.placeholder} style={{ textAlign: 'center', padding: '20px' }}>
    <Spin size="large" />
  </div>
);

// 模板接口定义
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  created_at: string;
  updated_at?: string;
  usage_count: number;
}

// 表单默认值
const defaultContent = '# {{标题}}\n\n## 摘要\n\n{{摘要内容}}\n\n## 正文\n\n{{正文内容}}\n\n## 结论\n\n{{结论内容}}';

// 主组件
const TemplateEditPage = () => {
  const router = useRouter();
  const params = useParams();
  const templateId = params?.id as string;
  const isNew = templateId === 'new';
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [form] = Form.useForm();
  
  // 使用useMemo缓存计算值
  const pageTitle = useMemo(() => isNew ? '创建新模板' : '编辑模板', [isNew]);
  const formattedCreationDate = useMemo(() => {
    if (!template) return '';
    return new Date(template.created_at).toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  }, [template]);
  
  // 加载模板数据 - 使用缓存提高性能
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setIsLoading(true);
        
        if (isNew) {
          // 新建模板 - 使用默认值
          form.setFieldsValue({
            name: '',
            category: '',
            description: '',
            content: defaultContent
          });
          setTemplate(null);
          setIsLoading(false);
          return;
        }
        
        // 使用优化的fetch函数获取模板数据
        const templateData = await fetchWithCache<Template>(`/api/templates/${templateId}`, {
          useCache: { ttl: 300000 }, // 缓存5分钟
          retry: 2
        });
        
        // 确保模板数据符合接口要求
        const template: Template = {
          id: templateData.id,
          name: templateData.name,
          description: templateData.description || '',
          category: templateData.category || '',
          content: templateData.content,
          created_at: templateData.created_at,
          updated_at: templateData.updated_at,
          usage_count: templateData.usage_count || 0
        };
        
        setTemplate(template);
        
        // 设置表单值
        form.setFieldsValue({
          name: template.name,
          category: template.category,
          description: template.description,
          content: template.content
        });
        
      } catch (error) {
        console.error('加载模板失败:', error);
        message.error('加载模板数据失败');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTemplate();
  }, [templateId, isNew, form]);
  
  // 保存模板 - 使用防抖优化
  const handleSave = () => {
    // 表单验证通过后的回调
    form.validateFields().then(async (values) => {
      try {
        setIsSaving(true);
        
        // 构建保存数据
        const templateData = {
          ...values,
          id: isNew ? undefined : templateId
        };
        
        // 发送API请求
        const url = isNew ? '/api/templates' : `/api/templates/${templateId}`;
        const method = isNew ? 'POST' : 'PUT';
        
        await fetchWithCache<Template>(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(templateData),
          useCache: false // 保存操作不使用缓存
        });
        
        message.success('模板保存成功');
        router.push('/templates');
      } catch (error) {
        console.error('保存模板失败:', error);
        message.error('保存模板失败');
      } finally {
        setIsSaving(false);
      }
    }).catch(err => {
      console.log('表单验证失败:', err);
    });
  };
  
  // 取消编辑
  const handleCancel = () => {
    router.push('/templates');
  };
  
  // 删除模板
  const handleDelete = async () => {
    if (!template) return;
    
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('删除模板失败');
      }
      
      // 清除模板列表的缓存，确保列表页面显示最新数据
      clearCache('/api/templates');
      
      message.success('模板已删除');
      router.push('/templates');
    } catch (error) {
      console.error('删除模板失败:', error);
      message.error('删除模板失败，请稍后重试');
    }
  };
  
  return (
    <DashboardLayout>
      <div className={styles.container}>
        {/* 面包屑导航 */}
        <Breadcrumb
          items={[
            { title: <a onClick={() => router.push('/templates')}>模板列表</a> },
            { title: pageTitle }
          ]}
          className={styles.breadcrumb}
        />
        
        {/* 标题区 */}
        <div className={styles.headerSection}>
          <Suspense fallback={<div className={styles.placeholder}></div>}>
            <div className={styles.title}>
              <DynamicTitle level={2}>{pageTitle}</DynamicTitle>
            </div>
          </Suspense>
          
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleCancel}
            >
              返回
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
        </div>
        
        <Divider />
        
        {/* 模板编辑表单 */}
        <Suspense fallback={<LoadingComponent />}>
          <Card loading={isLoading}>
            <Form
              form={form}
              layout="vertical"
              disabled={isLoading}
            >
              {/* 显示模板ID (只有编辑状态) */}
              {!isNew && (
                <Form.Item 
                  label="模板ID"
                >
                  <Input value={templateId} disabled />
                </Form.Item>
              )}
              
              {/* 基本信息区域 */}
              <div className={styles.section}>
                <Suspense fallback={<div className={styles.placeholder}></div>}>
                  <div className={styles.sectionTitle}>
                    <DynamicTitle level={4}>基本信息</DynamicTitle>
                  </div>
                </Suspense>
                
                {/* 模板名称 */}
                <Form.Item 
                  name="name"
                  label="模板名称" 
                  rules={[{ required: true, message: '请输入模板名称' }]}
                >
                  <Input placeholder="输入模板名称..." />
                </Form.Item>
                
                {/* 文章分类 */}
                <Form.Item 
                  name="category"
                  label="文章分类" 
                  rules={[{ required: true, message: '请输入文章分类' }]}
                >
                  <Input placeholder="输入文章分类，例如：分析、介绍、报道、技术等" />
                </Form.Item>
                
                {/* 模板简介 */}
                <Form.Item 
                  name="description"
                  label="模板简介" 
                  rules={[{ required: true, message: '请输入模板简介' }]}
                >
                  <TextArea 
                    placeholder="输入模板简介..." 
                    rows={2}
                  />
                </Form.Item>
              </div>
              
              {/* 模板内容区域 */}
              <div className={styles.section}>
                <Suspense fallback={<div className={styles.placeholder}></div>}>
                  <div className={styles.sectionTitle}>
                    <DynamicTitle level={4}>模板内容</DynamicTitle>
                  </div>
                </Suspense>
                
                <Form.Item 
                  name="content"
                  rules={[{ required: true, message: '请输入模板内容' }]}
                >
                  <TextArea
                    placeholder="输入模板内容，使用 {{变量名}} 格式定义模板中可替换的变量，例如 {{币种名称}}、{{市场分析}}..."
                    rows={15}
                    className={styles.monoText}
                  />
                </Form.Item>
                
                <Suspense fallback={<div className={styles.placeholderSmall}></div>}>
                  <div>
                    <DynamicText type="secondary">
                      提示: 使用 {'{{变量名}}'} 格式定义模板中可替换的变量，例如 {'{{币种名称}}'} 、{'{{市场分析}}'}
                    </DynamicText>
                  </div>
                </Suspense>
              </div>
              
              {/* 使用信息 - 只在编辑状态显示 */}
              {!isNew && template && (
                <div className={styles.infoSection}>
                  <Divider />
                  <div className={styles.infoRow}>
                    <div>
                      <Suspense fallback={<div className={styles.placeholderSmall}></div>}>
                        <div>
                          <DynamicText type="secondary">
                            创建时间: {formattedCreationDate}
                          </DynamicText>
                          <br />
                          <DynamicText type="secondary">
                            使用次数: <strong>{template.usage_count}</strong>
                          </DynamicText>
                        </div>
                      </Suspense>
                    </div>
                    
                    <Suspense fallback={<Spin />}>
                      <Popconfirm
                        title="确认删除"
                        description="确定要删除此模板吗？此操作无法撤销！"
                        onConfirm={handleDelete}
                        okText="确认删除"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                      >
                        <Button 
                          danger 
                          icon={<DeleteOutlined />}
                        >
                          删除模板
                        </Button>
                      </Popconfirm>
                    </Suspense>
                  </div>
                </div>
              )}
            </Form>
          </Card>
        </Suspense>
      </div>
    </DashboardLayout>
  );
};

// 使用React.memo避免不必要的重渲染
export default React.memo(TemplateEditPage); 