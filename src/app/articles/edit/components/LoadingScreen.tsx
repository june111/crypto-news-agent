'use client';

import { Spin } from 'antd';

interface LoadingScreenProps {
  tip: string;
}

/**
 * 共享的加载屏幕组件，用于显示加载状态和提示信息
 */
export default function LoadingScreen({ tip }: LoadingScreenProps) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <Spin size="large" tip={tip} />
    </div>
  );
} 