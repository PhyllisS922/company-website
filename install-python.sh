#!/bin/bash

# Python 安装脚本（Mac系统）
# 使用方法：在终端运行：bash install-python.sh

echo "=========================================="
echo "Python 安装脚本"
echo "=========================================="
echo ""

# 步骤1：检查是否已安装 Python3
echo "步骤1：检查 Python3..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✓ Python3 已安装: $PYTHON_VERSION"
    echo ""
    echo "安装完成！Python3 已经可以使用了。"
    exit 0
else
    echo "✗ Python3 未安装，继续安装..."
fi

echo ""

# 步骤2：检查是否已安装 Homebrew
echo "步骤2：检查 Homebrew..."
if command -v brew &> /dev/null; then
    BREW_VERSION=$(brew --version | head -n 1)
    echo "✓ Homebrew 已安装: $BREW_VERSION"
    HAS_BREW=true
else
    echo "✗ Homebrew 未安装，需要先安装 Homebrew"
    HAS_BREW=false
fi

echo ""

# 步骤3：安装 Homebrew（如果需要）
if [ "$HAS_BREW" = false ]; then
    echo "步骤3：安装 Homebrew..."
    echo "注意：安装过程可能需要输入你的 Mac 密码"
    echo ""
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # 检查安装是否成功
    if command -v brew &> /dev/null; then
        echo "✓ Homebrew 安装成功！"
    else
        echo "✗ Homebrew 安装失败，请检查错误信息"
        echo ""
        echo "如果安装失败，你可能需要："
        echo "1. 检查网络连接"
        echo "2. 手动运行安装命令"
        echo "3. 或者使用方法2（从官网下载）"
        exit 1
    fi
    echo ""
fi

# 步骤4：安装 Python3
echo "步骤4：使用 Homebrew 安装 Python3..."
echo "这可能需要几分钟，请耐心等待..."
echo ""

brew install python3

# 检查安装是否成功
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo ""
    echo "=========================================="
    echo "✓ 安装成功！"
    echo "Python 版本: $PYTHON_VERSION"
    echo "=========================================="
    echo ""
    echo "下一步：运行 'pip3 install -r requirements.txt' 安装依赖"
else
    echo ""
    echo "✗ Python3 安装失败，请检查错误信息"
    exit 1
fi

