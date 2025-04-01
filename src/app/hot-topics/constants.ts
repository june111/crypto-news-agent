/**
 * 热点话题相关常量定义
 */

// 热门话题阈值 - 搜索量超过此值将被标记为热门
export const TRENDING_THRESHOLD = 10000;

// 热点搜索量颜色阈值
export const VOLUME_COLOR = {
  HIGH: 10000,  // 高热度（红色）
  MEDIUM: 5000, // 中等热度（橙色）
  LOW: 2000     // 低热度（绿色）
};

// 获取颜色基于搜索量 - 使用常量定义阈值
export const getVolumeColor = (volume: number): string => {
  if (volume >= VOLUME_COLOR.HIGH) return '#f5222d'; // 高热度（红色）
  if (volume >= VOLUME_COLOR.MEDIUM) return '#fa8c16'; // 中等热度（橙色）
  if (volume >= VOLUME_COLOR.LOW) return '#52c41a'; // 低热度（绿色）
  return '#1890ff'; // 普通（蓝色）
};

// 默认来源列表
export const DEFAULT_SOURCES = [
  { label: '推特', value: '推特' },
  { label: '币安', value: '币安' },
  { label: 'CoinGecko', value: 'CoinGecko' },
  { label: 'CoinMarketCap', value: 'CoinMarketCap' },
  { label: '新闻', value: '新闻' },
  { label: '社交媒体', value: '社交媒体' },
  { label: '论坛', value: '论坛' },
  { label: '研究报告', value: '研究报告' },
  { label: '行业分析', value: '行业分析' }
];

// 示例热点数据，用于API返回失败时的默认展示
export const EXAMPLE_HOT_TOPICS = [
  {
    id: 'example-1',
    keyword: '比特币突破70000美元',
    volume: VOLUME_COLOR.HIGH + 2580, // 12580
    date: new Date().toISOString().split('T')[0],
    status: 'trending',
    source: '币安'
  },
  {
    id: 'example-2',
    keyword: 'DeFi总锁仓量突破100亿美元',
    volume: VOLUME_COLOR.MEDIUM + 4452, // 9452
    date: new Date().toISOString().split('T')[0],
    status: 'trending',
    source: 'CoinGecko'
  },
  {
    id: 'example-3',
    keyword: '以太坊2.0质押率突破25%',
    volume: VOLUME_COLOR.MEDIUM + 2830, // 7830
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    status: 'active',
    source: '推特'
  }
]; 