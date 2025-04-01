# Next.js 性能优化指南

本文档提供了一系列优化Next.js应用性能的最佳实践，特别是在开发模式下提升速度。

## 开发模式优化

1. **增加Node.js内存**
   ```bash
   # 在package.json中设置
   "dev": "NODE_OPTIONS='--max-old-space-size=4096' next dev"
   ```

2. **使用更快速的源映射**
   ```js
   // next.config.js
   webpack: (config, { dev }) => {
     if (dev) {
       config.devtool = 'eval-source-map';
     }
     return config;
   }
   ```

3. **禁用开发模式下的ESLint检查**
   ```js
   // next.config.js
   eslint: {
     ignoreDuringBuilds: true,
   }
   ```

4. **使用Turbopack (Next.js 13+)**
   ```bash
   next dev --turbo
   ```

## 组件优化

1. **组件懒加载**
   ```jsx
   import dynamic from 'next/dynamic';
   
   const DynamicComponent = dynamic(() => import('../components/MyComponent'), {
     loading: () => <p>加载中...</p>,
   });
   ```

2. **使用React.memo避免不必要的重渲染**
   ```jsx
   const MyComponent = React.memo(function MyComponent(props) {
     // 组件逻辑
   });
   ```

3. **使用useMemo和useCallback优化**
   ```jsx
   const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
   const memoizedCallback = useCallback(() => { doSomething(a, b); }, [a, b]);
   ```

## 数据获取优化

1. **使用缓存减少重复请求**
   ```jsx
   import { useCachedFetch } from '@/hooks';
   
   function MyComponent() {
     const { data, loading } = useCachedFetch('/api/data');
     // 组件逻辑
   }
   ```

2. **使用SWR或React Query**
   ```jsx
   import useSWR from 'swr';
   
   function Profile() {
     const { data, error } = useSWR('/api/user', fetcher);
     // 组件逻辑
   }
   ```

3. **批量获取数据，减少API请求次数**

## 资源优化

1. **优化图片**
   ```jsx
   import Image from 'next/image';
   
   <Image
     src="/profile.jpg"
     width={500}
     height={300}
     priority
     alt="Profile"
   />
   ```

2. **使用字体优化**
   ```jsx
   import { Inter } from 'next/font/google';
   
   const inter = Inter({ subsets: ['latin'] });
   ```

3. **代码分割和按需加载**
   ```jsx
   // 按需导入大型依赖
   const handleClick = async () => {
     const momentLib = await import('moment');
     const moment = momentLib.default;
     // 使用moment
   };
   ```

## 打包优化

1. **分析包大小**
   ```bash
   # 安装分析工具
   npm install --save-dev @next/bundle-analyzer
   
   # 在next.config.js中配置
   const withBundleAnalyzer = require('@next/bundle-analyzer')({
     enabled: process.env.ANALYZE === 'true',
   });
   module.exports = withBundleAnalyzer({
     // 配置
   });
   
   # 运行分析
   ANALYZE=true npm run build
   ```

2. **优化导入，避免引入全部库**
   ```js
   // 不好的做法
   import _ from 'lodash';
   
   // 好的做法
   import debounce from 'lodash/debounce';
   ```

3. **配置experimental.optimizePackageImports**
   ```js
   // next.config.js
   experimental: {
     optimizePackageImports: ['antd', '@ant-design/icons'],
   }
   ```

## 部署优化

1. **使用ISR缓存页面**
   ```jsx
   export async function getStaticProps() {
     return {
       props: { data },
       revalidate: 60, // 每60秒重新验证
     };
   }
   ```

2. **配置HTTP缓存**
   ```js
   // next.config.js
   headers: async () => [
     {
       source: '/(.*)',
       headers: [
         {
           key: 'Cache-Control',
           value: 'public, max-age=31536000, immutable',
         },
       ],
     },
   ],
   ```

3. **使用CDN加速静态资源**

## 性能监控

1. **使用Next.js内置的Web Vitals监控**
   ```jsx
   // pages/_app.js
   export function reportWebVitals(metric) {
     console.log(metric);
     // 发送到分析服务
   }
   ```

2. **使用Lighthouse进行性能审计**

3. **使用Chrome Performance工具分析性能瓶颈**

## 常见问题解决

1. **页面加载慢**
   - 检查组件渲染是否频繁
   - 检查网络请求是否过多
   - 使用React DevTools的Profiler

2. **开发服务器启动慢**
   - 清理node_modules并重新安装
   - 使用更快的包管理器(pnpm)
   - 重启开发环境

3. **热更新慢**
   - 减少页面组件数量
   - 优化组件结构
   - 使用next.config.js的onDemandEntries配置 