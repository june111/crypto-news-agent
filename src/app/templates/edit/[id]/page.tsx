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
import Popconfirm from 'antd/lib/popconfirm';
import Spin from 'antd/lib/spin';

import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import DashboardLayout from '@/components/DashboardLayout';
import fetchWithCache from '@/lib/utils/fetchUtils';

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

const TemplateEditPage = () => {
  const router = useRouter();
  const params = useParams();
  const templateId = params?.id as string;
  const isNew = templateId === 'new';
  
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
        
        // 使用优化的fetch函数获取模板数据
        const template = await fetchWithCache<Template>(`/api/templates/${templateId}`, {
          useCache: { ttl: 300000 }, // 缓存5分钟
          retry: 2
        });
        
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
  
  // 保存模板
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
  const handleDelete = () => {
    if (!template) return;
    
    message.success('模板已删除');
    router.push('/templates');
  };
  
  return (
    <DashboardLayout>
      <div style={{ padding: '24px' }}>
        {/* 面包屑导航 */}
        <Breadcrumb
          items={[
            { title: <a onClick={() => router.push('/templates')}>模板列表</a> },
            { title: isNew ? '创建新模板' : '编辑模板' }
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
          <Title level={2} style={{ margin: 0 }}>{isNew ? '创建新模板' : '编辑模板'}</Title>
          
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
            <div style={{ 
              backgroundColor: '#f9f9f9',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <Title level={4} style={{ marginBottom: '16px' }}>基本信息</Title>
              
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
              <Title level={4} style={{ marginBottom: '16px' }}>模板内容</Title>
              
              <Form.Item 
                name="content"
                rules={[{ required: true, message: '请输入模板内容' }]}
              >
                <TextArea
                  placeholder="输入模板内容，使用 {{变量名}} 格式定义模板中可替换的变量，例如 {{币种名称}}、{{市场分析}}..."
                  rows={15}
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>
              
              <Text type="secondary">
                提示: 使用 {'{{变量名}}'} 格式定义模板中可替换的变量，例如 {'{{币种名称}}'} 、{'{{市场分析}}'}
              </Text>
            </div>
            
            {/* 使用信息 - 只在编辑状态显示 */}
            {!isNew && template && (
              <div style={{ marginTop: '24px' }}>
                <Divider />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text type="secondary">创建时间: {template.createdAt}</Text>
                    <br />
                    <Text type="secondary">使用次数: <strong>{template.usageCount}</strong></Text>
                  </div>
                  
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
                </div>
              </div>
            )}
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TemplateEditPage; 