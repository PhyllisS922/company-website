# 📚 新闻自动更新系统 - 手把手设置指南

## 📋 目录

1. [我已经做了什么](#我已经做了什么)
2. [整体工作流程概览](#整体工作流程概览)
3. [接下来需要做的步骤（详细版）](#接下来需要做的步骤详细版)
4. [需要准备的工具和账号](#需要准备的工具和账号)
5. [可能遇到的问题](#可能遇到的问题)
6. [时间估算](#时间估算)

---

## 我已经做了什么

### ✅ 已完成（仅创建文件，未运行）

我已经为你创建了所有必要的代码文件，但**还没有执行任何实际运行**。这些文件包括：

1. **`data-sources.json`** - 数据源配置文件（目前是示例RSS链接，需要替换为真实链接）
2. **`scripts/fetch-news.py`** - Python抓取脚本（代码已写好，但还没运行过）
3. **`.github/workflows/update-news.yml`** - GitHub Actions配置（已配置，但还没激活）
4. **`assets/js/insights-loader.js`** - 前端加载脚本（代码已写好）
5. **`requirements.txt`** - Python依赖列表
6. **`assets/data/insights-data.json`** - 示例数据文件（用于测试前端显示）

### ❌ 未完成

- ❌ 还没有安装Python依赖
- ❌ 还没有配置API密钥
- ❌ 还没有测试脚本运行
- ❌ 还没有推送到GitHub
- ❌ 还没有设置GitHub Secrets

---

## 整体工作流程概览

### 系统工作原理（简单理解）

```
1. 你配置好数据源和API密钥
   ↓
2. 脚本每天自动运行（GitHub Actions）
   ↓
3. 从RSS源抓取新闻
   ↓
4. 用关键词和AI筛选相关内容
   ↓
5. 自动分类（马来西亚/新加坡/行业）
   ↓
6. 生成JSON数据文件
   ↓
7. 自动提交到GitHub
   ↓
8. 网站自动读取JSON并显示
```

---

## 接下来需要做的步骤（详细版）

### 🎯 阶段1：本地测试（先确保能跑通）

#### 步骤1：检查Python环境
- **做什么**：确认你的电脑上已经安装了Python
- **怎么做**：在终端运行 `python3 --version`
- **预期结果**：显示版本号（如 Python 3.11.0）
- **如果失败**：需要安装Python

#### 步骤2：安装Python依赖
- **做什么**：安装脚本需要的库（feedparser、openai等）
- **怎么做**：运行 `pip3 install -r requirements.txt`
- **预期结果**：显示 "Successfully installed..."
- **如果失败**：可能需要用 `pip3` 或处理权限问题

#### 步骤3：获取OpenAI API密钥
- **做什么**：在OpenAI网站获取API密钥
- **怎么做**：
  1. 访问 https://platform.openai.com/api-keys
  2. 登录你的账号（有ChatGPT付费版即可）
  3. 点击 "Create new secret key"
  4. 复制密钥（只显示一次，要保存好）
- **预期结果**：得到一个类似 `sk-...` 的密钥

#### 步骤4：创建.env文件
- **做什么**：在项目根目录创建`.env`文件，写入API密钥
- **怎么做**：创建文件，写入 `OPENAI_API_KEY=sk-你的密钥`
- **预期结果**：项目根目录有`.env`文件
- **注意**：这个文件不要提交到Git

#### 步骤5：测试运行脚本
- **做什么**：手动运行一次脚本，看是否正常工作
- **怎么做**：运行 `python3 scripts/fetch-news.py`
- **预期结果**：
  - 显示抓取进度
  - 生成 `assets/data/insights-data.json` 文件
  - 文件中有新闻数据
- **如果失败**：检查错误信息，可能是：
  - RSS链接无效
  - API密钥错误
  - 网络问题

#### 步骤6：测试前端显示
- **做什么**：在浏览器打开`insights.html`，看新闻是否显示
- **怎么做**：
  1. 用浏览器打开 `insights.html`
  2. 打开开发者工具（F12）查看控制台
- **预期结果**：页面显示从JSON加载的新闻
- **如果失败**：检查控制台错误

---

### 🚀 阶段2：配置GitHub（让系统自动运行）

#### 步骤7：创建GitHub仓库（如果还没有）
- **做什么**：在GitHub上创建一个新仓库
- **怎么做**：
  1. 登录GitHub
  2. 点击右上角 "+" → "New repository"
  3. 填写仓库名称（如 `company-website`）
  4. 选择 Public 或 Private
  5. **不要**勾选 "Initialize with README"
  6. 点击 "Create repository"
- **预期结果**：得到一个空的GitHub仓库

#### 步骤8：推送代码到GitHub
- **做什么**：把你本地的代码上传到GitHub
- **怎么做**：
  1. 在项目目录初始化Git（如果还没有）：`git init`
  2. 添加所有文件：`git add .`
  3. 提交：`git commit -m "初始提交"`
  4. 连接到GitHub仓库：`git remote add origin https://github.com/你的用户名/仓库名.git`
  5. 推送：`git push -u origin main`
- **预期结果**：GitHub仓库中有你的代码
- **注意**：不要推送`.env`文件（应该在`.gitignore`中）

#### 步骤9：配置GitHub Secrets（API密钥）
- **做什么**：在GitHub仓库设置中保存API密钥
- **怎么做**：
  1. 进入你的GitHub仓库
  2. 点击 "Settings"（设置）
  3. 左侧菜单找到 "Secrets and variables" → "Actions"
  4. 点击 "New repository secret"
  5. Name: `OPENAI_API_KEY`
  6. Value: 粘贴你的API密钥
  7. 点击 "Add secret"
- **预期结果**：在Secrets列表中看到 `OPENAI_API_KEY`

#### 步骤10：测试GitHub Actions
- **做什么**：手动触发一次GitHub Actions，看是否运行成功
- **怎么做**：
  1. 进入仓库的 "Actions" 标签
  2. 选择 "自动更新洞察新闻" 工作流
  3. 点击 "Run workflow" → "Run workflow"
  4. 等待运行完成（通常1-2分钟）
- **预期结果**：
  - 工作流显示绿色 ✓
  - 仓库中自动提交了新的JSON文件
- **如果失败**：查看错误日志

---

### 🌐 阶段3：部署网站（让网站上线）

#### 步骤11：选择部署平台
- **选项**：
  - **GitHub Pages**（免费，简单，推荐）
  - **Netlify**（免费，功能多）
  - **Vercel**（免费，速度快）
- **建议**：先用GitHub Pages

#### 步骤12：部署网站
- **如果选择GitHub Pages**：
  1. 进入仓库的 "Settings"
  2. 左侧菜单找到 "Pages"
  3. Source: 选择 `main` 分支
  4. 点击 "Save"
  5. 等待几分钟
  6. 访问生成的网址（如 `https://你的用户名.github.io/仓库名/`）
- **预期结果**：网站可以正常访问

#### 步骤13：验证自动更新
- **做什么**：等待或手动触发一次更新，确认网站自动更新
- **怎么做**：
  1. 手动触发GitHub Actions（步骤10）
  2. 等待几分钟
  3. 刷新网站，看新闻是否更新
- **预期结果**：网站显示最新抓取的新闻

---

## 需要准备的工具和账号

### ✅ 必须准备

1. **Python 3.8+**
   - 检查方法：在终端运行 `python3 --version`
   - 如果没有：需要安装Python

2. **Git**
   - 检查方法：在终端运行 `git --version`
   - 如果没有：需要安装Git

3. **GitHub账号**
   - 如果没有：去 https://github.com 注册

4. **OpenAI账号**
   - 你已经有了（ChatGPT付费版）
   - 需要去 https://platform.openai.com 获取API密钥

### 📝 可选准备

- 代码编辑器（VS Code / Cursor）

---

## 可能遇到的问题

### 问题1：Python未安装或版本不对
- **症状**：运行 `python3 --version` 显示 "command not found"
- **解决**：安装Python 3.8或更高版本
- **Mac**：`brew install python3` 或从官网下载
- **Windows**：从官网下载安装包

### 问题2：pip命令不工作
- **症状**：运行 `pip install` 显示 "command not found"
- **解决**：尝试 `pip3` 或 `python3 -m pip`

### 问题3：RSS链接无效
- **症状**：脚本运行但抓取不到新闻
- **解决**：检查RSS链接是否有效，替换为真实可用的链接

### 问题4：API密钥错误
- **症状**：脚本显示 "AI筛选出错" 或 "Unauthorized"
- **解决**：检查密钥是否正确，是否有余额

### 问题5：GitHub Actions运行失败
- **症状**：工作流显示红色 ✗
- **解决**：查看日志，通常是配置问题或API密钥未设置

### 问题6：前端不显示新闻
- **症状**：页面还是显示静态内容
- **解决**：
  1. 检查浏览器控制台是否有错误
  2. 确认 `assets/data/insights-data.json` 文件存在
  3. 检查JSON文件格式是否正确

---

## 时间估算

- **阶段1（本地测试）**：30-60分钟
- **阶段2（GitHub配置）**：20-30分钟
- **阶段3（部署）**：15-30分钟

**总计**：约1-2小时（首次设置）

---

## 🎯 你现在需要做的

1. ✅ 确认Python已安装（运行 `python3 --version`）
2. ✅ 准备好OpenAI API密钥（去 https://platform.openai.com/api-keys 获取）
3. ✅ 准备好GitHub账号（如果没有的话）

**准备好后告诉我，我们从步骤1开始，一步步进行！**

每一步我会：
- ✅ 告诉你具体要做什么
- ✅ 提供命令或操作步骤
- ✅ 解释预期结果
- ✅ 帮你排查问题

---

## 📞 需要帮助？

如果在任何步骤遇到问题，随时告诉我：
- 你执行了什么命令
- 看到了什么错误信息
- 卡在哪一步

我会帮你解决！

---

**准备好了吗？让我们开始第一步！** 🚀

