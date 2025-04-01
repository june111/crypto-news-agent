# 数据库模块使用示例

本文档提供数据库模块的常见使用场景和详细示例代码。

## 基础操作示例

### 初始化和连接

```typescript
// 页面组件中初始化数据库
import { useEffect } from 'react';
import { initDatabaseOnce } from '@/lib/db';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // 应用启动时初始化数据库连接
    initDatabaseOnce().catch(console.error);
  }, []);
  
  return <Component {...pageProps} />;
}
```

### 文章管理

```typescript
import { articles } from '@/lib/db';

// 创建文章
async function createArticleExample() {
  const newArticle = await articles.createArticle({
    title: '以太坊2.0升级完成，加密市场影响几何？',
    summary: '以太坊2.0成功升级为权益证明机制，对市场产生重大影响...',
    content: '详细内容...',
    category: '区块链',
    keywords: ['以太坊', '以太坊2.0', 'PoS', '加密货币'],
    status: 'draft'
  });
  
  console.log('文章已创建:', newArticle.id);
  return newArticle;
}

// 获取文章列表（分页、筛选和排序）
async function getArticlesExample() {
  const result = await articles.getAllArticles({
    page: 1,
    pageSize: 10,
    status: 'published',
    category: '区块链',
    keyword: '以太坊',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  
  console.log(`获取到${result.total}篇文章中的${result.articles.length}篇`);
  return result;
}

// 更新文章
async function updateArticleExample(id) {
  const updatedArticle = await articles.updateArticle(id, {
    title: '更新后的标题：以太坊2.0升级完成',
    status: 'published',
    published_at: new Date().toISOString()
  });
  
  console.log('文章已更新:', updatedArticle.id);
  return updatedArticle;
}

// 删除文章
async function deleteArticleExample(id) {
  await articles.deleteArticle(id);
  console.log('文章已删除:', id);
}
```

### 模板管理

```typescript
import { templates } from '@/lib/db';

// 创建模板
async function createTemplateExample() {
  const newTemplate = await templates.createTemplate({
    name: '市场分析模板',
    description: '用于加密货币市场分析的标准模板',
    category: '分析',
    content: `# {{title}}

## 市场概述

{{summary}}

## 价格分析

- 当前价格：xxx
- 近期趋势：xxx
- 支撑/阻力位：xxx

## 市场指标

- 交易量：xxx
- 市值：xxx
- 市场情绪：xxx

## 未来展望

xxx`
  });
  
  console.log('模板已创建:', newTemplate.id);
  return newTemplate;
}

// 获取模板列表
async function getTemplatesExample() {
  const allTemplates = await templates.getAllTemplates({
    category: '分析'
  });
  
  console.log(`获取到${allTemplates.length}个模板`);
  return allTemplates;
}

// 增加模板使用次数
async function incrementTemplateUsageExample(id) {
  const result = await templates.incrementUsage(id);
  console.log(`模板使用次数增加到${result.usage_count}`);
  return result;
}
```

### 热点话题管理

```typescript
import { hotTopics } from '@/lib/db';

// 创建热点话题
async function createHotTopicExample() {
  const newTopic = await hotTopics.createTopic({
    keyword: '比特币减半',
    volume: 12500,
    source: 'Twitter'
  });
  
  console.log('热点话题已创建:', newTopic.id);
  return newTopic;
}

// 获取热点话题列表
async function getHotTopicsExample() {
  const topics = await hotTopics.getHotTopics({
    minVolume: 5000,
    limit: 10
  });
  
  console.log(`获取到${topics.length}个热点话题`);
  return topics;
}

// 更新热点话题
async function updateHotTopicExample(id) {
  const updatedTopic = await hotTopics.updateTopic(id, {
    volume: 15000,
    trend: 'rising'
  });
  
  console.log('热点话题已更新:', updatedTopic.id);
  return updatedTopic;
}

// 删除热点话题
async function deleteHotTopicExample(id) {
  await hotTopics.deleteTopic(id);
  console.log('热点话题已删除:', id);
}
```

## 高级功能示例

### 向量搜索（语义搜索）

```typescript
import { embeddings } from '@/lib/db';
import { getEmbedding } from '@/lib/openai'; // 假设有一个获取OpenAI嵌入的函数

// 存储文章嵌入
async function storeArticleEmbeddingExample(articleId, content) {
  // 获取内容的向量表示
  const embedding = await getEmbedding(content);
  
  // 存储嵌入
  await embeddings.storeEmbedding({
    content,
    embedding,
    article_id: articleId,
    metadata: {
      type: 'article',
      title: '文章标题示例'
    }
  });
  
  console.log('文章嵌入已存储');
}

// 相似度搜索
async function similaritySearchExample(query) {
  // 获取查询的向量表示
  const queryEmbedding = await getEmbedding(query);
  
  // 执行相似度搜索
  const results = await embeddings.similaritySearch(
    queryEmbedding,
    0.75, // 相似度阈值
    5     // 最大结果数
  );
  
  console.log(`找到${results.length}个相似内容`);
  return results;
}
```

### 使用事务

```typescript
import { getSupabaseClient } from '@/lib/db/supabase';

// 使用事务进行多表操作
async function createArticleWithTasksExample(articleData, tasks) {
  const client = getSupabaseClient();
  
  // 模拟事务（Supabase目前不直接支持事务，使用错误回滚模式）
  let article = null;
  const createdTasks = [];
  
  try {
    // 1. 创建文章
    const { data: articleData, error: articleError } = await client
      .from('articles')
      .insert([articleData])
      .select()
      .single();
      
    if (articleError) throw articleError;
    article = articleData;
    
    // 2. 为文章创建多个任务
    for (const task of tasks) {
      const { data: taskData, error: taskError } = await client
        .from('ai_tasks')
        .insert([{
          ...task,
          article_id: article.id
        }])
        .select()
        .single();
        
      if (taskError) throw taskError;
      createdTasks.push(taskData);
    }
    
    return { article, tasks: createdTasks };
  } catch (error) {
    // 出错时尝试删除已创建的资源
    if (article) {
      await client.from('articles').delete().eq('id', article.id);
    }
    
    for (const task of createdTasks) {
      await client.from('ai_tasks').delete().eq('id', task.id);
    }
    
    throw error;
  }
}
```

### 实时更新

```typescript
import { getSupabaseClient } from '@/lib/db/supabase';
import { useEffect, useState } from 'react';

// 使用Supabase实时功能监听文章更新
function useArticleRealtime(articleId) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const client = getSupabaseClient();
    
    // 初始加载文章
    async function loadArticle() {
      setLoading(true);
      const { data, error } = await client
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();
        
      if (!error) {
        setArticle(data);
      }
      setLoading(false);
    }
    
    loadArticle();
    
    // 设置实时订阅
    const subscription = client
      .channel(`article-${articleId}`)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'articles',
          filter: `id=eq.${articleId}`
        }, 
        (payload) => {
          console.log('文章数据更新:', payload);
          setArticle(payload.new);
        }
      )
      .subscribe();
      
    // 清理订阅
    return () => {
      subscription.unsubscribe();
    };
  }, [articleId]);
  
  return { article, loading };
}

// 在组件中使用
function ArticleView({ articleId }) {
  const { article, loading } = useArticleRealtime(articleId);
  
  if (loading) return <div>加载中...</div>;
  if (!article) return <div>文章不存在</div>;
  
  return (
    <div>
      <h1>{article.title}</h1>
      <div>{article.content}</div>
    </div>
  );
}
```

## 与React Query集成

```typescript
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { articles } from '@/lib/db';

// 查询钩子
export function useArticle(id) {
  return useQuery(
    ['article', id],
    () => articles.getArticleById(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5分钟
    }
  );
}

export function useArticles(filters = {}) {
  return useQuery(
    ['articles', filters],
    () => articles.getAllArticles(filters),
    {
      staleTime: 2 * 60 * 1000, // 2分钟
    }
  );
}

// 变更钩子
export function useCreateArticle() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (articleData) => articles.createArticle(articleData),
    {
      onSuccess: () => {
        // 创建成功后使文章列表查询失效
        queryClient.invalidateQueries('articles');
      }
    }
  );
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }) => articles.updateArticle(id, data),
    {
      onSuccess: (data) => {
        // 更新缓存中的文章
        queryClient.setQueryData(['article', data.id], data);
        // 使文章列表查询失效
        queryClient.invalidateQueries('articles');
      }
    }
  );
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (id) => articles.deleteArticle(id),
    {
      onSuccess: (_, id) => {
        // 从缓存中移除文章
        queryClient.removeQueries(['article', id]);
        // 使文章列表查询失效
        queryClient.invalidateQueries('articles');
      }
    }
  );
}

// 在组件中使用
function ArticleEditor({ id }) {
  const { data: article, isLoading } = useArticle(id);
  const updateArticle = useUpdateArticle();
  
  const handleSave = (formData) => {
    updateArticle.mutate({
      id,
      data: formData
    });
  };
  
  if (isLoading) return <div>加载中...</div>;
  
  return (
    <form onSubmit={/* ... */}>
      {/* 编辑表单 */}
      <button 
        type="submit" 
        disabled={updateArticle.isLoading}
      >
        {updateArticle.isLoading ? '保存中...' : '保存'}
      </button>
    </form>
  );
}
``` 