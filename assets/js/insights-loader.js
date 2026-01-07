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
        if (!container) {
            console.error('找不到容器:', containerId);
            return;
        }
        if (!items || items.length === 0) {
            console.log('没有数据可渲染:', containerId);
            return; // 如果没有数据，保持静态内容
        }

        console.log('渲染到容器:', containerId, '数据量:', items.length);

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
        
        console.log('渲染完成:', containerId, '已添加', items.length, '条');
    }

    /**
     * 加载并渲染新闻数据
     */
    async function loadInsightsData() {
        try {
            console.log('开始加载新闻数据:', DATA_URL);
            const response = await fetch(DATA_URL);
            
            if (!response.ok) {
                console.error('新闻数据文件加载失败:', response.status, response.statusText);
                return; // 如果文件不存在，保持静态内容
            }

            const data = await response.json();
            console.log('数据加载成功，数据结构:', {
                has_recent_observations: !!data.recent_observations,
                has_industry_observations: !!data.industry_observations,
                recent_keys: data.recent_observations ? Object.keys(data.recent_observations) : [],
                industry_count: data.industry_observations ? data.industry_observations.length : 0
            });

            // 检查容器元素
            const malaysia = document.getElementById('malaysia-news');
            const singapore = document.getElementById('singapore-news');
            const industry = document.getElementById('industry-news');
            console.log('容器检查:', {
                malaysia: !!malaysia,
                singapore: !!singapore,
                industry: !!industry
            });

            // 渲染近期观察 - 使用与手动代码相同的逻辑
            if (data.recent_observations) {
                console.log('开始渲染近期观察...');
                
                // 渲染马来西亚
                if (malaysia) {
                    console.log('马来西亚容器存在');
                    if (data.recent_observations['马来西亚']) {
                        console.log('马来西亚数据存在，数量:', data.recent_observations['马来西亚'].length);
                        if (data.recent_observations['马来西亚'].length > 0) {
                            malaysia.innerHTML = '';
                            data.recent_observations['马来西亚'].forEach((item, index) => {
                                const li = document.createElement('li');
                                li.className = 'motion-group-item';
                                const a = document.createElement('a');
                                a.href = item.link || '#';
                                a.target = '_blank';
                                a.rel = 'noopener noreferrer';
                                a.textContent = item.text;
                                li.appendChild(a);
                                malaysia.appendChild(li);
                                // 立即添加 visible 类，确保元素可见
                                // 使用 requestAnimationFrame 确保 DOM 更新后再添加类
                                requestAnimationFrame(() => {
                                    li.classList.add('visible');
                                });
                            });
                            console.log('✓ 马来西亚已渲染:', data.recent_observations['马来西亚'].length, '条');
                        } else {
                            console.warn('马来西亚数据为空数组');
                        }
                    } else {
                        console.warn('马来西亚数据不存在');
                    }
                } else {
                    console.error('马来西亚容器不存在！');
                }
                
                // 渲染新加坡
                if (singapore) {
                    console.log('新加坡容器存在');
                    if (data.recent_observations['新加坡']) {
                        console.log('新加坡数据存在，数量:', data.recent_observations['新加坡'].length);
                        if (data.recent_observations['新加坡'].length > 0) {
                            singapore.innerHTML = '';
                            data.recent_observations['新加坡'].forEach((item, index) => {
                                const li = document.createElement('li');
                                li.className = 'motion-group-item';
                                const a = document.createElement('a');
                                a.href = item.link || '#';
                                a.target = '_blank';
                                a.rel = 'noopener noreferrer';
                                a.textContent = item.text;
                                li.appendChild(a);
                                singapore.appendChild(li);
                                // 立即添加 visible 类，确保元素可见
                                requestAnimationFrame(() => {
                                    li.classList.add('visible');
                                });
                            });
                            console.log('✓ 新加坡已渲染:', data.recent_observations['新加坡'].length, '条');
                        } else {
                            console.warn('新加坡数据为空数组');
                        }
                    } else {
                        console.warn('新加坡数据不存在');
                    }
                } else {
                    console.error('新加坡容器不存在！');
                }
            } else {
                console.warn('没有 recent_observations 数据');
            }

            // 渲染行业观察 - 使用与手动代码相同的逻辑
            if (industry) {
                console.log('行业观察容器存在');
                if (data.industry_observations) {
                    console.log('行业观察数据存在，数量:', data.industry_observations.length);
                    if (data.industry_observations.length > 0) {
                        industry.innerHTML = '';
                        data.industry_observations.forEach((item, index) => {
                            const li = document.createElement('li');
                            li.className = 'motion-group-item';
                            const a = document.createElement('a');
                            a.href = item.link || '#';
                            a.target = '_blank';
                            a.rel = 'noopener noreferrer';
                            a.textContent = item.text;
                            li.appendChild(a);
                            industry.appendChild(li);
                            // 立即添加 visible 类，确保元素可见
                            requestAnimationFrame(() => {
                                li.classList.add('visible');
                            });
                        });
                        console.log('✓ 行业观察已渲染:', data.industry_observations.length, '条');
                    } else {
                        console.warn('行业观察数据为空数组');
                    }
                } else {
                    console.warn('行业观察数据不存在');
                }
            } else {
                console.error('行业观察容器不存在！');
            }

            console.log('✓ 新闻数据已加载', data.last_updated || '');
        } catch (error) {
            // 显示详细错误信息
            console.error('数据加载失败:', error);
            console.error('错误详情:', error.message);
        }
    }

    // 页面加载完成后执行 - 确保容器存在后再执行
    function init() {
        console.log('初始化新闻加载器，页面状态:', document.readyState);
        
        function tryLoad() {
            console.log('尝试查找容器元素...');
            const malaysia = document.getElementById('malaysia-news');
            const singapore = document.getElementById('singapore-news');
            const industry = document.getElementById('industry-news');
            
            console.log('容器查找结果:', {
                malaysia: !!malaysia,
                singapore: !!singapore,
                industry: !!industry
            });
            
            if (malaysia && singapore && industry) {
                console.log('✓ 所有容器已找到，开始加载数据');
                loadInsightsData();
            } else {
                console.warn('容器未全部找到，100ms后重试...');
                // 如果容器还没准备好，100ms后重试（最多重试10次）
                if (typeof tryLoad.retryCount === 'undefined') {
                    tryLoad.retryCount = 0;
                }
                tryLoad.retryCount++;
                if (tryLoad.retryCount < 10) {
                    setTimeout(tryLoad, 100);
                } else {
                    console.error('重试10次后仍未找到容器，停止重试');
                }
            }
        }
        
        if (document.readyState === 'loading') {
            console.log('等待DOM加载...');
            document.addEventListener('DOMContentLoaded', tryLoad);
        } else {
            console.log('DOM已加载，延迟100ms后执行');
            // DOM已加载，延迟一点确保所有元素都已渲染
            setTimeout(tryLoad, 100);
        }
    }
    
    // 立即初始化
    init();
})();

