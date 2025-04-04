'use client';

import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { FileTextOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import useI18n from '@/hooks/useI18n';

interface StatisticsCardsProps {
  stats: {
    total: number;
    publishedCount: number;
    pendingCount: number;
    rejectedCount: number;
    failedCount: number;
    draftCount: number;
    unpublishedCount: number;
  };
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({ stats }) => {
  const { t } = useI18n();
  
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
      <Col xs={24} sm={12} md={6}>
        <Card style={{ borderRadius: '8px', height: '100%' }}>
          <Statistic 
            title={t('common.total') + t('articles.title')} 
            value={stats.total} 
            prefix={<FileTextOutlined />} 
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card style={{ borderRadius: '8px', height: '100%' }}>
          <Statistic 
            title={t('articles.pending')} 
            value={stats.pendingCount} 
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card style={{ borderRadius: '8px', height: '100%' }}>
          <Statistic 
            title={t('articles.published')} 
            value={stats.publishedCount} 
            prefix={<CheckOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card style={{ borderRadius: '8px', height: '100%' }}>
          <Statistic 
            title={t('articles.rejected') + '/' + t('articles.failed')} 
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