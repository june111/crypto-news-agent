# 热点话题管理模块

本文档详细介绍热点话题（Hot Topics）模块的功能、架构和使用方法，帮助开发者理解其业务需求和技术实现。

## 功能概述

热点话题模块用于管理和展示加密货币领域的热门关键词，具有以下核心功能：

- **热点话题列表**：展示所有热点话题，包括关键词、搜索量和来源
- **添加热点话题**：添加新的热点关键词及其相关信息
- **删除热点话题**：移除不再需要关注的热点
- **热点详情查看**：查看热点话题的详细信息
- **搜索和筛选**：通过关键词和来源筛选热点话题
- **热点分类标记**：基于搜索量自动标记热度等级
- **来源管理**：支持自定义热点话题来源

## 架构设计

热点话题模块采用前后端分离架构，包括：

```
src/app/
├── hot-topics/           # 前端页面和组件
│   ├── page.tsx          # 主页面组件
│   ├── constants.ts      # 常量定义
│   └── components/       # 子组件
│       ├── AddTopicModal.tsx      # 添加热点话题弹窗
│       ├── TopicDetailPanel.tsx   # 热点详情面板
│       └── StatisticsCards.tsx    # 统计数据卡片
│
└── api/hot-topics/       # 后端API接口
    ├── route.ts          # 主API路由(GET, POST)
    ├── [id]/route.ts     # 单个热点操作(GET, PUT, DELETE, PATCH)
    ├── trending/route.ts # 热门趋势话题API
    └── search/route.ts   # 热点搜索API
```

## 数据模型

### 热点话题（HotTopic）

```typescript
interface HotTopic {
  id: string;              // 唯一标识符
  keyword: string;         // 热点关键词
  volume: number;          // 搜索量/热度
  source?: string;         // 数据来源
  date?: string;           // 日期
  status?: string;         // 状态(trending, active)
  created_at: string;      // 创建时间
  updated_at: string;      // 更新时间
  related_articles?: any[]; // 相关文章
}
```

### 前端显示模型（DisplayHotTopic）

```typescript
interface DisplayHotTopic {
  id: string;
  keyword: string;
  volume: number;
  date: string;
  source?: string;
  status?: string;
  category?: string;      // 前端分类，不存储在数据库
}
```

## API接口说明

### 1. 获取热点话题列表

- **端点**：`GET /api/hot-topics`
- **参数**：
  - `source` (可选)：数据来源筛选
  - `minVolume` (可选)：最小搜索量筛选
  - `startDate` (可选)：开始日期
  - `endDate` (可选)：结束日期
- **响应**：
  ```json
  {
    "topics": [
      {
        "id": "uuid-1",
        "keyword": "比特币突破70000美元",
        "volume": 12500,
        "source": "推特",
        "date": "2023-03-14",
        "created_at": "2023-03-14T12:00:00Z",
        "updated_at": "2023-03-14T12:00:00Z"
      },
      // ...更多热点
    ]
  }
  ```

### 2. 创建新热点话题

- **端点**：`POST /api/hot-topics`
- **请求体**：
  ```json
  {
    "keyword": "以太坊超过5000美元",
    "volume": 8500,
    "source": "币安"
  }
  ```
- **响应**：创建的热点话题对象

### 3. 获取单个热点话题

- **端点**：`GET /api/hot-topics/{id}`
- **响应**：单个热点话题对象

### 4. 更新热点话题

- **端点**：`PUT /api/hot-topics/{id}`
- **请求体**：
  ```json
  {
    "keyword": "更新后的关键词",
    "volume": 10000,
    "source": "更新后的来源"
  }
  ```
- **响应**：更新后的热点话题对象

### 5. 删除热点话题

- **端点**：`DELETE /api/hot-topics/{id}`
- **响应**：`{ "success": true }`

### 6. 增加热点话题搜索量或更改状态

- **端点**：`PATCH /api/hot-topics/{id}`
- **请求体**：
  ```json
  {
    "action": "increment_volume",
    "volume": 1
  }
  ```
- **支持的actions**：
  - `increment_volume`: 增加搜索量
  - `mark_trending`: 标记为趋势
  - `archive`: 归档热点话题
- **响应**：更新后的热点话题对象或操作结果

### 7. 获取热门趋势话题

- **端点**：`GET /api/hot-topics/trending`
- **参数**：
  - `limit` (可选)：返回的热点数量，默认10
- **响应**：热门趋势话题列表

### 8. 搜索热点话题

- **端点**：`GET /api/hot-topics/search`
- **参数**：
  - `q`：搜索关键词
- **响应**：匹配的热点话题列表

## 前端组件说明

### 主页面 (page.tsx)

热点话题管理的主界面，整合了所有组件，实现以下功能：
- 热点话题的表格展示
- 搜索和筛选功能
- 添加/删除热点话题
- 查看热点详情

### 常量定义 (constants.ts)

包含模块中使用的常量值，包括：
- `TRENDING_THRESHOLD`: 热门话题的搜索量阈值(10000)
- `VOLUME_COLOR`: 不同热度级别的颜色阈值
  - HIGH: 10000 (红色)
  - MEDIUM: 5000 (橙色)
  - LOW: 2000 (绿色)
- `DEFAULT_SOURCES`: 默认的数据来源列表

### 添加热点弹窗 (AddTopicModal.tsx)

用于添加新热点的模态窗口，包含：
- 关键词输入框
- 搜索量输入框
- 来源选择器 (支持添加自定义来源)
- 自动热门标记功能 (超过阈值时)

### 热点详情面板 (TopicDetailPanel.tsx)

展示单个热点话题的详细信息，包括：
- 基本信息 (关键词、搜索量、来源、日期)
- 状态标签展示
- 热点分析信息展示
- 时间轴显示

### 统计卡片 (StatisticsCards.tsx)

显示热点话题的统计信息，包括：
- 热点总数
- 热门话题数量
- 最高搜索量

## 业务逻辑说明

### 热点分类逻辑

热点话题根据搜索量自动分为四个级别：
1. **高热度**：搜索量 ≥ 10,000 (红色)
2. **中等热度**：搜索量 ≥ 5,000 (橙色)
3. **低热度**：搜索量 ≥ 2,000 (绿色)
4. **普通**：搜索量 < 2,000 (蓝色)

当搜索量超过`TRENDING_THRESHOLD` (10000)时，自动标记为"热门"状态。

### 来源管理逻辑

1. 系统预设了默认来源列表
2. 用户可以添加自定义来源
3. 来源信息保存在本地存储中，在下次访问时保持一致

### 错误处理逻辑

1. API请求错误时，前端显示友好的错误信息
2. 表单验证确保数据正确性
3. 加载状态显示提升用户体验

## 使用示例

### 添加新热点话题

```typescript
// 前端代码示例
const handleSaveHotTopic = async () => {
  try {
    // 验证数据
    if (!keyword.trim()) {
      message.error('请输入关键词');
      return;
    }
    
    // 调用API
    const response = await fetch('/api/hot-topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        keyword: keyword.trim(),
        volume: volume || 0,
        source: source || undefined
      })
    });
    
    if (!response.ok) {
      throw new Error('创建热点话题失败');
    }
    
    // 处理成功响应
    const newTopic = await response.json();
    message.success('热点话题添加成功');
    
    // 刷新列表
    fetchHotTopics();
    
    // 重置表单
    setKeyword('');
    setVolume(0);
    setSource('');
    setIsModalVisible(false);
  } catch (error) {
    console.error('添加热点话题失败:', error);
    message.error('添加热点话题失败，请重试');
  }
};
```

### 删除热点话题

```typescript
// 前端代码示例
const handleDeleteTopic = async (id: string) => {
  try {
    const response = await fetch(`/api/hot-topics/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('删除热点话题失败');
    }
    
    message.success('热点话题已删除');
    fetchHotTopics(); // 刷新列表
  } catch (error) {
    console.error('删除热点话题失败:', error);
    message.error('删除热点话题失败，请重试');
  }
};
```

## 开发与扩展建议

### 可能的改进方向

1. **数据可视化**：添加热点话题趋势图表
2. **相关文章**：关联热点话题与相关文章
3. **自动数据采集**：从社交媒体和行业网站自动采集热点话题
4. **搜索量自动更新**：定期更新热点话题的搜索量
5. **热点话题分类**：添加热点话题分类功能
6. **用户关注**：允许用户关注特定热点话题
7. **热点推送**：新的高热度话题产生时进行推送

### 代码最佳实践

1. 使用React Query或SWR优化数据获取和缓存
2. 实现更完善的表单验证
3. 添加单元测试和集成测试
4. 优化组件性能，减少不必要的重渲染
5. 增强错误处理和日志记录

## 故障排除

### 常见问题

1. **热点话题无法添加**
   - 检查API端点是否正确
   - 验证请求体格式是否正确
   - 检查后端日志查看具体错误

2. **前端显示异常**
   - 清除浏览器缓存
   - 检查控制台错误信息
   - 验证API返回的数据格式

3. **数据不一致**
   - 检查浏览器本地存储
   - 确认API和前端的数据模型匹配
   - 验证数据转换逻辑是否正确

## 参考资源

- Ant Design 组件库: https://ant.design/components/overview/
- Next.js API Routes: https://nextjs.org/docs/api-routes/introduction
- React Hooks 指南: https://reactjs.org/docs/hooks-intro.html 