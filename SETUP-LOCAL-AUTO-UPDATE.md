# 本地自动更新设置指南

## 功能说明

设置后，系统会在每天上午10:00自动运行新闻抓取脚本，更新本地新闻数据。

## 设置步骤

### 步骤1：创建日志目录

```bash
cd ~/Desktop/company-website
mkdir -p logs
```

### 步骤2：加载定时任务

```bash
# 复制plist文件到LaunchAgents目录
cp com.moonmoment.newsupdate.plist ~/Library/LaunchAgents/

# 加载定时任务
launchctl load ~/Library/LaunchAgents/com.moonmoment.newsupdate.plist
```

### 步骤3：验证设置

```bash
# 检查任务是否已加载
launchctl list | grep com.moonmoment.newsupdate

# 手动测试运行一次
~/Desktop/company-website/update-news-local.sh
```

### 步骤4：查看日志（可选）

```bash
# 查看更新日志
tail -f ~/Desktop/company-website/logs/news-update.log

# 查看错误日志
tail -f ~/Desktop/company-website/logs/news-update-error.log
```

## 管理定时任务

### 停止定时任务

```bash
launchctl unload ~/Library/LaunchAgents/com.moonmoment.newsupdate.plist
```

### 重新加载定时任务

```bash
launchctl unload ~/Library/LaunchAgents/com.moonmoment.newsupdate.plist
launchctl load ~/Library/LaunchAgents/com.moonmoment.newsupdate.plist
```

### 立即运行一次（不等待定时）

```bash
launchctl start com.moonmoment.newsupdate
```

### 删除定时任务

```bash
launchctl unload ~/Library/LaunchAgents/com.moonmoment.newsupdate.plist
rm ~/Library/LaunchAgents/com.moonmoment.newsupdate.plist
```

## 注意事项

1. **确保Python环境正确**：脚本使用 `python3`，确保已安装Python 3
2. **确保API密钥**：需要 `.env` 文件中有 `OPENAI_API_KEY`
3. **网络连接**：需要网络连接才能抓取新闻
4. **Mac需要保持登录**：定时任务只在用户登录时运行

## 修改运行时间

编辑 `com.moonmoment.newsupdate.plist` 文件中的 `Hour` 和 `Minute` 字段：

```xml
<key>Hour</key>
<integer>10</integer>  <!-- 改为你想要的小时（0-23） -->
<key>Minute</key>
<integer>0</integer>  <!-- 改为你想要的分钟（0-59） -->
```

然后重新加载：

```bash
launchctl unload ~/Library/LaunchAgents/com.moonmoment.newsupdate.plist
launchctl load ~/Library/LaunchAgents/com.moonmoment.newsupdate.plist
```

## 故障排查

如果定时任务没有运行：

1. 检查日志文件是否有错误
2. 检查Python环境：`which python3`
3. 手动运行脚本测试：`./update-news-local.sh`
4. 检查任务状态：`launchctl list | grep com.moonmoment.newsupdate`

