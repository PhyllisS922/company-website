/**
 * 全站翻译模块
 * 自动翻译页面内容（需要后端API支持）
 * 实现一次性翻译+localStorage缓存机制
 */

(function() {
    'use strict';

    // 标记需要翻译的元素选择器（更全面的选择器）
    const TRANSLATABLE_SELECTORS = [
        'main h1',
        'main h2',
        'main h3',
        'main h4',
        'main p',
        'main li',
        'main .section-title',
        'main .accent-title',
        'main .motion-entrance h1',
        'main .motion-entrance h2',
        'main .motion-entrance h3',
        'main .motion-entrance p',
        'main .motion-entrance li',
        'main section h1',
        'main section h2',
        'main section h3',
        'main section p',
        'main section li',
        'main .container h1',
        'main .container h2',
        'main .container h3',
        'main .container p',
        'main .container li',
        'main .course-scroll-item h3',
        'main .course-scroll-item p',
        'main .cooperation-group h3',
        'main .cooperation-group p',
        'main .cooperation-group li', // 合作页面的列表项
        'main .motion-group-item', // 活动页面的列表项（但排除新闻）
        'main .highlight-item p', // 首页内容精选的段落
        'main .media-title',
        'main .media-source',
        'nav a' // 导航链接（需要翻译链接文本）
    ];

    // 排除的元素（不需要翻译）
    const EXCLUDE_SELECTORS = [
        '.lang-switch', // 语言切换按钮
        '.motion-group-item a', // 新闻链接由insights-loader.js处理
        'footer',
        'header .company-name', // 公司名称（英文固定）
        '#malaysia-news', // 近期观察 - 马来西亚（整个容器）
        '#singapore-news', // 近期观察 - 新加坡（整个容器）
        '#industry-news', // 行业观察（整个容器）
        '#malaysia-news *', // 排除所有子元素
        '#singapore-news *', // 排除所有子元素
        '#industry-news *' // 排除所有子元素
        // 注意：不再排除 nav a，因为导航链接需要被翻译
        // 注意：不再排除所有 .motion-group-container，因为活动页面和合作页面也需要翻译
    ];

    /**
     * 获取需要翻译的元素
     */
    function getTranslatableElements() {
        const elements = [];
        const excludeElements = new Set();
        const processedElements = new Set(); // 避免重复处理
        
        // 收集排除的元素
        EXCLUDE_SELECTORS.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(el => {
                    excludeElements.add(el);
                });
            } catch (e) {
                console.warn('选择器错误:', selector, e);
            }
        });
        
        // 收集需要翻译的元素
        TRANSLATABLE_SELECTORS.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(el => {
                    // 跳过已处理的元素
                    if (processedElements.has(el)) {
                        return;
                    }
                    
                    // 检查是否在排除列表中
                    let shouldExclude = false;
                    for (const excludeEl of excludeElements) {
                        if (excludeEl.contains(el) || excludeEl === el) {
                            shouldExclude = true;
                            break;
                        }
                    }
                    
                    // 检查是否是按钮（按钮不需要翻译）
                    if (el.tagName === 'BUTTON') {
                        shouldExclude = true;
                    }
                    
                    // 检查是否是链接
                    if (el.tagName === 'A') {
                        // 导航链接需要被翻译（如 <nav><a>首页</a></nav>）
                        const isNavLink = el.closest('nav');
                        if (isNavLink) {
                            // 导航链接，允许翻译
                            // 继续处理，不排除
                        } else {
                            // 非导航链接，检查是否有子元素
                            // 如果链接直接包含文本（如 <a>文本</a>），应该被翻译
                            // 如果链接包含子元素（如 <a><p>文本</p></a>），子元素会被单独处理
                            // 这里暂时不排除，让后续逻辑处理
                        }
                    }
                    
                    // 检查是否在新闻容器内（洞察页面的新闻列表）
                    if (el.closest('#malaysia-news') || el.closest('#singapore-news') || el.closest('#industry-news')) {
                        shouldExclude = true;
                    }
                    
                    // 注意：不再排除所有链接内的元素，因为首页的 .highlight-item p 需要被翻译
                    // 链接内的文本节点（如 <a><p>文本</p></a>）应该被翻译
                    
                    const text = el.textContent.trim();
                    if (!shouldExclude && text && text.length > 0) {
                        // 对于链接元素，需要特殊处理
                        // 如果链接直接包含文本（如 <a>首页</a>），应该翻译链接本身
                        // 如果链接包含子元素（如 <a><p>文本</p></a>），子元素会被单独处理
                        if (el.tagName === 'A') {
                            // 检查链接是否直接包含文本节点（而不是只有子元素）
                            const hasDirectText = Array.from(el.childNodes).some(node => 
                                node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
                            );
                            // 如果链接有子元素且没有直接文本，跳过（子元素会被单独处理）
                            if (el.children.length > 0 && !hasDirectText) {
                                return; // 跳过，让子元素被处理
                            }
                        }
                        
                        // 检查是否已经有翻译数据
                        if (!el.hasAttribute('data-original-text')) {
                            elements.push(el);
                            processedElements.add(el);
                        }
                    }
                });
            } catch (e) {
                console.warn('选择器错误:', selector, e);
            }
        });
        
        console.log('找到可翻译元素:', elements.length, '个');
        return elements;
    }

    /**
     * 从localStorage获取缓存的翻译
     */
    function getCachedTranslation(originalText) {
        try {
            const key = 'translation_cache_' + btoa(encodeURIComponent(originalText)) + '_en';
            const cached = localStorage.getItem(key);
            if (cached) {
                const data = JSON.parse(cached);
                // 检查是否过期（1年有效期）
                if (data.expiry && data.expiry > Date.now()) {
                    return data.translation;
                } else {
                    localStorage.removeItem(key);
                }
            }
        } catch (e) {
            console.warn('读取翻译缓存失败:', e);
        }
        return null;
    }

    /**
     * 保存翻译到localStorage缓存
     */
    function saveCachedTranslation(originalText, translatedText) {
        try {
            const key = 'translation_cache_' + btoa(encodeURIComponent(originalText)) + '_en';
            const data = {
                translation: translatedText,
                expiry: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1年有效期
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('保存翻译缓存失败:', e);
        }
    }

    /**
     * 翻译所有内容（一次性翻译+缓存机制）
     */
    async function translateAll() {
        // 确保LanguageManager已加载
        if (!window.LanguageManager) {
            console.warn('LanguageManager未加载，等待...');
            setTimeout(() => translateAll(), 200);
            return;
        }
        
        const lang = window.LanguageManager.getCurrentLanguage();
        console.log('translateAll: 当前语言', lang);
        
        if (lang === 'zh') {
            // 中文模式，显示原文（中文）
            restoreOriginalText();
            return;
        }
        
        // 英文模式
        const elements = getTranslatableElements();
        console.log(`全站翻译：找到 ${elements.length} 个需要翻译的元素`);
        
        if (elements.length === 0) return;
        
        // 分离需要翻译的元素和已有翻译的元素
        const elementsToTranslate = [];
        const elementsWithCache = [];
        
        elements.forEach((el) => {
            const text = el.textContent.trim();
            if (!text || text.length <= 1) return;
            
            // 检查元素是否已有翻译数据（从data属性）
            const existingTranslation = el.getAttribute('data-translated-text');
            if (existingTranslation) {
                // 已有翻译数据，直接使用
                if (!el.hasAttribute('data-original-text')) {
                    el.setAttribute('data-original-text', text);
                }
                el.textContent = existingTranslation;
                el.setAttribute('data-translated', 'true');
                elementsWithCache.push(el);
                return;
            }
            
            // 检查localStorage缓存
            const cachedTranslation = getCachedTranslation(text);
            if (cachedTranslation) {
                // 有缓存，直接使用
                el.setAttribute('data-original-text', text);
                el.setAttribute('data-translated-text', cachedTranslation);
                el.textContent = cachedTranslation;
                el.setAttribute('data-translated', 'true');
                elementsWithCache.push(el);
            } else {
                // 没有缓存，需要翻译
                if (!el.hasAttribute('data-original-text')) {
                    el.setAttribute('data-original-text', text);
                }
                elementsToTranslate.push({ el, text });
            }
        });
        
        console.log(`有缓存: ${elementsWithCache.length} 个，需要翻译: ${elementsToTranslate.length} 个`);
        
        // 如果有需要翻译的元素，批量翻译
        if (elementsToTranslate.length > 0 && window.TranslationService) {
            try {
                const textsToTranslate = elementsToTranslate.map(item => item.text);
                console.log(`全站翻译：开始批量翻译 ${textsToTranslate.length} 个文本...`);
                
                const translations = await window.TranslationService.translateBatch(textsToTranslate, 'en');
                
                // 应用翻译结果并缓存
                elementsToTranslate.forEach((item, index) => {
                    if (index < translations.length) {
                        const translatedText = translations[index];
                        item.el.setAttribute('data-translated-text', translatedText);
                        item.el.textContent = translatedText;
                        item.el.setAttribute('data-translated', 'true');
                        
                        // 保存到缓存
                        saveCachedTranslation(item.text, translatedText);
                    }
                });
                
                console.log('全站翻译：完成，已更新', elementsToTranslate.length, '个元素');
            } catch (error) {
                console.error('全站翻译失败:', error);
            }
        } else if (elementsToTranslate.length > 0) {
            console.warn('TranslationService未加载，无法翻译');
        }
    }

    /**
     * 恢复原文（中文模式）
     */
    function restoreOriginalText() {
        document.querySelectorAll('[data-original-text]').forEach(el => {
            const original = el.getAttribute('data-original-text');
            if (original) {
                el.textContent = original;
                el.removeAttribute('data-translated');
            }
        });
    }

    /**
     * 初始化
     */
    function init() {
        console.log('全站翻译模块初始化...');
        
        // 监听语言切换事件（立即响应，无延迟）
        document.addEventListener('languageChanged', (e) => {
            console.log('全站翻译：语言切换为', e.detail?.lang);
            // 立即执行，不延迟
            translateAll();
        });
        
        // 检查当前语言状态（从localStorage读取，确保全站一致）
        const currentLang = window.LanguageManager?.getCurrentLanguage();
        console.log('全站翻译：当前语言', currentLang);
        
        // 如果当前是英文，立即翻译（确保页面切换后也能正确显示）
        if (currentLang === 'en') {
            console.log('当前是英文，立即翻译页面内容...');
            // 使用requestAnimationFrame确保DOM已渲染，但尽量快
            requestAnimationFrame(() => {
                translateAll();
            });
        }
    }

    // 等待语言管理器和DOM加载
    function startInit() {
        if (window.LanguageManager && document.readyState !== 'loading') {
            init();
        } else {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => {
                        if (window.LanguageManager) {
                            init();
                        } else {
                            // 如果LanguageManager还没加载，再等一会（最多等待2秒）
                            let waitCount = 0;
                            const checkInterval = setInterval(() => {
                                waitCount++;
                                if (window.LanguageManager) {
                                    clearInterval(checkInterval);
                                    init();
                                } else if (waitCount >= 10) {
                                    clearInterval(checkInterval);
                                    console.error('LanguageManager加载超时');
                                }
                            }, 200);
                        }
                    }, 100);
                });
            } else {
                // DOM已加载，但LanguageManager可能还没加载
                let waitCount = 0;
                const checkInterval = setInterval(() => {
                    waitCount++;
                    if (window.LanguageManager) {
                        clearInterval(checkInterval);
                        init();
                    } else if (waitCount >= 10) {
                        clearInterval(checkInterval);
                        console.error('LanguageManager加载超时');
                    }
                }, 200);
            }
        }
    }
    
    startInit();
})();
