'use client';

import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface FullscreenLoadingProps {
  visible: boolean;
  text?: string;
}

/**
 * 全屏加载组件，用于显示全屏加载状态
 * 用于保存文章等需要锁定用户界面的操作
 */
const FullscreenLoading: React.FC<FullscreenLoadingProps> = ({
  visible,
  text = '保存中...'
}) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        <div>{text}</div>
      </div>
    </div>
  );
};

export default FullscreenLoading; 