import React, { ComponentType, Suspense } from 'react';
import { Spin } from 'antd';

interface LazyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// 默认的加载状态组件
const DefaultLoading = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <Spin size="large" />
  </div>
);

// 懒加载包装组件
export const LazyLoader: React.FC<LazyProps> = ({ 
  children, 
  fallback = <DefaultLoading /> 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

// 懒加载工厂函数，简化组件导入
export function createLazyComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const LazyComponent = React.lazy(factory);
  
  const WrappedComponent = (props: React.ComponentProps<T>) => (
    <LazyLoader>
      <LazyComponent {...props} />
    </LazyLoader>
  );
  
  // 保留组件显示名称，便于调试
  const componentName = factory.name || 'LazyComponent';
  WrappedComponent.displayName = `Lazy(${componentName})`;
  
  return WrappedComponent;
}

// 使用示例：
// const LazyArticleList = createLazyComponent(() => import('../articles/ArticleList')); 