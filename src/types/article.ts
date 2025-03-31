// 文章状态类型
export type ArticleStatus = '待审核' | '已发布' | '不过审' | '发布失败' | '草稿';

// 文章分类列表
export const ARTICLE_CATEGORIES = [
  '区块链',
  '比特币',
  '以太坊',
  '加密货币',
  '去中心化金融',
  'NFT',
  '元宇宙',
  '政策法规',
  '市场分析',
  '技术创新'
];

// 文章接口定义
export interface Article {
  id: string;
  title: string;
  content?: string;
  summary: string;
  coverImage: string;
  category: string;
  keywords: string[];
  status: ArticleStatus;
  date: string;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  author?: string;
  viewCount?: number;
  usageCount?: number;
}

// 创建/更新文章请求接口
export interface ArticleCreateUpdateRequest {
  title: string;
  content?: string;
  summary: string;
  coverImage: string;
  category: string;
  keywords: string[];
  status?: ArticleStatus;
}

// 文章查询参数接口
export interface ArticleQueryParams {
  page?: number;
  pageSize?: number;
  status?: ArticleStatus;
  category?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'viewCount' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// 文章列表响应接口
export interface ArticleListResponse {
  articles: Article[];
  total: number;
  page: number;
  pageSize: number;
} 