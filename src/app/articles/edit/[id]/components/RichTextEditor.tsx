import React, { useState, useEffect, useRef } from 'react';
import { Spin } from 'antd';

// 导入样式
import styles from '../../../articles.module.css';

// 扩展全局Window接口以包含动态添加的编辑器属性
declare global {
  interface Window {
    wangEditor?: any;
    wangEditorReact?: any;
  }
}

// 直接导入类型而非整个库
interface RichTextEditorProps {
  initialValue: string;
  onChange: (html: string) => void;
}

// 进一步优化的资源加载策略
const WANGEDITOR_CDN_CSS = 'https://unpkg.com/@wangeditor/editor@latest/dist/css/style.css';
const WANGEDITOR_CDN_JS = {
  editor: 'https://unpkg.com/@wangeditor/editor@5.1.23/dist/index.js',
  editorForReact: 'https://unpkg.com/@wangeditor/editor-for-react@1.0.6/dist/index.js'
};

// 使用轻量级方式懒加载
const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialValue, onChange }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [editor, setEditor] = useState<any>(null);
  const [html, setHtml] = useState(initialValue || '');
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);
  
  // 使用脚本加载器代替导入
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 检查脚本是否已加载
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => resolve();
      script.onerror = (e) => reject(new Error(`加载脚本失败: ${src}`));
      
      document.body.appendChild(script);
    });
  };
  
  // 初始化编辑器
  useEffect(() => {
    // 清理函数设置
    return () => {
      isMounted.current = false;
      if (editor) {
        try {
          editor.destroy();
        } catch (e) {
          console.error('销毁编辑器失败:', e);
        }
      }
    };
  }, []);
  
  // 分离加载逻辑，避免不必要的重复请求
  useEffect(() => {
    let editorInstance: any = null;
    
    const loadEditor = async () => {
      try {
        // 1. 加载CSS
        if (!document.querySelector(`link[href="${WANGEDITOR_CDN_CSS}"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = WANGEDITOR_CDN_CSS;
          document.head.appendChild(link);
        }
        
        // 2. 使用 Promise.all 并行加载所有资源
        try {
          // 如果支持动态导入，使用动态导入（更安全）
          const [editorModule, reactEditorModule] = await Promise.all([
            import('@wangeditor/editor'),
            import('@wangeditor/editor-for-react')
          ]);
          
          initEditor(editorModule, reactEditorModule);
        } catch (importError) {
          console.log('备用CDN加载编辑器...');
          
          // 备用方案：使用CDN
          await Promise.all([
            loadScript(WANGEDITOR_CDN_JS.editor),
            loadScript(WANGEDITOR_CDN_JS.editorForReact)
          ]);
          
          // 等待脚本加载并初始化
          setTimeout(() => {
            // 使用可选链和类型判断，避免类型错误
            if (window.wangEditor && window.wangEditorReact) {
              initEditor(window.wangEditor, window.wangEditorReact);
            } else {
              console.error('编辑器未能正确加载');
            }
          }, 500);
        }
      } catch (error) {
        console.error('加载编辑器失败:', error);
      }
    };
    
    // 编辑器初始化函数
    const initEditor = (editorModule: any, reactEditorModule: any) => {
      if (!isMounted.current || !editorRef.current || !toolbarRef.current) return;
      
      try {
        // 初始化编辑器
        const { createEditor, createToolbar } = editorModule;
        
        // 创建实例 - 确保使用空字符串作为默认值
        editorInstance = createEditor({
          selector: editorRef.current,
          html: initialValue || '',
          config: {
            placeholder: '请输入文章正文内容...',
            MENU_CONF: {}
          },
          mode: 'default'
        });
        
        // 创建工具栏
        createToolbar({
          editor: editorInstance,
          selector: toolbarRef.current,
          mode: 'default',
          config: {}
        });
        
        // 监听内容变化 - 使用节流减少更新频率
        let lastChangeTime = 0;
        editorInstance.on('change', () => {
          const now = Date.now();
          if (now - lastChangeTime > 300) { // 300ms节流
            lastChangeTime = now;
            const content = editorInstance.getHtml();
            setHtml(content);
            onChange(content);
          }
        });
        
        // 保存实例
        setEditor(editorInstance);
        setIsLoaded(true);
      } catch (error) {
        console.error('初始化编辑器失败:', error);
      }
    };
    
    // 开始加载
    loadEditor();
  }, []);
  
  // 更新内容处理
  useEffect(() => {
    if (editor) {
      // 确保编辑器内容与传入的initialValue保持同步
      // 如果initialValue是空字符串或undefined，就清空编辑器
      const contentToSet = initialValue || '';
      if (contentToSet !== html) {
        editor.setHtml(contentToSet);
        setHtml(contentToSet);
      }
    }
  }, [initialValue, editor, html]);
  
  return (
    <div className={styles.editorContainer}>
      <div
        ref={toolbarRef}
        className={styles.toolbar}
        style={{ 
          border: '1px solid #ccc',
          borderBottom: 'none'
        }}
      />
      <div 
        ref={editorRef}
        className={styles.editor}
        style={{
          height: '500px',
          overflowY: 'auto',
          border: '1px solid #ccc'
        }}
      >
        {!isLoaded && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%'
          }}>
            <Spin size="large" tip="正在加载编辑器..." />
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor; 