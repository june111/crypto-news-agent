# 文章模板 API 文档

本文档详细介绍了文章模板（Article Templates）API的设计、功能和实现细节，帮助开发者理解和使用这些API接口。

## 概述

文章模板API提供一组REST风格的接口，用于管理加密货币内容创作的标准模板，支持模板的创建、获取、更新、删除和使用统计等功能。

## 目录结构

```
src/app/api/templates/
├── route.ts                # 主API路由处理(GET列表, POST创建)
└── [id]/                   # 动态路由，处理特定ID的模板
    └── route.ts            # 单个模板操作(GET, PUT, DELETE, PATCH)
```

## API端点详情

### 主API端点 (`/api/templates`)

#### GET 方法：获取模板列表

获取所有可用的文章模板，支持分页、排序和过滤功能。

**请求参数**：
- `page`: 当前页码（可选，默认为1）
- `pageSize`: 每页显示数量（可选，默认为10）
- `sort`: 排序字段（可选，默认为`usage_count`）
- `order`: 排序方向，`asc`或`desc`（可选，默认为`desc`）
- `category`: 按分类过滤（可选）
- `search`: 搜索关键词，匹配模板名称和描述（可选）

**示例请求**：
```http
GET /api/templates?page=1&pageSize=20&sort=created_at&order=desc&category=分析
```

**成功响应** (200 OK)：
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template-123",
        "name": "市场分析模板",
        "description": "用于分析加密市场趋势的标准模板",
        "category": "分析",
        "content": "# {{币种名称}} 市场分析\n\n## 市场概况\n\n{{币种名称}}目前的市值为{{市值}}...",
        "created_at": "2023-04-15T08:30:00Z",
        "updated_at": "2023-05-20T14:45:00Z",
        "usage_count": 42
      },
      // 更多模板...
    ],
    "total": 58,
    "page": 1,
    "pageSize": 20
  }
}
```

**错误响应** (500 Internal Server Error)：
```json
{
  "success": false,
  "error": "获取模板列表失败"
}
```

**实现细节**：
```typescript
// route.ts - GET方法
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sort = searchParams.get('sort') || 'usage_count';
    const order = searchParams.get('order') || 'desc';
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    
    // 从数据库获取模板，应用过滤和排序
    const client = await getSupabaseClient();
    let query = client.from('templates').select('*', { count: 'exact' });
    
    // 应用搜索和过滤
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq('category', category);
    }
    
    // 应用排序和分页
    const { data: templates, count, error } = await query
      .order(sort, { ascending: order === 'asc' })
      .range((page - 1) * pageSize, page * pageSize - 1);
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      data: {
        templates,
        total: count || 0,
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('获取模板列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取模板列表失败' },
      { status: 500 }
    );
  }
}
```

#### POST 方法：创建新模板

创建一个新的文章模板。

**请求体**：
```json
{
  "name": "比特币价格分析模板",
  "description": "用于分析比特币价格走势的标准模板",
  "category": "分析",
  "content": "# 比特币价格分析\n\n## 当前价格\n\n比特币目前的价格为{{价格}}..."
}
```

**成功响应** (201 Created)：
```json
{
  "success": true,
  "data": {
    "id": "template-456",
    "name": "比特币价格分析模板",
    "description": "用于分析比特币价格走势的标准模板",
    "category": "分析",
    "content": "# 比特币价格分析\n\n## 当前价格\n\n比特币目前的价格为{{价格}}...",
    "created_at": "2023-06-10T09:15:00Z",
    "usage_count": 0
  }
}
```

**错误响应** (400 Bad Request)：
```json
{
  "success": false,
  "error": "创建模板失败：缺少必要字段"
}
```

**实现细节**：
```typescript
// route.ts - POST方法
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 验证必要字段
    const { name, description, category, content } = body;
    if (!name || !category || !content) {
      return NextResponse.json(
        { success: false, error: '创建模板失败：缺少必要字段' },
        { status: 400 }
      );
    }
    
    // 创建新模板
    const client = await getSupabaseClient();
    const { data, error } = await client.from('templates').insert({
      name,
      description,
      category,
      content,
      usage_count: 0,
      created_at: new Date().toISOString()
    }).select().single();
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      data
    }, { status: 201 });
  } catch (error) {
    console.error('创建模板失败:', error);
    return NextResponse.json(
      { success: false, error: '创建模板失败：服务器错误' },
      { status: 500 }
    );
  }
}
```

### 单个模板API端点 (`/api/templates/[id]`)

#### GET 方法：获取单个模板

根据ID获取特定的模板详情。

**URL参数**：
- `id`: 模板ID

**示例请求**：
```http
GET /api/templates/template-123
```

**成功响应** (200 OK)：
```json
{
  "success": true,
  "data": {
    "id": "template-123",
    "name": "市场分析模板",
    "description": "用于分析加密市场趋势的标准模板",
    "category": "分析",
    "content": "# {{币种名称}} 市场分析\n\n## 市场概况\n\n{{币种名称}}目前的市值为{{市值}}...",
    "created_at": "2023-04-15T08:30:00Z",
    "updated_at": "2023-05-20T14:45:00Z",
    "usage_count": 42
  }
}
```

**错误响应** (404 Not Found)：
```json
{
  "success": false,
  "error": "模板不存在"
}
```

**实现细节**：
```typescript
// [id]/route.ts - GET方法
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // 获取指定ID的模板
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return NextResponse.json(
        { success: false, error: '模板不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('获取模板失败:', error);
    return NextResponse.json(
      { success: false, error: '获取模板失败：服务器错误' },
      { status: 500 }
    );
  }
}
```

#### PUT 方法：更新模板

更新特定ID的模板信息。

**URL参数**：
- `id`: 模板ID

**请求体**：
```json
{
  "name": "更新后的模板名称",
  "description": "更新后的描述",
  "category": "介绍",
  "content": "更新后的模板内容..."
}
```

**成功响应** (200 OK)：
```json
{
  "success": true,
  "data": {
    "id": "template-123",
    "name": "更新后的模板名称",
    "description": "更新后的描述",
    "category": "介绍",
    "content": "更新后的模板内容...",
    "created_at": "2023-04-15T08:30:00Z",
    "updated_at": "2023-06-15T10:20:00Z",
    "usage_count": 42
  }
}
```

**错误响应** (404 Not Found)：
```json
{
  "success": false,
  "error": "模板不存在"
}
```

**实现细节**：
```typescript
// [id]/route.ts - PUT方法
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    
    // 验证必要字段
    const { name, description, category, content } = body;
    if (!name || !category || !content) {
      return NextResponse.json(
        { success: false, error: '更新模板失败：缺少必要字段' },
        { status: 400 }
      );
    }
    
    // 更新模板
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('templates')
      .update({
        name,
        description,
        category,
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { success: false, error: '模板不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('更新模板失败:', error);
    return NextResponse.json(
      { success: false, error: '更新模板失败：服务器错误' },
      { status: 500 }
    );
  }
}
```

#### DELETE 方法：删除模板

删除特定ID的模板。

**URL参数**：
- `id`: 模板ID

**示例请求**：
```http
DELETE /api/templates/template-123
```

**成功响应** (200 OK)：
```json
{
  "success": true,
  "message": "模板已成功删除"
}
```

**错误响应** (404 Not Found)：
```json
{
  "success": false,
  "error": "模板不存在"
}
```

**实现细节**：
```typescript
// [id]/route.ts - DELETE方法
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // 删除指定ID的模板
    const client = await getSupabaseClient();
    const { error } = await client
      .from('templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json(
        { success: false, error: '模板不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '模板已成功删除'
    });
  } catch (error) {
    console.error('删除模板失败:', error);
    return NextResponse.json(
      { success: false, error: '删除模板失败：服务器错误' },
      { status: 500 }
    );
  }
}
```

#### PATCH 方法：更新模板使用次数

递增模板的使用次数统计。

**URL参数**：
- `id`: 模板ID

**示例请求**：
```http
PATCH /api/templates/template-123
```

**成功响应** (200 OK)：
```json
{
  "success": true,
  "data": {
    "id": "template-123",
    "usage_count": 43
  }
}
```

**错误响应** (400 Bad Request)：
```json
{
  "success": false,
  "error": "模板ID缺失"
}
```

**实现细节**：
```typescript
// [id]/route.ts - PATCH方法
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: '模板ID缺失' },
        { status: 400 }
      );
    }
    
    // 递增使用次数
    const client = await getSupabaseClient();
    const { data, error } = await client.rpc('increment_template_usage', { 
      template_id: id 
    });
    
    if (error) {
      return NextResponse.json(
        { success: false, error: '更新使用次数失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id,
        usage_count: data
      }
    });
  } catch (error) {
    console.error('更新使用次数失败:', error);
    return NextResponse.json(
      { success: false, error: '更新使用次数失败：服务器错误' },
      { status: 500 }
    );
  }
}
```

## 数据库交互

API使用Supabase客户端与数据库进行交互，主要涉及以下表和操作：

### 表结构

**templates 表**：
- `id`: UUID，主键
- `name`: 字符串，模板名称
- `description`: 字符串，模板描述（可选）
- `category`: 字符串，模板分类
- `content`: 文本，模板内容
- `created_at`: 时间戳，创建时间
- `updated_at`: 时间戳，更新时间（可选）
- `usage_count`: 整数，使用次数

### 存储过程

**increment_template_usage** - 递增模板使用次数：
```sql
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE templates
  SET usage_count = usage_count + 1
  WHERE id = template_id
  RETURNING usage_count INTO new_count;
  
  RETURN new_count;
END;
$$;
```

## 错误处理

API实现了统一的错误处理机制：

1. **客户端错误**：
   - 400 Bad Request：请求参数无效或缺失必要字段
   - 404 Not Found：请求的资源不存在

2. **服务器错误**：
   - 500 Internal Server Error：服务器处理请求时发生错误

所有错误响应都包含：
- `success: false`：表示请求失败
- `error`：错误描述信息

## 使用示例

### 使用fetch获取模板列表

```javascript
async function fetchTemplates(page = 1, pageSize = 10, category = '') {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString()
  });
  
  if (category) {
    params.append('category', category);
  }
  
  try {
    const response = await fetch(`/api/templates?${params.toString()}`);
    if (!response.ok) {
      throw new Error('获取模板列表失败');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('获取模板失败:', error);
    throw error;
  }
}
```

### 使用fetch创建新模板

```javascript
async function createTemplate(templateData) {
  try {
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '创建模板失败');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('创建模板失败:', error);
    throw error;
  }
}
```

### 使用fetch递增模板使用次数

```javascript
async function incrementTemplateUsage(templateId) {
  try {
    const response = await fetch(`/api/templates/${templateId}`, {
      method: 'PATCH'
    });
    
    if (!response.ok) {
      throw new Error('更新使用次数失败');
    }
    
    const data = await response.json();
    return data.data.usage_count;
  } catch (error) {
    console.error('更新使用次数失败:', error);
    // 错误可以被静默处理，因为这不应阻止用户继续使用模板
    return null;
  }
}
```

## 开发指南

### 添加新API端点

1. 在适当的路径创建新的`route.ts`文件
2. 实现所需的HTTP方法处理函数（GET, POST, PUT等）
3. 确保错误处理与现有模式一致
4. 遵循RESTful设计原则

### 测试API接口

推荐使用以下方法测试API:
1. **Postman**：用于手动测试各个端点
2. **单元测试**：使用Jest和Supertest编写自动化测试
3. **集成测试**：测试API与前端的交互

### 安全注意事项

1. **输入验证**：始终验证客户端输入
2. **错误处理**：不要在错误响应中暴露敏感信息
3. **认证和授权**：确保只有授权用户可以执行特定操作
4. **速率限制**：考虑实施速率限制以防止滥用

## 计划改进

1. **缓存机制**：添加Redis缓存层，提高频繁请求的响应速度
2. **批量操作**：支持批量创建和删除模板
3. **模板版本控制**：跟踪模板的历史版本
4. **高级搜索**：实现全文搜索和更多过滤选项
5. **使用统计**：增加更详细的使用统计和分析

## 参考资源

- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Supabase Documentation](https://supabase.io/docs)
- [RESTful API Design Guidelines](https://restfulapi.net/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) 