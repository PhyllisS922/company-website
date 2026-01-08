#!/bin/bash

# 使用Token推送代码的脚本

echo "=========================================="
echo "使用Token推送代码到GitHub"
echo "=========================================="
echo ""

cd ~/Desktop/company-website

echo "请提供你的Personal Access Token："
read -s TOKEN

if [ -z "$TOKEN" ]; then
    echo "错误：Token不能为空"
    exit 1
fi

echo ""
echo "正在配置远程仓库URL（包含Token）..."
git remote set-url origin "https://${TOKEN}@github.com/PhyllisS922/company-website.git"

echo "正在推送代码..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ 代码推送成功！"
    echo ""
    echo "注意：为了安全，建议移除URL中的Token："
    echo "git remote set-url origin https://github.com/PhyllisS922/company-website.git"
else
    echo ""
    echo "✗ 推送失败，请检查Token是否正确"
fi


