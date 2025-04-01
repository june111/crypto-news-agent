import React, { useState } from 'react';
import { Modal, Button, Typography, Space, Spin } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Article, ArticleStatus } from '@/types/article';

interface ReviewArticleModalProps {
  visible: boolean;
  articleId: string;
  articles: Article[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: ArticleStatus) => void;
}

const { Paragraph } = Typography;

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
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 更新文章状态
      onUpdateStatus(articleId, '待审核');
    } catch (error) {
      console.error('重新发送失败:', error);
    } finally {
      setIsReviewing(false);
    }
  };
  
  return (
    <Modal
      open={visible}
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CheckOutlined style={{ marginRight: 8, color: '#52c41a' }} />
          文章审核
        </div>
      }
      onCancel={onClose}
      footer={null}
    >
      {article && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Typography.Title level={5}>
              {article.title}
            </Typography.Title>
            <Typography.Text type="secondary">
              分类: {article.category} | 状态: {article.status}
            </Typography.Text>
            <Paragraph style={{ marginTop: 8 }}>
              {article.summary}
            </Paragraph>
          </div>
        </>
      )}
      
      <Paragraph style={{ marginBottom: 24, textAlign: 'center' }}>
        请选择审核操作:
      </Paragraph>
      
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        {article?.status === '待审核' && (
          <>
            <Button 
              type="primary" 
              icon={<CheckOutlined />}
              onClick={handleApprove}
              loading={isReviewing}
              style={{ borderRadius: 4 }}
            >
              通过审核
            </Button>
            
            <Button 
              danger
              icon={<CloseOutlined />}
              onClick={handleReject}
              loading={isReviewing}
              style={{ borderRadius: 4 }}
            >
              拒绝通过
            </Button>
          </>
        )}
        
        {article?.status === '发布失败' && (
          <Button 
            type="primary" 
            icon={<CheckOutlined />}
            onClick={handleResend}
            loading={isReviewing}
            style={{ borderRadius: 4 }}
          >
            重新发送
          </Button>
        )}
        
        {article?.status === '不过审' && (
          <Button 
            type="primary" 
            onClick={handleResend}
            loading={isReviewing}
            style={{ borderRadius: 4 }}
          >
            重新提交
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default ReviewArticleModal; 