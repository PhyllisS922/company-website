# 使用Token推送代码

## 方法1：在推送时输入Token

运行：
```bash
git push -u origin main
```

当提示：
- **Username**: 输入 `PhyllisS922`
- **Password**: 输入你的 **Personal Access Token**（不是GitHub密码！）

## 方法2：在URL中嵌入Token（一次性）

运行（把 `YOUR_TOKEN` 替换为你的实际Token）：
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/PhyllisS922/company-website.git
git push -u origin main
```

## 方法3：使用Git凭据助手（推荐，保存Token）

1. 运行：
```bash
git config --global credential.helper osxkeychain
```

2. 然后推送：
```bash
git push -u origin main
```

3. 输入：
- Username: `PhyllisS922`
- Password: 你的 **Personal Access Token**

4. Token会被保存在Mac的钥匙串中，以后不需要再输入


