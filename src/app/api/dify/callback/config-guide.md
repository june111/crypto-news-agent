# Dify回调API配置指南

## 基本配置信息

### 请求URL
```
https://您的域名/api/dify/callback
```
例如：`https://example.com/api/dify/callback` 或本地开发环境 `http://localhost:3000/api/dify/callback`

### 请求方法
```
POST
```

### Headers
```
Content-Type: application/json
```

### 鉴权方式
目前采用无鉴权方式（None）。

如需添加基本鉴权，可在Dify中选择"Bearer"并配置如下token：
```
your_secret_token_here
```
然后修改回调API代码，添加token验证。

## 请求体（Body）格式

请求体应为JSON格式，包含以下字段：

```json
{
  "content": "文章正文内容...",
  "describe": "文章摘要...",
  "title": "文章标题",
  "image": [
    {
      "url": "图片URL",
      "filename": "图片文件名.png",
      "type": "image",
      "size": 1234567
    }
  ],
  "date": "2025-04-03 16:03:27"
}
```

### 必填字段
- `content`: 文章正文内容
- `title`: 文章标题

### 可选字段
- `describe`: 文章摘要
- `image`: 图片信息数组
- `date`: 日期时间

## 在Dify中配置步骤

1. 进入Dify管理界面，选择您的应用
2. 导航到"集成"或"Integrations"选项卡
3. 选择"Webhooks"或"回调"选项
4. 点击"添加回调"按钮
5. 填写回调名称，如"文章保存回调"
6. 输入回调URL：`https://您的域名/api/dify/callback`
7. 选择请求方法：`POST`
8. 设置Content-Type：`application/json`
9. 鉴权选择：`None`
10. 保存配置

## 测试配置

配置完成后，您可以通过访问：
```
https://您的域名/api/dify/callback/test
```
来测试回调功能是否正常工作。该接口会发送预设的测试数据到回调接口，并返回处理结果。

## 工作流程说明

1. Dify完成内容生成后，会自动将数据POST到配置的回调URL
2. 我们的回调API接收数据并处理
3. API将数据保存到Supabase文章表
4. API返回保存结果到Dify 