 ## Changelog  

### 2025.03.31

#### 热点和模板API联调
- 完成热点列表的CRUD接口对接
- 完成模板列表和编辑的接口对接

### 2025.03.30

#### 优化UI 
- **把UI库换为ant design**  
  - 更换所有页面的UI组件

#### 文章模板开发  
- **完成文章模板卡片显示功能**  
  - 创建了文章模板页面及相关组件  
  - 实现文章模板列表的增、删、查、改（CRUD）功能  

#### AI任务列表
- **完成AI任务列表的功能**  
  - 多维度筛选：按完成时间、状态和任务类型（封面图、标题、文章内容）筛选
  - 任务操作：查看结果、取消任务、重试失败任务
  - 结果查看：
    - 基本信息：任务详情、时间、耗时等
    - 结果内容：根据任务类型显示不同内容（图片/标题列表/文章）

#### 搭建AI服务架构

1. **模型服务** (server/services/ai/models/index.ts)
   - 支持OpenAI、Anthropic Claude、Ollama等多种大语言模型
   - 提供模型配置和创建函数

2. **嵌入服务** (server/services/ai/embeddings/index.ts)
   - 支持OpenAI、Cohere、HuggingFace等多种嵌入模型
   - 提供文本、文档嵌入功能

3. **向量存储服务** (server/services/ai/vectorstore/index.ts)
   - 支持内存、Pinecone、Supabase等多种向量存储
   - 提供文档存储、检索功能

4. **RAG服务** (server/services/ai/rag/index.ts)
   - 提供基础RAG和转发RAG两种实现
   - 支持相关度评估和文档检索

5. **MCP服务** (server/services/ai/mcp/index.ts)
   - 实现Anthropic的Model Context Protocol
   - 提供对话上下文管理功能

6. **LangChain服务** (server/services/ai/langchain/index.ts)
   - 提供基础链和工具功能
   - 包含预构建的加密新闻分析、价格分析等链

7. **统一入口** (server/services/ai/index.ts)
   - 导出所有AI服务模块
   - 提供任务创建函数

8. **API接口**：
   - 新闻分析API - 分析加密货币新闻
   - 价格分析API - 分析加密货币价格走势
   - 新闻生成API - 创建加密货币新闻文章
   - RAG查询API - 基于知识库回答问题
   - MCP对话API - 进行上下文对话
   - 文本嵌入API - 将文本转换为向量

#### 初始化数据库supabse

#### 把前端框架换成next.js
- 新建nextjs项目
- 迁移前端页面
- 搭建后端项目结构，加入langchain，mcp

### 2025.03.29
#### 项目初始化与基础仪表盘实现  
- **创建项目并完成基础架构搭建**  

- **实现基础仪表盘（Dashboard）**  
  - 侧边栏导航（Sidebar Navigation）  
  - 基本布局（包含头部导航和主内容区）  

#### 热点列表与可复用组件开发  
- **完成热点列表功能**  
  - 创建了热点列表页面及相关组件  
  - 实现热点列表的增、删、查（CRUD）功能  

- **开发可复用的组件库**  
  - `InputField`：输入框组件（支持文本、数字等类型输入，带有标签和占位符）  
  - `Button`：按钮组件（支持多种样式变体和图标）  
  - `Table`：表格组件（支持分页、排序、自定义渲染等功能）  
  - `Modal`：模态框组件（支持自定义标题、内容和按钮）  
  - `Toast`：消息提示组件（支持成功、警告、错误等状态）  
  - `Tooltip`：文字提示组件（支持多个方向和延迟显示）

#### 文章列表开发  
- **完成文章列表功能**  
  - 创建了文件列表页面及相关组件  
  - 实现文章列表的增、删、改、查（CRUD）功能  

- **完成文章编辑功能**  
  - 创建富文本编辑器组件  

#### 优化用户体验
- 统一了各页面的样式和交互逻辑
- 统一颜色主题 