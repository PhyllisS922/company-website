# 部署翻译API指南

## 方案：使用Vercel（推荐）

### 步骤1：安装Vercel CLI

```bash
npm install -g vercel
```

### 步骤2：登录Vercel

```bash
vercel login
```

### 步骤3：进入项目目录

```bash
cd backend-translation-api
```

### 步骤4：设置环境变量

在Vercel Dashboard中设置：
- 项目设置 → Environment Variables
- 添加：`OPENAI_API_KEY` = 你的OpenAI API密钥

或者使用CLI：

```bash
vercel env add OPENAI_API_KEY
# 粘贴你的API密钥
```

### 步骤5：部署

```bash
vercel --prod
```

### 步骤6：获取API端点

部署完成后，Vercel会给你一个URL，例如：
```
https://your-project.vercel.app/api/translate
```

### 步骤7：更新前端代码

在 `assets/js/translation-service.js` 中更新API端点：

```javascript
const API_ENDPOINT = 'https://your-project.vercel.app/api/translate';
```

## 测试API

```bash
curl -X POST https://your-project.vercel.app/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Hello", "World"],
    "targetLang": "zh"
  }'
```

## 成本

- Vercel：免费（有使用限制，但对于翻译API足够）
- OpenAI API：约 $0.01-0.02/次翻译
- 总成本：非常低

## 安全注意事项

1. API密钥存储在Vercel环境变量中，不会暴露给前端
2. 可以添加API密钥验证（可选）
3. 可以添加速率限制（可选）

