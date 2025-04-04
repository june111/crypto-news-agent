'use client';

import React from 'react';
import { Table, Tag, Button, Space, Dropdown, Menu } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Article } from '@/types/article';
import useI18n from '@/hooks/useI18n';

// 获取状态对应的标签颜色
const getStatusTagColor = (status: string): string => {
  switch (status) {
    case '已发布':
      return 'success';
    case '待审核':
      return 'processing';
    case '不过审':
      return 'error';
    case '发布失败':
      return 'warning';
    case '草稿':
      return 'cyan';
    case '已下架':
      return 'default';
    default:
      return '';
  }
};

// 状态与国际化键值映射
const STATUS_KEYS = {
  '草稿': 'draft',
  '待审核': 'pending',
  '已发布': 'published',
  '不过审': 'rejected',
  '发布失败': 'failed',
  '已下架': 'unpublished'
};

interface ArticleListProps {
  articles: Article[];
  loading: boolean;
  onEditArticle: (id: string) => void;
  onDeleteArticle: (id: string) => void;
  onReviewArticle: (id: string) => void;
}

const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  loading,
  onEditArticle,
  onDeleteArticle,
  onReviewArticle
}) => {
  const { t } = useI18n();

  const columns = [
    {
      title: t('articles.articleTitle'),
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: t('articles.category'),
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: t('articles.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusTagColor(status)}>
          {t(`articles.${STATUS_KEYS[status]}`)}
        </Tag>
      ),
    },
    {
      title: t('articles.createDate'),
      dataIndex: 'createDate',
      key: 'createDate',
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_, record: Article) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => onReviewArticle(record.id)}
          />
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => onEditArticle(record.id)}
          />
          <Button 
            type="text" 
            icon={<DeleteOutlined />} 
            onClick={() => onDeleteArticle(record.id)}
            danger
          />
        </Space>
      ),
    },
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={articles} 
      rowKey="id" 
      loading={loading}
    />
  );
};

export default ArticleList; 