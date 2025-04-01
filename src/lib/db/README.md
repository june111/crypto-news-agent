# 数据库模块 (Database Module)

这个模块提供与Supabase数据库的连接和交互功能，采用现代化的连接池管理和仓库模式设计。

## 主要特性

- **连接池管理**：使用React cache API实现单例模式，解决Next.js路由隔离问题
- **Mock模式**：支持离线开发和测试，无需真实数据库连接
- **仓库模式**：数据访问层采用仓库模式，提供清晰的API接口
- **类型安全**：完整的TypeScript类型定义，确保代码质量
- **日志系统**：内置可配置的日志系统，便于调试和监控
- **健康检查**：提供数据库连接健康检查功能

## 文档目录

- [架构概览](./docs/architecture.md) - 模块架构和组件关系
- [安装配置指南](./docs/setup-guide.md) - 安装和配置说明
- [最佳实践指南](./docs/best-practices.md) - 使用本模块的最佳实践
- [使用示例](./docs/examples.md) - 各种功能的代码示例

## 目录结构

```
src/lib/db/
│
├── connection-pool.ts    # Supabase连接池管理，使用React cache API实现单例
├── supabase.ts           # Supabase客户端和mock客户端实现
├── schema.ts             # 数据库表结构定义
├── index.ts              # 模块入口，导出必要的函数和常量
├── createTables.ts       # 数据库表创建脚本
│
├── repositories/         # 数据访问层 - 仓库模式
│   ├── index.ts                # 仓库导出入口
│   ├── articleRepository.ts    # 文章相关操作
│   ├── aiTaskRepository.ts     # AI任务相关操作
│   ├── templatesRepository.ts  # 文章模板相关操作
│   ├── hotTopicsRepository.ts  # 热点话题相关操作
│   └── embeddingsRepository.ts # 向量嵌入相关操作
│
├── migrations/           # 数据库迁移脚本
│
├── utils/                # 工具函数
│   └── logger.ts         # 日志记录工具
│
└── tests/                # 单元测试和集成测试
    ├── index.ts          # 测试入口
    ├── test-basic.ts     # 基础功能测试
    ├── test-connection.ts # 连接测试
    ├── test-articles.ts  # 文章仓库测试
    ├── test-tasks.ts     # 任务仓库测试
    ├── test-templates.ts # 模板仓库测试
    ├── test-hot-topics.ts # 热点话题测试
    └── test-embeddings.ts # 向量嵌入测试
```

## 配置说明

### 环境变量配置

在项目根目录创建`.env.local`文件（基于`.env.example`），填写以下配置：

```bash
# Supabase配置
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key  # 可选，用于高权限操作

# 可选配置
MOCK_DB=false                          # 设置为true启用模拟数据库模式
DEBUG_SUPABASE=false                   # 设置为true启用详细日志
```

### 模拟模式 (Mock Mode)

当满足以下条件之一时，系统将自动切换到模拟模式：

1. 环境变量`MOCK_DB=true`
2. 处于测试环境(`NODE_ENV=test`)
3. 开发环境下未配置Supabase URL

模拟模式下，系统使用内存数据存储，无需真实数据库连接，便于本地开发和测试。

## 快速开始

### 初始化数据库连接

```typescript
import { initDatabaseOnce } from '@/lib/db';

// 在应用启动时初始化数据库连接
await initDatabaseOnce();
```

### 文章操作

```typescript
import { articles } from '@/lib/db';

// 创建文章
const newArticle = await articles.createArticle({
  title: '比特币突破历史新高',
  content: '比特币价格突破...',
  summary: '简要概述...',
  category: 'cryptocurrency',
  keywords: ['比特币', '价格', '突破'],
  status: 'draft'
});

// 获取文章列表
const allArticles = await articles.getArticles();

// 更新文章
await articles.updateArticle(newArticle.id, {
  title: '更新后的标题',
  status: 'published'
});

// 删除文章
await articles.deleteArticle(newArticle.id);
```

### 热点话题操作

```typescript
import { hotTopics } from '@/lib/db';

// 获取热门话题
const topics = await hotTopics.getHotTopics();

// 添加新热点
const newTopic = await hotTopics.createTopic({
  keyword: '以太坊2.0',
  volume: 5000,
  source: 'Twitter'
});

// 删除热点
await hotTopics.deleteTopic(newTopic.id);
```

## 其他资源

- [Supabase 官方文档](https://supabase.com/docs)
- [pgvector 官方文档](https://github.com/pgvector/pgvector)
- [Next.js 与数据库集成](https://nextjs.org/docs/pages/building-your-application/data-fetching)

## 常见问题排查

更多常见问题和解决方案，请参阅 [安装配置指南](./docs/setup-guide.md) 的"常见问题排查"部分。

## 核心组件

### 连接池管理 (connection-pool.ts)

使用React的cache API实现真正的单例模式，解决Next.js路由隔离问题。主要功能：

- 确保每个请求周期只创建一个数据库连接实例
- 自动重试连接机制
- 请求ID跟踪
- 连接健康检查

```typescript
// 获取数据库客户端实例
import { getSupabaseClient } from '@/lib/db';
const client = getSupabaseClient();
```

### 仓库 (Repositories)

采用仓库模式封装数据访问逻辑，提供清晰的API接口。每个仓库负责特定实体的CRUD操作：

```typescript
// 导入仓库
import { articles, templates, aiTasks, hotTopics, embeddings } from '@/lib/db';

// 使用文章仓库
const article = await articles.getArticleById('article-id');
const newArticle = await articles.createArticle({
  title: '新文章标题',
  content: '文章内容',
  status: 'draft'
});
```

### 日志系统 (logger.ts)

提供四种级别的日志记录，可通过环境变量配置启用/禁用详细日志：

- `logDebug`: 调试日志，仅在开发模式或`DEBUG_SUPABASE=true`时输出
- `logInfo`: 信息日志
- `logWarning`: 警告日志
- `logError`: 错误日志，支持错误对象和堆栈跟踪

```typescript
import { logInfo, logError } from '@/lib/db/utils/logger';

logInfo('操作成功', { userId: 123 });
try {
  // 业务逻辑
} catch (error) {
  logError('操作失败', error);
}
```

## 数据模型

系统包含以下主要数据模型：

### 文章 (Article)

```typescript
interface Article {
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
}
```

### AI任务 (AITask)

```typescript
interface AITask {
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
```

### 模板 (Template)

```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
}
```

### 热点话题 (HotTopic)

```typescript
interface HotTopic {
  id: string;
  keyword: string;
  volume: number;
  source?: string;
  created_at: string;
  updated_at: string;
  related_articles?: any[];
}
```

## 测试

系统提供完整的测试套件，包括单元测试和集成测试：

```bash
# 运行所有测试
npm run test:db

# 运行特定测试
npm run test:db -- --testPathPattern=test-articles
```

## 最佳实践

1. **使用仓库API**：始终通过仓库API访问数据，而不是直接使用Supabase客户端
2. **错误处理**：始终捕获并处理异常，使用日志系统记录错误
3. **类型安全**：利用TypeScript类型系统，确保代码质量和可维护性
4. **测试**：为关键数据操作编写测试，确保系统稳定性

## 故障排除

常见问题及解决方案：

1. **连接失败**：检查环境变量和网络连接
2. **类型错误**：确保按照接口定义提供正确的数据结构
3. **权限问题**：检查Supabase权限设置和使用的API密钥类型 