# 数据库模块安装和配置指南

本指南将帮助你设置和配置数据库模块，包括Supabase项目创建、数据库初始化和环境变量配置。

## 先决条件

- Node.js 18.x 或更高版本
- npm 或 yarn 包管理器
- Supabase账号 (免费计划即可)

## 步骤1: 创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com) 并创建账号或登录。

2. 在Supabase控制台中，点击"New Project"创建一个新项目：
   - 输入项目名称 (例如: `crypto-news-app`)
   - 设置数据库密码 (请保存此密码)
   - 选择离你最近的区域/数据中心
   - 点击"Create new project"

3. 项目创建完成后，从控制台获取必要的密钥：
   - 从项目设置 > API 获取项目URL (`https://[YOUR-PROJECT-ID].supabase.co`)
   - 获取`anon`公共密钥 (`项目设置 > API > anon public`)
   - 获取`service_role`密钥 (`项目设置 > API > service_role secret`)

## 步骤2: 配置环境变量

1. 在项目根目录创建`.env.local`文件 (如果不存在)：

```bash
touch .env.local
```

2. 编辑`.env.local`文件，添加以下内容：

```
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_KEY=[YOUR-SERVICE-ROLE-KEY]

# 可选配置
MOCK_DB=false                       # 设置为true启用模拟数据库模式
DEBUG_SUPABASE=true                 # 开发时设置为true启用详细日志
```

## 步骤3: 初始化数据库表结构

Supabase提供了SQL编辑器用于执行数据库脚本：

1. 在Supabase控制台中，导航到`SQL编辑器`。

2. 启用必要的扩展：
   - 点击"New Query"创建一个新的SQL查询
   - 粘贴以下SQL并执行：
   ```sql
   -- 启用UUID扩展
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- 启用向量扩展 (用于语义搜索)
   CREATE EXTENSION IF NOT EXISTS "vector";
   ```

3. 创建数据库表：
   - 复制项目中`src/lib/db/migrations/initial_schema.sql`文件的内容
   - 在SQL编辑器中粘贴并执行

## 步骤4: 测试连接

创建一个简单的测试脚本确保数据库连接正常工作：

1. 在项目根目录创建一个测试文件`scripts/test-db.js`：

```javascript
const { initDatabaseOnce, getSupabaseClient } = require('../src/lib/db');

async function testConnection() {
  console.log('初始化数据库连接...');
  await initDatabaseOnce();
  
  const client = getSupabaseClient();
  console.log('获取Supabase客户端实例...');
  
  try {
    console.log('测试连接...');
    const { data, error } = await client.from('articles').select('id').limit(1);
    
    if (error) {
      console.error('连接测试失败:', error);
    } else {
      console.log('连接测试成功!', data);
    }
  } catch (err) {
    console.error('连接测试出现异常:', err);
  }
}

testConnection();
```

2. 使用Node.js运行此测试脚本：

```bash
node -r dotenv/config scripts/test-db.js
```

## 步骤5: 添加初始数据 (可选)

可以通过SQL或API添加一些初始数据：

1. 创建一个模板示例：

```sql
INSERT INTO templates (name, description, content, category) 
VALUES (
  '市场分析模板', 
  '用于分析加密货币市场动态的模板', 
  '# {{title}}\n\n## 市场概览\n\n{{summary}}\n\n## 价格分析\n\n## 市场趋势\n\n## 未来展望',
  '分析'
);
```

2. 创建一个热点话题示例：

```sql
INSERT INTO hot_topics (keyword, volume, source) 
VALUES (
  '比特币减半事件',
  8500,
  'CoinDesk'
);
```

## 模拟模式使用

在开发或测试时，可以使用模拟模式而无需真实数据库连接：

1. 在`.env.local`文件中设置：

```
MOCK_DB=true
```

2. 模拟模式将使用内存中的模拟数据，适用于：
   - 离线开发
   - 单元测试
   - CI/CD管道测试

## 常见问题排查

1. **连接失败**
   - 检查环境变量是否正确配置
   - 确认Supabase项目是否处于活动状态
   - 检查网络连接和防火墙设置

2. **pgvector扩展问题**
   - 确认已创建vector扩展
   - 检查向量维度设置(默认1536，适用于OpenAI嵌入)

3. **权限问题**
   - 对于公共API，使用anon密钥
   - 对于后端操作，使用service_role密钥
   - 检查Supabase行级安全策略

4. **模拟模式不工作**
   - 确认`MOCK_DB=true`环境变量已设置
   - 检查控制台是否有错误信息 