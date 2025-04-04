import './globals.css';
import type { Metadata } from 'next';
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import Script from 'next/script';

export const metadata: Metadata = {
  title: "加密货币新闻管理系统",
  description: "一个用于管理加密货币新闻和文章的管理系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
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
          locale={zhCN}
          theme={{
            token: {
              colorPrimary: '#065E7C',
              colorLink: '#065E7C',
              colorLinkHover: '#03456B',
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
