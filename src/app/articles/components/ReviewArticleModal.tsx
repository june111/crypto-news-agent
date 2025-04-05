'use client';

import React, { useState, forwardRef } from 'react';
import { Modal, Button, Typography, Space, Spin, Divider, Card, Image } from 'antd';
import { CheckOutlined, CloseOutlined, FileTextOutlined, PictureOutlined } from '@ant-design/icons';
import { Article, ArticleStatus } from '@/types/article';
import styles from '../articles.module.css';
import dayjs from 'dayjs';
import useI18n from '@/hooks/useI18n';
import { STATUS_KEYS, formatDateTimeString } from '../utils/articleUtils';

interface ReviewArticleModalProps {
  visible: boolean;
  articleId: string;
  articles: Article[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: ArticleStatus) => void;
}

const { Paragraph, Text, Title } = Typography;

// 使用forwardRef包装组件以适应React 19的ref处理方式
const ReviewArticleModal = forwardRef<HTMLDivElement, ReviewArticleModalProps>(({
  visible,
  articleId,
  articles,
  onClose,
  onUpdateStatus
}, ref) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState<boolean>(false);
  
  // 获取当前文章
  const article = articles.find(a => a.id === articleId);
  
  // 处理审核通过
  const handleApprove = async () => {
    setLoading(true);
    try {
      await onUpdateStatus(articleId, '已发布');
      onClose();
    } catch (error) {
      console.error('审核失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理审核拒绝
  const handleReject = async () => {
    setLoading(true);
    try {
      await onUpdateStatus(articleId, '不过审');
      onClose();
    } catch (error) {
      console.error('驳回失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理重新发送
  const handleResend = async () => {
    try {
      setLoading(true);
      
      // 减少API调用的等待时间
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 更新文章状态
      onUpdateStatus(articleId, '待审核');
    } catch (error) {
      console.error('重新发送失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!article) return null;

  const formattedDate = article.createdAt 
    ? formatDateTimeString(article.createdAt)
    : '未知时间';

  return (
    <div ref={ref}>
      <Modal
        open={visible}
        title={t('articles.reviewArticle')}
        onCancel={onClose}
        width={800}
        footer={
          article?.status === '待审核' ? (
            <Space>
              <Button onClick={onClose}>{t('common.cancel')}</Button>
              <Button 
                type="primary" 
                danger
                icon={<CloseOutlined />}
                onClick={handleReject}
                loading={loading}
              >
                {t('articles.reject')}
              </Button>
              <Button 
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleApprove}
                loading={loading}
              >
                {t('articles.approve')}
              </Button>
            </Space>
          ) : (
            <Button onClick={onClose}>{t('common.close')}</Button>
          )
        }
        style={{ top: 20, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
      >
        {!article ? (
          <Spin tip={t('common.loading')} size="large" />
        ) : (
          <div className={styles.reviewContent}>
            <Typography.Title level={4}>{article.title}</Typography.Title>
            
            <Space className={styles.articleMeta}>
              <Typography.Text type="secondary">
                {t('articles.category')}: {article.category}
              </Typography.Text>
              <Typography.Text type="secondary">
                {t('articles.status')}: {t(`articles.${STATUS_KEYS[article.status]}`)}
              </Typography.Text>
              <Typography.Text type="secondary">
                {t('articles.createDate')}: {formattedDate}
              </Typography.Text>
            </Space>
            
            <Divider />
            
            {/* 封面图预览 */}
            {article.coverImage && (
              <div className={styles.coverImage}>
                <Typography.Title level={5} className={styles.sectionTitle}>
                  <PictureOutlined /> {t('articles.coverImage')}
                </Typography.Title>
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  className={styles.previewImage}
                />
                <Divider />
              </div>
            )}
            
            <div className={styles.contentSection}>
              <Typography.Title level={5} className={styles.sectionTitle}>
                <FileTextOutlined /> {t('articles.content')}
              </Typography.Title>
              <Card className={styles.contentCard}>
                <div 
                  dangerouslySetInnerHTML={{ __html: article.content || '' }} 
                  className={styles.articleContent}
                />
              </Card>
            </div>
            
            {Array.isArray(article.keywords) && article.keywords.length > 0 && (
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
          </div>
        )}
      </Modal>
    </div>
  );
});

// 设置显示名称
ReviewArticleModal.displayName = 'ReviewArticleModal';

export default ReviewArticleModal; 