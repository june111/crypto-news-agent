'use client';

import { useState, useEffect } from 'react';
import { getLocale, type Locale } from '@/lib/i18n';
import zhMessages from '@/locales/zh.json';
import enMessages from '@/locales/en.json';

const messages = {
  zh: zhMessages,
  en: enMessages
};

type MessagePath = string | string[];

const useI18n = () => {
  const [locale, setLocale] = useState<Locale>('zh');
  
  useEffect(() => {
    try {
      const currentLocale = getLocale();
      console.log('useI18n hook - 当前语言:', currentLocale);
      setLocale(currentLocale);
    } catch (error) {
      console.error('useI18n hook - 获取语言设置失败:', error);
      setLocale('zh'); // 出错时使用默认语言
    }
  }, []);
  
  const t = (path: MessagePath): string => {
    try {
      // 先转换路径为数组
      const keys = Array.isArray(path) ? path : path.split('.');
      
      // 获取当前语言的消息
      const currentMessages = messages[locale];
      if (!currentMessages) {
        console.warn(`useI18n hook - 未找到语言包: ${locale}`);
        return Array.isArray(path) ? path.join('.') : path;
      }
      
      // 按路径深入获取翻译
      const translation = keys.reduce((obj, key) => {
        if (obj && typeof obj === 'object' && key in obj) {
          return obj[key];
        }
        return undefined;
      }, currentMessages as any);
      
      // 如果找到翻译就返回，否则返回原始路径
      if (translation !== undefined) {
        return translation;
      }
      
      console.warn(`useI18n hook - 未找到翻译路径: ${Array.isArray(path) ? path.join('.') : path}`);
      return Array.isArray(path) ? path.join('.') : path;
    } catch (e) {
      console.error(`useI18n hook - 翻译出错 (${path}):`, e);
      return Array.isArray(path) ? path.join('.') : path;
    }
  };
  
  return { t, locale };
};

export default useI18n; 