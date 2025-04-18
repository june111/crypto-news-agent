'use client';

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Input, 
  Space, 
  Typography, 
  Select, 
  Button, 
  Tag, 
  Form,
  InputNumber
} from 'antd';
import { 
  PlusOutlined, 
  FireOutlined, 
  LinkOutlined
} from '@ant-design/icons';
import useI18n from '@/hooks/useI18n';

const { Text } = Typography;
const { Option } = Select;

interface AddTopicModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  sourceOptions: { label: string; value: string }[];
  setSourceOptions: React.Dispatch<React.SetStateAction<{ label: string; value: string }[]>>;
  saveSourcesLocally: (sources: { label: string; value: string }[]) => void;
  keyword: string;
  setKeyword: React.Dispatch<React.SetStateAction<string>>;
  volume: number;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
  source: string;
  setSource: React.Dispatch<React.SetStateAction<string>>;
  trendingThreshold: number;
}

const AddTopicModal: React.FC<AddTopicModalProps> = ({
  visible,
  onClose,
  onSave,
  sourceOptions,
  setSourceOptions,
  saveSourcesLocally,
  keyword,
  setKeyword,
  volume,
  setVolume,
  source,
  setSource,
  trendingThreshold
}) => {
  const [customSource, setCustomSource] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [form] = Form.useForm();
  const { t } = useI18n();
  
  // 处理关键词变化
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };
  
  // 处理搜索量变化
  const handleVolumeChange = (value: number | null) => {
    setVolume(value || 0);
  };
  
  // 处理来源变化
  const handleSourceChange = (value: string) => {
    setSource(value);
  };
  
  // 处理来源搜索
  const handleSourceSearch = (value: string) => {
    setCustomSource(value);
  };
  
  // 处理添加新来源
  const handleAddSource = () => {
    if (!customSource.trim()) return;
    
    const newSource = customSource.trim();
    
    // 检查是否已存在
    const exists = sourceOptions.some(
      option => option.value.toLowerCase() === newSource.toLowerCase()
    );
    
    if (!exists) {
      // 添加新来源
      const updatedSources = [
        ...sourceOptions,
        { label: newSource, value: newSource }
      ];
      
      // 更新状态
      setSourceOptions(updatedSources);
      
      // 保存到本地存储
      saveSourcesLocally(updatedSources);
    }
    
    // 设置为当前选择的来源
    setSource(newSource);
    setCustomSource('');
  };
  
  // 处理保存操作
  const handleSaveClick = async () => {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };
  
  // 清理副作用 - 组件关闭时重置表单
  useEffect(() => {
    if (!visible) {
      form.resetFields();
    }
  }, [visible, form]);
  
  return (
    <Modal
      title={t('hotTopics.addTopicTitle')}
      open={visible}
      onCancel={saving ? undefined : onClose}
      okText={saving ? t('hotTopics.saving') : t('common.save')}
      cancelText={t('common.cancel')}
      confirmLoading={saving}
      onOk={handleSaveClick}
      okButtonProps={{ 
        disabled: !keyword.trim() || saving,
        icon: <PlusOutlined />
      }}
      cancelButtonProps={{ disabled: saving }}
      maskClosable={!saving}
      destroyOnClose
      width={500}
      style={{ top: 20 }}
      className="add-topic-modal"
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        initialValues={{
          keyword: keyword,
          volume: volume || undefined,
          source: source || undefined
        }}
      >
        <Form.Item 
          label={
            <Space style={{ marginBottom: 4 }}>
              <Text strong>{t('hotTopics.keywordLabel')}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>({t('hotTopics.required')})</Text>
            </Space>
          }
          required
          validateStatus={!keyword.trim() && keyword !== '' ? 'error' : ''}
          help={!keyword.trim() && keyword !== '' ? t('hotTopics.keywordRequired') : null}
        >
          <Input 
            value={keyword} 
            onChange={handleKeywordChange}
            placeholder={t('hotTopics.keywordPlaceholder')}
            maxLength={50}
            showCount
            autoFocus
            size="large"
            style={{ borderRadius: '6px' }}
          />
        </Form.Item>
        
        <Form.Item 
          label={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Space align="center">
                <Text strong>{t('hotTopics.volumeLabel')}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>({t('hotTopics.required')})</Text>
              </Space>
              {volume >= trendingThreshold && (
                <Tag color="red" icon={<FireOutlined />} style={{ marginLeft: 'auto' }}>
                  {t('hotTopics.hotLabel')}
                </Tag>
              )}
            </div>
          }
          required
        >
          <InputNumber 
            value={volume === 0 ? '' : volume} 
            onChange={handleVolumeChange}
            placeholder={t('hotTopics.volumePlaceholder')}
            min={0}
            style={{ width: '100%', borderRadius: '6px' }}
            size="large"
            addonAfter={t('hotTopics.searchTimes')}
          />
          <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
            {t('hotTopics.volumeThresholdTip').replace('{threshold}', trendingThreshold.toLocaleString())}
          </Text>
        </Form.Item>
        
        <Form.Item 
          label={
            <Space style={{ marginBottom: 4 }}>
              <Text strong>{t('hotTopics.sourceLabel')}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>({t('hotTopics.optional')})</Text>
            </Space>
          }
        >
          <Select
            style={{ width: '100%', borderRadius: '6px' }}
            placeholder={t('hotTopics.sourcePlaceholder')}
            value={source}
            onChange={handleSourceChange}
            showSearch
            allowClear
            optionFilterProp="label"
            searchValue={customSource}
            onSearch={handleSourceSearch}
            size="large"
            suffixIcon={<LinkOutlined style={{ color: '#1890ff' }} />}
            dropdownRender={(menu) => (
              <div>
                {menu}
                {customSource && !sourceOptions.find(
                  option => option.value.toLowerCase() === customSource.toLowerCase()
                ) && (
                  <div style={{ padding: '8px', borderTop: '1px solid #e8e8e8' }}>
                    <Button 
                      type="text" 
                      icon={<PlusOutlined />} 
                      style={{ width: '100%', textAlign: 'left' }}
                      onClick={handleAddSource}
                    >
                      {t('hotTopics.addSourcePrefix')} "{customSource}"
                    </Button>
                  </div>
                )}
              </div>
            )}
          >
            {sourceOptions.map(option => (
              <Option key={option.value} value={option.value} label={option.label}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <LinkOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                  {option.label}
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
      
      <style jsx global>{`
        .add-topic-modal .ant-form-item-label > label {
          height: auto;
        }
        
        .add-topic-modal .ant-select-selector {
          border-radius: 6px !important;
        }
      `}</style>
    </Modal>
  );
};

export default AddTopicModal; 