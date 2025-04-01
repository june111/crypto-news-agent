'use client';

import React from 'react';
import { Card, Descriptions, Tag, Typography, Divider, Space, Timeline } from 'antd';
import { 
  FireOutlined, 
  LineChartOutlined, 
  CalendarOutlined, 
  LinkOutlined 
} from '@ant-design/icons';
import { VOLUME_COLOR, getVolumeColor } from '../constants';

const { Title, Text, Paragraph } = Typography;

interface TopicDetailProps {
  topic?: {
    id: string;
    keyword: string;
    volume: number;
    date: string;
    source?: string;
    status?: string;
    category?: string;
  };
}

// 获取状态标签
const getStatusTag = (status?: string) => {
  if (!status) return null;
  
  switch (status.toLowerCase()) {
    case 'trending':
      return <Tag color="red" icon={<FireOutlined />}>热门</Tag>;
    case 'active':
      return <Tag color="blue" icon={<LineChartOutlined />}>活跃</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
};

const TopicDetailPanel: React.FC<TopicDetailProps> = ({ topic }) => {
  if (!topic) {
    return (
      <Card>
        <Text type="secondary">请选择一个热点话题查看详情</Text>
      </Card>
    );
  }
  
  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ color: getVolumeColor(topic.volume), margin: 0 }}>
          {topic.keyword}
        </Title>
        <Space style={{ marginTop: 8 }}>
          {getStatusTag(topic.status)}
          {topic.category && <Tag>{topic.category}</Tag>}
        </Space>
      </div>
      
      <Divider style={{ margin: '12px 0' }} />
      
      <Descriptions column={1} size="small">
        <Descriptions.Item label="搜索量">
          <Text strong style={{ color: getVolumeColor(topic.volume) }}>
            {topic.volume.toLocaleString()} 次
          </Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="添加日期">
          <Space>
            <CalendarOutlined />
            <Text>{topic.date}</Text>
          </Space>
        </Descriptions.Item>
        
        <Descriptions.Item label="来源">
          <Space>
            <LinkOutlined />
            <Text>{topic.source || '未知来源'}</Text>
          </Space>
        </Descriptions.Item>
      </Descriptions>
      
      <Divider style={{ margin: '12px 0' }} />
      
      <div>
        <Title level={5}>热点关键词分析</Title>
        <Paragraph>
          该热点话题的搜索量为 {topic.volume.toLocaleString()} 次，属于
          {topic.volume >= VOLUME_COLOR.HIGH ? '高度热门' : 
           topic.volume >= VOLUME_COLOR.MEDIUM ? '较为热门' : 
           topic.volume >= VOLUME_COLOR.LOW ? '一般热度' : '低热度'} 水平。
        </Paragraph>
        
        <Timeline
          items={[
            {
              color: '#f5222d',
              children: (
                <>
                  <Text strong>添加到系统</Text>
                  <div>添加时间：{topic.date}</div>
                </>
              ),
            },
            {
              color: '#1890ff',
              children: (
                <>
                  <Text strong>数据来源</Text>
                  <div>来源：{topic.source || '未知来源'}</div>
                </>
              ),
            },
            {
              color: '#52c41a',
              children: (
                <>
                  <Text strong>关键信息</Text>
                  <div>ID: {topic.id}</div>
                  <div>类别: {topic.category || '未分类'}</div>
                </>
              ),
            },
          ]}
        />
      </div>
    </Card>
  );
};

export default TopicDetailPanel; 