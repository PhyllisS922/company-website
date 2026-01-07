#!/bin/bash

# 推送代码到GitHub的脚本

echo "=========================================="
echo "推送代码到GitHub"
echo "=========================================="
echo ""

cd ~/Desktop/company-website

# 步骤1：检查Git是否已初始化
if [ ! -d .git ]; then
    echo "步骤1：初始化Git仓库..."
    git init
    echo "✓ Git仓库已初始化"
else
    echo "✓ Git仓库已存在"
fi
echo ""

# 步骤2：添加所有文件（.gitignore会自动排除.env等文件）
echo "步骤2：添加文件到Git..."
git add .
echo "✓ 文件已添加"
echo ""

# 步骤3：提交代码
echo "步骤3：提交代码..."
git commit -m "初始提交：添加新闻自动更新系统"
echo "✓ 代码已提交"
echo ""

# 步骤4：连接到GitHub（如果还没有）
echo "步骤4：检查远程仓库连接..."
if git remote get-url origin > /dev/null 2>&1; then
    echo "✓ 远程仓库已连接"
    git remote get-url origin
else
    echo "需要连接GitHub仓库..."
    echo ""
    echo "请提供你的GitHub用户名："
    read GITHUB_USERNAME
    echo ""
    echo "仓库名称（默认：company-website）："
    read REPO_NAME
    REPO_NAME=${REPO_NAME:-company-website}
    
    git remote add origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
    echo "✓ 已连接到GitHub仓库"
fi
echo ""

# 步骤5：推送代码
echo "步骤5：推送代码到GitHub..."
echo "注意：可能需要输入GitHub用户名和密码（或Personal Access Token）"
echo ""
git branch -M main
git push -u origin main

echo ""
echo "=========================================="
if [ $? -eq 0 ]; then
    echo "✓ 代码推送成功！"
else
    echo "✗ 推送失败，请检查错误信息"
    echo ""
    echo "如果遇到认证问题，可能需要："
    echo "1. 使用Personal Access Token代替密码"
    echo "2. 或者配置SSH密钥"
fi
echo "=========================================="

