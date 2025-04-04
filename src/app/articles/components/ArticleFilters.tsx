'use client';

import React, { useState } from 'react';
import { Card, Form, Input, Select, DatePicker, Row, Col, Button, Tag, Space } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Article, ArticleStatus, ARTICLE_CATEGORIES } from '@/types/article';
import useI18n from '@/hooks/useI18n';

import styles from '../articles.module.css';

// 状态选项
const STATUS_OPTIONS = ['草稿', '待审核', '已发布', '不过审', '发布失败', '已下架'];
const STATUS_KEYS = ['draft', 'pending', 'published', 'rejected', 'failed', 'unpublished'];

// 获取状态颜色
const getStatusColor = (status: string): string => {
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
  const { t, locale } = useI18n();

  // 处理文本输入变化
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };
  
  // 处理选择器变化
  const handleSelectChange = (value, name) => {
    onFilterChange(name, value);
  };
  
  // 处理日期变化
  const handleDateChange = (date) => {
    onFilterChange('date', date ? date.format('YYYY-MM-DD') : null);
  };

  return (
    <Card 
      className={styles.filtersCard}
      title={
        <div className={styles.filterHeader}>
          <span>{t('common.filter')}</span>
          <Button 
            type="link" 
            icon={<ClearOutlined />} 
            onClick={onClearFilters}
            size="small"
          >
            {t('common.clear')}
          </Button>
        </div>
      }
    >
      <Form layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item label={t('articles.articleTitle')}>
              <Input
                name="title"
                value={filters.title}
                onChange={handleTextChange}
                placeholder={t('common.search')}
                prefix={<SearchOutlined />}
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Form.Item label={t('articles.date')}>
              <DatePicker
                value={filters.date ? dayjs(filters.date) : null}
                onChange={handleDateChange}
                style={{ width: '100%' }}
                placeholder={t('common.selectDate')}
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Form.Item label={t('articles.status')}>
              <Select
                value={filters.status}
                onChange={(value) => handleSelectChange(value, 'status')}
                placeholder={t('common.all')}
                allowClear
                style={{ width: '100%' }}
              >
                {STATUS_OPTIONS.map((status, index) => (
                  <Option key={status} value={status}>
                    {t(`articles.${STATUS_KEYS[index]}`)}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Form.Item label={t('articles.category')}>
              <Select
                value={filters.category}
                onChange={(value) => handleSelectChange(value, 'category')}
                placeholder={t('common.selectCategory')}
                allowClear
                style={{ width: '100%' }}
              >
                {categories.map(category => (
                  <Option key={category} value={category}>
                    {category}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Form.Item label={t('articles.keywords')}>
              <Input
                name="keyword"
                value={filters.keyword}
                onChange={handleTextChange}
                placeholder={t('common.search')}
                prefix={<SearchOutlined />}
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Form.Item label={t('articles.content')}>
              <Input
                name="content"
                value={filters.content}
                onChange={handleTextChange}
                placeholder={t('common.search')}
                prefix={<SearchOutlined />}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default ArticleFilters; 