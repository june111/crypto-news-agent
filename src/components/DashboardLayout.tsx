'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import { colors } from '@/styles/theme';

const { Content } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// 预加载关键组件函数
const preloadImports = () => {
  // 预加载可能会用到的组件
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  
  useEffect(() => {
    // 只在组件挂载时执行预加载
    preloadImports();
    
    // 这里不需要返回清理函数，因为preloadImports不会设置任何需要清理的资源
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Layout style={{ 
        marginLeft: collapsed ? 80 : 220,
        transition: 'margin-left 0.2s',
        background: colors.backgroundLight 
      }}>
        <Content style={{ 
          padding: '24px', 
          margin: '24px',
          background: colors.white,
          borderRadius: '8px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout; 