'use client';

import React from 'react';
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
    case '已下架':
      return 'default';
    default:
      return 'default';
  }
};

// 渲染关键词标签
const renderKeywordTags = (keywords: string[]) => {
  // 确保keywords是有效的数组
  if (!keywords || !Array.isArray(keywords)) {
    return <div className={styles.keywordTagContainer}></div>;
  }
  
  return (
    <div className={styles.keywordTagContainer}>
      {keywords.length > 0 && keywords.slice(0, 3).map((keyword: string, index: number) => (
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
};

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

const ArticleTable: React.FC<ArticleTableProps> = ({
  articles,
  loading,
  onEdit,
  onDelete,
  onReview,
  onApprove,
  onReject,
  onResend,
  onTakeDown
}) => {
  
  // 表格列定义
  const columns: ColumnsType<Article> = [
    {
      title: '更新时间',
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
        
        // 格式化日期时间
        const date = new Date(timeString);
        const formattedDate = date.toLocaleDateString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        });
        
        const formattedTime = date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        return (
          <Tooltip title={`最后更新: ${timeString}`}>
            <span>
              <CalendarOutlined style={{ marginRight: 4, opacity: 0.5 }} />
              {formattedDate} {formattedTime}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '标题',
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
      title: '封面图',
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
              <span style={{ color: '#999', fontSize: '12px' }}>无封面</span>
            </div>
          );
        }
          
        // 使用Ant Design的Image组件，支持预览
        return (
          <div className={styles.tableImage}>
            <Image 
              src={coverImage}
              alt="文章封面"
              width={80}
              height={60}
              style={{ objectFit: 'cover', borderRadius: '4px' }}
              preview={{
                maskClassName: styles.imageMask,
                mask: <div><EyeOutlined /> 预览</div>
              }}
            />
          </div>
        );
      },
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
            
            {record.status === '已发布' && (
              <Popconfirm
                title="确认下架"
                description="确定要下架此文章吗？下架后将不再对用户展示"
                onConfirm={() => onTakeDown(record.id)}
                okText="确认下架"
                cancelText="取消"
              >
                <Button 
                  size="small"
                  style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff' }}
                  icon={<CloseOutlined />}
                  className={styles.tableActionButton}
                >
                  下架
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
                重发
              </Button>
            )}
          </Space>
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
          dataSource={Array.isArray(articles) ? articles : []}
          columns={columns}
          rowKey={record => record?.id || `article-${Math.random().toString(36).slice(2)}`}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `共 ${total} 条数据`,
          }}
          scroll={{ x: 1500 }}
          size="middle"
          locale={{
            emptyText: (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    {Array.isArray(articles) && articles.length === 0 ? '暂无文章，请创建新文章' : '没有找到匹配的文章'}
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