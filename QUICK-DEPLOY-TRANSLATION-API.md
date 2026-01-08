# 快速部署翻译API（5分钟）

## 步骤1：安装Vercel CLI（如果还没有）

```bash
npm install -g vercel
```

## 步骤2：登录Vercel

```bash
vercel login
```

## 步骤3：进入后端目录并部署

```bash
cd backend-translation-api
vercel --prod
```

## 步骤4：设置环境变量

部署完成后，Vercel会给你一个URL。然后：

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. 进入 Settings → Environment Variables
4. 添加：`OPENAI_API_KEY` = 你的OpenAI API密钥
5. 选择所有环境（Production, Preview, Development）
6. 点击 Save

## 步骤5：更新前端代码

部署完成后，Vercel会给你一个URL，例如：
```
https://your-project.vercel.app/api/translate
```

然后更新 `assets/js/translation-service.js` 中的 `API_ENDPOINT`：

```javascript
const API_ENDPOINT = 'https://your-project.vercel.app/api/translate';
```

## 步骤6：测试

刷新网站，点击语言切换按钮，页面内容应该会自动翻译。

## 成本

- Vercel：免费（有使用限制，但对翻译API足够）
- OpenAI API：约 $0.01-0.02/次翻译
- 总成本：非常低

