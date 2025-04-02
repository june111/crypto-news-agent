'use client';

import React, { ReactNode } from 'react';
import { Typography, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface FormFieldProps {
  label: string;
  required?: boolean;
  tooltip?: string;
  children: ReactNode;
  error?: string;
}

/**
 * 表单字段通用组件，提供标签、提示和错误信息显示
 */
export default function FormField({
  label,
  required = false,
  tooltip,
  children,
  error
}: FormFieldProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <label style={{ 
          fontWeight: 500,
          color: 'rgba(0, 0, 0, 0.85)',
          fontSize: '14px'
        }}>
          {required && (
            <span style={{ color: '#ff4d4f', marginRight: '4px' }}>*</span>
          )}
          {label}
        </label>
        
        {tooltip && (
          <Tooltip title={tooltip} placement="top">
            <InfoCircleOutlined style={{ 
              marginLeft: '8px', 
              color: 'rgba(0, 0, 0, 0.45)',
              fontSize: '14px',
              cursor: 'pointer'
            }} />
          </Tooltip>
        )}
      </div>
      
      {children}
      
      {error && (
        <Text type="danger" style={{ 
          display: 'block',
          fontSize: '12px',
          lineHeight: '20px',
          marginTop: '6px'
        }}>
          {error}
        </Text>
      )}
    </div>
  );
} 