'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Input, 
  Button, 
  Table, 
  Modal, 
  message, 
  Popconfirm, 
  Typography, 
  Divider,
  Row,
  Col,
  Card,
  Skeleton,
  Badge,
  Statistic,
  Space,
  Progress,
  Tag,
  Tooltip,
  Select,
  Collapse,
  Empty,
  Alert,
  Spin
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FireOutlined,
  DeleteOutlined,
  RiseOutlined,
  LineChartOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  FileExcelOutlined,
  ExportOutlined,
  BulbOutlined,
  LinkOutlined,
  TwitterOutlined,
  ReadOutlined,
  CommentOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import DashboardLayout from '@/components/DashboardLayout';
import { fontSizes, spacing, colors } from '@/styles/theme';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// 热点话题接口 (来自API)
interface HotTopic {
  id: string;
  keyword: string;       // 从title改为keyword
  volume: number;        // 从score改为volume
  source?: string;  
  date?: string;         // 新增日期字段
  status?: string;
  created_at: string;
  updated_at: string;
}

// 热点显示接口
interface DisplayHotTopic {
  id: string;
  keyword: string;       // 从title改为keyword
  volume: number;        // 从score改为volume
  date: string;
  source?: string;
  status?: string;
  category?: string;     // 保留兼容性
}

// 模拟数据
const mockTopics: DisplayHotTopic[] = [
  {
    id: '1',
    keyword: '比特币突破70000美元',
    volume: 12580,
    date: new Date().toISOString().split('T')[0],
    status: 'trending',
    source: '币安',
    category: '市场行情'
  },
  {
    id: '2',
    keyword: 'DeFi总锁仓量突破100亿美元',
    volume: 9452,
    date: new Date().toISOString().split('T')[0],
    status: 'trending',
    source: 'CoinGecko',
    category: 'DeFi'
  },
  {
    id: '3',
    keyword: '以太坊2.0质押率突破25%',
    volume: 7830,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    status: 'active',
    source: '推特',
    category: '技术发展'
  },
  {
    id: '4',
    keyword: '美国SEC批准比特币现货ETF',
    volume: 5680,
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    status: 'active',
    source: '新闻',
    category: '政策监管'
  },
  {
    id: '5',
    keyword: 'FTX债权人获偿计划公布',
    volume: 3420,
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    status: 'active',
    source: '社交媒体',
    category: '交易所'
  },
  {
    id: '6',
    keyword: '新型稳定币机制引发争议',
    volume: 2150,
    date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    status: 'active',
    source: '论坛',
    category: '稳定币'
  },
  {
    id: '7',
    keyword: '比特币减半倒计时30天',
    volume: 8760,
    date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    status: 'trending',
    source: '研究报告',
    category: '区块链'
  },
  {
    id: '8',
    keyword: '加密支付在拉美国家普及率提升',
    volume: 1890,
    date: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0],
    status: 'active',
    source: '行业分析',
    category: '支付'
  }
];

// 获取颜色基于搜索量 - 性能优化：使用函数而不是内联计算
const getVolumeColor = (volume: number): string => {
  if (volume >= 10000) return '#f5222d'; // 热门
  if (volume >= 5000) return '#fa8c16';  // 较热
  if (volume >= 2000) return '#52c41a';  // 普通
  return '#1890ff';                      // 一般
};

// 获取颜色说明文本
const getVolumeColorDescription = (): string => {
  return `颜色区分标准：
  • 红色：10000次以上（热门）
  • 橙色：5000-9999次（较热）
  • 绿色：2000-4999次（普通）
  • 蓝色：2000次以下（一般）`;
};

// 获取来源图标
const getSourceIcon = (source?: string): React.ReactNode => {
  if (!source) return null;
  
  const sourceLower = source.toLowerCase();
  
  // 根据来源类型返回不同图标
  if (sourceLower.includes('币安') || sourceLower === 'binance') 
    return <TwitterOutlined style={{ color: '#F0B90B', marginRight: 4 }} />;
  if (sourceLower.includes('推特') || sourceLower === 'twitter') 
    return <TwitterOutlined style={{ color: '#1DA1F2', marginRight: 4 }} />;
  if (sourceLower.includes('coingecko')) 
    return <TwitterOutlined style={{ color: '#8DC63F', marginRight: 4 }} />;
  if (sourceLower.includes('coinmarketcap')) 
    return <TwitterOutlined style={{ color: '#17181B', marginRight: 4 }} />;
  if (sourceLower.includes('社交媒体')) 
    return <TwitterOutlined style={{ color: '#1DA1F2', marginRight: 4 }} />;
  if (sourceLower.includes('新闻')) 
    return <ReadOutlined style={{ color: '#722ed1', marginRight: 4 }} />;
  if (sourceLower.includes('论坛')) 
    return <CommentOutlined style={{ color: '#13c2c2', marginRight: 4 }} />;
  if (sourceLower.includes('研究')) 
    return <FileTextOutlined style={{ color: '#fa8c16', marginRight: 4 }} />;
  
  // 默认图标
  return <LinkOutlined style={{ color: '#8c8c8c', marginRight: 4 }} />;
};

// 来源渲染组件
const SourceCell: React.FC<{ source?: string }> = React.memo(({ source }) => {
  if (!source) return <Text type="secondary">未知来源</Text>;
  
  return (
    <Space>
      {getSourceIcon(source)}
      <Text>{source}</Text>
    </Space>
  );
});

// 状态标签组件 - 提取为单独组件优化渲染
const StatusTag: React.FC<{ status: string | undefined }> = React.memo(({ status }) => {
  if (!status) return null;
  
  type StatusConfigType = {
    color: string;
    text: string;
    icon?: React.ReactNode;
  };
  
  const statusConfig: Record<string, StatusConfigType> = {
    active: { color: 'blue', icon: <LineChartOutlined />, text: '活跃' },
    trending: { color: 'red', icon: <RiseOutlined />, text: '热门' },
    archived: { color: 'default', text: '归档' }
  };
  
  const config = statusConfig[status] || { color: 'default', text: status };
  
  return (
    <Tag color={config.color} icon={config.icon}>
      {config.text}
    </Tag>
  );
});

// 热点关键词渲染组件
const KeywordCell: React.FC<{ text: string; record: DisplayHotTopic }> = React.memo(({ text, record }) => {
  const isTrending = record.status === 'trending';
  
  return (
    <Space>
      {isTrending && <FireOutlined style={{ color: '#f5222d' }} />}
      <Text strong={isTrending}>{text}</Text>
    </Space>
  );
});

// 页面骨架屏组件
const PageSkeleton: React.FC = () => (
  <div style={{ padding: spacing.xl }}>
    <Skeleton
      active
      title={{ width: '30%' }}
      paragraph={{ rows: 1, width: ['60%'] }}
      style={{ marginBottom: spacing.xl }}
    />
    
    {/* 统计卡片骨架 */}
    <Row gutter={16} style={{ marginBottom: spacing.xl }}>
      {[1, 2, 3].map(i => (
        <Col span={8} key={i}>
          <Card>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        </Col>
      ))}
    </Row>
    
    {/* 搜索区域骨架 */}
    <Card style={{ marginBottom: spacing.lg }}>
      <Row gutter={16}>
        <Col flex="auto">
          <Skeleton.Input active style={{ width: '100%', height: 40 }} />
        </Col>
        <Col>
          <Skeleton.Button active style={{ width: 120, height: 40 }} />
        </Col>
      </Row>
    </Card>
    
    {/* 表格骨架 */}
    <Card>
      <Table 
        columns={[
          { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
          { title: '关键词', dataIndex: 'keyword', key: 'keyword' },
          { title: '来源', dataIndex: 'source', key: 'source', width: 200 },
          { title: '搜索量', dataIndex: 'volume', key: 'volume', width: 200 },
          { title: '管理', dataIndex: 'action', key: 'action', width: 100 },
        ]}
        dataSource={[]}
        locale={{ emptyText: <Skeleton active paragraph={{ rows: 4 }} /> }}
        pagination={false}
      />
    </Card>
  </div>
);

// 使用React.memo优化组件重渲染
const HotTopicsPage: React.FC = () => {
  // 热点数据状态
  const [hotTopics, setHotTopics] = useState<DisplayHotTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 页面加载状态
  const [pageReady, setPageReady] = useState(false);
  
  // 弹窗表单状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newVolume, setNewVolume] = useState<number | ''>('');
  const [newSource, setNewSource] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // 类别选项
  const categoryOptions = [
    { label: '加密货币', value: '加密货币' },
    { label: 'NFT', value: 'NFT' },
    { label: 'DeFi', value: 'DeFi' },
    { label: '监管', value: '监管' },
    { label: '元宇宙', value: '元宇宙' },
    { label: '安全', value: '安全' },
    { label: '企业应用', value: '企业应用' },
    { label: '其他', value: '其他' },
  ];
  
  // 来源选项 - 使用useState管理，以便动态添加
  const [sourceOptions, setSourceOptions] = useState<{ label: string; value: string }[]>([
    { label: '推特', value: '推特' },
    { label: '币安', value: '币安' },
    { label: 'CoinMarketCap', value: 'CoinMarketCap' },
    { label: 'CoinGecko', value: 'CoinGecko' },
    { label: '社交媒体', value: '社交媒体' },
    { label: '新闻', value: '新闻' },
    { label: '论坛', value: '论坛' },
    { label: '研究报告', value: '研究报告' },
    { label: '行业分析', value: '行业分析' }
  ]);
  
  // 从本地存储加载用户添加的来源
  useEffect(() => {
    try {
      const savedSources = localStorage.getItem('hotTopicSources');
      if (savedSources) {
        const parsedSources = JSON.parse(savedSources);
        if (Array.isArray(parsedSources) && parsedSources.length > 0) {
          // 合并默认来源和保存的来源，避免重复
          const defaultValues = sourceOptions.map(option => option.value.toLowerCase());
          const newSources = parsedSources.filter(
            (source: {value: string}) => !defaultValues.includes(source.value.toLowerCase())
          );
          
          if (newSources.length > 0) {
            setSourceOptions(prev => [...prev, ...newSources]);
          }
        }
      }
    } catch (error) {
      console.error('加载保存的来源失败:', error);
    }
  }, []);
  
  // 保存来源到本地存储
  const saveSourcesLocally = (updatedSources: {label: string, value: string}[]) => {
    try {
      localStorage.setItem('hotTopicSources', JSON.stringify(updatedSources));
    } catch (error) {
      console.error('保存来源到本地存储失败:', error);
    }
  };
  
  // 获取热点话题数据
  const fetchHotTopics = async () => {
    try {
      setLoading(true);
      
      // 使用真实API获取数据
      console.log('正在从API获取热点数据...');
      const response = await fetch('/api/hot-topics');
      if (!response.ok) {
        console.error('获取热点列表失败，状态码:', response.status);
        const errorText = await response.text();
        console.error('错误详情:', errorText);
        throw new Error('获取热点列表失败');
      }
      
      const data = await response.json();
      console.log('从API获取的热点数据:', data);
      
      // 格式化数据
      const formattedTopics: DisplayHotTopic[] = data.topics.map((topic: HotTopic) => ({
        id: topic.id,
        keyword: topic.keyword,
        volume: topic.volume || 0,
        date: topic.date || new Date(topic.created_at).toISOString().split('T')[0],
        source: topic.source,
        status: topic.status,
        category: '加密货币' // 默认类别
      }));
      
      console.log('格式化后的热点数据:', formattedTopics);
      setHotTopics(formattedTopics);
      
      // 如果没有获取到数据，显示模拟数据（可选）
      if (formattedTopics.length === 0) {
        console.log('API返回的数据为空，使用模拟数据');
        //setHotTopics(mockTopics);
      }
    } catch (error) {
      console.error('获取热点列表失败:', error);
      message.error('获取热点列表失败，请重试');
      
      // 错误时可以使用模拟数据（可选）
      //setHotTopics(mockTopics);
    } finally {
      setLoading(false);
      setPageReady(true); // 设置页面准备就绪
    }
  };
  
  // 首次加载时获取数据
  useEffect(() => {
    // 设置一个短暂的延迟，模拟页面组件加载时间
    const timer = setTimeout(() => {
      setPageReady(false); // 初始化加载状态
      fetchHotTopics();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // 处理删除热点
  const handleDeleteTopic = async (id: string) => {
    try {
      console.log('正在删除热点:', id);
      const response = await fetch(`/api/hot-topics/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        console.error('删除热点失败，状态码:', response.status);
        const errorText = await response.text();
        console.error('错误详情:', errorText);
        throw new Error('删除热点失败');
      }
      
      // 从本地状态中移除热点
      setHotTopics(hotTopics.filter(topic => topic.id !== id));
      
      // 显示删除成功提示
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败，请重试');
      console.error('删除热点失败:', error);
    }
  };
  
  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };
  
  // 处理添加热点
  const handleAddHotTopic = () => {
    setIsModalOpen(true);
  };
  
  // 处理关闭弹窗
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewKeyword('');
    setNewVolume('');
    setNewSource('');
    setCustomSource('');
    setIsSaving(false);
  };
  
  // 处理保存
  const handleSaveHotTopic = async () => {
    console.log('保存热点话题开始...');
    console.log('关键词:', newKeyword);
    console.log('搜索量:', newVolume);
    console.log('来源:', newSource);

    // 验证输入
    if (!newKeyword.trim()) {
      message.error('请输入关键词');
      return;
    }

    if (isNaN(Number(newVolume)) || Number(newVolume) <= 0) {
      message.error('请输入有效的搜索量');
      return;
    }

    try {
      // 设置保存状态
      setIsSaving(true);
      console.log('开始API调用...');

      // 构建请求数据
      const hotTopic = {
        keyword: newKeyword.trim(),
        volume: Number(newVolume),
        source: newSource || '未知来源',
        date: new Date().toISOString().split('T')[0]
      };
      console.log('请求数据:', hotTopic);

      // 发送请求
      const response = await fetch('/api/hot-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hotTopic),
      });
      
      console.log('API响应状态:', response.status, response.statusText);

      // 获取响应内容，无论成功失败
      const responseText = await response.text();
      console.log('API响应内容:', responseText);
      
      // 尝试解析为JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('响应不是有效的JSON:', responseText);
      }
      
      if (!response.ok) {
        // 提取错误信息
        const errorMessage = responseData?.error || `保存失败: ${response.status}`;
        console.error('API错误响应:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('API响应成功，正在解析数据...');
      const newTopic = responseData;
      console.log('收到的新热点数据:', newTopic);
      
      // 显示成功消息
      message.success({
        content: '热点话题保存成功',
        duration: 2,
      });

      // 重置表单并关闭弹窗
      setNewKeyword('');
      setNewVolume('');
      setNewSource('');
      setCustomSource('');
      setIsModalOpen(false);

      // 重新加载数据
      fetchHotTopics();
    } catch (error) {
      console.error('保存热点话题出错:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : '未知错误，请稍后再试';
      
      // 显示错误消息
      message.error({
        content: `保存失败: ${errorMessage}`,
        duration: 3,
        icon: <ExclamationCircleOutlined style={{ color: 'red' }} />
      });
      
      // 在错误区域内显示错误信息
      if (document.getElementById('error-message-container')) {
        try {
          const alertDiv = document.createElement('div');
          alertDiv.id = 'error-alert';
          document.getElementById('error-message-container')?.appendChild(alertDiv);
          
          createRoot(alertDiv).render(
            <Alert 
              message="保存失败" 
              description={errorMessage} 
              type="error" 
              showIcon 
              closable 
            />
          );
        } catch (renderError) {
          console.error('渲染错误消息时失败:', renderError);
        }
      }
    } finally {
      setIsSaving(false);
      console.log('保存热点话题流程结束');
    }
  };
  
  // 处理新关键词变化
  const handleNewKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewKeyword(e.target.value);
  };
  
  // 处理新搜索量变化
  const handleNewVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewVolume(e.target.value === '' ? '' : Number(e.target.value));
  };
  
  // 处理来源变化
  const handleNewSourceChange = (value: string) => {
    setNewSource(value);
  };
  
  // 处理来源搜索/输入
  const handleSourceSearch = (value: string) => {
    setCustomSource(value);
  };
  
  // 处理添加新来源
  const handleAddSource = () => {
    if (!customSource.trim()) return;
    
    // 转换为标准格式
    const formattedSource = customSource.trim();
    
    // 检查是否已存在
    const exists = sourceOptions.some(
      option => option.value.toLowerCase() === formattedSource.toLowerCase()
    );
    
    if (!exists) {
      // 添加新来源
      const updatedSources = [
        ...sourceOptions,
        { label: formattedSource, value: formattedSource }
      ];
      setSourceOptions(updatedSources);
      
      // 保存到本地存储
      saveSourcesLocally(updatedSources);
      
      message.success(`已添加新来源: ${formattedSource}`);
    }
    
    // 无论是否存在，都设置为当前选择的来源
    setNewSource(formattedSource);
    setCustomSource('');
  };
  
  // 使用useMemo优化过滤计算，避免不必要的重新计算
  const filteredTopics = useMemo(() => {
    return hotTopics.filter(topic => {
      const keyword = topic.keyword || '';
      return keyword.toLowerCase().includes((searchKeyword || '').toLowerCase());
    });
  }, [hotTopics, searchKeyword]);
  
  // 使用useMemo计算统计数据，避免重复计算
  const statistics = useMemo(() => {
    if (hotTopics.length === 0) return { todayTotal: 0, todayTrending: 0, todayMaxVolume: 0 };
    
    const today = new Date().toISOString().split('T')[0];
    const todayTopics = hotTopics.filter(t => t.date === today);
    
    // 热门话题标准：搜索量超过8000次
    const todayTrending = todayTopics.filter(t => t.volume >= 8000).length;
    const todayMaxVolume = todayTopics.length > 0 ? Math.max(...todayTopics.map(t => t.volume)) : 0;
    
    return {
      todayTotal: todayTopics.length,
      todayTrending,
      todayMaxVolume
    };
  }, [hotTopics]);
  
  // 定义表格列
  const columns: ColumnsType<DisplayHotTopic> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a, b) => {
        // 使用字符串比较排序日期，因为日期格式为 YYYY-MM-DD
        return a.date.localeCompare(b.date);
      },
      defaultSortOrder: 'descend',
    },
    {
      title: '关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (text, record) => <KeywordCell text={text} record={record} />,
    },
    {
      title: (
        <Space>
          <span>搜索量</span>
          <Tooltip title={
            <div>
              <p>进度条显示相对于当日最高搜索量的百分比</p>
              <p style={{ marginTop: '8px', marginBottom: 0 }}>{getVolumeColorDescription()}</p>
            </div>
          }>
            <InfoCircleOutlined style={{ fontSize: '14px', color: '#1890ff' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'volume',
      key: 'volume',
      width: 200,
      render: (volume) => {
        // 当天最高搜索量为0时使用默认值1000，避免除以0的错误
        const maxVolume = statistics.todayMaxVolume || 1000;
        const percent = Math.min(100, (volume / maxVolume) * 100);
        
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong style={{ color: getVolumeColor(volume) }}>
              {volume.toLocaleString()}
            </Text>
            <Progress 
              percent={percent} 
              showInfo={false} 
              strokeColor={getVolumeColor(volume)}
              size="small"
            />
          </Space>
        );
      },
      sorter: (a, b) => a.volume - b.volume,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 200,
      render: (source) => <SourceCell source={source} />,
    },
    {
      title: '管理',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="确认删除"
          description={`确定要删除"${record.keyword}"关键词吗？此操作无法撤销。`}
          onConfirm={() => handleDeleteTopic(record.id)}
          okText="确认"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button 
            danger 
            type="text" 
            icon={<DeleteOutlined />} 
            size="small"
          />
        </Popconfirm>
      ),
    },
  ];
  
  // 渲染数据概览卡片
  const renderStatisticsCards = () => {
    // 在加载中时显示骨架屏
    if (loading) {
      return (
        <Row gutter={16}>
          {[1, 2, 3].map(i => (
            <Col span={8} key={i}>
              <Card>
                <Skeleton active paragraph={{ rows: 1 }} />
              </Card>
            </Col>
          ))}
        </Row>
      );
    }
    
    return (
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic 
              title={
                <Space>
                  <span>当天新增热点</span>
                  <Tooltip title="显示今天新增的热点话题数量">
                    <Button type="text" size="small" icon={<InfoCircleOutlined />} />
                  </Tooltip>
                </Space>
              }
              value={statistics.todayTotal} 
              prefix={<CalendarOutlined />} 
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title={
                <Space>
                  <span>当日热门话题</span>
                  <Tooltip title="今天新增的热门话题数量，热门标准：搜索量超过8000次将被标记为热门">
                    <Button type="text" size="small" icon={<InfoCircleOutlined />} />
                  </Tooltip>
                </Space>
              }
              value={statistics.todayTrending} 
              prefix={<FireOutlined />} 
              valueStyle={{ color: '#f5222d' }}
              suffix={`/ ${statistics.todayTotal}`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title={
                <Space>
                  <span>当日最高搜索量</span>
                  <Tooltip title="今天话题中的最高搜索量">
                    <Button type="text" size="small" icon={<InfoCircleOutlined />} />
                  </Tooltip>
                </Space>
              }
              value={statistics.todayMaxVolume} 
              prefix={<RiseOutlined />} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };
  
  // 导出CSV数据
  const exportToCSV = () => {
    if (filteredTopics.length === 0) {
      message.warning('没有可导出的数据');
      return;
    }
    
    // 生成CSV内容
    let csvContent = "日期,关键词,类别,状态,搜索量\n";
    
    filteredTopics.forEach(topic => {
      const row = [
        topic.date,
        `"${topic.keyword.replace(/"/g, '""')}"`, // 处理关键词中的双引号
        topic.category || '未分类',
        topic.status === 'trending' ? '热门' : '活跃',
        topic.volume
      ].join(',');
      
      csvContent += row + "\n";
    });
    
    // 创建Blob并下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // 设置文件名 - 当前日期加热点话题关键词
    const date = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `热点话题数据_${date}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success('导出成功');
  };

  // 渲染操作按钮
  const renderActionButtons = () => {
    return (
      <Space>
        <Button
          icon={<ExportOutlined />}
          onClick={exportToCSV}
          disabled={filteredTopics.length === 0}
        >
          导出数据
        </Button>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAddHotTopic}
          size="middle"
        >
          添加热点
        </Button>
      </Space>
    );
  };
  
  // 如果页面未准备就绪，显示骨架屏
  if (!pageReady) {
    return (
      <DashboardLayout>
        <Spin 
          tip="加载热点话题数据中..."
          size="large"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000
          }}
        >
          <PageSkeleton />
        </Spin>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div style={{ padding: spacing.xl }}>
        <div style={{ marginBottom: spacing.xl }}>
          <Title level={2} style={{ marginBottom: spacing.xs }}>热点列表</Title>
          <Text type="secondary" style={{ fontSize: fontSizes.md }}>
            跟踪和管理加密货币相关热点话题，了解最新趋势
          </Text>
        </div>
        
        {/* 统计数据卡片 */}
        <div style={{ marginBottom: spacing.xl }}>
          {renderStatisticsCards()}
        </div>
        
        {/* 搜索和添加区域 */}
        <Card
          style={{ marginBottom: spacing.lg }}
          bodyStyle={{ padding: spacing.md }}
        >
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Input
                placeholder="搜索热点关键词..."
                value={searchKeyword}
                onChange={handleSearch}
                prefix={<SearchOutlined />}
                allowClear
                size="large"
              />
            </Col>
            <Col>
              {renderActionButtons()}
            </Col>
          </Row>
        </Card>
        
        {/* 表格组件 */}
        <Card>
          {filteredTopics.length === 0 && !loading ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                searchKeyword ? '没有找到匹配的热点数据' : '暂无热点数据'
              }
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddHotTopic}>
                添加第一个热点
              </Button>
            </Empty>
          ) : (
            <Table 
              columns={columns}
              dataSource={filteredTopics}
              rowKey="id"
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total) => `共 ${total} 条热点数据`,
              }}
              size="middle"
              loading={{
                spinning: loading,
                indicator: <LoadingOutlined style={{ fontSize: 24 }} spin />,
                tip: '正在加载热点数据...'
              }}
              locale={{ emptyText: searchKeyword ? '没有找到匹配的热点数据' : '暂无热点数据' }}
              // 添加表格行样式
              rowClassName={(record) => record.status === 'trending' ? 'trending-row' : ''}
              // 添加表格样式
              className="hot-topics-table"
            />
          )}
        </Card>
        
        {/* 添加热点的弹窗 */}
        <Modal
          open={isModalOpen}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <FireOutlined style={{ color: '#f5222d' }} />
              <span>添加热点话题</span>
            </div>
          }
          onCancel={isSaving ? undefined : handleCloseModal}
          confirmLoading={isSaving}
          onOk={handleSaveHotTopic}
          okText={isSaving ? "保存中..." : "保存"}
          cancelText="取消"
          okButtonProps={{ 
            disabled: !newKeyword.trim() || newVolume === '' || isSaving,
            icon: isSaving ? <LoadingOutlined /> : <PlusOutlined />
          }}
          cancelButtonProps={{ disabled: isSaving }}
          width={500}
          maskClosable={!isSaving}
          destroyOnClose
        >
          <div id="save-error-area" style={{ marginBottom: '16px' }}>
            {/* 错误信息区域 */}
          </div>
          
          <Alert
            message="添加热点话题"
            description="热点话题用于跟踪加密市场当前最受关注的内容，添加后会显示在热点列表中。"
            type="info"
            showIcon
            style={{ marginBottom: spacing.lg }}
          />

          <div style={{ marginBottom: spacing.lg }}>
            <Space style={{ marginBottom: spacing.xs }}>
              <Text strong>关键词</Text>
              <Text type="secondary" style={{ fontSize: fontSizes.sm }}>
                (必填)
              </Text>
            </Space>
            <Input 
              value={newKeyword} 
              onChange={handleNewKeywordChange}
              placeholder={"输入热点关键词，如'比特币突破70000美元'"}
              maxLength={50}
              showCount
              autoFocus
              onPressEnter={() => {
                if (newKeyword.trim() && newVolume !== '') {
                  handleSaveHotTopic();
                }
              }}
            />
          </div>
          
          <div style={{ marginBottom: spacing.md }}>
            <Space align="center" style={{ marginBottom: spacing.xs }}>
              <Text strong>搜索量</Text>
              <Text type="secondary" style={{ fontSize: fontSizes.sm }}>
                (必填)
              </Text>
              {Number(newVolume) > 8000 && (
                <Tag color="red" icon={<FireOutlined />}>
                  热门
                </Tag>
              )}
            </Space>
            <Input 
              type="number"
              value={newVolume} 
              onChange={handleNewVolumeChange}
              placeholder="输入搜索量..."
              min={0}
              max={1000000}
              addonAfter="次搜索"
              suffix={
                Number(newVolume) > 0 ? (
                  <Tooltip title={Number(newVolume) > 8000 ? "将被标记为热门话题" : "普通话题"}>
                    <div style={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%',
                      background: Number(newVolume) > 8000 ? '#f5222d' : 
                                Number(newVolume) > 5000 ? '#fa8c16' : 
                                Number(newVolume) > 2000 ? '#52c41a' : '#1890ff'
                    }} />
                  </Tooltip>
                ) : null
              }
              onPressEnter={() => {
                if (newKeyword.trim() && newVolume !== '') {
                  handleSaveHotTopic();
                }
              }}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: spacing.xs, fontSize: fontSizes.sm }}>
              搜索量超过8000次将自动标记为热门话题
            </Text>
          </div>
          
          <div style={{ marginBottom: spacing.md }}>
            <Space style={{ marginBottom: spacing.xs }}>
              <Text strong>来源</Text>
              <Text type="secondary" style={{ fontSize: fontSizes.sm }}>
                (选填)
              </Text>
            </Space>
            <Select
              style={{ width: '100%' }}
              placeholder="选择或输入热点来源..."
              value={newSource}
              onChange={handleNewSourceChange}
              options={sourceOptions}
              showSearch
              allowClear
              optionFilterProp="label"
              suffixIcon={<LinkOutlined />}
              searchValue={customSource}
              onSearch={handleSourceSearch}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  {customSource && !sourceOptions.find(
                    option => option.value.toLowerCase() === customSource.toLowerCase()
                  ) && (
                    <div style={{ padding: '8px', borderTop: '1px solid #e8e8e8' }}>
                      <Button 
                        type="text" 
                        icon={<PlusOutlined />} 
                        style={{ width: '100%', textAlign: 'left' }}
                        onClick={handleAddSource}
                      >
                        添加 &quot;{customSource}&quot;
                      </Button>
                    </div>
                  )}
                </>
              )}
              notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无匹配来源" />}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: spacing.xs, fontSize: fontSizes.sm }}>
              选择或输入热点话题的信息来源，系统会自动检查并添加新来源
            </Text>
          </div>
        </Modal>
        
        {/* 添加必要的CSS */}
        <style jsx global>{`
          .hot-topics-table .trending-row {
            background-color: rgba(245, 34, 45, 0.05);
          }
          
          .ant-progress-bg {
            height: 4px !important;
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
};

export default React.memo(HotTopicsPage);