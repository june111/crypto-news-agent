/**
 * 数据库连接模块
 * 提供Supabase客户端实例
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Article, AITask, Template, HotTopic, TABLES } from './schema';
import { getSupabaseClient as getPooledClient, checkDatabaseHealth } from './connection-pool';
import { logDebug, logWarning, logError } from './utils/logger';

/**
 * 数据库类型定义
 */
type Database = {
  public: {
    Tables: {
      articles: {
        Row: Article;
        Insert: Omit<Article, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Article, 'id' | 'created_at'>>;
      };
      ai_tasks: {
        Row: AITask;
        Insert: Omit<AITask, 'id' | 'created_at'>;
        Update: Partial<Omit<AITask, 'id' | 'created_at'>>;
      };
      templates: {
        Row: Template;
        Insert: Omit<Template, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Template, 'id' | 'created_at'>>;
      };
      hot_topics: {
        Row: HotTopic;
        Insert: Omit<HotTopic, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<HotTopic, 'id' | 'created_at'>>;
      };
    };
  };
};

// 根据环境变量判断是否使用模拟模式
export const MOCK_MODE = process.env.MOCK_DB === 'true' || 
  process.env.NODE_ENV === 'test' || 
  (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL);

// 模拟客户端单例
let mockClient: any = null;

/**
 * 获取Supabase客户端实例
 * 使用连接池管理，并支持模拟模式
 */
export function getSupabaseClient(): SupabaseClient | any {
  // 检查是否使用模拟模式
  if (MOCK_MODE) {
    if (mockClient) {
      return mockClient;
    }
    
    logDebug('使用模拟Supabase客户端 (MOCK_MODE=true)');
    mockClient = createMockClient();
    return mockClient;
  }
  
  // 使用连接池中的客户端实例
  const client = getPooledClient();
  
  if (!client) {
    logWarning('无法获取Supabase客户端，使用模拟客户端作为后备');
    if (!mockClient) {
      mockClient = createMockClient();
    }
    return mockClient;
  }
  
  return client;
}

// 类型定义
interface MockData {
  [table: string]: Record<string, unknown>[];
}

interface SortOptions {
  ascending?: boolean;
}

interface RpcParams {
  [key: string]: unknown;
}

// 创建模拟客户端，用于开发和测试
function createMockClient() {
  // 全局存储空间，用于在所有测试中共享数据
  if (!global.__mockStorage) {
    global.__mockStorage = {
      articles: [
        { id: 'art-mock-1', title: '模拟文章1', status: 'published' },
        { id: 'art-mock-2', title: '模拟文章2', status: 'draft' }
      ],
      templates: [
        { id: 'tpl-mock-1', name: '模拟模板1', usage_count: 5 },
        { id: 'tpl-mock-2', name: '模拟模板2', usage_count: 3 }
      ],
      ai_tasks: [
        { id: 'task-mock-1', type: 'summary', status: 'completed' },
        { id: 'task-mock-2', type: 'content', status: 'pending' }
      ],
      hot_topics: [
        { id: 'topic-mock-1', title: '模拟热门话题1', score: 90 },
        { id: 'topic-mock-2', title: '模拟热门话题2', score: 70 }
      ],
      embeddings: [
        { id: 'emb-mock-1', content: '模拟嵌入内容1', article_id: 'art-mock-1' },
        { id: 'emb-mock-2', content: '模拟嵌入内容2', article_id: 'art-mock-2' }
      ]
    };
  }
  
  // 使用全局存储
  const mockStorage = global.__mockStorage as MockData;
  
  // 新增：测试新创建的项目
  global.__testItems = global.__testItems || {};
  const testItems = global.__testItems as MockData;
  
  logDebug('使用模拟数据库模式');
  
  return {
    from: (table: string) => {
      return {
        select: () => {
          return {
            eq: (field: string, value: unknown) => {
              // 首先在测试数据中查找
              const testItem = (testItems[table] || []).find(item => item[field] === value);
              
              // 然后在模拟数据中查找
              const mockItem = (mockStorage[table] || []).find(item => item[field] === value);
              
              // 合并查找结果
              const filteredItems = [];
              if (testItem) filteredItems.push(testItem);
              if (mockItem) filteredItems.push(mockItem);
              
              return {
                single: () => {
                  const item = testItem || mockItem;
                  return {
                    data: item || null,
                    error: item ? null : { message: `数据未找到: ${table} 中 ${field}=${value}` }
                  };
                },
                data: filteredItems,
                error: null,
                count: filteredItems.length
              };
            },
            limit: (n: number) => {
              const allItems = [...(mockStorage[table] || []), ...(testItems[table] || [])];
              return {
                data: allItems.slice(0, n),
                error: null,
                count: allItems.length
              };
            },
            range: (from: number, to: number) => {
              const allItems = [...(mockStorage[table] || []), ...(testItems[table] || [])];
              return {
                data: allItems.slice(from, to + 1),
                error: null,
                count: allItems.length
              };
            },
            order: (column: string, options: SortOptions = {}) => {
              const allItems = [...(mockStorage[table] || []), ...(testItems[table] || [])];
              
              const sortedItems = [...allItems].sort((a, b) => {
                if (options.ascending) {
                  return a[column] > b[column] ? 1 : -1;
                } else {
                  return a[column] < b[column] ? 1 : -1;
                }
              });
              
              return {
                range: (from: number, to: number) => ({
                  data: sortedItems.slice(from, to + 1),
                  error: null,
                  count: sortedItems.length
                }),
                data: sortedItems,
                error: null,
                count: sortedItems.length
              };
            }
          };
        },
        insert: (data: Record<string, unknown>) => {
          if (!testItems[table]) {
            testItems[table] = [];
          }
          
          testItems[table].push(data);
          logDebug(`添加了新${table}，ID: ${data.id}`);
          
          return {
            select: () => ({
              single: () => ({ data, error: null })
            }),
            data,
            error: null
          };
        },
        update: (data: Record<string, unknown>) => ({
          eq: (field: string, value: unknown) => {
            // 首先在测试数据中查找
            let updatedItem = null;
            const testIndex = (testItems[table] || []).findIndex(item => item[field] === value);
            
            if (testIndex !== -1) {
              testItems[table][testIndex] = { ...testItems[table][testIndex], ...data };
              updatedItem = testItems[table][testIndex];
            } else {
              // 然后在模拟数据中查找
              const mockIndex = (mockStorage[table] || []).findIndex(item => item[field] === value);
              
              if (mockIndex !== -1) {
                mockStorage[table][mockIndex] = { ...mockStorage[table][mockIndex], ...data };
                updatedItem = mockStorage[table][mockIndex];
              }
            }
            
            return {
              select: () => ({
                single: () => ({
                  data: updatedItem,
                  error: updatedItem ? null : { message: `数据未找到: ${table} 中 ${field}=${value}` }
                })
              })
            };
          }
        }),
        delete: () => ({
          eq: (field: string, value: unknown) => {
            // 首先在测试数据中查找
            const testIndex = (testItems[table] || []).findIndex(item => item[field] === value);
            
            if (testIndex !== -1) {
              const deletedItem = testItems[table][testIndex];
              testItems[table].splice(testIndex, 1);
              
              return {
                data: deletedItem,
                error: null
              };
            } else {
              // 然后在模拟数据中查找
              const mockIndex = (mockStorage[table] || []).findIndex(item => item[field] === value);
              
              if (mockIndex !== -1) {
                const deletedItem = mockStorage[table][mockIndex];
                mockStorage[table].splice(mockIndex, 1);
                
                return {
                  data: deletedItem,
                  error: null
                };
              }
            }
            
            return {
              data: null,
              error: { message: `数据未找到: ${table} 中 ${field}=${value}` }
            };
          }
        })
      };
    },
    rpc: (functionName: string, params: RpcParams) => {
      // 模拟远程过程调用
      if (functionName === 'increment_template_usage') {
        const { template_id } = params;
        
        // 首先在测试数据中查找
        const testIndex = (testItems.templates || []).findIndex(item => item.id === template_id);
        
        if (testIndex !== -1) {
          const usageCount = Number(testItems.templates[testIndex].usage_count || 0);
          testItems.templates[testIndex].usage_count = usageCount + 1;
          
          return {
            data: { success: true, usage_count: usageCount + 1 },
            error: null
          };
        } else {
          // 然后在模拟数据中查找
          const mockIndex = (mockStorage.templates || []).findIndex(item => item.id === template_id);
          
          if (mockIndex !== -1) {
            const usageCount = Number(mockStorage.templates[mockIndex].usage_count || 0);
            mockStorage.templates[mockIndex].usage_count = usageCount + 1;
            
            return {
              data: { success: true, usage_count: usageCount + 1 },
              error: null
            };
          }
        }
        
        return {
          data: null,
          error: { message: `模板未找到: ${template_id}` }
        };
      }
      
      return {
        data: null,
        error: { message: `未实现的RPC函数: ${functionName}` }
      };
    }
  };
}

/**
 * 检查Supabase连接状态
 * @returns 如果连接成功，返回true；否则返回false
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  return await checkDatabaseHealth();
}

/**
 * 初始化数据库连接
 */
export async function initDatabase(): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    
    // 选择一个表检查是否存在
    const { error } = await client.from('articles').select('id').limit(1);
    
    if (error && error.code === '42P01') {
      logDebug("数据库表不存在，初始化数据库...");
      // 在这里可以调用创建表的函数
      return true;
    } else {
      logDebug("数据库表已存在");
      return true;
    }
  } catch (error) {
    logError("数据库初始化失败", error);
    return false;
  }
}

// 创建一个模块对象导出所有功能
const supabaseModule = {
  getSupabaseClient,
  checkSupabaseConnection,
  initDatabase
};

export default supabaseModule; 