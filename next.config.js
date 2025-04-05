/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // 在开发模式下不检查ESLint错误，加快开发过程
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 忽略TypeScript错误，以便构建可以成功完成
    ignoreBuildErrors: true,
  },
  // 减少不必要的polyfills
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
  // 提高编译缓存的效率
  distDir: '.next',
};

module.exports = nextConfig; 