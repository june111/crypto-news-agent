# 数据库模块

此模块提供与Supabase数据库的连接和交互功能。

## 配置步骤

1. 创建Supabase项目
   - 访问 [Supabase官网](https://supabase.com) 并创建账号
   - 创建新项目，记下项目URL和API密钥

2. 配置环境变量
   - 在项目根目录创建`.env`文件（基于`.env.example`）
   - 填写Supabase配置:
     ```
     SUPABASE_URL=https://your-project-id.supabase.co
     SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_KEY=your-service-key
     ```

3. 启用pgvector扩展
   - 在Supabase项目的SQL编辑器中运行: `CREATE EXTENSION IF NOT EXISTS vector;`

## 模块结构

- `index.ts` - 提供数据库客户端和连接管理
- `schema.ts` - 定义数据库表结构
- `migrations/` - 数据库迁移脚本
  - `001_initial_schema.sql` - 初始表结构
  - `init.ts` - 执行迁移脚本
- `repositories/` - 数据访问层
  - `articles.ts` - 文章相关操作
  - `tasks.ts` - AI任务相关操作
  - `templates.ts` - 文章模板相关操作
  - `embeddings.ts` - 向量嵌入相关操作

## 初始化数据库

要初始化数据库，请运行：

```bash
npm run db:init
```

此命令会：
1. 创建所有必要的表和索引
2. 启用必要的扩展
3. 添加初始模板数据

## 使用示例

```typescript
// 导入数据库客户端
import { getSupabaseClient } from './db';
import { articleRepository, taskRepository } from './db/repositories';

// 创建文章
const article = await articleRepository.createArticle({
  title: '比特币突破历史新高',
  content: '比特币价格突破...',
  status: 'draft'
});

// 创建AI任务
const task = await taskRepository.createTask({
  name: '生成文章标题',
  type: '标题',
  status: 'pending',
  article_id: article.id,
  input: { keywords: ['比特币', '突破', '历史新高'] }
});

// 更新任务状态
await taskRepository.updateTaskStatus(
  task.id, 
  'completed', 
  { title: '比特币价格突破历史新高，创下新纪录' }
);
```

## 向量搜索

本系统使用pgvector实现语义搜索：

```typescript
import { embedRepository } from './db/repositories';

// 存储文本向量
await embedRepository.storeEmbedding({
  content: '比特币今日价格上涨10%',
  embedding: [...], // 1536维向量
  article_id: 'article-uuid'
});

// 相似度搜索
const results = await embedRepository.similaritySearch(
  queryEmbedding, // 查询文本的向量表示
  0.75, // 相似度阈值
  5     // 最大结果数
);
``` 