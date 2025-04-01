# 热点话题 API 文档

本文档详细介绍热点话题(Hot Topics)API的设计、实现和使用方法，为开发者提供清晰的接口说明和示例。

## API概述

热点话题API提供了一系列端点，用于管理加密货币领域的热门关键词，包括创建、读取、更新和删除(CRUD)操作，以及搜索和趋势分析功能。

## 目录结构

```
src/app/api/hot-topics/
├── route.ts                # 主API路由，处理获取列表和创建新热点
├── [id]/                   # 针对单个热点的操作
│   └── route.ts            # 处理获取、更新、删除单个热点的请求
├── trending/               # 热门趋势相关API
│   └── route.ts            # 获取热门趋势话题
└── search/                 # 搜索相关API
    └── route.ts            # 处理热点话题搜索请求
```

## API端点详情

### 1. 主API路由 (`/api/hot-topics`)

#### GET: 获取热点话题列表

获取热点话题列表，支持多种筛选条件。

**请求参数** (Query String):
- `source` (可选): 按来源筛选
- `minVolume` (可选): 最小搜索量
- `startDate` (可选): 开始日期
- `endDate` (可选): 结束日期

**示例请求**:
```
GET /api/hot-topics?source=推特&minVolume=5000
```

**成功响应** (200 OK):
```json
{
  "topics": [
    {
      "id": "uuid1",
      "keyword": "比特币突破70000美元",
      "volume": 12500,
      "source": "推特",
      "date": "2023-03-15",
      "created_at": "2023-03-15T12:00:00Z",
      "updated_at": "2023-03-15T12:00:00Z"
    },
    // ...更多热点
  ]
}
```

**错误响应** (500 Internal Server Error):
```json
{
  "error": "获取热点话题列表失败"
}
```

**实现细节**:
- 从请求URL获取查询参数
- 构建过滤条件并调用数据库仓库方法
- 对旧版数据结构进行转换和兼容处理
- 设置UTF-8字符编码响应头

#### POST: 创建新热点话题

创建新的热点话题。

**请求体**:
```json
{
  "keyword": "以太坊超过5000美元", // 必填
  "volume": 8500,                // 可选，默认0
  "source": "币安"               // 可选
}
```

**示例请求**:
```
POST /api/hot-topics
Content-Type: application/json

{
  "keyword": "以太坊超过5000美元",
  "volume": 8500,
  "source": "币安"
}
```

**成功响应** (201 Created):
```json
{
  "id": "uuid2",
  "keyword": "以太坊超过5000美元",
  "volume": 8500,
  "source": "币安",
  "created_at": "2023-03-15T14:30:00Z",
  "updated_at": "2023-03-15T14:30:00Z"
}
```

**错误响应** (400 Bad Request):
```json
{
  "error": "关键词为必填项"
}
```

**错误响应** (500 Internal Server Error):
```json
{
  "error": "创建热点话题失败"
}
```

**实现细节**:
- 验证请求体中的必填字段
- 调用数据库仓库方法创建热点话题
- 使用ISO格式的时间戳记录创建和更新时间
- 设置正确的HTTP状态码(201 Created)

### 2. 单个热点操作 (`/api/hot-topics/[id]`)

#### GET: 获取单个热点话题

获取特定ID的热点话题详情。

**路径参数**:
- `id`: 热点话题ID

**示例请求**:
```
GET /api/hot-topics/uuid1
```

**成功响应** (200 OK):
```json
{
  "id": "uuid1",
  "keyword": "比特币突破70000美元",
  "volume": 12500,
  "source": "推特",
  "created_at": "2023-03-15T12:00:00Z",
  "updated_at": "2023-03-15T12:00:00Z"
}
```

**错误响应** (404 Not Found):
```json
{
  "error": "热点话题不存在"
}
```

#### PUT: 更新热点话题

更新特定ID的热点话题信息。

**路径参数**:
- `id`: 热点话题ID

**请求体**:
```json
{
  "keyword": "更新后的关键词", // 可选
  "volume": 10000,           // 可选
  "source": "更新后的来源",    // 可选
  "status": "trending",      // 可选
  "date": "2023-03-16"       // 可选
}
```

**示例请求**:
```
PUT /api/hot-topics/uuid1
Content-Type: application/json

{
  "keyword": "比特币突破80000美元",
  "volume": 15000
}
```

**成功响应** (200 OK):
```json
{
  "id": "uuid1",
  "keyword": "比特币突破80000美元",
  "volume": 15000,
  "source": "推特",
  "created_at": "2023-03-15T12:00:00Z",
  "updated_at": "2023-03-16T09:45:00Z"
}
```

**错误响应** (400 Bad Request):
```json
{
  "error": "未提供任何更新字段"
}
```

**错误响应** (404 Not Found):
```json
{
  "error": "热点话题不存在或更新失败"
}
```

#### DELETE: 删除热点话题

删除特定ID的热点话题。

**路径参数**:
- `id`: 热点话题ID

**示例请求**:
```
DELETE /api/hot-topics/uuid1
```

**成功响应** (200 OK):
```json
{
  "success": true
}
```

**错误响应** (404 Not Found):
```json
{
  "error": "热点话题不存在或删除失败"
}
```

#### PATCH: 增加搜索量或更改状态

部分更新特定ID的热点话题，支持多种操作类型。

**路径参数**:
- `id`: 热点话题ID

**请求体**:
```json
{
  "action": "increment_volume", // 必填，操作类型
  "volume": 1                  // 可选，默认1
}
```

**支持的操作类型**:
- `increment_volume`: 增加热点话题的搜索量
- `mark_trending`: 将热点话题标记为趋势
- `archive`: 归档热点话题

**示例请求**:
```
PATCH /api/hot-topics/uuid1
Content-Type: application/json

{
  "action": "increment_volume",
  "volume": 100
}
```

**成功响应** (200 OK):
```json
{
  "success": true
}
```

**错误响应** (400 Bad Request):
```json
{
  "error": "不支持的操作类型: invalid_action"
}
```

### 3. 热门趋势API (`/api/hot-topics/trending`)

#### GET: 获取热门趋势话题

获取当前热门的趋势话题列表。

**请求参数** (Query String):
- `limit` (可选): 返回的热点数量，默认10

**示例请求**:
```
GET /api/hot-topics/trending?limit=5
```

**成功响应** (200 OK):
```json
{
  "topics": [
    {
      "id": "uuid1",
      "keyword": "比特币突破70000美元",
      "volume": 12500,
      "source": "推特",
      // 其他字段...
    },
    // ...更多热点
  ]
}
```

**错误响应** (400 Bad Request):
```json
{
  "error": "无效的limit参数"
}
```

**实现细节**:
- 验证limit参数
- 调用数据库仓库的getTrendingTopics方法
- 默认按搜索量降序排序

### 4. 搜索API (`/api/hot-topics/search`)

#### GET: 搜索热点话题

根据关键词搜索热点话题。

**请求参数** (Query String):
- `q` (必填): 搜索关键词

**示例请求**:
```
GET /api/hot-topics/search?q=比特币
```

**成功响应** (200 OK):
```json
{
  "topics": [
    {
      "id": "uuid1",
      "keyword": "比特币突破70000美元",
      "volume": 12500,
      // 其他字段...
    },
    {
      "id": "uuid3",
      "keyword": "比特币减半事件",
      "volume": 9800,
      // 其他字段...
    }
  ]
}
```

**错误响应** (400 Bad Request):
```json
{
  "error": "搜索关键词不能为空"
}
```

**实现细节**:
- 验证搜索关键词
- 获取所有热点话题并在服务端进行过滤
- 匹配标题或描述字段中的关键词

## 数据库交互

API与数据库的交互通过仓库模式实现，主要使用以下方法：

```typescript
// 获取热点话题列表
const topics = await db.hotTopics.getAllHotTopics(filter);

// 获取单个热点话题
const topic = await db.hotTopics.getHotTopic(id);

// 创建热点话题
const topic = await db.hotTopics.createHotTopic({
  keyword,
  volume: Number(volume),
  source,
  created_at: now,
  updated_at: now
});

// 更新热点话题
const topic = await db.hotTopics.updateHotTopic(id, updateData);

// 删除热点话题
const success = await db.hotTopics.deleteHotTopic(id);

// 增加热点话题搜索量
const success = await db.hotTopics.incrementHotTopicVolume(id, volume);

// 获取热门趋势话题
const topics = await db.hotTopics.getTrendingTopics(limit);
```

## 错误处理

API实现了统一的错误处理模式：

1. 使用try-catch捕获所有可能的异常
2. 记录错误到控制台，便于调试
3. 返回合适的HTTP状态码和清晰的错误消息
4. 对API响应设置正确的Content-Type头

示例：
```typescript
try {
  // API逻辑...
} catch (error) {
  console.error('操作失败:', error);
  return NextResponse.json(
    { error: '操作失败' },
    { status: 500 }
  );
}
```

## 使用示例

### 使用fetch API调用

```javascript
// 获取热点话题列表
async function fetchHotTopics() {
  const response = await fetch('/api/hot-topics');
  if (!response.ok) throw new Error('获取热点话题失败');
  const data = await response.json();
  return data.topics;
}

// 创建新热点话题
async function createHotTopic(topicData) {
  const response = await fetch('/api/hot-topics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(topicData)
  });
  
  if (!response.ok) throw new Error('创建热点话题失败');
  return await response.json();
}

// 删除热点话题
async function deleteHotTopic(id) {
  const response = await fetch(`/api/hot-topics/${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) throw new Error('删除热点话题失败');
  return await response.json();
}
```

### 使用API客户端调用

```typescript
import api from '@/lib/api-client';

// 获取热点话题列表
async function fetchHotTopics() {
  const { data, success, error } = await api.get('hot-topics');
  if (!success) throw new Error(error || '获取热点话题失败');
  return data.topics;
}

// 创建新热点话题
async function createHotTopic(topicData) {
  const { data, success, error } = await api.post('hot-topics', topicData);
  if (!success) throw new Error(error || '创建热点话题失败');
  return data;
}

// 删除热点话题
async function deleteHotTopic(id) {
  const { success, error } = await api.del(`hot-topics/${id}`);
  if (!success) throw new Error(error || '删除热点话题失败');
  return { success };
}
```

## 开发指南

### 添加新的API端点

要添加新的API端点，请按照以下步骤操作：

1. 在适当的目录中创建新的`route.ts`文件
2. 实现必要的请求处理函数(GET, POST, PUT, DELETE等)
3. 添加错误处理和日志记录
4. 更新此文档以反映新API

示例:
```typescript
// /api/hot-topics/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const stats = await db.hotTopics.getStatistics();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('获取热点话题统计失败:', error);
    return NextResponse.json(
      { error: '获取热点话题统计失败' },
      { status: 500 }
    );
  }
}
```

### 测试API

推荐使用以下方法测试API:

1. **浏览器开发者工具**: 直接在应用中检查网络请求
2. **Postman**: 使用Postman创建API请求集合
3. **Jest测试**: 编写单元测试和集成测试

测试示例:
```javascript
// 使用Jest测试API
describe('Hot Topics API', () => {
  test('GET /api/hot-topics returns list of topics', async () => {
    const res = await fetch('/api/hot-topics');
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(Array.isArray(data.topics)).toBe(true);
  });
});
```

## 安全注意事项

当前API实现未包含身份验证和授权机制。在生产环境中，应考虑以下安全措施：

1. 添加身份验证中间件，验证用户身份
2. 实现基于角色的授权，限制特定操作
3. 添加请求速率限制，防止滥用
4. 验证和净化所有用户输入

## 未来改进

计划中的API改进：

1. 添加分页支持，优化大量数据的处理
2. 实现更高级的搜索功能，支持多字段和模糊匹配
3. 添加数据聚合和分析端点，提供更丰富的统计信息
4. 支持批量操作，提高效率
5. 添加WebSocket支持，实现实时更新 