'use client';

import React, { useState, useEffect } from 'react';
import { Input, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styles from '../../articles.module.css';

interface TagDisplayProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  disabled?: boolean;
}

/**
 * 关键词标签组件，用于显示、添加和删除关键词标签
 */
export default function TagDisplay({ tags = [], onAdd, onRemove, disabled = false }: TagDisplayProps) {
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = () => {
    if (inputValue && !tags.includes(inputValue) && onAdd) {
      onAdd(inputValue);
    }
    setInputVisible(false);
    setInputValue('');
  };
  
  // 懒加载Tag组件
  const [TagComponent, setTagComponent] = useState<any>(null);
  
  useEffect(() => {
    // 动态导入，但只导入一次
    import('antd/lib/tag').then(module => {
      setTagComponent(() => module.default);
    });
  }, []);
  
  if (!TagComponent) {
    return <Spin size="small" />;
  }
  
  return (
    <div className={styles.tagContainer}>
      {tags.map(tag => (
        <TagComponent
          key={tag}
          closable={!disabled && !!onRemove}
          onClose={() => onRemove && onRemove(tag)}
          style={{ marginBottom: '8px' }}
          color="blue"
        >
          {tag}
        </TagComponent>
      ))}
      
      {!disabled && inputVisible ? (
        <Input
          type="text"
          size="small"
          className={styles.tagInput}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputConfirm}
          onPressEnter={handleInputConfirm}
          placeholder="输入后按回车"
          autoFocus
        />
      ) : !disabled && (
        <div
          className={styles.tagAddButton}
          onClick={() => setInputVisible(true)}
        >
          <PlusOutlined /> 添加关键词
        </div>
      )}
    </div>
  );
} 