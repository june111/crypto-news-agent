This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 项目架构

本项目采用清晰的三层架构设计，有利于代码的组织和维护：

### 数据层 - 负责数据访问和存储
- 使用Supabase作为数据库服务
- 实现数据库连接和操作的抽象
- 通过仓库模式(Repository Pattern)组织数据访问逻辑
- 位于`src/lib/db`目录下
- 支持向量存储和相似度搜索，用于实现RAG(检索增强生成)

### 服务层 - 提供业务逻辑和AI能力
- 实现了基于LangChain的内容生成和处理服务
- 提供MCP（Model Context Protocol）实现高效的对话上下文管理
- 集成多种AI模型（OpenAI、Anthropic等）
- 位于`src/lib/services`目录下

### API层 - 连接前端与后端服务
- 基于Next.js API Routes实现RESTful接口
- 提供统一的错误处理和响应格式
- 路由和控制器分离，便于测试和维护
- 位于`src/app/api`目录下

## 向量数据库功能

本项目集成了基于PostgreSQL的向量数据库功能：

- 使用`pgvector`扩展支持存储和查询高维向量
- 提供向量相似度搜索API，支持余弦相似度和欧几里得距离
- 实现了文档嵌入存储和检索功能，支持LLM的RAG应用
- 自动为文章内容创建嵌入向量，便于相似内容搜索和推荐

相关实现位于`src/lib/db/repositories/embeddingsRepository.ts`。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
