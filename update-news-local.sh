#!/bin/bash

# 本地新闻自动更新脚本
# 每天自动运行 fetch-news.py 更新新闻数据

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 运行Python脚本
echo "=========================================="
echo "开始更新新闻数据..."
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

python3 scripts/fetch-news.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ 新闻更新成功！"
    echo "更新时间: $(date '+%Y-%m-%d %H:%M:%S')"
else
    echo ""
    echo "✗ 新闻更新失败，请检查错误信息"
    exit 1
fi

