'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Tag, 
  Space, 
  Typography, 
  Modal, 
  message,
  Row,
  Col,
  Select,
  Form,
  DatePicker,
  Card,
  Descriptions,
  Spin,
  Badge,
  Divider
} from 'antd';
import { 
  ReloadOutlined, 
  EyeOutlined, 
  SearchOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { DifyClient } from '@/lib/services/dify/client';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Dify工作流日志接口响应类型
interface DifyWorkflowLog {
  id: string;
  workflow_run: {
    id: string;
    version: string | number;
    status: string; // 'succeeded' | 'failed' | 'running' | 'queued'
    elapsed_time: number;
    total_tokens: number;
    total_steps?: number;
    created_at: number | string;
    finished_at?: number;
    error?: string | null;
    exceptions_count?: number;
  };
  created_from?: string;
  created_by_role?: string;
  created_by_account?: any;
  created_by_end_user?: {
    id: string;
    type: string;
    is_anonymous: boolean;
    session_id: string;
  };
  created_at?: number;
  user?: {
    id: string;
    name: string;
  };
}

interface DifyWorkflowLogsResponse {
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
  data: DifyWorkflowLog[];
  success: boolean;
}

const DifyTasksComponent: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [tasks, setTasks] = useState<DifyWorkflowLog[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<DifyWorkflowLog | null>(null);

  // 获取任务列表
  const fetchTasks = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      // 构建查询参数
      const params: any = {
        page,
        limit
      };
      
      // 添加筛选条件
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      
      if (selectedStatus) {
        params.status = selectedStatus;
      }
      
      if (selectedUser) {
        params.user = selectedUser;
      }
      
      console.log('正在获取工作流日志，参数:', params);
      
      // 使用DifyClient获取工作流日志
      const response = await DifyClient.getWorkflowLogs(params);
      
      console.log('接收到工作流日志响应:', response);
      
      if (response.success) {
        // 确保数据是数组
        const responseData = Array.isArray(response.data) ? response.data : [];
        console.log('处理后的数据:', responseData);
        
        setTasks(responseData);
        setPagination({
          current: response.page || 1,
          pageSize: response.limit || 10,
          total: response.total || 0,
        });
      } else {
        message.error('获取任务列表失败: ' + (response.error || '未知错误'));
        // 确保在错误情况下tasks也是数组
        setTasks([]);
      }
    } catch (error) {
      console.error('获取任务列表异常:', error);
      message.error('获取任务列表异常');
      // 确保在异常情况下tasks也是数组
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和筛选条件变更时获取任务
  useEffect(() => {
    fetchTasks(pagination.current, pagination.pageSize);
  }, []);
  
  // 处理筛选条件变更
  const handleFilter = () => {
    fetchTasks(1, pagination.pageSize);
  };

  // 处理表格分页变化
  const handleTableChange = (newPagination: any) => {
    fetchTasks(newPagination.current, newPagination.pageSize);
  };

  // 查看任务详情
  const handleViewDetails = (task: DifyWorkflowLog) => {
    setCurrentTask(task);
    setDetailModalVisible(true);
  };

  // 转换状态为展示文本
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'succeeded':
        return '已完成';
      case 'failed':
        return '失败';
      case 'running':
        return '进行中';
      case 'queued':
        return '排队中';
      default:
        return '未知';
    }
  };

  // 获取状态对应的标签样式
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge status="success" text="已完成" />;
      case 'failed':
        return <Badge status="error" text="失败" />;
      case 'running':
        return <Badge status="processing" text="进行中" />;
      case 'queued':
        return <Badge status="default" text="排队中" />;
      default:
        return <Badge status="default" text="未知" />;
    }
  };

  // 时间戳转换为日期时间字符串
  const formatTimestamp = (timestamp: string | number): string => {
    if (typeof timestamp === 'string') {
      // ISO日期字符串
      return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
    } else if (typeof timestamp === 'number') {
      // Unix时间戳（秒）
      return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm:ss');
    }
    return '无效时间';
  };

  // 表格列定义
  const columns: ColumnsType<DifyWorkflowLog> = [
    {
      title: 'ID',
      dataIndex: ['workflow_run', 'id'],
      key: 'id',
      width: 220,
      ellipsis: true,
    },
    {
      title: '用户',
      dataIndex: ['created_by_end_user', 'session_id'],
      key: 'user',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: ['workflow_run', 'status'],
      key: 'status',
      width: 100,
      render: (status) => getStatusBadge(status),
    },
    {
      title: '创建时间',
      dataIndex: ['workflow_run', 'created_at'],
      key: 'created_at',
      width: 180,
      render: (timestamp) => formatTimestamp(timestamp),
    },
    {
      title: '完成时间',
      dataIndex: ['workflow_run', 'finished_at'],
      key: 'finished_at',
      width: 180,
      render: (timestamp) => timestamp ? formatTimestamp(timestamp) : '-',
    },
    {
      title: '耗时(秒)',
      dataIndex: ['workflow_run', 'elapsed_time'],
      key: 'elapsed_time',
      width: 100,
      render: (time) => time ? time.toFixed(2) : '-',
    },
    {
      title: '令牌数',
      dataIndex: ['workflow_run', 'total_tokens'],
      key: 'total_tokens',
      width: 100,
    },
    {
      title: '步骤数',
      dataIndex: ['workflow_run', 'total_steps'],
      key: 'total_steps',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<EyeOutlined />} 
          size="small" 
          onClick={() => handleViewDetails(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  // 渲染任务详情弹窗
  const renderTaskDetailModal = () => {
    if (!currentTask) return null;
    
    return (
      <Modal
        title="任务详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <Card>
          <Descriptions title="基本信息" bordered>
            <Descriptions.Item label="工作流ID" span={3}>
              {currentTask.workflow_run.id}
            </Descriptions.Item>
            <Descriptions.Item label="版本">
              {currentTask.workflow_run.version}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {getStatusBadge(currentTask.workflow_run.status)}
            </Descriptions.Item>
            <Descriptions.Item label="异常数">
              {currentTask.workflow_run.exceptions_count || 0}
            </Descriptions.Item>
            <Descriptions.Item label="耗时(秒)">
              {currentTask.workflow_run.elapsed_time.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="令牌数">
              {currentTask.workflow_run.total_tokens}
            </Descriptions.Item>
            <Descriptions.Item label="步骤数">
              {currentTask.workflow_run.total_steps || 0}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Descriptions title="用户信息" bordered>
            <Descriptions.Item label="用户ID">
              {currentTask.created_by_end_user?.id || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="用户类型">
              {currentTask.created_by_end_user?.type || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="会话ID">
              {currentTask.created_by_end_user?.session_id || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="匿名用户">
              {currentTask.created_by_end_user?.is_anonymous ? '是' : '否'}
            </Descriptions.Item>
            <Descriptions.Item label="创建来源">
              {currentTask.created_from || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="创建角色">
              {currentTask.created_by_role || '无'}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Descriptions title="时间信息" bordered>
            <Descriptions.Item label="创建时间">
              {formatTimestamp(currentTask.workflow_run.created_at)}
            </Descriptions.Item>
            <Descriptions.Item label="完成时间">
              {currentTask.workflow_run.finished_at ? formatTimestamp(currentTask.workflow_run.finished_at) : '-'}
            </Descriptions.Item>
          </Descriptions>

          {currentTask.workflow_run.error && (
            <>
              <Divider />
              <Card title="错误信息" type="inner" style={{ marginTop: 16 }}>
                <pre style={{ whiteSpace: 'pre-wrap', color: 'red' }}>
                  {currentTask.workflow_run.error}
                </pre>
              </Card>
            </>
          )}
        </Card>
      </Modal>
    );
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card>
            <Title level={4}>Dify AI任务列表</Title>
            <Text type="secondary">
              查看所有通过Dify执行的AI任务，包括生成状态、执行时间和结果。
            </Text>

            <Space style={{ marginTop: 16, marginBottom: 16 }} size="large">
              <Form layout="inline">
                <Form.Item label="日期范围">
                  <RangePicker
                    value={dateRange}
                    onChange={(dates) => setDateRange(dates)}
                  />
                </Form.Item>
                
                <Form.Item label="状态">
                  <Select
                    style={{ width: 120 }}
                    value={selectedStatus}
                    onChange={(value) => setSelectedStatus(value)}
                    allowClear
                    placeholder="选择状态"
                  >
                    <Option value="succeeded">已完成</Option>
                    <Option value="failed">失败</Option>
                    <Option value="running">进行中</Option>
                    <Option value="queued">排队中</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item label="用户">
                  <Select
                    style={{ width: 150 }}
                    value={selectedUser}
                    onChange={(value) => setSelectedUser(value)}
                    allowClear
                    placeholder="选择用户"
                  >
                    <Option value="test-user-001">test-user-001</Option>
                    <Option value="test-user-002">test-user-002</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    type="primary" 
                    icon={<SearchOutlined />}
                    onClick={handleFilter}
                  >
                    查询
                  </Button>
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setDateRange(null);
                      setSelectedStatus('');
                      setSelectedUser('');
                      fetchTasks(1, pagination.pageSize);
                    }}
                  >
                    重置
                  </Button>
                </Form.Item>
              </Form>
            </Space>

            <Table
              columns={columns}
              dataSource={tasks}
              rowKey={record => {
                // 确保所有记录都有唯一id
                if (!record || !record.id) {
                  console.warn('记录缺少id:', record);
                  return Math.random().toString(36).substring(2, 9);
                }
                return record.id;
              }}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              onChange={handleTableChange}
              loading={loading}
              scroll={{ x: 1300 }}
            />
          </Card>
        </Col>
      </Row>

      {renderTaskDetailModal()}
    </div>
  );
};

export default DifyTasksComponent; 