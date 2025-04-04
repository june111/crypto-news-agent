'use client';

import React, { useEffect, useState } from 'react';
import { Button, Tooltip, message } from 'antd';
import { TranslationOutlined } from '@ant-design/icons';
import { getLocale, setLocale, type Locale } from '@/lib/i18n';

const LanguageSwitcher: React.FC = () => {
  const [currentLocale, setCurrentLocale] = useState<Locale>('zh');
  
  useEffect(() => {
    try {
      // 安全地获取当前语言
      const locale = getLocale();
      setCurrentLocale(locale);
      console.log('当前语言:', locale);
    } catch (error) {
      console.error('获取语言设置失败:', error);
    }
  }, []);
  
  const toggleLanguage = () => {
    try {
      console.log('切换语言，当前语言:', currentLocale);
      const newLocale = currentLocale === 'zh' ? 'en' : 'zh';
      
      // 保存新语言设置
      setLocale(newLocale);
      setCurrentLocale(newLocale);
      
      // 显示切换消息
      message.success(`正在切换到${newLocale === 'zh' ? '中文' : '英文'}...`);
      
      // 延迟一下再刷新，确保消息能显示
      setTimeout(() => {
        console.log('刷新页面应用新语言:', newLocale);
        // 强制重新加载页面
        window.location.href = window.location.pathname;
      }, 500);
    } catch (error) {
      console.error('切换语言失败:', error);
      message.error('切换语言失败');
    }
  };
  
  return (
    <Tooltip title={currentLocale === 'zh' ? "Switch to English" : "切换到中文"}>
      <Button
        type="text"
        icon={<TranslationOutlined />}
        onClick={toggleLanguage}
        aria-label="切换语言"
        style={{ color: 'inherit' }}
      />
    </Tooltip>
  );
};

export default LanguageSwitcher; 