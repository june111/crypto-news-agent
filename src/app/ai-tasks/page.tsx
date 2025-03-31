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
  CalendarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { colors, spacing, fontSizes, borderRadius } from '@/styles/theme';
import DashboardLayout from '@/components/DashboardLayout';
import dayjs from 'dayjs';
// 注意：需要安装这个包来渲染markdown
// 命令：npm install react-markdown
import ReactMarkdown from 'react-markdown';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

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
      
      // 任务类型筛选
      if (selectedType && task.type !== selectedType) {
        return false;
      }
      
      // 完成日期范围筛选
      if (completionDateRange && completionDateRange[0] && completionDateRange[1]) {
        // 只筛选已完成或失败的任务
        if (!task.completedAt) {
          return false;
        }
        
        const completedDate = dayjs(task.completedAt);
        const startDate = completionDateRange[0].startOf('day');
        const endDate = completionDateRange[1].endOf('day');
        
        if (!completedDate.isAfter(startDate) || !completedDate.isBefore(endDate)) {
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
      ellipsis: true,
    },
    {
      title: '任务类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: AITask['type']) => {
        const { icon, color } = getTypeInfo(type);
        return (
          <Tag color={color} icon={icon}>
            {type}
          </Tag>
        );
      },
      filters: [
        { text: '封面图', value: '封面图' },
        { text: '标题', value: '标题' },
        { text: '文章内容', value: '文章内容' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: AITask['status']) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
      filters: [
        { text: '进行中', value: '进行中' },
        { text: '已完成', value: '已完成' },
        { text: '失败', value: '失败' },
        { text: '排队中', value: '排队中' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (text) => text || '-',
    },
    {
      title: '耗时',
      key: 'duration',
      render: (_, record) => formatDuration(calculateDuration(record.createdAt, record.completedAt)),
      sorter: (a, b) => {
        const durationA = calculateDuration(a.createdAt, a.completedAt) || 0;
        const durationB = calculateDuration(b.createdAt, b.completedAt) || 0;
        return durationA - durationB;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
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
          {(record.status === '排队中' || record.status === '进行中') && (
            <Popconfirm
              title="确认取消"
              description="确定要取消这个任务吗？"
              onConfirm={() => handleCancelTask(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
              >
                取消
              </Button>
            </Popconfirm>
          )}
          {record.status === '失败' && (
            <Button
              type="primary"
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
  
  // 渲染任务结果内容
  const renderTaskResult = () => {
    if (!currentTask || !currentTask.result) {
      return <Empty description="暂无结果数据" />;
    }
    
    const { type, result } = currentTask;
    const duration = calculateDuration(currentTask.createdAt, currentTask.completedAt);
    
    return (
      <div>
        <Tabs defaultActiveKey="info">
          <TabPane 
            tab={<span><CalendarOutlined />基本信息</span>} 
            key="info"
          >
            <Descriptions 
              bordered 
              column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
              style={{ marginBottom: spacing.lg }}
            >
              <Descriptions.Item 
                label="任务名称" 
                labelStyle={{ fontWeight: 'bold' }}
                span={2}
              >
                {currentTask.name}
              </Descriptions.Item>
              
              <Descriptions.Item 
                label="任务类型" 
                labelStyle={{ fontWeight: 'bold' }}
              >
                <Tag color={getTypeInfo(type).color} icon={getTypeInfo(type).icon}>
                  {type}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item 
                label="任务状态" 
                labelStyle={{ fontWeight: 'bold' }}
              >
                <Tag color={getStatusColor(currentTask.status)}>
                  {currentTask.status}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item 
                label="创建时间" 
                labelStyle={{ fontWeight: 'bold' }}
              >
                {currentTask.createdAt}
              </Descriptions.Item>
              
              <Descriptions.Item 
                label="完成时间" 
                labelStyle={{ fontWeight: 'bold' }}
              >
                {currentTask.completedAt || '-'}
              </Descriptions.Item>
              
              <Descriptions.Item 
                label="耗时" 
                labelStyle={{ fontWeight: 'bold' }}
              >
                {formatDuration(duration)}
              </Descriptions.Item>
              
              <Descriptions.Item 
                label="文章模板" 
                labelStyle={{ fontWeight: 'bold' }}
              >
                {result.template || '-'}
              </Descriptions.Item>
              
              <Descriptions.Item 
                label="关键词" 
                labelStyle={{ fontWeight: 'bold' }}
                span={2}
              >
                {result.keywords ? 
                  <Space wrap>
                    {result.keywords.map((keyword, index) => (
                      <Tag key={index} color="blue">{keyword}</Tag>
                    ))}
                  </Space> : '-'
                }
              </Descriptions.Item>
            </Descriptions>
          </TabPane>
          
          <TabPane 
            tab={<span><FileTextOutlined />任务结果</span>} 
            key="result"
          >
            {/* 封面图类型的结果展示 */}
            {type === '封面图' && result.coverImage && (
              <Card bordered={false}>
                <div style={{ 
                  textAlign: 'center', 
                  padding: spacing.lg,
                  backgroundColor: colors.backgroundLight,
                  borderRadius: borderRadius.lg
                }}>
                  <Image 
                    src={result.coverImage} 
                    alt="封面图"
                    style={{ 
                      maxWidth: '100%',
                      borderRadius: borderRadius.md,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Text type="secondary" style={{ display: 'block', marginTop: spacing.md }}>
                    生成的封面图
                  </Text>
                </div>
              </Card>
            )}
            
            {/* 标题类型的结果展示 - 单独处理，可能有多个候选标题 */}
            {type === '标题' && (
              <div className="title-result">
                <Card 
                  bordered
                  headStyle={{ backgroundColor: colors.backgroundLight }}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <FormOutlined style={{ marginRight: spacing.sm, color: colors.primary }} />
                      <Text strong>生成的标题候选</Text>
                    </div>
                  }
                >
                  {result.generatedTitles && result.generatedTitles.length > 0 ? (
                    <List
                      itemLayout="vertical"
                      dataSource={result.generatedTitles}
                      renderItem={(title, index) => (
                        <List.Item
                          key={index}
                          style={{
                            padding: spacing.md,
                            backgroundColor: index % 2 === 0 ? colors.backgroundLight : 'white',
                            borderRadius: borderRadius.sm,
                            marginBottom: spacing.md
                          }}
                        >
                          <Row align="middle">
                            <Col span={2} style={{ textAlign: 'center' }}>
                              <Tag color={colors.primary}>{index + 1}</Tag>
                            </Col>
                            <Col span={22}>
                              <Title 
                                level={4} 
                                style={{ 
                                  margin: 0,
                                  color: index === 0 ? colors.primary : 'inherit'
                                }}
                              >
                                {title}
                              </Title>
                            </Col>
                          </Row>
                        </List.Item>
                      )}
                    />
                  ) : result.title ? (
                    <div style={{ padding: spacing.lg, textAlign: 'center' }}>
                      <Title 
                        level={3} 
                        style={{ 
                          color: colors.primary,
                          margin: `${spacing.md} 0`
                        }}
                      >
                        {result.title}
                      </Title>
                    </div>
                  ) : (
                    <Empty description="暂无标题数据" />
                  )}
                </Card>
              </div>
            )}
            
            {/* 文章内容类型的结果展示 */}
            {type === '文章内容' && (
              <div className="article-result">
                {result.summary && (
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FileTextOutlined style={{ marginRight: spacing.sm, color: colors.primary }} />
                        <Text strong>文章摘要</Text>
                      </div>
                    }
                    bordered
                    style={{ marginBottom: spacing.lg }}
                    headStyle={{ backgroundColor: colors.backgroundLight }}
                  >
                    <Paragraph 
                      style={{ 
                        fontSize: fontSizes.md,
                        lineHeight: 1.8,
                        margin: spacing.md
                      }}
                    >
                      {result.summary}
                    </Paragraph>
                  </Card>
                )}
                
                {result.content && (
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FileTextOutlined style={{ marginRight: spacing.sm, color: colors.primary }} />
                        <Text strong>文章正文</Text>
                      </div>
                    }
                    bordered
                    headStyle={{ backgroundColor: colors.backgroundLight }}
                  >
                    <div 
                      className="markdown-content" 
                      style={{ 
                        padding: spacing.lg,
                        fontSize: fontSizes.md,
                        lineHeight: 1.8
                      }}
                    >
                      <ReactMarkdown>
                        {result.content}
                      </ReactMarkdown>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </TabPane>
        </Tabs>
      </div>
    );
  };
  
  return (
    <DashboardLayout>
      <div style={{ padding: spacing.xl }}>
        <Title level={2} style={{ marginBottom: spacing.sm }}>AI任务列表</Title>
        <Text type="secondary" style={{ fontSize: fontSizes.lg, display: 'block', marginBottom: spacing.xl }}>
          管理和监控AI自动化任务
        </Text>
        
        <Divider />
        
        {/* 搜索条件区域 */}
        <div style={{ 
          backgroundColor: colors.backgroundLight,
          padding: spacing.lg,
          borderRadius: borderRadius.md,
          marginBottom: spacing.xl,
          border: `1px solid ${colors.border}`
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: spacing.md
          }}>
            <Title level={4} style={{ margin: 0 }}>搜索条件</Title>
            
            <div style={{ display: 'flex', gap: spacing.md }}>
              <Button onClick={handleClearFilters}>
                清空筛选
              </Button>
            </div>
          </div>
          
          {/* 搜索条件网格布局 - 使用Ant Design的Form和Grid */}
          <Form layout="vertical">
            <Row gutter={16}>
              {/* 完成时间范围搜索 */}
              <Col span={8}>
                <Form.Item label="完成时间范围">
                  <RangePicker
                    value={completionDateRange}
                    onChange={handleDateRangeChange}
                    style={{ width: '100%' }}
                    placeholder={['开始日期', '结束日期']}
                  />
                </Form.Item>
              </Col>
              
              {/* 状态搜索 */}
              <Col span={8}>
                <Form.Item label="任务状态">
                  <Select
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    placeholder="请选择任务状态"
                    style={{ width: '100%' }}
                    allowClear
                  >
                    <Option value="进行中">进行中</Option>
                    <Option value="已完成">已完成</Option>
                    <Option value="失败">失败</Option>
                    <Option value="排队中">排队中</Option>
                  </Select>
                </Form.Item>
              </Col>

              {/* 任务类型搜索 */}
              <Col span={8}>
                <Form.Item label="任务类型">
                  <Select
                    value={selectedType}
                    onChange={handleTypeChange}
                    placeholder="请选择任务类型"
                    style={{ width: '100%' }}
                    allowClear
                  >
                    <Option value="封面图">封面图</Option>
                    <Option value="标题">标题</Option>
                    <Option value="文章内容">文章内容</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
        
        <Table 
          columns={columns}
          dataSource={filteredTasks}
          rowKey="id"
          pagination={{ 
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            showTotal: (total) => `共 ${total} 条任务`
          }}
          bordered
          size="middle"
        />
        
        {/* 任务结果查看弹窗 */}
        <Modal
          open={isResultModalOpen}
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <EyeOutlined style={{ marginRight: spacing.sm }} />
              任务结果查看
            </div>
          }
          onCancel={handleCloseResultModal}
          footer={[
            <Button key="close" type="primary" onClick={handleCloseResultModal}>
              关闭
            </Button>
          ]}
          width={800}
          bodyStyle={{ 
            maxHeight: '75vh', 
            overflow: 'auto',
            padding: spacing.lg
          }}
        >
          {renderTaskResult()}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AITasksPage; 