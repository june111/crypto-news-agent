import './globals.css';
import type { Metadata } from 'next';
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import Script from 'next/script';
import { getLocale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: "加密货币新闻管理系统",
  description: "一个用于管理加密货币新闻和文章的管理系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 如果是服务器端渲染，默认使用中文
  const locale = typeof window !== 'undefined' ? getLocale() : 'zh';
  const antLocale = locale === 'en' ? enUS : zhCN;
  
  return (
    <html lang={locale === 'en' ? 'en' : 'zh-CN'}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --font-family: 'Inter', system-ui, sans-serif;
          }
        `}} />
        {/* 运行时配置脚本 */}
        <Script src="/config.js" strategy="beforeInteractive" />
      </head>
      <body className="font-inter">
        <ConfigProvider
          locale={antLocale}
          theme={{
            token: {
              colorPrimary: '#1890ff',
              colorLink: '#1890ff',
              colorLinkHover: '#40a9ff',
              borderRadius: 4
            }
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
