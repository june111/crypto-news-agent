'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// 基础组件立即导入
import { Spin, Form, message, Button, Space, Breadcrumb, Divider, Card, Input, Popconfirm } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/DashboardLayout';
import fetchWithCache, { clearCache } from '@/lib/utils/fetchUtils';
import useI18n from '@/hooks/useI18n';

// 导入CSS模块
import styles from '../../template.module.css';

// 单独导入Typography组件
import Typography from 'antd/lib/typography';
const { Title, Text } = Typography;
const { TextArea } = Input;

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
  const { t, locale } = useI18n();  // 添加国际化支持
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [form] = Form.useForm();
  
  // 使用useMemo缓存计算值
  const pageTitle = useMemo(() => isNew ? t('templates.createTemplate') : t('templates.editTemplate'), [isNew, t]);
  const formattedCreationDate = useMemo(() => {
    if (!template) return '';
    return new Date(template.created_at).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  }, [template, locale]);
  
  // 加载模板数据
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setIsLoading(true);
        
        if (isNew) {
          // 设置表单值
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
        message.error(t('templates.loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTemplate();
  }, [templateId, isNew, form, t]);
  
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
            { title: <a onClick={() => router.push('/templates')}>{t('templates.title')}</a> },
            { title: pageTitle }
          ]}
          className={styles.breadcrumb}
        />
        
        {/* 标题区 */}
        <div className={styles.headerSection}>
          <div className={styles.title}>
            <Title level={2}>{pageTitle}</Title>
          </div>
          
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleCancel}
            >
              {t('common.back')}
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={handleSave}
              loading={isSaving}
            >
              {t('common.save')}
            </Button>
          </Space>
        </div>
        
        <Divider />
        
        {/* 模板编辑表单 */}
        <Card loading={isLoading}>
          <Form
            form={form}
            layout="vertical"
            disabled={isLoading}
          >
            {/* 显示模板ID (只有编辑状态) */}
            {!isNew && (
              <Form.Item 
                label={t('templates.templateId')}
              >
                <Input value={templateId} disabled />
              </Form.Item>
            )}
            
            {/* 基本信息区域 */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <Title level={4}>{t('templates.basicInfo')}</Title>
              </div>
              
              {/* 模板名称 */}
              <Form.Item 
                name="name"
                label={t('templates.templateName')}
                rules={[{ required: true, message: t('templates.nameRequired') }]}
              >
                <Input placeholder={t('templates.namePlaceholder')} />
              </Form.Item>
              
              {/* 文章分类 */}
              <Form.Item 
                name="category"
                label={t('templates.category')}
                rules={[{ required: true, message: t('templates.categoryRequired') }]}
              >
                <Input placeholder={t('templates.categoryPlaceholder')} />
              </Form.Item>
              
              {/* 模板简介 */}
              <Form.Item 
                name="description"
                label={t('templates.description')}
                rules={[{ required: true, message: t('templates.descriptionRequired') }]}
              >
                <TextArea 
                  placeholder={t('templates.descriptionPlaceholder')}
                  rows={2}
                />
              </Form.Item>
            </div>
            
            {/* 模板内容区域 */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <Title level={4}>{t('templates.content')}</Title>
              </div>
              
              <Form.Item 
                name="content"
                rules={[{ required: true, message: t('templates.contentRequired') }]}
              >
                <TextArea
                  placeholder={t('templates.contentPlaceholder')}
                  rows={15}
                  className={styles.monoText}
                />
              </Form.Item>
              
              <div>
                <Text type="secondary">
                  {t('templates.variableTip').replace('{{format}}', '{{变量名}}')}
                </Text>
              </div>
            </div>
            
            {/* 使用信息 - 只在编辑状态显示 */}
            {!isNew && template && (
              <div className={styles.infoSection}>
                <Divider />
                <div className={styles.infoRow}>
                  <div>
                    <Text type="secondary">
                      {t('templates.createdAt')}: {formattedCreationDate}
                    </Text>
                    <br />
                    <Text type="secondary">
                      {t('templates.usageCount')}: <strong>{template.usage_count}</strong>
                    </Text>
                  </div>
                  
                  <Popconfirm
                    title={t('common.confirmDelete')}
                    description={t('templates.deleteConfirm')}
                    onConfirm={handleDelete}
                    okText={t('common.confirm')}
                    cancelText={t('common.cancel')}
                    okButtonProps={{ danger: true }}
                  >
                    <Button 
                      danger 
                      icon={<DeleteOutlined />}
                    >
                      {t('common.delete')}
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            )}
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

// 使用React.memo避免不必要的重渲染
export default React.memo(TemplateEditPage); 