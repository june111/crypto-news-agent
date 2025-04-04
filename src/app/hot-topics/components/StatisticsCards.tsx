'use client';

import React from 'react';
import { Row, Col, Card, Statistic, Tooltip, Button, Badge } from 'antd';
import { 
  FireOutlined, 
  CalendarOutlined, 
  RiseOutlined, 
  LineChartOutlined
} from '@ant-design/icons';
import { TRENDING_THRESHOLD } from '../constants';
import useI18n from '@/hooks/useI18n';

interface StatsProps {
  statistics: {
    todayTotal: number;
    todayTrending: number;
    todayMaxVolume: number;
    trendingThreshold?: number; // 添加热门话题阈值
  };
}

const StatisticsCards: React.FC<StatsProps> = ({ statistics }) => {
  const trendingThreshold = statistics.trendingThreshold || TRENDING_THRESHOLD; // 使用导入的常量作为默认值
  const { t } = useI18n();
  
  // 计算百分比
  const trendingPercentage = statistics.todayTotal > 0 
    ? Math.round((statistics.todayTrending / statistics.todayTotal) * 100) 
    : 0;
  
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8}>
        <Card 
          hoverable 
          style={{ 
            borderRadius: '8px',
            overflow: 'hidden',
            height: '100%',
            background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 100%)'
          }}
        >
          <Statistic 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarOutlined style={{ color: '#722ed1' }} />
                <span>{t('hotTopics.todayNewTopics')}</span>
              </div>
            }
            value={statistics.todayTotal} 
            valueStyle={{ 
              color: '#722ed1',
              fontSize: '28px',
              fontWeight: 'bold'
            }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={8}>
        <Card 
          hoverable 
          style={{ 
            borderRadius: '8px',
            overflow: 'hidden',
            height: '100%',
            background: 'linear-gradient(135deg, #fff2e8 0%, #fff1f0 100%)'
          }}
        >
          <Statistic 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FireOutlined style={{ color: '#f5222d' }} />
                <span>{t('hotTopics.todayTrendingTopics')}</span>
              </div>
            }
            value={statistics.todayTrending} 
            valueStyle={{ 
              color: '#f5222d',
              fontSize: '28px',
              fontWeight: 'bold'
            }}
            suffix={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginLeft: '8px', fontSize: '16px', opacity: 0.75 }}>/ {statistics.todayTotal}</span>
                {trendingPercentage > 0 && (
                  <Badge 
                    count={`${trendingPercentage}%`} 
                    style={{ 
                      backgroundColor: '#f5222d', 
                      marginLeft: '8px' 
                    }} 
                  />
                )}
              </div>
            }
          />
          <div 
            style={{ 
              marginTop: '8px', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center' 
            }}
          >
            <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
              {t('hotTopics.trendingStandard')}: {trendingThreshold.toLocaleString()}+
            </div>
          </div>
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={8}>
        <Card 
          hoverable 
          style={{ 
            borderRadius: '8px',
            overflow: 'hidden',
            height: '100%',
            background: 'linear-gradient(135deg, #f6ffed 0%, #e6fffb 100%)'
          }}
        >
          <Statistic 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RiseOutlined style={{ color: '#52c41a' }} />
                <span>{t('hotTopics.todayMaxVolume')}</span>
              </div>
            }
            value={statistics.todayMaxVolume} 
            valueStyle={{ 
              color: '#52c41a',
              fontSize: '28px',
              fontWeight: 'bold'
            }}
          />
          <div 
            style={{ 
              marginTop: '8px', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
              {t('hotTopics.equivalentToStandard')}{' '}
              <span style={{ 
                fontWeight: 'bold', 
                color: statistics.todayMaxVolume >= trendingThreshold ? '#52c41a' : 'inherit' 
              }}>
                {statistics.todayMaxVolume > 0 && trendingThreshold > 0 
                  ? Math.round((statistics.todayMaxVolume / trendingThreshold) * 100) 
                  : 0}%
              </span>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default StatisticsCards; 