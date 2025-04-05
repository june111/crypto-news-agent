'use client';

import React, { forwardRef } from 'react';
import { 
  Table, 
  Button, 
  Tag, 
  Tooltip, 
  Popconfirm, 
  Empty,
  Skeleton,
  Image,
  Space
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  CalendarOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CheckOutlined, 
  CloseOutlined,
  ExportOutlined,
  PlusOutlined,
  EyeOutlined
} from '@ant-design/icons';

import styles from '../articles.module.css';
import { Article, ArticleStatus } from '@/types/article';
import useI18n from '@/hooks/useI18n';
import { STATUS_KEYS, getStatusTagColor, formatDateTimeString, renderKeywordTags } from '../utils/articleUtils';

interface ArticleTableProps {
  articles: Article[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReview: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onResend: (id: string) => void;
  onTakeDown: (id: string) => void;
}

// 使用forwardRef包装组件以适应React 19的ref处理方式
const ArticleTable = forwardRef<HTMLDivElement, ArticleTableProps>(({
  articles,
  loading,
  onEdit,
  onDelete,
  onReview,
  onApprove,
  onReject,
  onResend,
  onTakeDown
}, ref) => {
  const { t } = useI18n();
  
  // 表格列定义
  const columns: ColumnsType<Article> = [
    {
      title: t('articles.updatedAt'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      sorter: (a, b) => {
        if (!a.updatedAt) return -1;
        if (!b.updatedAt) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      },
      sortDirections: ['descend', 'ascend'],
      defaultSortOrder: 'descend',
      render: (updatedAt: string, record: Article) => {
        // 优先使用updatedAt，如果不存在则使用date或创建时间
        const timeString = updatedAt || record.date || record.createdAt || '';
        if (!timeString) return <span>-</span>;
        
        return (
          <Tooltip title={`${t('articles.lastUpdate')}: ${timeString}`}>
            <span>
              <CalendarOutlined style={{ marginRight: 4, opacity: 0.5 }} />
              {formatDateTimeString(timeString)}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: t('articles.articleTitle'),
      dataIndex: 'title',
      key: 'title',
      width: 250,
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
      title: t('articles.coverImage'),
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 100,
      render: (coverImage: string) => {
        // 更可靠的图片源检查
        if (!coverImage || coverImage.trim() === '') {
          // 如果没有图片，显示占位符
          return (
            <div className={styles.tableImage} style={{ 
              backgroundColor: '#f5f5f5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <span style={{ color: '#999', fontSize: '12px' }}>{t('articles.noCover')}</span>
            </div>
          );
        }
          
        // 使用Ant Design的Image组件，支持预览
        return (
          <div className={styles.tableImage}>
            <Image 
              src={coverImage}
              alt={t('articles.coverImage')}
              width={80}
              height={60}
              style={{ objectFit: 'cover', borderRadius: '4px' }}
              preview={{
                maskClassName: styles.imageMask,
                mask: <div><EyeOutlined /> {t('common.preview')}</div>
              }}
            />
          </div>
        );
      },
    },
    {
      title: t('articles.keywords'),
      dataIndex: 'keywords',
      key: 'keywords',
      width: 180,
      render: (keywords: string[]) => renderKeywordTags(keywords, styles.keywordTagContainer, styles.keywordTag),
    },
    {
      title: t('articles.category'),
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: t('articles.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ArticleStatus) => (
        <Tag color={getStatusTagColor(status)}>
          {t(`articles.${STATUS_KEYS[status]}`)}
        </Tag>
      ),
      filters: [
        { text: t('articles.draft'), value: '草稿' },
        { text: t('articles.pending'), value: '待审核' },
        { text: t('articles.published'), value: '已发布' },
        { text: t('articles.rejected'), value: '不过审' },
        { text: t('articles.failed'), value: '发布失败' },
        { text: t('articles.unpublished'), value: '已下架' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: t('articles.actions'),
      key: 'actions',
      width: 320,
      fixed: 'right',
      render: (_: unknown, record: Article) => (
        <div className={styles.tableActions}>
          <Space size="small">
            <Button 
              size="small"
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => onEdit(record.id)}
              className={styles.tableActionButton}
            >
              {t('common.edit')}
            </Button>
            
            <Popconfirm
              title={t('common.confirmDelete')}
              description={t('articles.deleteConfirm')}
              onConfirm={() => onDelete(record.id)}
              okText={t('common.confirmDelete')}
              cancelText={t('common.cancel')}
              okButtonProps={{ danger: true }}
            >
              <Button 
                danger 
                size="small"
                icon={<DeleteOutlined />}
                className={styles.tableActionButton}
              >
                {t('common.delete')}
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
                {t('articles.review')}
              </Button>
            )}
            
            {record.status === '已发布' && (
              <Popconfirm
                title={t('articles.unpublished')}
                description={t('common.confirmAction')}
                onConfirm={() => onTakeDown(record.id)}
                okText={t('common.confirm')}
                cancelText={t('common.cancel')}
              >
                <Button 
                  size="small"
                  style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff' }}
                  icon={<CloseOutlined />}
                  className={styles.tableActionButton}
                >
                  {t('articles.unpublished')}
                </Button>
              </Popconfirm>
            )}
            
            {record.status === '发布失败' && (
              <Button 
                type="primary" 
                size="small"
                icon={<ExportOutlined />}
                onClick={() => onResend(record.id)}
                className={styles.tableActionButton}
              >
                {t('common.resend')}
              </Button>
            )}
          </Space>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.tableContainer} ref={ref}>
      {loading ? (
        <div style={{ padding: '24px' }}>
          <Skeleton active />
          <Skeleton active />
        </div>
      ) : (
        <Table
          dataSource={Array.isArray(articles) ? articles : []}
          columns={columns}
          rowKey={record => record?.id || `article-${Math.random().toString(36).slice(2)}`}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `${t('common.total')} ${total} ${t('articles.title')}`,
          }}
          scroll={{ x: 1500 }}
          size="middle"
          locale={{
            emptyText: (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    {Array.isArray(articles) && articles.length === 0 ? 
                      t('articles.noArticles') : 
                      t('articles.noMatchingArticles')}
                  </span>
                }
                className={styles.tableEmpty}
              >
                {Array.isArray(articles) && articles.length === 0 && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => window.location.href = '/articles/edit/new'}
                  >
                    {t('articles.createFirstArticle')}
                  </Button>
                )}
              </Empty>
            )
          }}
        />
      )}
    </div>
  );
});

// 设置显示名称
ArticleTable.displayName = 'ArticleTable';

export default ArticleTable; 