/**
 * 洞察页面新闻动态加载器
 * 从 JSON 文件读取新闻数据并动态渲染到页面
 */

(function() {
    'use strict';

    const DATA_URL = 'assets/data/insights-data.json';

    /**
     * 渲染新闻列表
     */
    function renderNewsList(containerId, items) {
        const container = document.getElementById(containerId);
        if (!container || !items || items.length === 0) {
            return; // 如果没有数据，保持静态内容
        }

        // 清空容器
        container.innerHTML = '';

        // 创建列表项
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'motion-group-item';
            
            const a = document.createElement('a');
            a.href = item.link || '#';
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = item.text;
            
            li.appendChild(a);
            container.appendChild(li);
        });
    }

    /**
     * 加载并渲染新闻数据
     */
    async function loadInsightsData() {
        try {
            const response = await fetch(DATA_URL);
            
            if (!response.ok) {
                console.log('新闻数据文件不存在，使用静态内容');
                return; // 如果文件不存在，保持静态内容
            }

            const data = await response.json();

            // 渲染近期观察
            if (data.recent_observations) {
                if (data.recent_observations['马来西亚']) {
                    renderNewsList('malaysia-news', data.recent_observations['马来西亚']);
                }
                if (data.recent_observations['新加坡']) {
                    renderNewsList('singapore-news', data.recent_observations['新加坡']);
                }
            }

            // 渲染行业观察
            if (data.industry_observations) {
                renderNewsList('industry-news', data.industry_observations);
            }

            console.log('✓ 新闻数据已加载', data.last_updated || '');
        } catch (error) {
            // 静默失败，保持静态内容显示
            console.log('使用静态内容（数据加载失败）');
        }
    }

    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadInsightsData);
    } else {
        loadInsightsData();
    }
})();

