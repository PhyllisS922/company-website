# 🚀 网站部署指南 - GitHub Pages

## 📋 部署前检查清单

✅ **已完成**：
- [x] 所有HTML文件使用相对路径
- [x] CSS和JS文件使用相对路径
- [x] 图片路径正确
- [x] 代码已推送到GitHub

---

## 🎯 部署步骤（5分钟完成）

### 步骤 1：在 GitHub 上开启 Pages

1. **打开你的 GitHub 仓库**
   - 访问：https://github.com/PhyllisS922/company-website

2. **进入设置**
   - 点击仓库顶部的 **"Settings"** 标签

3. **找到 Pages 设置**
   - 在左侧菜单中找到 **"Pages"**（在 "Code and automation" 部分下）

4. **配置 Pages**
   - **Source（源）**：选择 **"Deploy from a branch"**
   - **Branch（分支）**：选择 **"main"**
   - **Folder（文件夹）**：选择 **"/ (root)"**
   - 点击 **"Save"** 保存

5. **等待部署**
   - GitHub 会在几分钟内自动部署
   - 部署完成后，你会看到绿色的提示和网站地址

---

### 步骤 2：获取网站地址

部署完成后，你的网站地址将是：
```
https://phylliss922.github.io/company-website/
```

或者，如果你设置了自定义域名：
```
https://你的域名.com
```

---

### 步骤 3：验证部署

1. **访问网站地址**
   - 打开浏览器，访问上面的地址
   - 检查所有页面是否正常显示

2. **检查功能**
   - [ ] 首页正常显示
   - [ ] 导航链接正常
   - [ ] 图片正常加载
   - [ ] CSS样式正常
   - [ ] JavaScript功能正常
   - [ ] 新闻数据正常加载（insights页面）

---

## 🔄 更新网站

部署后，每次你推送代码到 GitHub，网站会自动更新：

```bash
# 1. 本地修改文件
# 2. 提交更改
git add .
git commit -m "更新：修改内容"
git push origin main

# 3. 等待1-5分钟，网站自动更新
```

---

## 🌐 自定义域名（可选）

如果你想使用自己的域名（如 `www.yourcompany.com`）：

### 步骤 1：在 GitHub Pages 设置中添加域名

1. 进入仓库 Settings → Pages
2. 在 "Custom domain" 部分输入你的域名
3. 点击 Save

### 步骤 2：配置 DNS

在你的域名注册商处添加 DNS 记录：
- **类型**：CNAME
- **名称**：www（或 @）
- **值**：phylliss922.github.io

---

## ⚠️ 常见问题

### 问题 1：网站显示 404

**原因**：GitHub Pages 需要几分钟时间部署

**解决**：
- 等待 5-10 分钟
- 刷新页面
- 检查 Settings → Pages 中的部署状态

### 问题 2：CSS/JS/图片不显示

**原因**：路径问题

**解决**：
- 确保所有路径都是相对路径（如 `assets/css/style.css`）
- 不要使用绝对路径（如 `/assets/css/style.css`）

### 问题 3：新闻数据不显示

**原因**：JSON 文件路径问题或 CORS 问题

**解决**：
- 检查 `assets/data/insights-data.json` 是否存在
- 检查浏览器控制台是否有错误
- 确保 GitHub Actions 已成功生成数据文件

---

## 📊 部署状态检查

### 在 GitHub 上检查

1. 进入仓库
2. 点击 **"Actions"** 标签
3. 查看最新的工作流运行状态

### 检查网站

访问你的网站地址，确认：
- ✅ 页面正常加载
- ✅ 样式正常显示
- ✅ 链接正常工作
- ✅ 图片正常显示

---

## 🎉 部署完成！

部署成功后，你的网站就可以：
- ✅ 被任何人访问
- ✅ 自动更新（每次推送代码）
- ✅ 支持 HTTPS（安全连接）
- ✅ 新闻系统自动运行（GitHub Actions）

---

## 📞 需要帮助？

如果遇到问题：
1. 检查 GitHub Pages 设置
2. 查看 Actions 日志
3. 检查浏览器控制台错误
4. 告诉我具体的错误信息

**祝你部署顺利！** 🚀


