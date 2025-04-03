'use client';

import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { FileTextOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

interface StatisticsCardsProps {
  stats: {
    total: number;
    publishedCount: number;
    pendingCount: number;
    rejectedCount: number;
    failedCount: number;
  };
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({ stats }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
      <Col xs={24} sm={12} md={6}>
        <Card variant="borderless" style={{ borderRadius: '8px', height: '100%' }}>
          <Statistic 
            title="文章总数" 
            value={stats.total} 
            prefix={<FileTextOutlined />} 
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card variant="borderless" style={{ borderRadius: '8px', height: '100%' }}>
          <Statistic 
            title="待审核" 
            value={stats.pendingCount} 
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card variant="borderless" style={{ borderRadius: '8px', height: '100%' }}>
          <Statistic 
            title="已发布" 
            value={stats.publishedCount} 
            prefix={<CheckOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card variant="borderless" style={{ borderRadius: '8px', height: '100%' }}>
          <Statistic 
            title="有问题的文章" 
            value={stats.rejectedCount + stats.failedCount} 
            prefix={<CloseOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default StatisticsCards; 