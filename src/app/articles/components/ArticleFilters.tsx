import React from 'react';
import { Card, Form, Input, Select, DatePicker, Row, Col, Button, Tag, Space } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import styles from '../articles.module.css';
import { ArticleStatus } from '@/types/article';

// 状态选项
const STATUS_OPTIONS: ArticleStatus[] = ['待审核', '已发布', '不过审', '发布失败'];

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

interface ArticleFiltersProps {
  filters: {
    title: string;
    date: string | null;
    keyword: string;
    category: string;
    content: string;
    status: string;
  };
  onFilterChange: (name: string, value: any) => void;
  onClearFilters: () => void;
  categories: string[];
}

const { Option } = Select;

const ArticleFilters: React.FC<ArticleFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  categories
}) => {
  // 处理标题变化
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange('title', e.target.value);
  };

  // 处理日期变化
  const handleDateChange = (date: dayjs.Dayjs | null) => {
    onFilterChange('date', date ? date.format('YYYY-MM-DD') : null);
  };

  // 处理关键词搜索变化
  const handleKeywordSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange('keyword', e.target.value);
  };

  // 处理分类变化
  const handleCategoryChange = (value: string) => {
    onFilterChange('category', value);
  };

  // 处理正文搜索变化
  const handleContentSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange('content', e.target.value);
  };

  // 处理状态变化
  const handleStatusChange = (value: string) => {
    onFilterChange('status', value);
  };

  return (
    <Card 
      bordered={false}
      className={styles.searchBox}
      title={
        <div className={styles.searchHeader}>
          <span>搜索筛选</span>
          <Space>
            <Button
              icon={<ClearOutlined />}
              onClick={onClearFilters}
              className={styles.clearButton}
            >
              清空筛选
            </Button>
          </Space>
        </div>
      }
    >
      <Form layout="vertical" className={styles.searchForm}>
        <Row gutter={[24, 0]}>
          {/* 标题搜索 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="标题">
              <Input
                value={filters.title}
                onChange={handleTitleChange}
                placeholder="搜索标题关键词..."
                prefix={<SearchOutlined />}
                allowClear
              />
            </Form.Item>
          </Col>
          
          {/* 日期搜索 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="日期">
              <DatePicker
                value={filters.date ? dayjs(filters.date) : null}
                onChange={handleDateChange}
                style={{ width: '100%' }}
                allowClear
              />
            </Form.Item>
          </Col>
          
          {/* 关键词搜索 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="关键词">
              <Input
                value={filters.keyword}
                onChange={handleKeywordSearchChange}
                placeholder="搜索关键词..."
                prefix={<SearchOutlined />}
                allowClear
              />
            </Form.Item>
          </Col>
          
          {/* 文章分类搜索 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="文章分类">
              <Select
                value={filters.category}
                onChange={handleCategoryChange}
                placeholder="选择分类"
                style={{ width: '100%' }}
                allowClear
              >
                {categories.map((category) => (
                  <Option key={category} value={category}>
                    <Tag color="blue">{category}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          {/* 正文搜索 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="正文内容">
              <Input
                value={filters.content}
                onChange={handleContentSearchChange}
                placeholder="搜索正文内容..."
                prefix={<SearchOutlined />}
                allowClear
              />
            </Form.Item>
          </Col>
          
          {/* 状态搜索 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="状态">
              <Select
                value={filters.status}
                onChange={handleStatusChange}
                placeholder="选择状态"
                style={{ width: '100%' }}
                allowClear
              >
                {STATUS_OPTIONS.map((status) => (
                  <Option key={status} value={status}>
                    <Tag color={getStatusColor(status)}>{status}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default ArticleFilters; 