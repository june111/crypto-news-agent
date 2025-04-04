// 支持的语言
export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];

// 安全地访问localStorage的辅助函数
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error('读取localStorage失败:', error);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('写入localStorage失败:', error);
    }
  }
};

// 获取本地语言 - 默认中文
export function getLocale(): Locale {
  try {
    if (typeof window === 'undefined') return 'zh';
    
    const storedLocale = safeLocalStorage.getItem('locale') as Locale;
    if (storedLocale && locales.includes(storedLocale)) {
      console.log('从localStorage获取语言设置:', storedLocale);
      return storedLocale;
    }
  } catch (error) {
    console.error('获取语言设置出错:', error);
  }
  
  console.log('使用默认语言设置: zh');
  return 'zh';
}

// 设置本地语言
export function setLocale(locale: Locale): void {
  try {
    if (typeof window !== 'undefined') {
      console.log('保存语言设置到localStorage:', locale);
      safeLocalStorage.setItem('locale', locale);
    }
  } catch (error) {
    console.error('保存语言设置失败:', error);
  }
}

// 获取语言包
export async function getMessages(locale: Locale) {
  console.log('加载语言包:', locale);
  try {
    return (await import(`../locales/${locale}.json`)).default;
  } catch (error) {
    console.error(`加载语言包失败 ${locale}:`, error);
    // 如果加载失败，返回空对象而不是崩溃
    return {};
  }
}

// 国际化上下文提供者
export const I18nProvider = ({ children, locale }: { children: React.ReactNode, locale: Locale }) => {
  const messages = getMessages(locale);
  return children;
};
