'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Layout, 
  Menu, 
  Button,
  theme,
  Tooltip
} from 'antd';
import {
  FileTextOutlined,
  FormOutlined,
  FireOutlined,
  LogoutOutlined,
  RocketOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { colors } from '@/styles/theme';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = theme.useToken();
  
  // 管理员信息
  const adminInfo = {
    name: '张文强',
    role: '系统管理员',
  };
  
  // 获取当前选中菜单项的key
  const getSelectedKey = () => {
    const path = pathname;
    if (path.includes('/article/edit')) return 'article-edit';
    if (path.includes('/articles')) return 'articles';
    if (path.includes('/templates')) return 'templates';
    if (path.includes('/ai-tasks')) return 'ai-tasks';
    return 'hot-topics';
  };
  
  // 处理菜单点击事件
  const handleMenuClick = (key: string) => {
    switch (key) {
      case 'hot-topics':
        router.push('/hot-topics');
        break;
      case 'articles':
        router.push('/articles');
        break;
      case 'templates':
        router.push('/templates');
        break;
      case 'ai-tasks':
        router.push('/ai-tasks');
        break;
      default:
        break;
    }
  };
  
  // 处理登出
  const handleLogout = () => {
    // 这里添加登出逻辑
    console.log('登出');
    // 模拟登出后跳转到登录页
    // 实际应用中需要清除token等状态
    alert('已登出系统');
  };

  // 切换折叠状态
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Sider 
      width={220} 
      theme="light"
      collapsed={collapsed}
      style={{
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        background: colors.backgroundLight,
      }}
    >
      {/* Logo 和折叠按钮 */}
      <div style={{ 
        height: '64px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: `1px solid ${token.colorBorder}`,
        background: colors.backgroundLight,
      }}>
        {collapsed ? (
          <span style={{ color: token.colorPrimary, fontSize: '24px', fontWeight: 'bold' }}>CN</span>
        ) : (
          <span style={{ color: token.colorPrimary, fontSize: '18px', fontWeight: 'bold' }}>Crypto News</span>
        )}
        
        <Button 
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleCollapsed}
          style={{ fontSize: '16px' }}
        />
      </div>
      
      {/* 导航菜单 */}
      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        style={{ 
          borderRight: 0,
          background: colors.backgroundLight,
        }}
        items={[
          {
            key: 'content-group',
            type: 'group',
            label: '内容管理',
            children: [
              {
                key: 'hot-topics',
                icon: <FireOutlined />,
                label: '热点列表',
                onClick: () => handleMenuClick('hot-topics'),
              },
              {
                key: 'articles',
                icon: <FileTextOutlined />,
                label: '文章列表',
                onClick: () => handleMenuClick('articles'),
              },
              {
                key: 'templates',
                icon: <FormOutlined />,
                label: '模板列表',
                onClick: () => handleMenuClick('templates'),
              },
            ],
          },
          {
            key: 'system-group',
            type: 'group',
            label: '系统管理',
            children: [
              {
                key: 'ai-tasks',
                icon: <RocketOutlined />,
                label: 'AI任务列表',
                onClick: () => handleMenuClick('ai-tasks'),
              },
            ],
          },
        ]}
      />
      
      {/* 底部区域 - 包含管理员信息和登出按钮 */}
      <div style={{ 
        position: 'absolute', 
        bottom: 0, 
        width: '100%',
        borderTop: `1px solid ${token.colorBorder}`,
        background: colors.backgroundLight,
      }}>
        {/* 管理员信息和登出按钮 */}
        {!collapsed ? (
          <div style={{ 
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: colors.backgroundLight,
          }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>{adminInfo.name}</div>
              <div style={{ fontSize: '12px', color: token.colorTextSecondary }}>{adminInfo.role}</div>
            </div>
            
            <Tooltip title="退出登录">
              <Button 
                type="text" 
                size="small"
                icon={<LogoutOutlined />} 
                onClick={handleLogout}
                danger
              />
            </Tooltip>
          </div>
        ) : (
          <div style={{ 
            padding: '12px 0',
            textAlign: 'center',
            background: colors.backgroundLight,
          }}>
            <Tooltip title="退出登录" placement="right">
              <Button 
                type="text" 
                icon={<LogoutOutlined />} 
                onClick={handleLogout}
                danger
              />
            </Tooltip>
          </div>
        )}
      </div>
    </Sider>
  );
};

export default Sidebar; 