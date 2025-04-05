import { ArticleStatus } from '@/types/article';
import React from 'react';

/**
 * 状态与国际化键值映射
 */
export const STATUS_KEYS = {
  '草稿': 'draft',
  '待审核': 'pending',
  '已发布': 'published',
  '不过审': 'rejected',
  '发布失败': 'failed',
  '已下架': 'unpublished'
};

/**
 * 获取文章状态对应的标签颜色
 * @param status 文章状态
 * @returns 对应的颜色名称
 */
export const getStatusTagColor = (status: ArticleStatus): string => {
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

/**
 * 格式化日期时间字符串
 * @param dateTimeString 日期时间字符串
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTimeString = (dateTimeString: string | undefined): string => {
  if (!dateTimeString) return '';
  
  try {
    const date = new Date(dateTimeString);
    
    const formattedDate = date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
    
    const formattedTime = date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `${formattedDate} ${formattedTime}`;
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateTimeString;
  }
};

/**
 * 渲染关键词标签
 * @param keywords 关键词数组
 * @returns JSX元素
 */
export const renderKeywordTags = (
  keywords: string[], 
  containerClassName?: string, 
  tagClassName?: string
): JSX.Element => {
  // 确保keywords是有效的数组
  if (!keywords || !Array.isArray(keywords)) {
    return <div className={containerClassName}></div>;
  }
  
  return (
    <div className={containerClassName}>
      {keywords.length > 0 && keywords.slice(0, 3).map((keyword: string, index: number) => (
        <span key={index} className={tagClassName}>
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