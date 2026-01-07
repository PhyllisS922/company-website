#!/usr/bin/env python3
"""创建.env文件"""

import os
from pathlib import Path

# 获取项目根目录
base_dir = Path(__file__).parent
env_file = base_dir / ".env"

# API密钥（从用户输入获取，不硬编码）
import sys

if len(sys.argv) > 1:
    api_key = sys.argv[1]
else:
    print("请提供API密钥作为参数：")
    print("python3 create-env.py YOUR_API_KEY")
    sys.exit(1)

# 写入文件
with open(env_file, 'w') as f:
    f.write(f"OPENAI_API_KEY={api_key}\n")

print(f"✓ .env文件已创建: {env_file}")
print(f"✓ 文件大小: {env_file.stat().st_size} 字节")

# 验证
if env_file.exists():
    print("✓ 验证成功：文件存在")
    with open(env_file, 'r') as f:
        content = f.read().strip()
        if api_key in content:
            print("✓ 验证成功：API密钥已写入")
        else:
            print("✗ 警告：API密钥可能未正确写入")
else:
    print("✗ 错误：文件创建失败")

