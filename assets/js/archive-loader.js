/**
 * 历史归档页面加载器
 * 动态加载归档文件并渲染到页面
 */

(function() {
    'use strict';

    const ARCHIVE_DIR = 'assets/data/archive';
    const DAYS_TO_LOAD = 30; // 加载最近30天的归档

    /**
     * 获取日期范围内的所有日期
     */
    function getDateRange(days) {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]); // YYYY-MM-DD格式
        }
        return dates;
    }

    /**
     * 加载单个归档文件
     */
    async function loadArchiveFile(date) {
        const url = `${ARCHIVE_DIR}/${date}.json`;
        try {
            const response = await fetch(url);
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            // 文件不存在或读取失败，忽略
        }
        return null;
    }

    /**
     * 获取当前语言
     */
    function getCurrentLanguage() {
        return window.LanguageManager ? window.LanguageManager.getCurrentLanguage() : 'zh';
    }

    /**
     * 根据语言获取文本
     */
    function getTextByLanguage(item) {
        const lang = getCurrentLanguage();
        if (lang === 'zh' && item.text_zh) {
            return item.text_zh;
        }
        return item.text || item.text_zh || '';
    }

    /**
     * 渲染归档数据
     */
    function renderArchiveData(archiveData) {
        // 查找容器
        const policyContainer = document.querySelector('.archive-list:first-of-type');
        const industryContainer = document.querySelector('.archive-list:last-of-type');

        if (!policyContainer || !industryContainer) {
            console.warn('找不到归档容器');
            return;
        }

        // 清空容器
        policyContainer.innerHTML = '';
        industryContainer.innerHTML = '';

        // 渲染政策类新闻
        if (archiveData.recent_observations) {
            const allPolicy = [];
            if (archiveData.recent_observations['马来西亚']) {
                allPolicy.push(...archiveData.recent_observations['马来西亚']);
            }
            if (archiveData.recent_observations['新加坡']) {
                allPolicy.push(...archiveData.recent_observations['新加坡']);
            }

            allPolicy.forEach(item => {
                const li = document.createElement('li');
                li.className = 'motion-group-item';
                const a = document.createElement('a');
                a.href = item.link || '#';
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = getTextByLanguage(item);
                li.appendChild(a);
                policyContainer.appendChild(li);
            });
        }

        // 渲染行业观察
        if (archiveData.industry_observations) {
            archiveData.industry_observations.forEach(item => {
                const li = document.createElement('li');
                li.className = 'motion-group-item';
                const a = document.createElement('a');
                a.href = item.link || '#';
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = getTextByLanguage(item);
                li.appendChild(a);
                industryContainer.appendChild(li);
            });
        }
    }

    /**
     * 加载并合并所有归档文件
     */
    async function loadArchives() {
        const dates = getDateRange(DAYS_TO_LOAD);
        const allArchives = {
            recent_observations: {
                马来西亚: [],
                新加坡: []
            },
            industry_observations: []
        };

        console.log(`开始加载最近 ${DAYS_TO_LOAD} 天的归档...`);

        // 并行加载所有归档文件
        const promises = dates.map(date => loadArchiveFile(date));
        const results = await Promise.all(promises);

        // 合并所有归档数据
        results.forEach((archive, index) => {
            if (archive) {
                console.log(`✓ 加载归档: ${dates[index]}`);
                
                // 合并政策类新闻
                if (archive.recent_observations) {
                    if (archive.recent_observations['马来西亚']) {
                        allArchives.recent_observations['马来西亚'].push(...archive.recent_observations['马来西亚']);
                    }
                    if (archive.recent_observations['新加坡']) {
                        allArchives.recent_observations['新加坡'].push(...archive.recent_observations['新加坡']);
                    }
                }

                // 合并行业观察
                if (archive.industry_observations) {
                    allArchives.industry_observations.push(...archive.industry_observations);
                }
            }
        });

        // 按日期排序（最新的在前）
        const sortByDate = (a, b) => {
            // 从text中提取日期进行比较
            const dateA = a.text ? a.text.match(/\[(\d{2}-\d{2}-\d{2})/)?.[1] : '';
            const dateB = b.text ? b.text.match(/\[(\d{2}-\d{2}-\d{2})/)?.[1] : '';
            return dateB.localeCompare(dateA);
        };

        allArchives.recent_observations['马来西亚'].sort(sortByDate);
        allArchives.recent_observations['新加坡'].sort(sortByDate);
        allArchives.industry_observations.sort(sortByDate);

        // 渲染数据
        renderArchiveData(allArchives);

        console.log(`✓ 归档加载完成`);
        console.log(`  政策类: ${allArchives.recent_observations['马来西亚'].length + allArchives.recent_observations['新加坡'].length} 条`);
        console.log(`  行业观察: ${allArchives.industry_observations.length} 条`);
    }

    /**
     * 初始化
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadArchives);
        } else {
            loadArchives();
        }

        // 监听语言切换事件
        document.addEventListener('languageChanged', () => {
            console.log('语言已切换，重新加载归档...');
            loadArchives();
        });
    }

    init();
})();

