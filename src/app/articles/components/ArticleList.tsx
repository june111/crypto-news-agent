'use client';

import React from 'react';
import { Table, Tag, Button, Space, Dropdown, Menu } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Article } from '@/types/article';

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
  // 表格列定义
  const columns = [
    // ... 其他列
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusTagColor(status)}>
          {status}
        </Tag>
      ),
      width: 100,
      align: 'center' as const
    },
    // ... 其他列
    {
      title: '操作',
      key: 'action',
      render: (_, record: Article) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEditArticle(record.id)}
          />
          <Button
            type="text"
            icon={<EyeOutlined />} 
            onClick={() => onReviewArticle(record.id)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDeleteArticle(record.id)}
          />
        </Space>
      ),
      width: 150,
      align: 'center' as const
    }
  ];

  return (
    <Table
      dataSource={articles}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 篇文章`
      }}
    />
  );
};

export default ArticleList; 