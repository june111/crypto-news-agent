/**
 * 组件预加载工具
 * 在页面加载前预热常用组件，减少首次渲染延迟
 * 取消自动预加载API数据，改为按需加载
 */

// 设置是否已预加载过的标志
let isComponentsPreloaded = false;

// 预加载已导入的模块
export function preloadImports() {
  // 如果在浏览器环境下且尚未预加载过
  if (typeof window !== 'undefined' && !isComponentsPreloaded) {
    console.log('预加载UI组件...');
    isComponentsPreloaded = true;
    
    // 预加载常用的Ant Design组件
    try {
      // 采用更加轻量级的预加载方式
      const preloadModules = async () => {
        // 使用Promise.all并行预加载提升效率
        await Promise.all([
          import('antd/lib/form'),
          import('antd/lib/input'),
          import('antd/lib/button'),
          import('antd/lib/card'),
          import('antd/lib/table'),
          import('antd/lib/select'),
          import('antd/lib/message')
        ]);
        console.debug('UI组件预加载完成');
      };
      
      // 在空闲时间预加载，不阻塞页面渲染
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          preloadModules();
        }, { timeout: 2000 });
      } else {
        // 对于不支持requestIdleCallback的浏览器，延迟执行
        setTimeout(preloadModules, 1000);
      }
    } catch (e) {
      // 忽略预加载错误
      console.debug('UI组件预加载失败，但这不会影响应用功能');
    }
  }
}

// 创建API数据加载函数，用于在需要时手动调用
// 而不是自动预加载所有端点
export function loadApiData(endpoint: string, options = { priority: 'low', headers: {} }) {
  console.debug(`手动加载API数据: ${endpoint}`);
  return fetch(endpoint, { 
    method: 'GET',
    // @ts-ignore - 'priority' 可能不是所有浏览器都支持
    priority: options.priority, 
    headers: { 
      'x-manual-load': '1',
      ...options.headers
    }
  })
  .then(res => res.json())
  .catch(error => {
    console.error(`加载${endpoint}数据失败:`, error);
    return { data: [] };
  });
}

// 同时支持默认导出和具名导出，兼容不同的导入方式
const preloadUtils = {
  preloadImports,
  loadApiData
};

// 默认导出preloadImports函数，以保持向后兼容
export default preloadImports; 