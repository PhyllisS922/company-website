# 🐍 Python 安装指南（Mac系统）

## 方法1：使用 Homebrew（推荐，最简单）

### 步骤1：检查是否已安装 Homebrew

在终端运行：
```bash
brew --version
```

**如果显示版本号**：说明已安装，跳到步骤2
**如果显示 "command not found"**：需要先安装 Homebrew

### 步骤2：安装 Homebrew（如果还没有）

在终端运行：
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

这会需要几分钟，按照提示操作即可。

### 步骤3：使用 Homebrew 安装 Python

在终端运行：
```bash
brew install python3
```

等待安装完成（可能需要几分钟）。

### 步骤4：验证安装

在终端运行：
```bash
python3 --version
```

**预期结果**：显示类似 `Python 3.11.5` 或 `Python 3.12.0` 的版本号

---

## 方法2：从官网下载安装包（适合不熟悉终端的用户）

### 步骤1：访问 Python 官网

打开浏览器，访问：https://www.python.org/downloads/

### 步骤2：下载安装包

1. 页面会自动检测你的系统（Mac）
2. 点击大大的黄色按钮 "Download Python 3.x.x"（x.x.x 是版本号）
3. 下载 `.pkg` 文件

### 步骤3：安装

1. 双击下载的 `.pkg` 文件
2. 按照安装向导操作：
   - 点击 "继续"
   - 点击 "安装"
   - 输入你的 Mac 密码
   - 等待安装完成

### 步骤4：验证安装

打开终端（Terminal），运行：
```bash
python3 --version
```

**预期结果**：显示类似 `Python 3.11.5` 的版本号

---

## 方法3：使用 MacPorts（如果你已经安装了 MacPorts）

如果你已经安装了 MacPorts，可以运行：
```bash
sudo port install python311
```

---

## ✅ 安装完成后

安装完成后，运行以下命令验证：

```bash
python3 --version
```

**应该看到**：`Python 3.x.x`（版本号）

**如果看到这个**：说明安装成功！✅

**如果看到 "command not found"**：说明安装有问题，需要检查。

---

## 🔧 常见问题

### 问题1：安装后还是找不到 python3

**解决**：
1. 关闭终端，重新打开
2. 或者运行：`source ~/.zshrc`（如果你用 zsh）
3. 或者运行：`source ~/.bash_profile`（如果你用 bash）

### 问题2：提示权限不足

**解决**：在命令前加 `sudo`，例如：
```bash
sudo brew install python3
```
然后输入你的 Mac 密码。

### 问题3：Homebrew 安装很慢

**解决**：这是正常的，因为需要下载很多文件。耐心等待即可。

---

## 📝 下一步

安装完成后，告诉我，我们继续**步骤2：安装Python依赖**！

---

## 💡 小提示

- **推荐使用方法1（Homebrew）**：最简单，也最常用
- **如果不想用终端**：使用方法2（官网下载）
- **Python 3.8 或更高版本都可以**：不需要特定版本

