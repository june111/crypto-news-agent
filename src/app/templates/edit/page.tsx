'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useRouter, useParams } from 'next/navigation';

// 按需导入Ant Design组件
import Form from 'antd/lib/form';
import Input from 'antd/lib/input'; 
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Typography from 'antd/lib/typography';
import Divider from 'antd/lib/divider';
import message from 'antd/lib/message';
import Space from 'antd/lib/space';
import Breadcrumb from 'antd/lib/breadcrumb';
import Spin from 'antd/lib/spin';

import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import DashboardLayout from '@/components/DashboardLayout';
import fetchWithCache from '@/lib/utils/fetchUtils';
import useI18n from '@/hooks/useI18n';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  createdAt: string;
  usageCount: number;
}

function TemplateEditContent() {
  const router = useRouter();
  const params = useParams();
  const templateId = params?.id as string;
  const isNew = templateId === 'new';
  const { t, locale } = useI18n();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [form] = Form.useForm();
  
  // 加载模板数据
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
            content: '# {{标题}}\n\n## 摘要\n\n{{摘要内容}}\n\n## 正文\n\n{{正文内容}}\n\n## 结论\n\n{{结论内容}}'
          });
          setTemplate(null);
          setIsLoading(false);
          return;
        }
        
        // 模拟API调用加载模板
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 模拟数据
        const mockTemplate: Template = {
          id: templateId,
          name: `加密货币${templateId}号模板`,
          description: '用于分析加密货币市场趋势的文章模板',
          category: '分析',
          content: '# {{币种名称}}市场分析\n\n## 市场概况\n\n{{币种名称}}目前市值为{{市值}}，24小时交易量为{{交易量}}。\n\n## 价格分析\n\n近期价格表现：{{价格分析}}\n\n## 技术指标\n\n- RSI: {{RSI值}}\n- MACD: {{MACD值}}\n\n## 市场情绪\n\n目前市场对{{币种名称}}的总体情绪是{{情绪分析}}。\n\n## 未来展望\n\n基于以上分析，我们预计{{币种名称}}在短期内可能会{{预测结果}}。',
          createdAt: '2023-03-15',
          usageCount: parseInt(templateId) * 3
        };
        
        setTemplate(mockTemplate);
        
        // 设置表单值
        form.setFieldsValue({
          name: mockTemplate.name,
          category: mockTemplate.category,
          description: mockTemplate.description,
          content: mockTemplate.content
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
  
  // 保存模板
  const handleSave = () => {
    form.validateFields().then(() => {
      setIsSaving(true);
      
      // 模拟API调用
      setTimeout(() => {
        setIsSaving(false);
        message.success(t('templates.saveSuccess'));
        router.push('/templates');
      }, 800);
    }).catch(err => {
      console.log('表单验证失败:', err);
    });
  };
  
  // 取消编辑
  const handleCancel = () => {
    router.push('/templates');
  };
  
  // 删除模板
  const handleDelete = () => {
    if (!template) return;
    
    message.success(t('templates.deleteSuccess'));
    router.push('/templates');
  };
  
  return (
    <div style={{ padding: '24px' }}>
      {/* 面包屑导航 */}
      <Breadcrumb
        items={[
          { title: <a onClick={() => router.push('/templates')}>{t('templates.title')}</a> },
          { title: isNew ? t('templates.createTemplate') : t('templates.editTemplate') }
        ]}
        style={{ marginBottom: '16px' }}
      />
      
      {/* 标题区 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <Title level={2} style={{ margin: 0 }}>{isNew ? t('templates.createTemplate') : t('templates.editTemplate')}</Title>
        
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
          <div style={{ 
            backgroundColor: '#f9f9f9',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <Title level={4} style={{ marginBottom: '16px' }}>{t('templates.basicInfo')}</Title>
            
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
                showCount
                maxLength={100}
              />
            </Form.Item>
          </div>
          
          {/* 模板内容区域 */}
          <div style={{ 
            backgroundColor: '#f9f9f9',
            padding: '16px',
            borderRadius: '8px',
          }}>
            <Title level={4} style={{ marginBottom: '16px' }}>{t('templates.content')}</Title>
            
            <Form.Item 
              name="content"
              rules={[{ required: true, message: t('templates.contentRequired') }]}
            >
              <TextArea
                placeholder={t('templates.contentPlaceholder')}
                rows={15}
                style={{ fontFamily: 'monospace' }}
              />
            </Form.Item>
            
            <Text type="secondary">
              {t('templates.variableTip').replace('{{format}}', '{{变量名}}')}
            </Text>
          </div>
          
          {/* 使用信息 - 只在编辑状态显示 */}
          {!isNew && template && (
            <div style={{ marginTop: '24px' }}>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary">{t('templates.createdAt')}: {template.createdAt}</Text>
                  <br />
                  <Text type="secondary">{t('templates.usageCount')}: <strong>{template.usageCount}</strong></Text>
                </div>
                
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={handleDelete}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          )}
        </Form>
      </Card>
    </div>
  );
}

// 主组件包含Suspense边界
const TemplateEditPage = () => {
  const { t } = useI18n();
  return (
    <DashboardLayout>
      <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}><Spin size="large" tip={t('common.loading')} /></div>}>
        <TemplateEditContent />
      </Suspense>
    </DashboardLayout>
  );
};

export default TemplateEditPage; 