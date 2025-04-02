'use client';

import React, { useState, useEffect } from 'react';

interface SectionTitleProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5;
}

/**
 * 标题组件，用于显示各级标题
 * 懒加载Typography.Title组件
 */
export default function SectionTitle({ children, level = 5 }: SectionTitleProps) {
  const [TitleComponent, setTitleComponent] = useState<any>(null);
  
  useEffect(() => {
    import('antd/lib/typography/Title').then(
      mod => setTitleComponent(() => mod.default)
    );
  }, []);
  
  if (!TitleComponent) {
    return (
      <div style={{ 
        height: '24px', 
        marginBottom: '16px',
        fontWeight: 'bold',
        fontSize: level === 5 ? '16px' : '20px'
      }}>
        {children}
      </div>
    );
  }
  
  return <TitleComponent level={level}>{children}</TitleComponent>;
} 