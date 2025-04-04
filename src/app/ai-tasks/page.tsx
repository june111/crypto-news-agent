'use client';

import React, { useState, useMemo } from 'react';
import { 
  Table, 
  Button, 
  Tag, 
  Space, 
  Typography, 
  Divider, 
  Modal, 
  message,
  Row,
  Col,
  Select,
  Form,
  Popconfirm,
  DatePicker,
  Card,
  Image,
  Descriptions,
  Empty,
  Tabs,
  List
} from 'antd';
import { 
  ReloadOutlined, 
  EyeOutlined, 
  StopOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FormOutlined,
  CalendarOutlined,
  ApiOutlined,
  PlusOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { colors, spacing, fontSizes, borderRadius } from '@/styles/theme';
import DashboardLayout from '@/components/DashboardLayout';
import dayjs from 'dayjs';
// 注意：需要安装这个包来渲染markdown
// 命令：npm install react-markdown
import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';
import useI18n from '@/hooks/useI18n';
import { useRouter } from 'next/navigation';
import { logError, logInfo } from '@/lib/db/utils/logger';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 动态导入Dify任务组件，以避免SSR问题
const DifyTasksComponent = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <Empty 
        description="Dify API接入中，敬请期待" 
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    </div>
  );
};

// AI任务类型定义
interface AITask {
  id: string;
  name: string;
  type: '封面图' | '标题' | '文章内容';
  status: '进行中' | '已完成' | '失败' | '排队中';
  createdAt: string;
  completedAt?: string;
  result?: {
    template?: string;
    keywords?: string[];
    content?: string;
    summary?: string;
    title?: string;
    coverImage?: string;
    generatedTitles?: string[]; // 标题任务生成的多个候选标题
  };
}

const AITasksPage = () => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const { t } = useI18n();
  
  // 页面状态
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState<AITask | null>(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [resultLoading, setResultLoading] = useState(false);
  const [taskResult, setTaskResult] = useState<any>(null);
  
  // 添加tab选项卡状态
  const [activeTab, setActiveTab] = useState('2');
  
  // 搜索相关状态
  const [completionDateRange, setCompletionDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  
  // 获取任务类型对应的图标和颜色
  const getTypeInfo = (type: AITask['type']) => {
    switch(type) {
      case '封面图':
        return { icon: <FileImageOutlined />, color: 'blue' };
      case '标题':
        return { icon: <FormOutlined />, color: 'green' };
      case '文章内容':
        return { icon: <FileTextOutlined />, color: 'purple' };
      default:
        return { icon: <FileTextOutlined />, color: 'default' };
    }
  };
  
  // 获取状态对应的标签颜色
  const getStatusColor = (status: AITask['status']) => {
    switch(status) {
      case '进行中':
        return 'processing';
      case '已完成':
        return 'success';
      case '失败':
        return 'error';
      case '排队中':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // 查看任务结果
  const handleViewResult = (id: string) => {
    const task = tasks.find(task => task.id === id);
    if (task) {
      setCurrentTask(task);
      setResultModalVisible(true);
    }
  };
  
  // 关闭结果弹窗
  const handleCloseResultModal = () => {
    setResultModalVisible(false);
    setCurrentTask(null);
  };
  
  // 取消任务
  const handleCancelTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, status: '失败' } : task
    ));
    message.success('任务已取消');
  };
  
  // 重试任务
  const handleRetryTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, status: '排队中' } : task
    ));
    message.success('任务已重新提交');
  };
  
  // 处理日期范围变化
  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    setCompletionDateRange(dates);
  };
  
  // 处理状态变化
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
  };
  
  // 处理任务类型变化
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
  };
  
  // 清空筛选条件
  const handleClearFilters = () => {
    setCompletionDateRange(null);
    setSelectedStatus('');
    setSelectedType('');
  };
  
  // 显示创建任务弹窗
  const handleShowModal = () => {
    setModalVisible(true);
  };
  
  // 计算任务耗时（分钟）
  const calculateDuration = (createdAt: string, completedAt?: string) => {
    if (!completedAt) return null;
    
    const start = new Date(createdAt);
    const end = new Date(completedAt);
    const durationMs = end.getTime() - start.getTime();
    
    // 转换为分钟并保留1位小数
    const minutes = Math.round(durationMs / 1000 / 60 * 10) / 10;
    
    return minutes;
  };
  
  // 格式化耗时展示
  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return '-';
    
    if (minutes < 1) {
      return `${Math.round(minutes * 60)}秒`;
    } else {
      return `${minutes}分钟`;
    }
  };
  
  // 筛选后的任务数据
  const filteredTasks = useMemo(() => {
    if (!Array.isArray(tasks)) {
      console.warn('tasks不是有效数组:', tasks);
      return [];
    }
    
    return tasks.filter(task => {
      // 状态筛选
      if (selectedStatus && task.status !== selectedStatus) {
        return false;
      }
      
      // 类型筛选
      if (selectedType && task.type !== selectedType) {
        return false;
      }
      
      // 日期范围筛选
      if (completionDateRange && completionDateRange[0] && completionDateRange[1] && task.completedAt) {
        const completedDate = dayjs(task.completedAt);
        const startDate = completionDateRange[0];
        const endDate = completionDateRange[1];
        
        if (completedDate.isBefore(startDate) || completedDate.isAfter(endDate)) {
          return false;
        }
      }
      
      return true;
    });
  }, [tasks, selectedStatus, selectedType, completionDateRange]);
  
  // 表格列定义
  const columns: ColumnsType<AITask> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 250,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => {
        const typeInfo = getTypeInfo(type);
        return (
          <Tag color={typeInfo.color} icon={typeInfo.icon}>
            {type}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: 180,
      render: (completedAt) => completedAt || '-',
    },
    {
      title: '耗时',
      key: 'duration',
      width: 100,
      render: (_, record) => formatDuration(calculateDuration(record.createdAt, record.completedAt)),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {record.status === '已完成' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewResult(record.id)}
            >
              查看结果
            </Button>
          )}
          
          {(record.status === '进行中' || record.status === '排队中') && (
            <Popconfirm
              title="确定要取消这个任务吗？"
              onConfirm={() => handleCancelTask(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button 
                danger 
                size="small" 
                icon={<StopOutlined />}
              >
                取消任务
              </Button>
            </Popconfirm>
          )}
          
          {record.status === '失败' && (
            <Button 
              type="default" 
              size="small" 
              icon={<ReloadOutlined />}
              onClick={() => handleRetryTask(record.id)}
            >
              重试
            </Button>
          )}
        </Space>
      ),
    },
  ];
  
  // 渲染任务结果
  const renderTaskResult = () => {
    if (!currentTask) {
      return <Empty description="没有可用的任务" />;
    }
    
    if (!currentTask.result) {
      return <Empty description="没有可用的结果" />;
    }
    
    const { type } = currentTask;
    const { template, keywords, content, summary, title, coverImage, generatedTitles } = currentTask.result;
    
    return (
      <div>
        <Descriptions title="基本信息" bordered size="small" column={3} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="使用模板" span={3}>{template || '无模板信息'}</Descriptions.Item>
          {keywords && Array.isArray(keywords) && keywords.length > 0 && (
            <Descriptions.Item label="关键词" span={3}>
              {keywords.map(keyword => (
                <Tag key={keyword} style={{ marginBottom: 8 }}>{keyword}</Tag>
              ))}
            </Descriptions.Item>
          )}
        </Descriptions>
        
        <Divider />
        
        {type === '封面图' && coverImage && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Image 
              src={coverImage} 
              alt="生成的封面图"
              width={600}
              style={{ maxWidth: '100%' }}
            />
          </div>
        )}
        
        {type === '标题' && generatedTitles && Array.isArray(generatedTitles) && generatedTitles.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>生成的标题候选</Title>
            <List
              bordered
              dataSource={generatedTitles}
              renderItem={(item, index) => (
                <List.Item>
                  <Typography.Text mark>[选项 {index + 1}]</Typography.Text> {item}
                </List.Item>
              )}
            />
          </div>
        )}
        
        {type === '文章内容' && (
          <>
            {title && (
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>标题</Title>
                <Paragraph>{title}</Paragraph>
              </div>
            )}
            
            {summary && (
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>摘要</Title>
                <Paragraph>{summary}</Paragraph>
              </div>
            )}
            
            {content && (
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>正文</Title>
                <div className="markdown-content">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };
  
  return (
    <DashboardLayout>
      {contextHolder}
      <div style={{ padding: '24px' }}>
        {/* 页面标题 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <div>
            <Title level={2}>{t('aiTasks.title')}</Title>
            <Text type="secondary">
              {t('aiTasks.description')}
            </Text>
          </div>
          
          <div>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleShowModal}
              size="large"
            >
              {t('aiTasks.createTask')}
            </Button>
          </div>
        </div>
        
        <Divider />
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: '1',
              label: (
                <span>
                  <CalendarOutlined />
                  内部AI任务
                </span>
              ),
              children: (
                <>
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} md={8}>
                      <Form layout="vertical">
                        <Form.Item label="完成日期范围">
                          <RangePicker 
                            value={completionDateRange}
                            onChange={handleDateRangeChange}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Form>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form layout="vertical">
                        <Form.Item label={t('aiTasks.status')}>
                          <Select 
                            placeholder="选择状态" 
                            style={{ width: '100%' }}
                            value={selectedStatus}
                            onChange={handleStatusChange}
                            allowClear
                          >
                            <Option value="进行中">进行中</Option>
                            <Option value="已完成">已完成</Option>
                            <Option value="失败">失败</Option>
                            <Option value="排队中">排队中</Option>
                          </Select>
                        </Form.Item>
                      </Form>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form layout="vertical">
                        <Form.Item label={t('aiTasks.itemDescription')}>
                          <Select 
                            placeholder="选择类型" 
                            style={{ width: '100%' }}
                            value={selectedType}
                            onChange={handleTypeChange}
                            allowClear
                          >
                            <Option value="封面图">封面图</Option>
                            <Option value="标题">标题</Option>
                            <Option value="文章内容">文章内容</Option>
                          </Select>
                        </Form.Item>
                      </Form>
                    </Col>
                    <Col xs={24} md={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <Button 
                        icon={<ReloadOutlined />} 
                        onClick={handleClearFilters}
                        style={{ marginBottom: 24 }}
                      >
                        重置筛选
                      </Button>
                    </Col>
                  </Row>
                  
                  <Table 
                    columns={columns} 
                    dataSource={Array.isArray(filteredTasks) ? filteredTasks : []} 
                    rowKey="id"
                    pagination={{ 
                      pageSize: 10, 
                      showSizeChanger: true, 
                      showTotal: (total) => `共 ${total} 个任务`
                    }}
                  />
                </>
              )
            },
            {
              key: '2',
              label: (
                <span>
                  <ApiOutlined />
                  Dify任务列表
                </span>
              ),
              children: <DifyTasksComponent />
            }
          ]}
        />
        
        {/* 任务结果查看弹窗 */}
        <Modal
          title={`任务结果 - ${currentTask?.name}`}
          open={resultModalVisible}
          onCancel={handleCloseResultModal}
          footer={[
            <Button key="close" onClick={handleCloseResultModal}>
              关闭
            </Button>
          ]}
          width={800}
        >
          {renderTaskResult()}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AITasksPage; 