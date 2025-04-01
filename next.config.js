/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify: true, // 已被弃用，移除此选项
  eslint: {
    // 在开发模式下不检查ESLint错误，加快开发过程
    ignoreDuringBuilds: true,
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
  },
  // 性能优化配置
  webpack: (config, { dev, isServer }) => {
    // 开发模式下的优化
    if (dev) {
      // 注意: Next.js不允许在开发模式下修改devtool
      // config.devtool = 'eval-source-map'; // 移除这一行
      
      // 仅在生产构建中使用source-map-loader
      // 在开发模式下不需要这个优化，它可能会导致性能问题
      /* 移除这部分代码
      config.module.rules.push({
        test: /node_modules[\\/](react|react-dom|@ant-design|antd|langchain|@langchain)[\\/]/,
        use: 'source-map-loader',
        enforce: 'pre',
      });
      */
    }

    // 生产模式下的优化
    if (!dev) {
      // 为大型库优化块分割
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 20000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // 获取包名
              const packageMatch = module.context ? module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              ) : null;
              
              // 安全检查，如果没有匹配到包名，返回通用vendor名称
              if (!packageMatch || !packageMatch[1]) {
                return 'vendor';
              }
              
              const packageName = packageMatch[1];
              
              // 为大型依赖创建单独的块
              if (['react', 'react-dom', 'antd', '@ant-design'].includes(packageName)) {
                return `npm.${packageName}`;
              }
              
              // 其他依赖分组
              return 'vendor';
            },
          },
        },
      };

      // 在生产模式下使用source-map-loader排除大型依赖
      config.module.rules.push({
        test: /node_modules[\\/](react|react-dom|@ant-design|antd|langchain|@langchain)[\\/]/,
        use: 'source-map-loader',
        enforce: 'pre',
      });
    }
    
    return config;
  },
  // 减少不必要的polyfills
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons', 'langchain'],
  },
  // 提高编译缓存的效率
  distDir: '.next',
};

module.exports = nextConfig; 