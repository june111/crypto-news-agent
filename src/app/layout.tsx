import type { Metadata } from "next";
import "./globals.css";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

export const metadata: Metadata = {
  title: "加密货币新闻管理系统",
  description: "一个用于管理加密货币新闻和文章的管理系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        />
        <style dangerouslySetInnerHTML={{ __html: `
          /* 备用字体加载 */
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: local('Inter Regular'), local('Inter-Regular'), local('sans-serif');
          }
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 500;
            font-display: swap;
            src: local('Inter Medium'), local('Inter-Medium'), local('sans-serif-medium');
          }
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 600;
            font-display: swap;
            src: local('Inter SemiBold'), local('Inter-SemiBold'), local('sans-serif-semibold');
          }
        `}} />
      </head>
      <body className="font-inter">
        <ConfigProvider
          locale={zhCN}
          theme={{
            token: {
              colorPrimary: "#1890ff",
              borderRadius: 4,
              fontSize: 14,
            },
            components: {
              Menu: {
                itemBg: "transparent",
              },
              Layout: {
                bodyBg: "#f0f2f5",
              },
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
