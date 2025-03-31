'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import { colors } from '@/styles/theme';
import preloadImports from '@/lib/utils/preloadComponents';

const { Content } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  
  useEffect(() => {
    preloadImports();
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