import { Article, ArticleStatus } from '@/types/article';
import { ARTICLE_CATEGORIES } from '@/types/article';

// 图片链接统一替换为百度图片
const COVER_IMAGE = "https://img0.baidu.com/it/u=4160253413,3711804954&fm=253&fmt=auto&app=138&f=JPEG?w=708&h=500";

// 生成模拟文章数据
const mockArticles: Article[] = [
  { 
    id: '1', 
    title: '比特币价格分析：突破关键阻力位后有望延续上涨趋势，分析师预计未来三个月将进一步上行', 
    date: '2023-03-29', 
    coverImage: COVER_IMAGE,
    keywords: ['比特币', '价格分析', '阻力位'],
    summary: '本文分析了比特币近期价格走势，突破重要阻力位意味着什么',
    category: '比特币',
    status: '已发布',
    content: '比特币近期价格突破关键阻力位，技术面显示上涨趋势明显...',
    createdAt: '2023-03-29'
  },
  { 
    id: '2', 
    title: '以太坊2.0：新功能详解', 
    date: '2023-03-28', 
    coverImage: COVER_IMAGE,
    keywords: ['以太坊', '以太坊2.0', '区块链'],
    summary: '深入解析以太坊2.0带来的新功能及其对生态系统的影响',
    category: '以太坊',
    status: '已发布',
    content: '以太坊2.0将带来质押、分片等重要功能，提高网络吞吐量...',
    createdAt: '2023-03-28'
  },
  { 
    id: '3', 
    title: '去中心化金融的未来趋势', 
    date: '2023-03-27', 
    coverImage: COVER_IMAGE,
    keywords: ['DeFi', '去中心化金融', '趋势'],
    summary: '探讨去中心化金融的发展趋势及未来可能的发展方向',
    category: 'DeFi',
    status: '待审核',
    content: '去中心化金融正改变传统金融格局，流动性挖矿、收益聚合等创新不断涌现...',
    createdAt: '2023-03-27'
  },
  { 
    id: '4', 
    title: 'NFT市场动态：本周热门交易', 
    date: '2023-03-26', 
    coverImage: COVER_IMAGE,
    keywords: ['NFT', '交易', '市场分析'],
    summary: '回顾本周NFT市场热门交易及市场动态',
    category: 'NFT',
    status: '已发布',
    content: 'NFT市场本周交易量突破1亿美元，多个蓝筹项目价格创新高...',
    createdAt: '2023-03-26'
  },
  { 
    id: '5', 
    title: '比特币减半对市场的影响分析', 
    date: '2023-03-25', 
    coverImage: COVER_IMAGE,
    keywords: ['比特币', '减半', '市场影响'],
    summary: '深入分析比特币减半机制对加密货币市场的长期和短期影响',
    category: '比特币',
    status: '不过审',
    content: '比特币减半将使挖矿奖励降低，历史数据显示减半后价格往往会上涨...',
    createdAt: '2023-03-25'
  },
  // 添加更多数据用于测试分页
  ...Array.from({ length: 15 }, (_, i) => {
    const statuses: ArticleStatus[] = ['待审核', '已发布', '不过审', '发布失败'];
    const status = statuses[i % statuses.length];
    const category = ARTICLE_CATEGORIES[i % ARTICLE_CATEGORIES.length];
    
    return {
      id: `${i + 6}`,
      title: `加密货币市场分析 ${i + 1}`,
      date: new Date(2023, 2, 24 - i).toISOString().split('T')[0],
      coverImage: COVER_IMAGE,
      keywords: ['加密货币', '市场分析', `关键词${i+1}`],
      summary: `这是加密货币市场分析文章${i+1}的摘要，包含市场动态和预测。`,
      category,
      status,
      content: `这是文章${i+1}的正文内容，详细分析了加密货币市场的最新动态和投资机会...`,
      createdAt: new Date(2023, 2, 24 - i).toISOString()
    };
  })
];

export default mockArticles; 