'use client';

import React, { useState } from 'react';
import { Modal, Button, Typography, Space, Spin, Divider, Card, Image } from 'antd';
import { CheckOutlined, CloseOutlined, FileTextOutlined, PictureOutlined } from '@ant-design/icons';
import { Article, ArticleStatus } from '@/types/article';
import styles from '../articles.module.css';
import dayjs from 'dayjs';

interface ReviewArticleModalProps {
  visible: boolean;
  articleId: string;
  articles: Article[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: ArticleStatus) => void;
}

const { Paragraph, Text, Title } = Typography;

const ReviewArticleModal: React.FC<ReviewArticleModalProps> = ({
  visible,
  articleId,
  articles,
  onClose,
  onUpdateStatus
}) => {
  const [isReviewing, setIsReviewing] = useState(false);
  
  // 获取当前文章
  const article = articles.find(a => a.id === articleId);
  
  // 处理审核通过
  const handleApprove = async () => {
    try {
      setIsReviewing(true);
      
      // 减少API调用的等待时间
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 更新文章状态
      onUpdateStatus(articleId, '已发布');
    } catch (error) {
      console.error('审核失败:', error);
    } finally {
      setIsReviewing(false);
    }
  };
  
  // 处理审核拒绝
  const handleReject = async () => {
    try {
      setIsReviewing(true);
      
      // 减少API调用的等待时间
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 更新文章状态
      onUpdateStatus(articleId, '不过审');
    } catch (error) {
      console.error('审核失败:', error);
    } finally {
      setIsReviewing(false);
    }
  };
  
  // 处理重新发送
  const handleResend = async () => {
    try {
      setIsReviewing(true);
      
      // 减少API调用的等待时间
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 更新文章状态
      onUpdateStatus(articleId, '待审核');
    } catch (error) {
      console.error('重新发送失败:', error);
    } finally {
      setIsReviewing(false);
    }
  };
  
  if (!article) return null;

  const formattedDate = article.createdAt 
    ? dayjs(article.createdAt).format('YYYY-MM-DD HH:mm:ss')
    : '未知时间';

  return (
    <Modal
      open={visible}
      title={
        <Space>
          <FileTextOutlined />
          <Title level={4} style={{ margin: 0 }}>文章审核</Title>
        </Space>
      }
      onCancel={onClose}
      footer={[
        <Button key="reject" danger icon={<CloseOutlined />} onClick={handleReject} loading={isReviewing}>
          拒绝
        </Button>,
        <Button key="approve" type="primary" icon={<CheckOutlined />} onClick={handleApprove} loading={isReviewing}>
          通过
        </Button>,
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>
      ]}
      width={800}
      style={{ top: 20 }}
      styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' } }}
    >
      <div style={{ marginBottom: 16 }}>
        <Title level={5}>{article.title}</Title>
        <Space split={<Divider type="vertical" />} style={{ marginBottom: 16 }}>
          <Text type="secondary">作者: {article.author || '未知'}</Text>
          <Text type="secondary">分类: {article.category || '未分类'}</Text>
          <Text type="secondary">创建时间: {formattedDate}</Text>
        </Space>
      </div>
      
      {/* 封面图预览 */}
      {article.coverImage && (
        <Card 
          title={
            <Space>
              <PictureOutlined />
              <span>封面图</span>
            </Space>
          }
          size="small" 
          style={{ marginBottom: 16 }}
          styles={{ 
            body: { 
              display: 'flex', 
              justifyContent: 'center', 
              padding: '12px',
              background: '#f9f9f9'
            }
          }}
        >
          <Image
            src={article.coverImage}
            alt={article.title}
            style={{ 
              maxHeight: '200px',
              objectFit: 'contain',
              cursor: 'zoom-in',
              borderRadius: '4px'
            }}
            preview={{
              mask: '点击查看大图',
              maskClassName: styles.imageMask
            }}
          />
        </Card>
      )}
      
      <Card 
        title="文章摘要" 
        size="small" 
        style={{ marginBottom: 16 }}
        styles={{ body: { maxHeight: '150px', overflow: 'auto' } }}
      >
        <Paragraph>{article.summary}</Paragraph>
      </Card>
      
      <Card 
        title="文章正文" 
        size="small"
        styles={{ body: { maxHeight: '300px', overflow: 'auto' } }}
      >
        <div 
          dangerouslySetInnerHTML={{ __html: article.content }} 
          style={{ 
            padding: '10px',
            fontSize: '14px',
            lineHeight: '1.6'
          }}
        />
      </Card>
      
      {article.keywords && article.keywords.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Text strong>关键词: </Text>
          {article.keywords.map((keyword, index) => (
            <Text key={index} style={{ marginRight: 8 }}>
              {keyword}
              {index < article.keywords.length - 1 ? ',' : ''}
            </Text>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default ReviewArticleModal; 