#!/bin/bash

# 简单的推送脚本，使用环境变量

cd ~/Desktop/company-website

echo "请提供你的Personal Access Token："
read -s TOKEN

echo ""
echo "正在推送代码..."

# 使用环境变量方式，避免URL中包含Token
GIT_ASKPASS=echo GIT_TERMINAL_PROMPT=0 git -c credential.helper='!f() { echo "username=PhyllisS922"; echo "password='$TOKEN'"; }; f' push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ 代码推送成功！"
else
    echo ""
    echo "✗ 推送失败"
fi


