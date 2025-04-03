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
  ApiOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { colors, spacing, fontSizes, borderRadius } from '@/styles/theme';
import DashboardLayout from '@/components/DashboardLayout';
import dayjs from 'dayjs';
// 注意：需要安装这个包来渲染markdown
// 命令：npm install react-markdown
import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 动态导入Dify任务组件，以避免SSR问题
const DifyTasksComponent = dynamic(() => import('./dify-tasks'), { 
  ssr: false,
  loading: () => <div>正在加载Dify任务列表...</div>
});

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
  // 模拟AI任务数据
  const [tasks, setTasks] = useState<AITask[]>([
    { 
      id: '1', 
      name: '生成比特币周报封面', 
      type: '封面图', 
      status: '已完成', 
      createdAt: '2025-03-29 09:15',
      completedAt: '2025-03-29 09:18',
      result: {
        template: '市场分析模板',
        keywords: ['比特币', '市场分析', '周报'],
        coverImage: 'https://via.placeholder.com/800x400?text=Bitcoin+Weekly+Report'
      }
    },
    { 
      id: '2', 
      name: '生成以太坊价格趋势标题', 
      type: '标题', 
      status: '已完成', 
      createdAt: '2025-03-29 10:30',
      completedAt: '2025-03-29 10:35',
      result: {
        template: '市场分析模板',
        keywords: ['以太坊', '价格', '趋势分析'],
        generatedTitles: [
          '以太坊价格走势分析：突破2000美元关口的技术因素',
          '2025年以太坊价格展望：机构投资者如何影响市场',
          '以太坊价格趋势：Layer2解决方案推动的新增长点'
        ]
      }
    },
    { 
      id: '3', 
      name: '监控新兴NFT项目', 
      type: '标题', 
      status: '排队中', 
      createdAt: '2025-03-29 11:45'
    },
    { 
      id: '4', 
      name: '生成比特币白皮书解析文章', 
      type: '文章内容', 
      status: '已完成', 
      createdAt: '2025-03-28 15:20',
      completedAt: '2025-03-28 15:25',
      result: {
        template: '技术解析模板',
        keywords: ['比特币', '白皮书', '区块链'],
        title: '深入解析比特币白皮书：中本聪的去中心化愿景',
        summary: '本文对比特币白皮书进行了详细解析，探讨了中本聪的去中心化愿景及其对现代金融体系的影响。',
        content: '# 深入解析比特币白皮书：中本聪的去中心化愿景\n\n## 引言\n\n2008年10月31日，一个化名为中本聪的神秘人物发布了《比特币：一种点对点的电子现金系统》白皮书，这份文件奠定了比特币和区块链技术的基础...\n\n## 核心概念\n\n比特币白皮书引入了几个革命性的概念：区块链、工作量证明、去中心化共识机制...\n\n## 技术创新\n\n白皮书中最具创新性的方面在于解决了双重支付问题，同时不依赖于中央机构...\n\n## 影响与意义\n\n比特币白皮书不仅创造了第一种加密货币，更重要的是开创了一个全新的技术领域...'
      }
    },
    { 
      id: '5', 
      name: '生成莱特币市场分析封面', 
      type: '封面图', 
      status: '失败', 
      createdAt: '2025-03-28 16:30',
      completedAt: '2025-03-28 16:32'
    }
  ]);
  
  // 添加tab选项卡状态
  const [activeTab, setActiveTab] = useState('2');
  
  // 搜索相关状态
  const [completionDateRange, setCompletionDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  
  // 结果查看弹窗状态
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<AITask | null>(null);
  
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
      setIsResultModalOpen(true);
    }
  };
  
  // 关闭结果弹窗
  const handleCloseResultModal = () => {
    setIsResultModalOpen(false);
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
    if (!currentTask || !currentTask.result) {
      return <Empty description="没有可用的结果" />;
    }
    
    const { type } = currentTask;
    const { template, keywords, content, summary, title, coverImage, generatedTitles } = currentTask.result;
    
    return (
      <div>
        {template && (
          <Descriptions title="基本信息" bordered size="small" column={3} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="使用模板" span={3}>{template}</Descriptions.Item>
            {keywords && keywords.length > 0 && (
              <Descriptions.Item label="关键词" span={3}>
                {keywords.map(keyword => (
                  <Tag key={keyword} style={{ marginBottom: 8 }}>{keyword}</Tag>
                ))}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
        
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
        
        {type === '标题' && generatedTitles && generatedTitles.length > 0 && (
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
      <Row>
        <Col span={24}>
          <Title level={2}>AI任务管理</Title>
          <Text type="secondary">
            管理和监控所有AI任务的执行情况，包括标题生成、内容创作和图像生成任务。
          </Text>
        </Col>
      </Row>
      
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
                      <Form.Item label="任务状态">
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
                      <Form.Item label="任务类型">
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
                  dataSource={filteredTasks} 
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
        open={isResultModalOpen}
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
    </DashboardLayout>
  );
};

export default AITasksPage; 