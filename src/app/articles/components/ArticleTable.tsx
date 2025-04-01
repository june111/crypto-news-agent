import React from 'react';
import Image from 'next/image';
import { 
  Table, 
  Button, 
  Tag, 
  Tooltip, 
  Popconfirm, 
  Empty,
  Skeleton
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  CalendarOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CheckOutlined, 
  ExportOutlined,
  PlusOutlined
} from '@ant-design/icons';

import styles from '../articles.module.css';
import { Article, ArticleStatus } from '@/types/article';

// 获取状态对应的颜色
const getStatusColor = (status: ArticleStatus) => {
  switch (status) {
    case '已发布':
      return 'success';
    case '待审核':
      return 'processing';
    case '不过审':
      return 'error';
    case '发布失败':
      return 'warning';
    default:
      return 'default';
  }
};

// 渲染关键词标签
const renderKeywordTags = (keywords: string[]) => (
  <div className={styles.keywordTagContainer}>
    {keywords.slice(0, 3).map((keyword: string, index: number) => (
      <span key={index} className={styles.keywordTag}>
        {keyword}
      </span>
    ))}
    {keywords.length > 3 && (
      <span style={{ 
        color: '#8c8c8c',
        fontSize: '12px',
        padding: '2px 4px'
      }}>
        +{keywords.length - 3}
      </span>
    )}
  </div>
);

interface ArticleTableProps {
  articles: Article[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReview: (id: string) => void;
}

const ArticleTable: React.FC<ArticleTableProps> = ({
  articles,
  loading,
  onEdit,
  onDelete,
  onReview
}) => {
  
  // 表格列定义
  const columns: ColumnsType<Article> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => (
        <span>
          <CalendarOutlined style={{ marginRight: 4, opacity: 0.5 }} />
          {date}
        </span>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: {
        showTitle: false,
      },
      render: (title: string) => (
        <Tooltip title={title} placement="topLeft">
          <div className={styles.titleOverflow}>
            {title}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '封面图',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 120,
      render: (coverImage: string) => (
        <div className={styles.tableImage}>
          <Image 
            src={coverImage} 
            alt="封面"
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
      ),
    },
    {
      title: '关键词',
      dataIndex: 'keywords',
      key: 'keywords',
      width: 180,
      render: renderKeywordTags,
    },
    {
      title: '文章分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ArticleStatus) => (
        <Tag 
          color={getStatusColor(status)}
          className={styles.statusTag}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (_: unknown, record: Article) => (
        <div className={styles.tableActions}>
          <Button 
            size="small"
            type="primary"
            ghost
            icon={<EditOutlined />}
            onClick={() => onEdit(record.id)}
            className={styles.tableActionButton}
          >
            编辑
          </Button>
          
          <Popconfirm
            title="确认删除"
            description={`确定要删除此文章吗？此操作无法撤销。`}
            onConfirm={() => onDelete(record.id)}
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button 
              danger 
              size="small"
              icon={<DeleteOutlined />}
              className={styles.tableActionButton}
            >
              删除
            </Button>
          </Popconfirm>
          
          {record.status === '待审核' && (
            <Button 
              type="primary" 
              size="small"
              icon={<CheckOutlined />}
              onClick={() => onReview(record.id)}
              className={styles.tableActionButton}
            >
              审核
            </Button>
          )}
          
          {record.status === '发布失败' && (
            <Button 
              type="primary" 
              size="small"
              icon={<ExportOutlined />}
              onClick={() => onReview(record.id)}
              className={styles.tableActionButton}
            >
              重发
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.tableContainer}>
      {loading ? (
        <div style={{ padding: '24px' }}>
          <Skeleton active />
          <Skeleton active />
        </div>
      ) : (
        <Table
          dataSource={articles}
          columns={columns}
          rowKey="id"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `共 ${total} 条数据`,
          }}
          scroll={{ x: 1300 }}
          size="middle"
          locale={{
            emptyText: (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    {articles.length === 0 ? '暂无文章，请创建新文章' : '没有找到匹配的文章'}
                  </span>
                }
                className={styles.tableEmpty}
              >
                {articles.length === 0 && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => window.location.href = '/articles/edit/new'}
                  >
                    创建第一篇文章
                  </Button>
                )}
              </Empty>
            )
          }}
        />
      )}
    </div>
  );
};

export default ArticleTable; 