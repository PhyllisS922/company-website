#!/usr/bin/env python3
"""创建.env文件"""

import os
from pathlib import Path

# 获取项目根目录
base_dir = Path(__file__).parent
env_file = base_dir / ".env"

# API密钥
api_key = "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"

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

