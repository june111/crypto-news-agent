'use client';

import React, { useState, useEffect } from 'react';
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
}

/**
 * 富文本编辑器组件，基于wangEditor
 */
export default function RichTextEditor({ value, onChange, readOnly = false }: RichTextEditorProps) {
  // 编辑器实例状态
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  
  // 编辑器配置
  const toolbarConfig: Partial<IToolbarConfig> = {
    // 配置工具栏，可以根据需要自定义
    excludeKeys: []
  };
  
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入文章正文内容...',
    readOnly: readOnly,
    MENU_CONF: {}
  };
  
  // 组件销毁时销毁编辑器实例
  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);
  
  return (
    <div style={{ border: '1px solid #e8e8e8', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      {!readOnly && (
        <Toolbar
          editor={editor}
          defaultConfig={toolbarConfig}
          mode="default"
          style={{ 
            background: '#fafafa', 
            borderBottom: '1px solid #e8e8e8',
            padding: '8px'
          }}
        />
      )}
      <Editor
        defaultConfig={editorConfig}
        value={value}
        onCreated={setEditor}
        onChange={editor => !readOnly && onChange(editor.getHtml())}
        mode="default"
        style={{ 
          height: '500px', 
          overflowY: 'auto',
          padding: '16px'
        }}
      />
      
      {/* 编辑器底部状态栏 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: '#fafafa',
        borderTop: '1px solid #e8e8e8',
        fontSize: '12px',
        color: '#999'
      }}>
        <div>
          字数: {value.replace(/<[^>]+>/g, '').length || 0}
        </div>
        <div>
          最后编辑: {new Date().toLocaleString('zh-CN')}
        </div>
      </div>
    </div>
  );
} 