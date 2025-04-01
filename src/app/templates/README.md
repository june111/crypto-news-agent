# 文章模板管理模块

本文档详细介绍文章模板（Article Templates）模块的功能、架构和使用方法，帮助开发者理解其业务需求和技术实现。

## 功能概述

文章模板模块用于管理和使用加密货币内容创作的标准模板，具有以下核心功能：

- **模板列表展示**：以卡片形式展示所有可用的文章模板
- **模板搜索和筛选**：通过名称和分类筛选模板
- **模板创建与编辑**：添加新模板和修改现有模板的内容
- **模板删除**：移除不再需要的模板
- **模板使用统计**：跟踪和显示每个模板的使用频率
- **分类管理**：按不同分类组织和查看模板

## 架构设计

文章模板模块采用前后端分离架构，包括：

```
src/app/
├── templates/                  # 前端页面和组件
│   ├── page.tsx               # 主列表页面
│   ├── template.module.css    # 模板相关样式
│   ├── templates.module.css   # 列表页面样式
│   ├── layout.tsx             # 页面布局组件
│   └── edit/                  # 编辑相关页面
│       ├── page.tsx           # 新建模板页面
│       ├── [id]/              # 编辑特定模板页面
│       │   └── page.tsx       # 编辑页面组件
│       └── layout.tsx         # 编辑页面布局
│
└── api/templates/             # 后端API接口
    ├── route.ts               # 主API路由(GET, POST)
    └── [id]/                  # 单个模板操作
        └── route.ts           # 处理特定模板的请求
```

## 数据模型

### 模板（Template）

```typescript
interface Template {
  id: string;              // 唯一标识符
  name: string;            // 模板名称
  description: string;     // 模板描述
  category: string;        // 模板分类
  content: string;         // 模板内容（Markdown格式）
  created_at: string;      // 创建时间
  updated_at?: string;     // 更新时间
  usage_count: number;     // 使用次数
}
```

## 前端组件说明

### 主列表页面 (page.tsx)

模板列表页面使用卡片布局展示所有可用模板，包含以下功能：

- **统计信息**：展示模板总数、使用总次数和分类数量
- **搜索筛选**：通过名称和分类筛选模板
- **排序功能**：按使用频率排序模板
- **模板卡片**：展示每个模板的基本信息和操作按钮
- **添加按钮**：快速创建新模板

页面使用Ant Design组件库，采用响应式布局，在不同设备上提供一致的用户体验。

### 编辑页面 (edit/page.tsx 和 edit/[id]/page.tsx)

提供模板创建和编辑功能，包含：

- **表单验证**：确保必填字段不为空
- **Markdown编辑器**：编辑模板内容
- **预览功能**：实时预览Markdown渲染效果
- **变量提示**：支持模板变量的输入和提示
- **保存、取消、删除**操作：完整的模板管理功能

编辑页面支持两种模式：
1. 新建模式：创建全新的模板
2. 编辑模式：修改现有模板

## 业务逻辑说明

### 模板分类逻辑

模板按以下几个常见分类组织：
- **分析**：市场分析、价格分析类文章模板（蓝色标签）
- **介绍**：项目介绍、币种介绍类文章模板（绿色标签）
- **报道**：新闻报道类文章模板（橙色标签）
- **技术**：技术解析、代码说明类文章模板（紫色标签）
- **观点**：观点、评论类文章模板（红色标签）
- **教程**：教程、指南类文章模板（青色标签）

每个分类有对应的颜色标签，便于视觉识别。

### 模板变量机制

模板内容支持变量占位符，使用双大括号语法：`{{变量名}}`

常见变量类型：
- 文章基本信息：`{{标题}}`、`{{摘要}}`
- 币种相关：`{{币种名称}}`、`{{市值}}`、`{{价格}}`
- 市场数据：`{{交易量}}`、`{{流通量}}`、`{{市场排名}}`
- 分析指标：`{{RSI值}}`、`{{MACD值}}`、`{{情绪分析}}`

这些变量在使用模板创建文章时可以被实际内容替换。

### 使用次数统计

系统会自动跟踪每个模板的使用次数：
1. 每次通过模板创建文章时，对应模板的`usage_count`加1
2. 使用次数影响模板在列表中的排序（使用次数高的模板默认排在前面）
3. 使用次数也作为模板受欢迎程度和实用性的指标

## 前端状态管理

1. **模板列表状态**：
   - `templates`: 存储所有模板数据
   - `loading`: 加载状态标志
   - `searchName`和`searchCategory`: 搜索和筛选条件

2. **编辑页面状态**：
   - `template`: 当前编辑的模板
   - `isLoading`: 加载状态
   - `isSaving`: 保存状态
   - 表单状态: 使用Ant Design的Form组件管理

3. **模板统计状态**：
   - 使用`useMemo`计算衍生数据，如总使用次数、分类数量等

## 使用示例

### 创建新模板

```typescript
// 跳转到创建页面
const handleAddTemplate = () => {
  router.push('/templates/edit/new');
};

// 保存模板
const handleSave = async () => {
  try {
    const values = await form.validateFields();
    
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(values)
    });
    
    if (!response.ok) {
      throw new Error('创建模板失败');
    }
    
    message.success('模板创建成功');
    router.push('/templates');
  } catch (error) {
    console.error('创建模板失败:', error);
    message.error('创建模板失败，请检查表单并重试');
  }
};
```

### 按分类筛选模板

```typescript
// 处理分类搜索
const handleCategorySearch = (value: string) => {
  setSearchCategory(value);
};

// 过滤模板
const filteredTemplates = templates.filter((template: Template) => {
  const nameMatch = template.name.toLowerCase().includes(searchName.toLowerCase());
  const categoryMatch = !searchCategory || template.category === searchCategory;
  return nameMatch && categoryMatch;
});
```

### 删除模板

```typescript
const handleDeleteTemplate = async (id: string, name: string) => {
  try {
    const response = await fetch(`/api/templates/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('删除模板失败');
    }
    
    // 本地更新UI，不需要重新获取数据
    setTemplates(prevTemplates => 
      prevTemplates.filter((t: Template) => t.id !== id)
    );
    
    message.success(`已成功删除模板"${name}"`);
  } catch (error) {
    console.error('删除模板失败:', error);
    message.error('删除模板失败，请稍后重试');
  }
};
```

## 交互设计

### 模板卡片

每个模板卡片包含：
- **模板名称**：粗体显示
- **分类标签**：彩色标签指示分类
- **使用次数**：数字徽章展示
- **描述**：简短描述模板用途
- **操作按钮**：编辑、删除、使用等

### 反馈机制

用户操作会获得及时的反馈：
- **加载状态**：使用骨架屏和加载指示器
- **操作结果**：成功/失败消息提示
- **确认对话框**：删除操作前的二次确认

## 开发与扩展建议

### 可能的改进方向

1. **模板预览**：添加完整的预览功能，显示渲染后的效果
2. **模板变量管理**：提供变量列表和说明，便于模板创建
3. **模板版本控制**：记录模板的历史版本和变更
4. **模板分享**：允许用户分享或导出模板
5. **批量操作**：支持多选和批量删除
6. **自动保存**：编辑时自动保存草稿
7. **模板评分**：允许用户对模板进行评分和评价

### 性能优化建议

1. **列表虚拟化**：当模板数量较多时，使用虚拟列表优化渲染性能
2. **图片懒加载**：对模板中的图片实现懒加载
3. **缓存优化**：对不常变化的数据实施缓存策略
4. **代码分割**：将大型组件（如Markdown编辑器）拆分为独立chunk

## 故障排除

### 常见问题

1. **模板无法保存**
   - 检查表单验证是否通过
   - 验证API端点是否正确
   - 查看网络请求是否成功

2. **模板列表加载失败**
   - 确认API服务是否正常运行
   - 检查网络连接状态
   - 查看控制台错误信息

3. **模板内容显示异常**
   - 验证Markdown格式是否正确
   - 检查变量语法是否正确
   - 确认内容渲染组件是否正常工作

## 参考资源

- Ant Design 组件库: https://ant.design/components/overview/
- React Markdown: https://github.com/remarkjs/react-markdown
- Next.js 文档: https://nextjs.org/docs 