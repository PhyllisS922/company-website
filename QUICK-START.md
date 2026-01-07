# 🚀 快速开始指南

## 部署后仍可自动更新 ✅

**重要：** 这个系统在网站部署上线后仍然可以正常工作！

### 工作原理

1. **GitHub Actions 自动运行**（每天一次）
2. **抓取新闻并生成 JSON 文件**
3. **自动提交到 GitHub 仓库**
4. **如果使用 GitHub Pages/Netlify/Vercel，会自动触发重新部署**
5. **网站自动更新，无需人工干预**

---

## 📋 首次设置（5分钟）

### 1. 配置 OpenAI API 密钥

创建 `.env` 文件（在项目根目录）：

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

**获取 API 密钥：** https://platform.openai.com/api-keys

### 2. 配置 GitHub Secrets（用于 GitHub Actions）

1. 进入你的 GitHub 仓库
2. Settings → Secrets and variables → Actions
3. 点击 "New repository secret"
4. Name: `OPENAI_API_KEY`
5. Value: 你的 API 密钥
6. 点击 "Add secret"

### 3. 配置数据源

编辑 `data-sources.json`，添加真实的 RSS 链接：

```json
{
  "sources": [
    {
      "name": "新加坡政府新闻",
      "url": "https://www.gov.sg/rss",  // 替换为真实链接
      "region": "新加坡",
      "keywords": ["政策", "经济", "跨境", "特区"],
      "enabled": true
    }
  ]
}
```

### 4. 测试运行

```bash
# 安装依赖
pip install -r requirements.txt

# 运行脚本
python scripts/fetch-news.py
```

如果成功，会生成 `assets/data/insights-data.json`。

### 5. 推送到 GitHub

```bash
git add .
git commit -m "添加新闻自动更新系统"
git push
```

---

## 🔄 自动运行

推送代码后，GitHub Actions 会自动：
- 每天 UTC 02:00（北京时间 10:00）运行一次
- 抓取新闻、筛选、分类
- 自动提交 JSON 文件
- 如果使用自动部署，网站会自动更新

---

## 🎯 日常维护（几乎不需要）

### 偶尔需要做的事情：

1. **检查内容质量**：偶尔打开网站看看新闻是否合适
2. **调整关键词**：如果抓取的内容不够精准，编辑 `data-sources.json` 中的关键词
3. **添加新数据源**：发现好的 RSS 源，添加到 `data-sources.json`

### 完全不需要做的事情：

- ❌ 手动更新新闻
- ❌ 每天检查
- ❌ 手动运行脚本
- ❌ 手动部署

---

## 💡 提示

### 如果不想使用 AI 筛选

编辑 `data-sources.json`：

```json
"ai_filtering": {
  "enabled": false
}
```

系统将仅使用关键词筛选，仍然有效。

### 调整更新频率

编辑 `.github/workflows/update-news.yml`，修改 cron 表达式：

```yaml
- cron: '0 2 * * *'  # 每天 UTC 02:00
```

### 手动触发更新

在 GitHub 仓库：
1. 进入 "Actions" 标签
2. 选择 "自动更新洞察新闻"
3. 点击 "Run workflow"

---

## 📚 详细文档

查看 `README-NEWS-AUTOMATION.md` 获取完整文档。

---

**就这么简单！** 🎉

