/**
 * 组件预加载工具
 * 在页面加载前预热常用组件，减少首次渲染延迟
 */

// 预加载已导入的模块
export function preloadImports() {
  // 如果在浏览器环境下
  if (typeof window !== 'undefined') {
    // 预加载常用的Ant Design组件
    import('antd/lib/form');
    import('antd/lib/input');
    import('antd/lib/button');
    import('antd/lib/card');
    import('antd/lib/table');
    import('antd/lib/select');
    import('antd/lib/message');
    
    // 预热缓存
    if (!window.__PREFETCHED) {
      window.__PREFETCHED = true;

      // 预加载API数据
      const endpoints = [
        '/api/articles',
        '/api/templates',
        '/api/hot-topics'
      ];
      
      // 在页面加载完成后进行预加载
      if (document.readyState === 'complete') {
        preloadEndpoints(endpoints);
      } else {
        window.addEventListener('load', () => {
          setTimeout(() => {
            preloadEndpoints(endpoints);
          }, 1000); // 等待1秒再进行预加载，避免影响页面加载性能
        });
      }
    }
  }
}

// 预加载API端点数据
function preloadEndpoints(endpoints: string[]) {
  endpoints.forEach(endpoint => {
    try {
      fetch(endpoint, { 
        method: 'GET',
        priority: 'low', // 使用低优先级
        headers: { 'x-preload': '1' }
      })
      .then(res => res.json())
      .then(data => {
        // 存储到本地，但不做任何操作
        console.debug(`预加载${endpoint}完成`);
      })
      .catch(() => {
        // 忽略错误
      });
    } catch (e) {
      // 忽略任何错误
    }
  });
}

// 声明全局变量
declare global {
  interface Window {
    __PREFETCHED?: boolean;
  }
}

export default preloadImports; 