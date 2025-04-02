/**
 * 热点话题仓库
 * 管理热点话题的增删改查和评分
 */
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient, MOCK_MODE } from '../supabase';
import { safeQuery } from '../utils/queryBuilder';
import { TRENDING_THRESHOLD } from '@/app/hot-topics/constants';

// 热点话题类型定义
export interface HotTopic {
  id?: string;
  keyword: string;       // 关键词
  volume?: number;       // 搜索量
  source?: string;       // 来源
  created_at?: string;   // 创建时间
  updated_at?: string;   // 更新时间
  related_articles?: any[]; // 相关文章
  // status字段已从数据库移除，仅在前端使用
}

// 热点话题查询筛选条件
export interface HotTopicFilter {
  minVolume?: number;    // 最小搜索量
  source?: string;       // 来源筛选
  dateRange?: {
    start?: Date | string;
    end?: Date | string;
  };
}

/**
 * 创建热点话题
 * @param hotTopic 热点话题数据
 * @returns 创建的热点话题
 */
export async function createHotTopic(hotTopic: HotTopic): Promise<HotTopic | null> {
  try {
    // 记录输入数据
    console.log('开始创建热点话题，输入数据:', JSON.stringify(hotTopic, null, 2));
    
    // 验证参数
    if (!hotTopic) {
      console.error('热点话题数据为空');
      return null;
    }
    
    if (!hotTopic.keyword) {
      console.error('热点话题缺少关键词字段');
      return null;
    }
    
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    console.log('Supabase客户端获取状态:', supabase ? '成功' : '失败');
    console.log('Supabase客户端类型:', typeof supabase);
    console.log('Supabase客户端方法:', Object.keys(supabase));
    
    // 检查是否正在使用模拟模式
    console.log('模拟模式状态:', MOCK_MODE ? '启用' : '禁用');
    
    // 准备插入数据 - 严格匹配数据库实际字段
    const now = new Date().toISOString();
    const volume = hotTopic.volume !== undefined ? Number(hotTopic.volume) : 0;
    const newTopic = {
      id: hotTopic.id || uuidv4(),
      keyword: hotTopic.keyword,
      volume: volume,
      source: hotTopic.source || null,
      created_at: hotTopic.created_at || now,
      updated_at: hotTopic.updated_at || now,
      related_articles: hotTopic.related_articles || []
      // 移除status字段，数据库中不存在该列
    };
    
    console.log('待插入的数据:', JSON.stringify(newTopic, null, 2));
    console.log('检查表名:', 'hot_topics');
    
    // 尝试检查表是否存在
    try {
      console.log('尝试检查hot_topics表是否存在');
      const { data: tables, error: tablesError } = await supabase
        .from('hot_topics')
        .select('id')
        .limit(1);
      
      console.log('表检查结果:', {
        success: !tablesError,
        hasData: !!tables && tables.length > 0, 
        errorMessage: tablesError ? tablesError.message : null,
        errorCode: tablesError ? tablesError.code : null
      });
      
      // 如果能获取数据，打印字段结构
      if (tables && tables.length > 0) {
        console.log('表字段结构:', Object.keys(tables[0]));
      }
    } catch (checkError) {
      console.error('检查表存在时出错:', checkError);
    }
    
    // 执行插入操作 - 使用直接插入
    console.log('开始执行插入操作...');
    let insertResult;
    try {
      insertResult = await supabase
        .from('hot_topics')
        .insert(newTopic)
        .select();
      
      console.log('插入操作完成，结果:', {
        success: !insertResult.error,
        hasData: !!insertResult.data && insertResult.data.length > 0,
        statusCode: insertResult.status || '未知'
      });
    } catch (insertError) {
      console.error('执行插入操作时捕获到异常:', insertError);
      console.error('异常类型:', insertError instanceof Error ? insertError.name : typeof insertError);
      console.error('异常消息:', insertError instanceof Error ? insertError.message : '未知错误');
      console.error('异常堆栈:', insertError instanceof Error ? insertError.stack : '无堆栈信息');
      return null;
    }
    
    const { data, error } = insertResult;
    
    // 处理结果
    if (error) {
      console.error('插入数据库失败，错误信息:', error);
      console.error('错误详情:', error.details);
      console.error('错误提示:', error.hint);
      console.error('错误代码:', error.code);
      
      // 尝试解析更详细的错误信息
      if (error.message) {
        console.error('错误消息详解:', {
          original: error.message,
          lowerCase: error.message.toLowerCase(),
          containsForeignKey: error.message.toLowerCase().includes('foreign key'),
          containsUnique: error.message.toLowerCase().includes('unique'),
          containsNull: error.message.toLowerCase().includes('null'),
          containsNotFound: error.message.toLowerCase().includes('not found')
        });
      }
      
      return null;
    }
    
    console.log('插入成功，返回数据:', JSON.stringify(data, null, 2));
    return data && data.length > 0 ? data[0] as HotTopic : null;
  } catch (error) {
    console.error('创建热点话题异常:', error);
    console.error('异常类型:', error instanceof Error ? error.name : typeof error);
    console.error('异常消息:', error instanceof Error ? error.message : '未知错误');
    console.error('异常堆栈:', error instanceof Error ? error.stack : '无堆栈信息');
    return null;
  }
}

/**
 * 获取所有热点话题
 * @param filter 筛选条件
 * @returns 热点话题列表
 */
export async function getAllHotTopics(filter?: HotTopicFilter): Promise<HotTopic[]> {
  try {
    const supabase = getSupabaseClient();
    
    console.log('正在获取热点话题列表...');
    
    let result;
    try {
      result = await safeQuery(supabase.from('hot_topics')).select('*');
      console.log('查询结果:', JSON.stringify(result));
    } catch (err) {
      console.error('查询出错:', err);
      return [];
    }
    
    if (!result || !result.data) {
      console.log('未获取到数据或数据格式不正确:', result);
      // 返回空数组，而不是模拟数据
      return [];
    }
    
    const { data, error } = result;
    
    if (error) {
      console.error('获取热点话题列表失败:', error);
      return [];
    }
    
    console.log('成功获取热点话题数据，条数:', data.length);
    
    // 手动在内存中过滤数据
    let filteredData = [...data];
    
    // 应用筛选条件
    if (filter) {
      if (filter.source) {
        filteredData = filteredData.filter(topic => 
          topic.source && topic.source.toLowerCase().includes(filter.source!.toLowerCase())
        );
      }
      
      if (filter.minVolume !== undefined) {
        filteredData = filteredData.filter(topic => (topic.volume || 0) >= filter.minVolume!);
      }
      
      if (filter.dateRange) {
        if (filter.dateRange.start) {
          const startDate = new Date(filter.dateRange.start).getTime();
          filteredData = filteredData.filter(topic => {
            if (!topic.created_at) return false;
            const topicDate = new Date(topic.created_at).getTime();
            return topicDate >= startDate;
          });
        }
        if (filter.dateRange.end) {
          const endDate = new Date(filter.dateRange.end).getTime();
          filteredData = filteredData.filter(topic => {
            if (!topic.created_at) return false;
            const topicDate = new Date(topic.created_at).getTime();
            return topicDate <= endDate;
          });
        }
      }
    }
    
    return filteredData;
  } catch (error) {
    console.error('获取热点话题列表异常:', error);
    return [];
  }
}

/**
 * 获取单个热点话题
 * @param id 热点话题ID
 * @returns 热点话题数据
 */
export async function getHotTopic(id: string): Promise<HotTopic | null> {
  try {
    console.log('开始获取热点话题, ID:', id);
    const supabase = getSupabaseClient();
    
    // 直接使用supabase客户端
    const { data, error } = await supabase
      .from('hot_topics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取热点话题失败:', error);
      return null;
    }

    console.log('获取到的热点话题:', data);
    return data as HotTopic;
  } catch (error) {
    console.error('获取热点话题异常:', error);
    return null;
  }
}

/**
 * 更新热点话题
 * @param id 热点话题ID
 * @param updates 更新内容
 * @returns 更新后的热点话题
 */
export async function updateHotTopic(id: string, updates: Partial<HotTopic>): Promise<HotTopic | null> {
  try {
    console.log('开始更新热点话题, ID:', id, '更新内容:', updates);
    const supabase = getSupabaseClient();
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    // 直接使用supabase客户端
    const { data, error } = await supabase
      .from('hot_topics')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('更新热点话题失败:', error);
      return null;
    }

    console.log('更新成功, 结果:', data);
    return data as HotTopic;
  } catch (error) {
    console.error('更新热点话题异常:', error);
    return null;
  }
}

/**
 * 增加热点话题搜索量
 * @param id 热点话题ID
 * @param increment 增加的搜索量
 * @returns 操作结果
 */
export async function incrementHotTopicVolume(id: string, increment: number = 1): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    // 先获取当前话题
    const { data: topic, error: getError } = await safeQuery(supabase
      .from('hot_topics')
      .select('volume'))
      .eq('id', id)
      .single();
    
    if (getError || !topic) {
      console.error('获取话题失败:', getError);
      return false;
    }
    
    // 计算新的搜索量
    const newVolume = ((topic as {volume?: number}).volume || 0) + increment;
    
    // 更新搜索量
    const { error: updateError } = await safeQuery(supabase
      .from('hot_topics'))
      .update({
        volume: newVolume,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('更新话题搜索量失败:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('更新话题搜索量异常:', error);
    return false;
  }
}

/**
 * 删除热点话题
 * @param id 热点话题ID
 * @returns 操作结果
 */
export async function deleteHotTopic(id: string): Promise<boolean> {
  try {
    console.log('开始删除热点话题, ID:', id);
    const supabase = getSupabaseClient();
    
    // 直接使用supabase客户端
    const { error } = await supabase
      .from('hot_topics')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('删除热点话题失败:', error);
      return false;
    }
    
    console.log('成功删除热点话题');
    return true;
  } catch (error) {
    console.error('删除热点话题异常:', error);
    return false;
  }
}

/**
 * 设置话题为趋势
 * @param id 话题ID
 * @returns 更新后的话题
 */
export async function markTopicAsTrending(id: string): Promise<HotTopic | null> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await safeQuery(supabase
      .from('hot_topics'))
      .update({
        volume: TRENDING_THRESHOLD,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select("*")
      .single();
    
    if (error) {
      console.error('设置话题为趋势失败:', error);
      return null;
    }
    
    return data as HotTopic;
  } catch (error) {
    console.error('设置话题为趋势异常:', error);
    return null;
  }
}

/**
 * 归档话题
 * @param id 话题ID
 * @returns 更新后的话题
 */
export async function archiveTopic(id: string): Promise<HotTopic | null> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await safeQuery(supabase
      .from('hot_topics'))
      .update({
        volume: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select("*")
      .single();
    
    if (error) {
      console.error('归档话题失败:', error);
      return null;
    }
    
    return data as HotTopic;
  } catch (error) {
    console.error('归档话题异常:', error);
    return null;
  }
}

/**
 * 获取趋势话题
 * @param limit 限制数量
 * @returns 话题列表
 */
export async function getTrendingTopics(limit: number = 10): Promise<HotTopic[]> {
  try {
    // 使用 getAllHotTopics 获取全部话题
    const allTopics = await getAllHotTopics();
    
    // 按搜索量排序获取最热门的话题
    const trendingTopics = [...allTopics].sort((a, b) => (b.volume || 0) - (a.volume || 0));
    
    return trendingTopics.slice(0, limit);
  } catch (error) {
    console.error('获取趋势话题异常:', error);
    return [];
  }
}

// 热点话题仓库对象
const hotTopicsRepository = {
  createHotTopic,
  getAllHotTopics,
  getHotTopic,
  updateHotTopic,
  incrementHotTopicVolume,
  deleteHotTopic,
  markTopicAsTrending,
  archiveTopic,
  getTrendingTopics
};

export default hotTopicsRepository; 