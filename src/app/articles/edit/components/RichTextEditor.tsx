'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { 
  BoldOutlined, 
  ItalicOutlined, 
  UnderlineOutlined, 
  OrderedListOutlined, 
  UnorderedListOutlined, 
  AlignLeftOutlined,
  AlignCenterOutlined, 
  AlignRightOutlined,
  LinkOutlined,
  PictureOutlined,
  UndoOutlined,
  RedoOutlined
} from '@ant-design/icons';
import { Button, Tooltip, Space, Divider } from 'antd';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
}

/**
 * 富文本编辑器组件，基于Tiptap
 */
export default function RichTextEditor({ value, onChange, readOnly = false }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // 当value属性变化时更新编辑器内容
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // 按钮样式
  const buttonStyle = { 
    padding: '0 8px', 
    fontSize: '14px' 
  };
  
  // 设置活动按钮的样式
  const isActive = (type: string, attrs?: Record<string, any>) => {
    if (!editor) return false;
    
    return editor.isActive(type, attrs || {});
  };

  const addImage = () => {
    const url = window.prompt('输入图片URL');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const url = window.prompt('输入链接URL');
    if (url === null) {
      return;
    }
    
    if (url === '') {
      editor?.chain().focus().unsetLink().run();
      return;
    }
    
    editor?.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div style={{ border: '1px solid #e8e8e8', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      {!readOnly && editor && (
        <div style={{ 
          background: '#fafafa', 
          borderBottom: '1px solid #e8e8e8',
          padding: '8px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px'
        }}>
          <Space>
            <Tooltip title="加粗">
              <Button 
                type={isActive('bold') ? 'primary' : 'text'} 
                icon={<BoldOutlined />} 
                onClick={() => editor.chain().focus().toggleBold().run()}
                style={buttonStyle}
              />
            </Tooltip>
            
            <Tooltip title="斜体">
              <Button 
                type={isActive('italic') ? 'primary' : 'text'} 
                icon={<ItalicOutlined />} 
                onClick={() => editor.chain().focus().toggleItalic().run()}
                style={buttonStyle}
              />
            </Tooltip>
            
            <Tooltip title="下划线">
              <Button 
                type={isActive('underline') ? 'primary' : 'text'} 
                icon={<UnderlineOutlined />} 
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                style={buttonStyle}
              />
            </Tooltip>
          </Space>
          
          <Divider type="vertical" />
          
          <Space>
            <Tooltip title="有序列表">
              <Button 
                type={isActive('orderedList') ? 'primary' : 'text'} 
                icon={<OrderedListOutlined />} 
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                style={buttonStyle}
              />
            </Tooltip>
            
            <Tooltip title="无序列表">
              <Button 
                type={isActive('bulletList') ? 'primary' : 'text'} 
                icon={<UnorderedListOutlined />} 
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                style={buttonStyle}
              />
            </Tooltip>
          </Space>
          
          <Divider type="vertical" />
          
          <Space>
            <Tooltip title="居左对齐">
              <Button 
                type={isActive('textAlign', { textAlign: 'left' }) ? 'primary' : 'text'} 
                icon={<AlignLeftOutlined />} 
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                style={buttonStyle}
              />
            </Tooltip>
            
            <Tooltip title="居中对齐">
              <Button 
                type={isActive('textAlign', { textAlign: 'center' }) ? 'primary' : 'text'} 
                icon={<AlignCenterOutlined />} 
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                style={buttonStyle}
              />
            </Tooltip>
            
            <Tooltip title="居右对齐">
              <Button 
                type={isActive('textAlign', { textAlign: 'right' }) ? 'primary' : 'text'} 
                icon={<AlignRightOutlined />} 
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                style={buttonStyle}
              />
            </Tooltip>
          </Space>
          
          <Divider type="vertical" />
          
          <Space>
            <Tooltip title="添加链接">
              <Button 
                type={isActive('link') ? 'primary' : 'text'} 
                icon={<LinkOutlined />} 
                onClick={setLink}
                style={buttonStyle}
              />
            </Tooltip>
            
            <Tooltip title="添加图片">
              <Button 
                type="text" 
                icon={<PictureOutlined />} 
                onClick={addImage}
                style={buttonStyle}
              />
            </Tooltip>
          </Space>
          
          <Divider type="vertical" />
          
          <Space>
            <Tooltip title="撤销">
              <Button 
                type="text" 
                icon={<UndoOutlined />} 
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                style={buttonStyle}
              />
            </Tooltip>
            
            <Tooltip title="重做">
              <Button 
                type="text" 
                icon={<RedoOutlined />} 
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                style={buttonStyle}
              />
            </Tooltip>
          </Space>
        </div>
      )}
      
      <div style={{ 
        height: '500px', 
        overflowY: 'auto',
        padding: '16px'
      }}>
        <EditorContent editor={editor} />
      </div>
      
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