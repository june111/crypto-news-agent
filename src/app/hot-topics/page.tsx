'use client';

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { 
  Input, 
  Button, 
  Table, 
  Modal, 
  Popconfirm, 
  Typography, 
  Divider,
  Row,
  Col,
  Card,
  Skeleton,
  Badge,
  Space,
  Tooltip,
  Select,
  Empty,
  Spin,
  App,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FireOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  FilterOutlined,
  ShareAltOutlined,
  EyeOutlined
} from '@ant-design/icons';
import DashboardLayout from '@/components/DashboardLayout';
import { colors } from '@/styles/theme';
import { 
  TRENDING_THRESHOLD, 
  VOLUME_COLOR, 
  DEFAULT_SOURCES,
  EXAMPLE_HOT_TOPICS,
  getVolumeColor
} from './constants';
import api from '@/lib/api-client';
import { logError, logInfo } from '@/lib/db/utils/logger';

const { Title, Text, Paragraph } = Typography;

// 延迟加载大型组件
const StatisticsCards = lazy(() => import('./components/StatisticsCards'));
// 预加载添加热点弹窗组件，提高响应速度
const AddTopicModal = React.memo(lazy(() => 
  import('./components/AddTopicModal').then(module => ({
    default: module.default
  }))
));
const TopicDetailPanel = lazy(() => import('./components/TopicDetailPanel'));

// 热点话题接口 (来自API)
interface HotTopic {
  id: string;
  keyword: string;
  volume: number;
  source?: string;
  date?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

// 热点显示接口
interface DisplayHotTopic {
  id: string;
  keyword: string;
  volume: number;
  date: string;
  source?: string;
  status?: string;
  category?: string;
}

// 加载状态组件
const LoadingComponent = () => (
  <div style={{ 
    padding: '40px', 
    textAlign: 'center',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(4px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
  }}>
    <Spin size="large" />
    <div style={{ marginTop: '16px', fontWeight: 500, opacity: 0.8 }}>加载中...</div>
  </div>
);

// 页面骨架屏
const PageSkeleton: React.FC = () => (
  <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
    <Skeleton active paragraph={{ rows: 1 }} />
    
    <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 24 }}>
      {[1, 2, 3].map(i => (
        <Col xs={24} sm={12} md={8} key={i}>
          <Card hoverable variant="borderless" style={{ borderRadius: '8px', overflow: 'hidden' }}>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        </Col>
      ))}
    </Row>
    
    <Skeleton active paragraph={{ rows: 1 }} />
    <Card 
      variant="borderless" 
      style={{ borderRadius: '8px', overflow: 'hidden' }}
    >
      <Skeleton active paragraph={{ rows: 8 }} />
    </Card>
  </div>
);

const HotTopicsPage: React.FC = () => {
  // 核心状态
  const [topics, setTopics] = useState<DisplayHotTopic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>('');
  const [volume, setVolume] = useState<number>(0);
  const [source, setSource] = useState<string>('');
  const [sourceOptions, setSourceOptions] = useState<{label: string, value: string}[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<DisplayHotTopic | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState<boolean>(false);
  const [filterSource, setFilterSource] = useState<string>('');
  
  // 使用antd的消息API
  const [messageApi, contextHolder] = message.useMessage();
  
  // 只在组件挂载时获取一次数据
  useEffect(() => {
    // 立即开始获取数据，不再有延迟
    fetchHotTopics();
    loadSourceOptions();
    
    // 预加载添加热点组件，减少点击按钮后的延迟
    const preloadAddTopicModal = () => {
      import('./components/AddTopicModal');
    };
    preloadAddTopicModal();
  }, []);
  
  // 从本地存储加载来源选项
  const loadSourceOptions = () => {
    try {
      const savedSources = localStorage.getItem('hotTopicSources');
      if (savedSources) {
        setSourceOptions(JSON.parse(savedSources));
      } else {
        // 使用常量中的默认来源
        setSourceOptions(DEFAULT_SOURCES);
        localStorage.setItem('hotTopicSources', JSON.stringify(DEFAULT_SOURCES));
      }
    } catch (error) {
      console.error('加载来源选项失败:', error);
    }
  };
  
  // 保存来源到本地存储
  const saveSourcesLocally = (updatedSources: {label: string, value: string}[]) => {
    try {
      localStorage.setItem('hotTopicSources', JSON.stringify(updatedSources));
    } catch (error) {
      console.error('保存来源选项失败:', error);
    }
  };
  
  // 获取热点话题数据
  const fetchHotTopics = async () => {
    try {
      setLoading(true);
      
      // 使用新的API客户端获取数据
      const { data, success, error: apiError } = await api.get('hot-topics');
      
      // 添加完整响应日志
      console.log('API响应原始数据:', data);
      
      if (!success || apiError) {
        throw new Error(apiError || '获取热点话题失败');
      }
      
      logInfo('获取热点话题成功', data);
      
      // 更灵活地处理数据格式
      let topicsData: any[] = [];
      
      if (Array.isArray(data)) {
        // 直接是数组格式
        console.log('数据是数组格式');
        topicsData = data;
      } else if (data && typeof data === 'object') {
        // 打印对象的所有顶级属性
        console.log('数据是对象格式，属性列表:', Object.keys(data));
        
        // API响应可能是 { topics: [...] } 格式
        if (data.topics && Array.isArray(data.topics)) {
          console.log('找到topics数组属性:', data.topics.length);
          topicsData = data.topics;
        } 
        // 可能是其他包含数组的对象格式
        else {
          const possibleArrayProps = Object.values(data).filter(val => Array.isArray(val) && val !== null);
          console.log('找到的数组属性数量:', possibleArrayProps.length);
          
          if (possibleArrayProps.length > 0) {
            // 使用找到的第一个数组
            topicsData = possibleArrayProps[0] as any[];
            console.log('使用第一个数组属性，长度:', topicsData.length);
          } else if (data && 'data' in data && (data as any).data && Array.isArray((data as any).data)) {
            // 检查是否有data属性
            console.log('使用data属性数组');
            topicsData = (data as any).data;
          } else if (data && 'items' in data && (data as any).items && Array.isArray((data as any).items)) {
            // 检查是否有items属性
            console.log('使用items属性数组');
            topicsData = (data as any).items;
          } else if (data && 'results' in data && (data as any).results && Array.isArray((data as any).results)) {
            // 检查是否有results属性
            console.log('使用results属性数组');
            topicsData = (data as any).results;
          } else if (data && 'id' in data && 'keyword' in data) {
            // 可能是单个热点对象
            console.log('数据似乎是单个对象，转换为数组');
            topicsData = [data];
          }
        }
      }
      
      console.log('解析后的topicsData:', topicsData);
      
      if (topicsData && Array.isArray(topicsData) && topicsData.length > 0) {
        console.log('开始格式化数据，样本第一项:', topicsData[0]);
        
        const formattedTopics: DisplayHotTopic[] = topicsData.map((item, index) => {
          if (!item) {
            console.warn(`第${index+1}项是undefined或null，跳过格式化`);
            return {
              id: `invalid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              keyword: '未知关键词',
              volume: 0,
              date: new Date().toISOString().split('T')[0],
              source: '未知来源',
              status: 'active'
            };
          }
          
          console.log(`格式化第${index+1}项:`, item);
          
          const formattedItem = {
            id: item.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            keyword: item.keyword || item.title || '未知关键词',
            volume: typeof item.volume !== 'undefined' ? Number(item.volume) : 
                   (typeof item.score !== 'undefined' ? Number(item.score) : 0),
            date: item.date || (item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
            source: item.source || '未知来源',
            // 前端计算status，仅用于UI显示
            status: (Number(item.volume) >= TRENDING_THRESHOLD || 
                     (typeof item.score !== 'undefined' && Number(item.score) >= TRENDING_THRESHOLD)) ? 'trending' : 'active'
          };
          
          console.log(`第${index+1}项格式化结果:`, formattedItem);
          return formattedItem;
        });
        
        console.log('格式化后的topics:', formattedTopics);
        setTopics(formattedTopics);
        console.log('成功获取热点话题数据，条数:', formattedTopics.length);
      } else {
        console.warn('API返回数据为空或格式不正确:', data);
        messageApi.warning('获取数据为空或格式不正确，将使用默认数据');
        // 使用默认的示例数据
        setTopics(EXAMPLE_HOT_TOPICS);
      }
    } catch (error) {
      logError('获取热点话题失败', error);
      messageApi.error('获取热点话题失败，使用默认数据');
      // 添加默认数据
      setTopics(EXAMPLE_HOT_TOPICS.slice(0, 2)); // 只使用前两个示例数据
    } finally {
      setLoading(false);
    }
  };
  
  // 处理删除热点话题
  const handleDeleteTopic = async (id: string) => {
    try {
      const { success, error: apiError } = await api.delete(`hot-topics/${id}`);
      
      if (!success) {
        throw new Error(apiError || '删除失败');
      }
      
      setTopics(topics.filter(topic => topic.id !== id));
      messageApi.success('热点话题已删除');
    } catch (error) {
      logError('删除热点话题失败', error);
      messageApi.error('删除热点话题失败');
    }
  };
  
  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };
  
  // 打开添加热点话题弹窗
  const handleAddHotTopic = () => {
    setIsModalVisible(true);
  };
  
  // 关闭弹窗
  const handleCloseModal = () => {
    // 重置表单数据
    setKeyword('');
    setVolume(0);
    setSource('');
    setIsModalVisible(false);
  };
  
  // 保存新热点话题
  const handleSaveHotTopic = async () => {
    if (!keyword) {
      messageApi.error('请输入关键词');
      return;
    }
    
    try {
      // 只包含数据库表中存在的字段
      const newTopic = {
        keyword,
        volume: volume, // 直接使用volume值，不进行转换
        source: source || '未知来源'
      };
      
      const { data, success, error: apiError } = await api.post('hot-topics', newTopic);
      
      if (!success || !data) {
        throw new Error(apiError || '添加热点话题失败');
      }
      
      // 添加到列表 - 在前端计算status值，但不发送到后端
      const responseData = data as any; // 类型断言
      const displayTopic: DisplayHotTopic = {
        id: responseData.id || `temp-${Date.now()}`,
        keyword: responseData.keyword || keyword,
        volume: responseData.volume !== undefined ? responseData.volume : volume,
        date: new Date().toISOString().split('T')[0],
        source: responseData.source || source || '未知来源',
        // 前端计算status，仅用于UI显示
        status: (responseData.volume !== undefined ? responseData.volume : volume) >= TRENDING_THRESHOLD ? 'trending' : 'active'
      };
      
      setTopics([displayTopic, ...topics]);
      messageApi.success('热点话题已添加');
      handleCloseModal();
      
    } catch (error) {
      logError('添加热点话题失败', error);
      messageApi.error(`添加热点话题失败: ${error instanceof Error ? error.message : '未知错误'}`);
      // 不关闭弹窗，允许用户重试
    }
  };
  
  // 查看热点话题详情
  const handleViewTopic = (record: DisplayHotTopic) => {
    setSelectedTopic(record);
    setIsDetailVisible(true);
  };
  
  // 关闭详情面板
  const handleCloseDetail = () => {
    setIsDetailVisible(false);
    setSelectedTopic(null);
  };
  
  // 表格列定义
  const columns: ColumnsType<DisplayHotTopic> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => (
        <div style={{ padding: '2px 0' }}>{date}</div>
      ),
      sorter: (a, b) => a.date.localeCompare(b.date),
      defaultSortOrder: 'descend',
    },
    {
      title: '热点关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (text: string, record: DisplayHotTopic) => (
        <div 
          className="hot-topic-keyword"
          onClick={() => handleViewTopic(record)}
          style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          {record.status === 'trending' && 
            <FireOutlined style={{ 
              color: '#f5222d', 
              marginRight: 6,
              animation: 'pulse 1.5s infinite'
            }} />
          }
          <Text>
            {text}
          </Text>
        </div>
      ),
      sorter: (a, b) => a.keyword.localeCompare(b.keyword),
    },
    {
      title: '搜索量',
      dataIndex: 'volume',
      key: 'volume',
      width: 120,
      render: (volume: number) => (
        <Text>
          {volume.toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => a.volume - b.volume,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: string) => (
        <Text style={{ 
          display: 'inline-block',
          padding: '2px 8px',
          background: '#f0f2f5',
          borderRadius: '12px',
          fontSize: '12px'
        }}>
          {source || '未知来源'}
        </Text>
      ),
      sorter: (a, b) => (a.source || '').localeCompare(b.source || ''),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: DisplayHotTopic) => (
        <Space size="middle" onClick={(e) => e.stopPropagation()}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              handleViewTopic(record);
            }}
            size="small"
            style={{ color: '#1890ff' }}
          />
        <Popconfirm
          title="确认删除"
          description={`确定要删除"${record.keyword}"关键词吗？此操作无法撤销。`}
            onConfirm={(e) => {
              handleDeleteTopic(record.id);
            }}
            okText="确认"
          cancelText="取消"
          okButtonProps={{ danger: true }}
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              onClick={(e) => e.stopPropagation()} // 阻止删除按钮的点击事件冒泡
            />
        </Popconfirm>
        </Space>
      ),
    },
  ];
  
  // 筛选后的数据
  const filteredData = useMemo(() => {
    let filtered = topics;
    
    // 按关键词筛选
    if (searchKeyword) {
      filtered = filtered.filter(topic => 
        topic.keyword.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }
    
    // 按来源筛选
    if (filterSource) {
      filtered = filtered.filter(topic => 
        topic.source === filterSource
      );
    }
    
    return filtered;
  }, [topics, searchKeyword, filterSource]);
  
  // 获取当前所有来源的唯一值，用于筛选下拉框
  const sourceFilterOptions = useMemo(() => {
    if (!Array.isArray(topics) || topics.length === 0) {
      return [];
    }
    const uniqueSources = Array.from(new Set(topics.map(topic => topic.source)));
    return uniqueSources
      .filter(source => !!source)
      .map(source => ({
        label: source,
        value: source
      }));
  }, [topics]);
  
  // 行样式配置
  const getRowClassName = (record: DisplayHotTopic) => {
    return ''; // 移除行背景色标记
  };
  
  // 统计数据 - 使用常量判断热门话题
  const statistics = useMemo(() => {
    if (!Array.isArray(topics) || topics.length === 0) {
      return { 
        todayTotal: 0, 
        todayTrending: 0, 
        todayMaxVolume: 0,
        trendingThreshold: TRENDING_THRESHOLD
      };
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todayTopics = topics.filter(t => t.date === today);
    
    // 使用常量判断热门话题
    const todayTrending = todayTopics.filter(t => t.volume >= TRENDING_THRESHOLD).length;
    const todayMaxVolume = todayTopics.length > 0 ? Math.max(...todayTopics.map(t => t.volume)) : 0;
    
    return {
      todayTotal: todayTopics.length,
      todayTrending,
      todayMaxVolume,
      trendingThreshold: TRENDING_THRESHOLD
    };
  }, [topics]);
  
  return (
    <DashboardLayout>
      {contextHolder}
      <div style={{ 
        animation: 'fadeIn 0.3s ease-in-out',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ marginBottom: 24 }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <div>
                <Title level={2} style={{ margin: 0 }}>热点列表</Title>
                <Text type="secondary">
                  跟踪和管理加密货币相关热点话题，了解最新趋势
                </Text>
              </div>
            </Col>
            <Col>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddHotTopic}
                size="large"
                style={{ 
                  borderRadius: '6px',
                  boxShadow: '0 2px 0 rgba(0, 0, 0, 0.045)'
                }}
              >
                添加热点
              </Button>
            </Col>
          </Row>
        </div>
        
        {/* 统计卡片区域 - 加载中状态 */}
        {loading ? (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {[1, 2, 3].map(i => (
              <Col xs={24} sm={8} key={i}>
                <Card variant="borderless" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                  <Skeleton active paragraph={{ rows: 1 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Suspense fallback={<Skeleton active paragraph={{ rows: 1 }} />}>
            <StatisticsCards statistics={statistics} />
          </Suspense>
        )}
        
        <Divider style={{ margin: '24px 0' }} />
        
        {/* 搜索区域 */}
        <Card 
          style={{ 
            marginBottom: 16,
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
          }}
          variant="borderless"
        >
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Input
                placeholder="搜索热点关键词..."
                prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
                onChange={handleSearch}
                allowClear
                size="large"
                style={{ borderRadius: '6px' }}
              />
            </Col>
            <Col style={{ width: 200 }}>
              <Select
                placeholder="选择来源筛选"
                style={{ width: '100%' }}
                allowClear
                size="large"
                options={sourceFilterOptions}
                onChange={(value) => setFilterSource(value || '')}
                value={filterSource || undefined}
              />
            </Col>
          </Row>
        </Card>
        
        {/* 表格区域 */}
        <Card 
          variant="borderless" 
          style={{ 
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
          }}
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 10 }} />
          ) : (
            <Table 
              rowKey="id"
              dataSource={filteredData}
              columns={columns}
              loading={loading}
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total) => `共 ${total} 条热点数据`,
                style: { marginTop: 16 }
              }}
              rowClassName={getRowClassName}
              locale={{
                emptyText: <Empty 
                  description={searchKeyword ? '没有找到匹配的热点数据' : '暂无热点数据'} 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              }}
              className="hot-topics-table"
              onRow={(record) => ({
                onClick: () => handleViewTopic(record),
                style: { cursor: 'pointer' }
              })}
            />
          )}
        </Card>
        
        {/* 热点话题详情抽屉 */}
        {isDetailVisible && selectedTopic && (
        <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FireOutlined style={{ color: getVolumeColor(selectedTopic.volume) }} />
                <span>热点话题详情</span>
              </div>
            }
            open={isDetailVisible}
            onCancel={handleCloseDetail}
            footer={null}
            width={600}
            style={{ top: 20 }}
            destroyOnClose
          >
            <Suspense fallback={<LoadingComponent />}>
              <TopicDetailPanel topic={selectedTopic} />
            </Suspense>
          </Modal>
        )}
        
        {/* 添加热点话题弹窗 - 始终渲染但保持隐藏状态，避免点击时的延迟 */}
        <Suspense fallback={<LoadingComponent />}>
          <AddTopicModal
            visible={isModalVisible}
            onClose={handleCloseModal}
            onSave={handleSaveHotTopic}
            sourceOptions={sourceOptions}
            setSourceOptions={setSourceOptions}
            saveSourcesLocally={saveSourcesLocally}
            keyword={keyword}
            setKeyword={setKeyword}
            volume={volume}
            setVolume={setVolume}
            source={source}
            setSource={setSource}
            trendingThreshold={TRENDING_THRESHOLD}
          />
        </Suspense>
        
        <style jsx global>{`
          @keyframes pulse {
            0% {
              opacity: 1;
            }
            50% {
              opacity: 0.6;
            }
            100% {
              opacity: 1;
            }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          .ant-table-cell {
            padding: 12px 16px !important;
          }
          
          /* 简约表格样式 */
          .hot-topics-table .ant-table {
            background-color: white;
            border-radius: 8px;
          }
          
          .hot-topics-table .ant-table-thead > tr > th {
            background-color: #fafafa;
            font-weight: 500;
            color: rgba(0, 0, 0, 0.65);
          }
          
          .hot-topics-table .ant-table-tbody > tr > td {
            border-bottom: 1px solid #f0f0f0;
          }
          
          .hot-topics-table .ant-table-tbody > tr:hover > td {
            background-color: transparent;
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
};

export default HotTopicsPage; 