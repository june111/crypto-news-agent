'use client';

import React, { useState, useEffect } from 'react';
import { message, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styles from '../../articles.module.css';

interface ImageUploaderProps {
  coverImage: string;
  setCoverImage: (url: string) => void;
  disabled?: boolean;
}

/**
 * 图片上传组件，用于文章封面图片的上传和预览
 */
export default function ImageUploader({ coverImage, setCoverImage, disabled = false }: ImageUploaderProps) {
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isHover, setIsHover] = useState(false);
  
  // 组件挂载时设置初始图片
  useEffect(() => {
    if (coverImage) {
      setFileList([{
        uid: '-1',
        name: '封面图片',
        status: 'done',
        url: coverImage,
      }]);
    } else {
      setFileList([]);
    }
  }, [coverImage]);
  
  // 获取组件
  const [UploadComponent, setUploadComponent] = useState<any>(null);
  const [ModalComponent, setModalComponent] = useState<any>(null);
  const [TypographyComponent, setTypographyComponent] = useState<any>(null);
  const [notificationComponent, setNotificationComponent] = useState<any>(null);
  
  useEffect(() => {
    // 如果没有禁用，才加载上传组件
    if (!disabled) {
      Promise.all([
        import('antd/lib/upload').then(mod => setUploadComponent(() => mod.default)),
        import('antd/lib/modal').then(mod => setModalComponent(() => mod.default)),
        import('antd/lib/typography').then(mod => setTypographyComponent(() => mod.default)),
        import('antd/lib/notification').then(mod => setNotificationComponent(() => mod.default))
      ]);
    }
  }, [disabled]);
  
  // 图片上传前校验
  const beforeUpload = (file: File) => {
    // 验证文件类型
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
      return false;
    }
    
    // 验证文件大小 (最大5MB)
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片必须小于5MB!');
      return false;
    }
    
    return true;
  };
  
  // 处理上传状态变化
  const handleChange = ({ file, fileList }: any) => {
    // 克隆文件列表以避免副作用
    const newFileList = [...fileList];
    
    // 限制只显示最新上传的一张图片
    const latestFile = newFileList.slice(-1);
    setFileList(latestFile);
    
    // 处理上传状态
    if (file.status === 'uploading') {
      setUploading(true);
    } else if (file.status === 'done') {
      setUploading(false);
      
      // 服务器返回的URL
      if (file.response && file.response.url) {
        setCoverImage(file.response.url);
        
        // 显示适当的消息
        if (file.response.warning) {
          // 使用notification代替message显示更友好的警告
          if (notificationComponent) {
            notificationComponent.warning({
              message: '上传提示',
              description: file.response.warning,
              placement: 'bottomRight'
            });
          } else {
            message.warning(file.response.warning);
          }
        } else {
          // 使用notification代替message显示更友好的成功消息
          if (notificationComponent) {
            notificationComponent.success({
              message: '上传成功',
              description: '封面图片已成功上传',
              placement: 'bottomRight'
            });
          } else {
            message.success('封面图上传成功');
          }
        }
      }
    } else if (file.status === 'error') {
      setUploading(false);
      
      // 使用notification显示更详细的错误
      if (notificationComponent) {
        notificationComponent.error({
          message: '上传失败',
          description: '图片上传失败，将使用本地预览。发布时可能无法显示此图片。',
          placement: 'bottomRight'
        });
      } else {
        message.error('图片上传失败，请重试');
      }
      
      // 尝试本地预览
      if (file.originFileObj) {
        getBase64(file.originFileObj, (url: string) => {
          setCoverImage(url);
          if (!notificationComponent) message.warning('使用本地预览，未保存到服务器');
        });
      }
    }
  };
  
  // 将文件转换为base64
  const getBase64 = (file: File, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result as string));
    reader.readAsDataURL(file);
  };
  
  // 处理图片预览
  const handlePreview = async (file: any) => {
    if (!file.url && !file.preview) {
      file.preview = await new Promise(resolve => {
        if (file.originFileObj) {
          getBase64(file.originFileObj, (url: string) => resolve(url));
        } else {
          resolve('');
        }
      });
    }
    
    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
  };
  
  // 关闭预览
  const handleCancel = () => setPreviewVisible(false);
  
  // 构建上传按钮UI
  const renderUploadButton = () => {
    const baseStyle = {
      display: 'flex', 
      flexDirection: 'column' as const, 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100%',
      padding: '8px',
      cursor: 'pointer',
    };
    
    return (
      <div 
        style={baseStyle} 
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        {uploading ? (
          <Spin size="small" />
        ) : (
          <div style={{ fontSize: '22px', color: '#8c8c8c' }}>
            <PlusOutlined />
          </div>
        )}
        <div style={{ marginTop: 4, fontSize: '12px', color: '#8c8c8c' }}>
          {uploading ? '上传中...' : '上传图片'}
        </div>
      </div>
    );
  };
  
  // 如果禁用或者组件未加载，只显示预览
  if (disabled) {
    return coverImage ? (
      <div className={styles.uploadContainer}>
        <div className={styles.previewImage}>
          <img src={coverImage} alt="封面图片" style={{ width: '100%', height: 'auto' }} />
        </div>
      </div>
    ) : (
      <div className={styles.uploadContainer}>
        <div style={{ color: '#999', textAlign: 'center' }}>无封面图片</div>
      </div>
    );
  }
  
  if (!UploadComponent || !ModalComponent) {
    return (
      <div className={styles.uploadContainer}>
        <Spin size="small" />
        <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>加载中...</div>
      </div>
    );
  }
  
  return (
    <div>
      <div className={styles.uploadHint}>
        <TypographyComponent.Text type="secondary" style={{ fontSize: '12px' }}>
          支持JPG、PNG、GIF、WebP格式，最大5MB
        </TypographyComponent.Text>
      </div>
      
      <UploadComponent
        action="/api/upload"
        listType="picture-card"
        className={styles.uploader}
        fileList={fileList}
        beforeUpload={beforeUpload}
        onChange={handleChange}
        onPreview={handlePreview}
        accept="image/jpeg,image/png,image/gif,image/webp"
        name="file"
        maxCount={1}
      >
        {fileList.length >= 1 ? null : renderUploadButton()}
      </UploadComponent>
      
      <ModalComponent
        open={previewVisible}
        title="封面图预览"
        footer={null}
        onCancel={handleCancel}
        centered
        width={800}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ 
          maxHeight: '80vh', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          background: '#f0f0f0',
          overflow: 'auto' 
        }}>
          <img 
            alt="封面图预览" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '80vh',
              objectFit: 'contain',
              margin: '0 auto'
            }} 
            src={previewImage} 
          />
        </div>
      </ModalComponent>
    </div>
  );
} 