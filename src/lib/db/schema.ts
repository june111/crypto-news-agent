/**
 * 数据库表结构定义
 */

// 文章表
export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  cover_image?: string;
  category: string;
  keywords: string[];
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'failed';
  created_at: string;
  updated_at: string;
  published_at?: string;
  view_count: number;
  usage_count: number;
  hot_topic_id?: string | null;  // 关联的热点话题ID
  template_id?: string | null;   // 使用的文章模板ID
  author?: string;               // 文章作者
}

// 图片表
export interface Image {
  id: string;
  file_name: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  storage_path: string;
  article_id?: string;
  created_at: string;
  updated_at: string;
}

// AI任务表
export interface AITask {
  id: string;
  name: string;
  type: 'cover' | 'title' | 'content' | 'summary';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  input_data: Record<string, unknown>;
  result_data?: Record<string, unknown>;
  article_id?: string;
}

// 模板表
export interface Template {
  id: string;
  name: string;
  description?: string;
  content: string;
  category: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// 热点话题表
export interface HotTopic {
  id: string;
  keyword: string;
  volume: number;
  source?: string;
  created_at: string;
  updated_at: string;
  related_articles?: any[];
}

// 数据库表名称常量
export const TABLES = {
  ARTICLES: 'articles',
  IMAGES: 'images',
  AI_TASKS: 'ai_tasks',
  TEMPLATES: 'templates',
  HOT_TOPICS: 'hot_topics',
};

// 创建一个模块对象导出所有表常量
const schemaModule = {
  TABLES
};

export default schemaModule; 