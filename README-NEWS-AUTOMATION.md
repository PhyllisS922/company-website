# 洞察页面新闻自动更新系统

## 📋 概述

这是一个完全自动化的新闻抓取和更新系统，用于洞察页面（`insights.html`）的新闻内容。

**特点：**
- ✅ 完全自动化，无需人工干预
- ✅ 使用 AI 辅助筛选相关内容
- ✅ 自动分类（地区/行业）
- ✅ 每天自动更新
- ✅ 零服务器成本（使用 GitHub Actions）

---

## 🚀 快速开始

### 1. 配置数据源

编辑 `data-sources.json`，添加你的 RSS 源：

```json
{
  "sources": [
    {
      "name": "数据源名称",
      "url": "RSS链接",
      "region": "马来西亚" 或 "新加坡",
      "keywords": ["关键词1", "关键词2"],
      "enabled": true
    }
  ]
}
```

### 2. 配置 OpenAI API（可选但推荐）

1. 获取 OpenAI API 密钥：https://platform.openai.com/api-keys
2. 创建 `.env` 文件（复制 `.env.example`）：
   ```
   OPENAI_API_KEY=sk-your-api-key-here
   ```
3. 在 GitHub 仓库设置中添加 Secret：
   - 进入仓库 → Settings → Secrets and variables → Actions
   - 添加新 secret：`OPENAI_API_KEY`
   - 填入你的 API 密钥

**注意：** 如果不配置 API 密钥，系统将仅使用关键词筛选（仍然有效，但可能不够精准）。

### 3. 安装 Python 依赖

```bash
pip install -r requirements.txt
```

### 4. 测试运行

```bash
python scripts/fetch-news.py
```

如果成功，会在 `assets/data/insights-data.json` 生成数据文件。

### 5. 设置 GitHub Actions

1. 将代码推送到 GitHub 仓库
2. GitHub Actions 会自动运行（每天 UTC 02:00，即北京时间 10:00）
3. 也可以手动触发：Actions → 选择工作流 → Run workflow

---

## 📁 文件结构

```
.
├── data-sources.json          # 数据源配置
├── scripts/
│   └── fetch-news.py          # 抓取脚本
├── .github/
│   └── workflows/
│       └── update-news.yml    # GitHub Actions 工作流
├── assets/
│   ├── data/
│   │   └── insights-data.json # 生成的新闻数据（自动生成）
│   └── js/
│       └── insights-loader.js # 前端加载脚本
├── requirements.txt           # Python 依赖
├── .env                       # API 密钥（不提交到 Git）
└── .env.example              # API 密钥模板
```

---

## ⚙️ 配置说明

### 数据源配置（data-sources.json）

- **sources**: RSS 源列表
  - `name`: 数据源名称
  - `url`: RSS 链接
  - `region`: 地区分类（"马来西亚" 或 "新加坡"）
  - `keywords`: 筛选关键词列表
  - `enabled`: 是否启用

- **industry_keywords**: 行业分类关键词
  - 键：行业名称
  - 值：关键词列表

- **ai_filtering**: AI 筛选配置
  - `enabled`: 是否启用 AI 筛选
  - `relevance_threshold`: 相关性阈值（未使用，保留）
  - `max_items_per_category`: 每个类别最大条目数
  - `prompt`: AI 筛选提示词

---

## 🔄 工作流程

1. **GitHub Actions 定时触发**（每天 UTC 02:00）
2. **运行 Python 脚本**
   - 读取 `data-sources.json`
   - 抓取所有启用的 RSS 源
   - 使用关键词筛选
   - 使用 AI 判断相关性（如果启用）
   - 自动分类（地区/行业）
3. **生成 JSON 文件**
   - 保存到 `assets/data/insights-data.json`
4. **自动提交到仓库**
   - GitHub Actions 自动提交更改
5. **前端自动加载**
   - 页面加载时，JavaScript 读取 JSON
   - 动态渲染到页面

---

## 💰 成本估算

### OpenAI API 成本

- 使用模型：`gpt-4o-mini`（最便宜的模型）
- 每次调用：约 100-200 tokens
- 成本：约 $0.00015 / 次调用
- 每天运行一次，假设筛选 50 条新闻：
  - 每天：约 $0.0075
  - 每月：约 $0.23

**非常便宜！** 如果担心成本，可以：
- 降低 `max_items_per_category` 限制
- 增加关键词筛选的严格度
- 完全禁用 AI，仅使用关键词筛选

---

## 🛠️ 手动操作

### 手动运行脚本

```bash
python scripts/fetch-news.py
```

### 手动触发 GitHub Actions

1. 进入 GitHub 仓库
2. 点击 "Actions" 标签
3. 选择 "自动更新洞察新闻" 工作流
4. 点击 "Run workflow"

### 手动编辑新闻数据

如果需要对内容进行人工调整，可以直接编辑 `assets/data/insights-data.json`。

---

## 🐛 故障排除

### 问题：脚本运行失败

**检查：**
1. Python 版本（需要 3.8+）
2. 依赖是否安装：`pip install -r requirements.txt`
3. RSS 链接是否有效

### 问题：AI 筛选不工作

**检查：**
1. `.env` 文件是否存在
2. `OPENAI_API_KEY` 是否正确
3. GitHub Secrets 中是否配置了密钥

### 问题：前端不显示新闻

**检查：**
1. `assets/data/insights-data.json` 是否存在
2. 浏览器控制台是否有错误
3. JSON 文件格式是否正确

### 问题：GitHub Actions 不运行

**检查：**
1. 工作流文件路径是否正确：`.github/workflows/update-news.yml`
2. 是否推送到 GitHub
3. Actions 权限是否开启

---

## 📝 自定义提示

### 修改 AI 筛选提示词

编辑 `data-sources.json` 中的 `ai_filtering.prompt`：

```json
"prompt": "你的自定义提示词"
```

### 添加新的行业分类

编辑 `data-sources.json` 中的 `industry_keywords`：

```json
"industry_keywords": {
  "新行业": ["关键词1", "关键词2"]
}
```

---

## 🔒 安全注意事项

1. **不要提交 `.env` 文件到 Git**
   - `.env` 已在 `.gitignore` 中（应该添加）
2. **使用 GitHub Secrets 存储 API 密钥**
   - 不要直接在代码中硬编码密钥
3. **定期检查 API 使用量**
   - 避免意外产生高额费用

---

## 📞 支持

如果遇到问题：
1. 检查本文档的故障排除部分
2. 查看 GitHub Actions 日志
3. 检查 Python 脚本输出

---

## 🎯 下一步

- [ ] 添加更多数据源
- [ ] 优化关键词列表
- [ ] 调整 AI 筛选提示词
- [ ] 添加更多行业分类
- [ ] 设置通知（当更新失败时）

---

**祝使用愉快！** 🚀

