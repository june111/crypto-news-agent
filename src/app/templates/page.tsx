'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Input, 
  Button, 
  Card, 
  Typography, 
  Row, 
  Col, 
  Divider, 
  Empty, 
  Space,
  Popconfirm,
  Tag,
  Select,
  Form,
  message,
  Spin,
  Skeleton,
  Tooltip,
  Badge,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined, 
  ClearOutlined,
  EyeOutlined,
  FireOutlined,
  RiseOutlined,
  CalendarOutlined,
  FileTextOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import styles from './templates.module.css';
import useI18n from '@/hooks/useI18n';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Meta } = Card;

// 模板类型定义
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

const TemplatesPage = () => {
  const router = useRouter();
  const { t, locale } = useI18n();

  // 状态定义
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // 搜索状态
  const [searchName, setSearchName] = useState('');
  const [searchCategory, setSearchCategory] = useState<string>('');
  
  // 从API获取模板数据 - 仅在页面加载时执行一次
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        console.log('正在获取模板列表数据...');
        
        const response = await fetch('/api/templates');
        
        if (!response.ok) {
          throw new Error(t('templates.fetchFailed'));
        }
        
        const data = await response.json();
        console.log('获取到模板数据:', data.templates?.length || 0, '条记录');
        setTemplates(data.templates || []);
      } catch (error) {
        console.error('获取模板失败:', error);
        message.error(t('templates.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, []); // 空依赖数组，确保只在组件挂载时执行一次
  
  // 从现有模板中提取所有唯一分类
  const uniqueCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    templates.forEach((template: Template) => {
      if (template.category) {
        categoriesSet.add(template.category);
      }
    });
    return Array.from(categoriesSet);
  }, [templates]);
  
  // 获取统计数据
  const statistics = useMemo(() => {
    const totalTemplates = templates.length;
    const totalUsage = templates.reduce((sum, template) => sum + template.usage_count, 0);
    const categoriesCount = uniqueCategories.length;
    
    // 找出使用最多的模板
    const mostUsedTemplate = templates.length > 0 
      ? templates.reduce((prev, current) => 
          prev.usage_count > current.usage_count ? prev : current
        ) 
      : null;
    
    return {
      totalTemplates,
      totalUsage,
      categoriesCount,
      mostUsedTemplate
    };
  }, [templates, uniqueCategories]);
  
  // 处理模板名称搜索
  const handleNameSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchName(e.target.value);
  };
  
  // 处理分类搜索
  const handleCategorySearch = (value: string) => {
    setSearchCategory(value);
  };
  
  // 清空搜索
  const handleClearSearch = () => {
    setSearchName('');
    setSearchCategory('');
  };
  
  // 处理添加模板
  const handleAddTemplate = () => {
    router.push('/templates/edit/new');
  };
  
  // 处理删除模板
  const handleDeleteTemplate = async (id: string, name: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(t('templates.deleteFailed'));
      }
      
      // 本地更新UI，不需要重新获取数据
      setTemplates(prevTemplates => prevTemplates.filter((t: Template) => t.id !== id));
      
      message.success(`${t('common.success')}${t('templates.deleted')}"${name}"`);
    } catch (error) {
      console.error('删除模板失败:', error);
      message.error(t('templates.deleteFailed'));
    } finally {
      setLoading(false);
    }
  };
  
  // 过滤数据 - 同时匹配名称和分类
  const filteredTemplates = useMemo(() => {
    if (!Array.isArray(templates)) {
      console.error('templates 不是有效数组:', templates);
      return [];
    }
    
    return templates.filter((template: Template) => {
      // 防止访问undefined属性
      const name = template?.name || '';
      const category = template?.category || '';
      
      const nameMatch = name.toLowerCase().includes((searchName || '').toLowerCase());
      const categoryMatch = !searchCategory || category === searchCategory;
      return nameMatch && categoryMatch;
    });
  }, [templates, searchName, searchCategory]);
  
  // 按使用次数排序 (降序)
  const sortedTemplates = useMemo(() => {
    if (!Array.isArray(filteredTemplates)) {
      return [];
    }
    return [...filteredTemplates].sort((a, b) => {
      const usageA = typeof a?.usage_count === 'number' ? a.usage_count : 0;
      const usageB = typeof b?.usage_count === 'number' ? b.usage_count : 0;
      return usageB - usageA;
    });
  }, [filteredTemplates]);
  
  // 获取分类对应的颜色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case '分析':
        return 'blue';
      case '介绍':
        return 'green';
      case '报道':
        return 'orange';
      case '技术':
        return 'purple';
      case '观点':
        return 'red';
      case '教程':
        return 'cyan';
      default:
        return 'default';
    }
  };
  
  // 获取使用次数对应的标签
  const getUsageBadge = (count: number) => {
    if (count > 30) return <Badge count={count} overflowCount={99} color="#f50" />;
    if (count > 15) return <Badge count={count} overflowCount={99} color="#108ee9" />;
    return <Badge count={count} overflowCount={99} color="#52c41a" />;
  };
  
  // 渲染模板卡片
  const renderTemplateCard = (template: Template) => {
    return (
      <Badge.Ribbon 
        text={`${template.category}`} 
        color={getCategoryColor(template.category)}
        style={{ opacity: 0.9 }}
      >
        <Card 
          hoverable
          className={styles.templateCard}
          onClick={() => router.push(`/templates/edit/${template.id}`)}
          actions={[
            <Tooltip title={t('common.edit')} key="edit">
              <Button 
                type="text" 
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡
                  router.push(`/templates/edit/${template.id}`);
                }}
              />
            </Tooltip>,
            <Tooltip title={t('common.delete')} key="delete">
              <Popconfirm
                title={t('common.confirmDelete')}
                description={`${t('templates.deleteConfirm')}"${template.name}"？${t('templates.deleteWarning')}`}
                onConfirm={(e) => {
                  e?.stopPropagation(); // 阻止事件冒泡
                  handleDeleteTemplate(template.id, template.name);
                }}
                okText={t('common.confirm')}
                cancelText={t('common.cancel')}
                okButtonProps={{ danger: true }}
              >
                <Button 
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => e.stopPropagation()} // 阻止事件冒泡
                />
              </Popconfirm>
            </Tooltip>
          ]}
          cover={
            <div 
              className={styles.cardCover}
              style={{ 
                background: `linear-gradient(135deg, ${getCategoryColor(template.category)}22 0%, #ffffff 100%)` 
              }}
            >
              <Title level={4} ellipsis={{ rows: 1 }} className={styles.cardTitle}>
                {template.name}
              </Title>
              <div className={styles.cardMeta}>
                <Text type="secondary">
                  <CalendarOutlined /> {new Date(template.created_at).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                  })}
                </Text>
                <Tooltip title={`${t('templates.usageCount')}: ${template.usage_count}`}>
                  <Text>
                    <FireOutlined style={{ color: '#ff4d4f' }} /> <strong>{template.usage_count}</strong>
                  </Text>
                </Tooltip>
              </div>
            </div>
          }
        >
          <Paragraph 
            ellipsis={{ rows: 2 }} 
            className={styles.cardDescription}
          >
            {template.description}
          </Paragraph>
        </Card>
      </Badge.Ribbon>
    );
  };
  
  return (
    <DashboardLayout>
      <div style={{ padding: '24px' }}>
        <div className={styles.pageHeader}>
          <div>
            <Title level={2} style={{ marginBottom: '8px' }}>{t('templates.title')}</Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              {t('templates.description')}
            </Text>
          </div>
          
          <Button 
            type="primary" 
            size="large"
            icon={<PlusOutlined />} 
            onClick={handleAddTemplate}
            className={styles.createButton}
          >
            {t('templates.createTemplate')}
          </Button>
        </div>
        
        {/* 统计信息卡片 */}
        {!loading && (
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={8}>
              <Card className={styles.statCard}>
                <Statistic 
                  title={t('templates.totalTemplates')} 
                  value={statistics.totalTemplates} 
                  prefix={<FileTextOutlined />} 
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={8}>
              <Card className={styles.statCard}>
                <Statistic 
                  title={t('templates.totalCategories')} 
                  value={statistics.categoriesCount} 
                  prefix={<AppstoreOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={8}>
              <Card className={styles.statCard}>
                <Statistic 
                  title={t('templates.totalUsage')} 
                  value={statistics.totalUsage} 
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#fa541c' }}
                />
              </Card>
            </Col>
          </Row>
        )}
        
        {/* 搜索条件区域 */}
        <Card 
          className={styles.searchBox}
        >
          <Form layout="vertical" className={styles.searchForm}>
            <Row gutter={24} align="middle">
              <Col xs={24} md={10}>
                <Form.Item label={t('templates.templateName')} style={{ marginBottom: '12px' }}>
                  <Input
                    value={searchName}
                    onChange={handleNameSearch}
                    placeholder={t('templates.searchPlaceholder')}
                    prefix={<SearchOutlined />}
                    allowClear
                    style={{ borderRadius: '6px' }}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={10}>
                <Form.Item label={t('templates.category')}>
                  <Select
                    value={searchCategory}
                    onChange={handleCategorySearch}
                    placeholder={t('common.selectCategory')}
                    style={{ width: '100%', borderRadius: '6px' }}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {Array.isArray(uniqueCategories) && uniqueCategories.length > 0 ? (
                      uniqueCategories.map((category: string) => (
                        <Option key={category} value={category}>
                          <Tag color={getCategoryColor(category)}>
                            {category}
                          </Tag>
                        </Option>
                      ))
                    ) : (
                      <Option value="" disabled>{t('templates.noCategories')}</Option>
                    )}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} md={4}>
                <Form.Item label=" " style={{ marginBottom: '12px' }}>
                  <Button
                    icon={<ClearOutlined />}
                    onClick={handleClearSearch}
                    style={{ borderRadius: '6px', width: '100%' }}
                  >
                    {t('common.clear')}
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
        
        {/* 过滤结果提示 */}
        {!loading && Array.isArray(sortedTemplates) && sortedTemplates.length > 0 && (
          <div className={styles.filterResultInfo}>
            <Text>
              {t('common.total')} <Text strong>{sortedTemplates.length}</Text> {t('templates.matchingTemplates')}
              {searchName && <span>，{t('templates.keyword')}：<Tag color="blue">{searchName}</Tag></span>}
              {searchCategory && <span>，{t('templates.category')}：<Tag color={getCategoryColor(searchCategory)}>{searchCategory}</Tag></span>}
            </Text>
          </div>
        )}
        
        {/* 模板卡片网格 */}
        {loading ? (
          <Row gutter={[16, 16]}>
            {[...Array(8)].map((_, index) => (
              <Col xs={24} sm={12} md={8} lg={6} key={`skeleton-${index}`}>
                <Card className={styles.skeletonCard}>
                  <Skeleton active avatar paragraph={{ rows: 3 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : Array.isArray(sortedTemplates) && sortedTemplates.length > 0 ? (
          <Row gutter={[16, 16]}>
            {sortedTemplates.map((template: Template) => (
              <Col xs={24} sm={12} md={8} lg={6} key={template.id || `template-${Math.random()}`} style={{ marginBottom: '8px' }}>
                {renderTemplateCard(template)}
              </Col>
            ))}
          </Row>
        ) : (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                {searchName || searchCategory ? t('templates.noSearchResults') : t('templates.noTemplates')}
              </span>
            }
            className={styles.emptyState}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTemplate}>
              {t('templates.createFirstTemplate')}
            </Button>
          </Empty>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TemplatesPage; 