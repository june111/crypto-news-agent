# Dify API 集成文档

## 简介

本文档详细介绍了项目中与 Dify.ai 的集成。Dify.ai 是一个强大的 AI 应用开发平台，提供了完整的 API 接口，使您能够轻松构建和部署 AI 应用。本项目实现了与 Dify.ai 的完整集成，包括工作流执行、状态查询、日志管理等功能。

## 配置说明

### 环境变量

在使用 Dify 服务前，您需要在 `.env.local` 文件中配置以下环境变量：

```bash
# Dify.ai配置
DIFY_API_KEY=your_dify_api_key        # Dify API密钥
DIFY_APP_ID=your_dify_app_id          # Dify应用ID
DIFY_API_ENDPOINT=https://api.dify.ai/v1  # Dify API端点
```

### 获取 API 密钥和应用 ID

1. 在 [Dify.ai 控制台](https://cloud.dify.ai) 登录您的账户
2. 进入您的应用
3. 在"开发"页面找到 API 密钥和应用 ID

## 功能概览

本项目实现的 Dify 功能包括：

1. **执行工作流**：向 Dify 发送请求，执行预定义的工作流
2. **查询工作流状态**：获取工作流执行的实时状态
3. **停止工作流任务**：在流式响应模式下，停止正在执行的任务
4. **获取工作流日志**：查询历史工作流执行记录
5. **获取应用参数**：获取应用配置的输入参数信息

## API 端点

### 1. 执行工作流

- **端点**: `/api/dify`
- **方法**: `POST`
- **参数**:
  - `title`: 标题（必需）
  - `content`: 内容
  - `user`: 用户标识（必需）
  - `inputs`: 输入变量

**示例请求**:
```json
{
  "title": "测试标题",
  "content": "测试内容",
  "user": "user-123"
}
```

### 2. 获取工作流状态

- **端点**: `/api/dify/workflow/:id`
- **方法**: `GET`
- **参数**:
  - `id`: 工作流执行ID（路径参数）

### 3. 停止工作流任务

- **端点**: `/api/dify/workflow/task/:id/stop`
- **方法**: `POST`
- **参数**:
  - `id`: 任务ID（路径参数）

### 4. 获取工作流日志

- **端点**: `/api/dify/workflow/logs`
- **方法**: `GET`
- **查询参数**:
  - `page`: 页码
  - `limit`: 每页条数
  - `start_date`: 开始日期
  - `end_date`: 结束日期
  - `workflow_id`: 工作流ID
  - `user`: 用户标识
  - `status`: 状态 (`success`/`error`/`running`)

### 5. 获取应用参数

- **端点**: `/api/dify/parameters`
- **方法**: `GET`

## 客户端使用示例

### 初始化

```typescript
import { DifyClient } from '@/lib/services/dify/client';
```

### 执行工作流

```typescript
// 基本用法
const result = await DifyClient.generateContent({
  title: "测试标题",
  content: "测试内容",
  user: "user-123"
});

// 使用模板
const result = await DifyClient.generateFromTemplate(
  "这是一个包含{变量1}和{变量2}的模板",
  {
    变量1: "值1",
    变量2: "值2"
  },
  "模板标题"
);
```

### 获取工作流状态

```typescript
const status = await DifyClient.getWorkflowStatus("workflow-id");
```

### 停止工作流任务

```typescript
const result = await DifyClient.stopWorkflowTask("task-id");
```

### 获取工作流日志

```typescript
const logs = await DifyClient.getWorkflowLogs({
  page: 1,
  limit: 10,
  user: "user-123"
});
```

### 获取应用参数

```typescript
const parameters = await DifyClient.getParameters();
```

## 服务端使用示例

如果需要在服务端直接使用Dify服务，可以使用DifyChatService类：

```typescript
import { DifyChatService } from '@/lib/services/dify';

// 创建服务实例
const difyService = new DifyChatService();

// 执行工作流
const response = await difyService.runWorkflow({
  inputs: {
    title: "标题",
    content: "内容"
  },
  user: "user-123",
  response_mode: "blocking"
});
```

## 流式响应处理

Dify.ai支持流式响应模式，可以实时获取生成的内容。使用方法：

```typescript
// 客户端发起流式请求
const response = await fetch('/api/dify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: "标题",
    content: "内容",
    user: "user-123",
    response_mode: "streaming"
  }),
});

// 处理流式响应
if (response.body) {
  const reader = response.body.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    // 处理接收到的数据块
    const text = new TextDecoder().decode(value);
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        // 处理数据...
      }
    }
  }
}

// 如需停止流式响应
await DifyClient.stopWorkflowTask("task-id");
```

## 注意事项

1. **API密钥安全**：确保在客户端不会暴露 Dify API 密钥
2. **必需参数**：调用工作流API时必须提供`title`和`user`参数
3. **流式响应**：只有在使用流式响应模式时，停止任务API才有效
4. **错误处理**：所有API都包含了完善的错误处理机制，可以通过响应中的`success`和`error`字段判断请求是否成功

## 依赖

- Next.js API Routes
- fetch API
- TypeScript

## 调试建议

1. 使用测试路由`/api/dify/test`验证 Dify 连接是否正常
2. 检查 Dify.ai 控制台中的应用日志
3. 使用浏览器开发者工具查看网络请求

## 常见问题

### Q: 遇到 "title is required in input form" 错误怎么办？
A: 确保在请求中包含`title`字段，这是 Dify 工作流应用的必需参数。

### Q: 如何切换流式响应和阻塞响应？
A: 在请求中设置`response_mode`参数为`"streaming"`或`"blocking"`。

### Q: 获取不到工作流状态怎么办？
A: 确认工作流ID是否正确，并检查API密钥是否有访问该工作流的权限。

### Q: 在哪里查看Dify API的完整文档？
A: 在 [Dify 官方文档](https://docs.dify.ai/) 中可以找到完整的API参考。 