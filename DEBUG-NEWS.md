# 🔧 新闻显示问题 - 快速修复

## 问题
数据加载成功，但页面显示空白。

## 快速修复（在浏览器控制台运行）

打开洞察页面，按 F12，在 Console 中运行：

```javascript
// 快速修复代码
(async function() {
    console.log('开始修复...');
    
    // 1. 加载数据
    const response = await fetch('assets/data/insights-data.json');
    const data = await response.json();
    console.log('数据加载:', data);
    
    // 2. 检查容器
    const malaysia = document.getElementById('malaysia-news');
    const singapore = document.getElementById('singapore-news');
    const industry = document.getElementById('industry-news');
    
    console.log('容器检查:', {
        malaysia: malaysia ? '找到' : '未找到',
        singapore: singapore ? '找到' : '未找到',
        industry: industry ? '找到' : '未找到'
    });
    
    // 3. 渲染马来西亚
    if (malaysia && data.recent_observations && data.recent_observations['马来西亚']) {
        malaysia.innerHTML = '';
        data.recent_observations['马来西亚'].forEach(item => {
            const li = document.createElement('li');
            li.className = 'motion-group-item';
            const a = document.createElement('a');
            a.href = item.link;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = item.text;
            li.appendChild(a);
            malaysia.appendChild(li);
        });
        console.log('✓ 马来西亚新闻已渲染:', data.recent_observations['马来西亚'].length, '条');
    }
    
    // 4. 渲染新加坡
    if (singapore && data.recent_observations && data.recent_observations['新加坡']) {
        singapore.innerHTML = '';
        data.recent_observations['新加坡'].forEach(item => {
            const li = document.createElement('li');
            li.className = 'motion-group-item';
            const a = document.createElement('a');
            a.href = item.link;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = item.text;
            li.appendChild(a);
            singapore.appendChild(li);
        });
        console.log('✓ 新加坡新闻已渲染:', data.recent_observations['新加坡'].length, '条');
    }
    
    // 5. 渲染行业观察
    if (industry && data.industry_observations) {
        industry.innerHTML = '';
        data.industry_observations.forEach(item => {
            const li = document.createElement('li');
            li.className = 'motion-group-item';
            const a = document.createElement('a');
            a.href = item.link;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = item.text;
            li.appendChild(a);
            industry.appendChild(li);
        });
        console.log('✓ 行业观察已渲染:', data.industry_observations.length, '条');
    }
    
    console.log('修复完成！');
})();
```

## 如果还是不行

请告诉我控制台显示的所有信息。


