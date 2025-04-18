'use client';

import React, { forwardRef } from 'react';
import { Table, Tag, Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Article, ArticleStatus } from '@/types/article';
import useI18n from '@/hooks/useI18n';
import { STATUS_KEYS, getStatusTagColor } from '../utils/articleUtils';

interface ArticleListProps {
  articles: Article[];
  loading: boolean;
  onEditArticle: (id: string) => void;
  onDeleteArticle: (id: string) => void;
  onReviewArticle: (id: string) => void;
}

// 使用forwardRef包装组件以适应React 19的ref处理方式
const ArticleList = forwardRef<HTMLDivElement, ArticleListProps>(({
  articles,
  loading,
  onEditArticle,
  onDeleteArticle,
  onReviewArticle
}, ref) => {
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
      render: (status: ArticleStatus) => (
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
    <div ref={ref}>
      <Table 
        columns={columns} 
        dataSource={articles} 
        rowKey="id" 
        loading={loading}
      />
    </div>
  );
});

// 设置显示名称
ArticleList.displayName = 'ArticleList';

export default ArticleList; 