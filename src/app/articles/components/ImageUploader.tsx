'use client';

import React, { useState } from 'react';
import { Upload, Button, message, Spin, Modal } from 'antd';
import { UploadOutlined, PictureOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import Image from 'next/image';

interface ImageUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  label?: string;
  maxCount?: number;
  showPreview?: boolean;
  previewWidth?: number;
  previewHeight?: number;
}

/**
 * 图片上传组件
 * 支持上传图片到Supabase并返回URL
 */
const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = '上传图片',
  maxCount = 1,
  showPreview = true,
  previewWidth = 200,
  previewHeight = 150
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  
  // 当有图片URL时，显示已有图片
  React.useEffect(() => {
    if (value && fileList.length === 0) {
      setFileList([
        {
          uid: '-1',
          name: '当前图片',
          status: 'done',
          url: value,
          thumbUrl: value
        }
      ]);
    }
  }, [value, fileList.length]);
  
  // 处理图片上传前的验证
  const beforeUpload = (file: File) => {
    // 检查文件类型
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
      return false;
    }
    
    // 检查文件大小 (5MB限制)
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过5MB!');
      return false;
    }
    
    return true;
  };
  
  // 自定义上传行为
  const customUpload = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;
    
    // 创建FormData
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setUploading(true);
      
      // 调用图片上传API
      const response = await fetch('/api/images', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上传失败');
      }
      
      const data = await response.json();
      
      // 上传成功
      onSuccess(data, file);
      
      // 设置返回的URL
      if (onChange && data.url) {
        onChange(data.url);
      }
      
      message.success('图片上传成功!');
    } catch (error) {
      console.error('图片上传错误:', error);
      onError(error);
      message.error(`图片上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setUploading(false);
    }
  };
  
  // 处理上传状态变化
  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };
  
  // 预览图片
  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      return;
    }
    
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };
  
  // 关闭预览
  const handlePreviewCancel = () => {
    setPreviewOpen(false);
  };
  
  return (
    <div style={{ marginBottom: 16 }}>
      <Upload
        listType="picture-card"
        fileList={fileList}
        beforeUpload={beforeUpload}
        customRequest={customUpload}
        onChange={handleChange}
        onPreview={handlePreview}
        maxCount={maxCount}
      >
        {fileList.length >= maxCount ? null : (
          <div>
            {uploading ? <LoadingOutlined /> : <UploadOutlined />}
            <div style={{ marginTop: 8 }}>{label}</div>
          </div>
        )}
      </Upload>
      
      {/* 图片预览模态框 */}
      <Modal
        open={previewOpen}
        title="图片预览"
        footer={null}
        onCancel={handlePreviewCancel}
      >
        <img
          alt="图片预览"
          style={{ width: '100%' }}
          src={previewImage}
        />
      </Modal>
      
      {/* 如果有图片URL且需要预览，显示预览图 */}
      {showPreview && value && (
        <div style={{ marginTop: 8 }}>
          <div style={{ position: 'relative', width: previewWidth, height: previewHeight }}>
            <Image
              src={value}
              alt="预览图片"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 