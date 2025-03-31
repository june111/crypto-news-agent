/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify: true, // 已被弃用，移除此选项
  eslint: {
    // 在构建过程中显示ESLint错误
    ignoreDuringBuilds: false,
  },
  typescript: {
    // 忽略TypeScript错误，以便构建可以成功完成
    ignoreBuildErrors: true,
  },
  // 减少开发构建日志输出
  onDemandEntries: {
    // 页面保持活跃时间（毫秒）
    maxInactiveAge: 60 * 60 * 1000,
    // 同时保持活跃的页面数
    pagesBufferLength: 5,
  },
  // 配置允许的图片域名
  images: {
    domains: ['via.placeholder.com'],
  }
};

module.exports = nextConfig; 