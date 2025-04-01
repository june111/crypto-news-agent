# 数据库模块最佳实践指南

本文档提供使用数据库模块时的最佳实践、优化技巧和设计模式建议。

## 数据访问层

### 使用仓库模式

✅ **推荐**：始终使用仓库API访问数据，而不是直接使用Supabase客户端。

```typescript
// 推荐
import { articles } from '@/lib/db';
const article = await articles.getArticleById(id);

// 不推荐
import { getSupabaseClient } from '@/lib/db';
const client = getSupabaseClient();
const { data } = await client.from('articles').select('*').eq('id', id).single();
```

### 批量操作

✅ **推荐**：对于批量操作，使用事务或批处理API。

```typescript
// 批量插入多条记录
const batchArticles = [article1, article2, article3];
await articles.createBatchArticles(batchArticles);

// 不推荐多次单独调用
await articles.createArticle(article1);
await articles.createArticle(article2);
await articles.createArticle(article3);
```

### 数据筛选

✅ **推荐**：在数据库层面进行筛选，而不是在应用层。

```typescript
// 推荐：在数据库层面筛选
const filteredArticles = await articles.getAllArticles({
  status: 'published',
  category: 'cryptocurrency',
  keyword: 'bitcoin'
});

// 不推荐：获取所有文章再在应用层筛选
const allArticles = await articles.getAllArticles();
const filteredArticles = allArticles.filter(
  a => a.status === 'published' && 
       a.category === 'cryptocurrency' && 
       a.title.includes('bitcoin')
);
```

## 错误处理

### 全面的错误捕获

✅ **推荐**：使用try-catch捕获可能的数据库错误，并提供友好反馈。

```typescript
try {
  const article = await articles.getArticleById(id);
  // 处理文章数据
} catch (error) {
  if (error.code === 'PGRST301') {
    // 文章不存在的处理逻辑
    showNotification('文章未找到');
  } else {
    // 其他错误的处理逻辑
    logError('获取文章失败', error);
    showNotification('获取文章时出现错误');
  }
}
```

### 使用日志系统

✅ **推荐**：使用内置的日志系统记录操作和错误。

```typescript
import { logInfo, logError } from '@/lib/db/utils/logger';

try {
  logInfo('尝试创建新文章', { title: articleData.title });
  const article = await articles.createArticle(articleData);
  logInfo('文章创建成功', { id: article.id });
  return article;
} catch (error) {
  logError('创建文章失败', error);
  throw new AppError('ARTICLE_CREATE_FAILED', '无法创建文章');
}
```

## 性能优化

### 分页加载

✅ **推荐**：使用分页加载大量数据，而不是一次加载全部。

```typescript
// 使用分页加载文章
const pageSize = 20;
let currentPage = 1;

// 第一页
const { articles, total } = await articles.getAllArticles({
  page: currentPage,
  pageSize
});

// 加载下一页
function loadNextPage() {
  currentPage++;
  return articles.getAllArticles({
    page: currentPage,
    pageSize
  });
}
```

### 选择必要字段

✅ **推荐**：只请求需要的字段，减少数据传输量。

```typescript
// 只获取文章列表需要的字段
const articleList = await articles.getArticlesList(['id', 'title', 'summary', 'created_at']);

// 获取完整文章详情
const articleDetail = await articles.getArticleById(id);
```

### 缓存常用数据

✅ **推荐**：使用React Query或SWR缓存频繁访问的数据。

```typescript
import { useQuery } from 'react-query';
import { articles } from '@/lib/db';

// 使用React Query缓存文章列表
function useArticles() {
  return useQuery('articles', () => articles.getAllArticles(), {
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    refetchOnWindowFocus: false
  });
}
```

## 测试策略

### 使用模拟模式

✅ **推荐**：在测试中使用模拟模式，避免依赖真实数据库。

```typescript
// 设置环境变量
process.env.MOCK_DB = 'true';

// 测试仓库功能
test('should create an article', async () => {
  const { articles } = require('@/lib/db');
  
  const newArticle = await articles.createArticle({
    title: '测试文章',
    content: '测试内容',
    status: 'draft'
  });
  
  expect(newArticle).toHaveProperty('id');
  expect(newArticle.title).toBe('测试文章');
});
```

### 准备测试数据

✅ **推荐**：为每个测试准备专用的测试数据。

```typescript
beforeEach(() => {
  global.__mockStorage = {
    articles: [
      { id: 'test-1', title: '测试文章1', status: 'published' },
      { id: 'test-2', title: '测试文章2', status: 'draft' }
    ]
  };
});

test('should find published articles', async () => {
  const publishedArticles = await articles.getAllArticles({ status: 'published' });
  expect(publishedArticles.length).toBe(1);
});
```

## 数据模型设计

### 规范化数据

✅ **推荐**：合理规范化数据，避免冗余。

```typescript
// 好的设计：文章和标签分开存储
interface Article {
  id: string;
  title: string;
  // ...其他属性
}

interface ArticleTag {
  article_id: string;
  tag_id: string;
}

interface Tag {
  id: string;
  name: string;
}

// 不好的设计：标签作为重复字符串存储
interface BadArticleDesign {
  id: string;
  title: string;
  tags: string[]; // ["区块链", "比特币"]，多篇文章重复存储相同标签
}
```

### 使用JSON字段

✅ **推荐**：对于半结构化数据，使用JSON字段而不是创建多个表。

```typescript
// 使用JSON存储元数据
await articles.updateArticle(id, {
  metadata: {
    sourceUrl: 'https://example.com/article',
    author: {
      name: '张三',
      email: 'zhang@example.com'
    },
    readingTime: 5
  }
});
```

## 安全最佳实践

### 处理用户输入

✅ **推荐**：始终验证和消毒用户输入，防止SQL注入。

```typescript
// 使用类型验证库验证输入
import { z } from 'zod';

const ArticleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  status: z.enum(['draft', 'published', 'rejected']),
});

// 验证用户输入
function createArticleHandler(req, res) {
  const validation = ArticleSchema.safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }
  
  // 通过验证，安全地创建文章
  const article = await articles.createArticle(validation.data);
  return res.json(article);
}
```

### 权限检查

✅ **推荐**：实施适当的权限检查，确保数据安全。

```typescript
// 检查用户是否有权编辑文章
async function canEditArticle(userId, articleId) {
  const article = await articles.getArticleById(articleId);
  return article.author_id === userId || isAdmin(userId);
}

// 更新文章时验证权限
async function updateArticleHandler(req, res) {
  const { articleId } = req.params;
  const userId = req.user.id;
  
  if (!(await canEditArticle(userId, articleId))) {
    return res.status(403).json({ error: '无权编辑此文章' });
  }
  
  const updatedArticle = await articles.updateArticle(articleId, req.body);
  return res.json(updatedArticle);
}
```

## 部署注意事项

### 环境区分

✅ **推荐**：为不同环境使用不同的数据库实例。

```
# 开发环境
.env.development
NEXT_PUBLIC_SUPABASE_URL=https://dev-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-key

# 生产环境
.env.production
NEXT_PUBLIC_SUPABASE_URL=https://prod-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-key
```

### 监控和告警

✅ **推荐**：设置数据库监控和错误告警。

```typescript
// 添加全局错误处理记录错误率
let errorCount = 0;
let totalQueries = 0;

function trackDbOperation() {
  totalQueries++;
  return {
    success: () => {},
    error: (err) => {
      errorCount++;
      logError('数据库操作失败', err);
      
      // 如果错误率超过阈值，触发告警
      const errorRate = errorCount / totalQueries;
      if (errorRate > 0.05) { // 5%错误率
        sendAlert('数据库错误率过高', { errorRate, recentErrors: getRecentErrors() });
      }
    }
  };
}
```

## 模块版本管理

### 前后端版本同步

✅ **推荐**：确保前后端对数据模型的理解一致。

```typescript
// 在API响应中包含版本信息
app.get('/api/version', (req, res) => {
  res.json({
    api: '1.0.5',
    dbSchema: '1.2.3',
    features: ['vector-search', 'realtime-updates']
  });
});

// 前端检查版本兼容性
async function checkApiCompatibility() {
  const { data } = await fetch('/api/version').then(r => r.json());
  
  if (semver.lt(data.dbSchema, '1.2.0')) {
    showWarning('应用使用的API版本较旧，某些功能可能不可用');
  }
  
  return data;
}
``` 