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
        'main .media-title',
        'main .media-source'
    ];

    // 排除的元素（不需要翻译）
    const EXCLUDE_SELECTORS = [
        'nav a',
        '.lang-switch',
        '.motion-group-item a', // 新闻链接由insights-loader.js处理
        'footer',
        'header',
        '#malaysia-news', // 近期观察 - 马来西亚
        '#singapore-news', // 近期观察 - 新加坡
        '#industry-news', // 行业观察
        '#malaysia-news *', // 排除所有子元素
        '#singapore-news *', // 排除所有子元素
        '#industry-news *', // 排除所有子元素
        '.motion-group-container', // 新闻容器
        '.motion-group-container *' // 新闻容器内的所有元素
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
                    
                    // 检查是否是链接或按钮
                    if (el.tagName === 'A' || el.tagName === 'BUTTON') {
                        shouldExclude = true;
                    }
                    
                    // 检查父元素是否是链接
                    if (el.closest('a') || el.closest('button')) {
                        shouldExclude = true;
                    }
                    
                    // 检查是否在新闻容器内
                    if (el.closest('#malaysia-news') || el.closest('#singapore-news') || el.closest('#industry-news')) {
                        shouldExclude = true;
                    }
                    
                    const text = el.textContent.trim();
                    if (!shouldExclude && text && text.length > 0) {
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
        const lang = window.LanguageManager?.getCurrentLanguage();
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
        
        // 监听语言切换事件
        document.addEventListener('languageChanged', (e) => {
            console.log('全站翻译：语言切换为', e.detail?.lang);
            setTimeout(() => {
                translateAll();
            }, 100);
        });
        
        // 不自动翻译，等待用户点击切换按钮
        // 默认是中文，不需要翻译
        const currentLang = window.LanguageManager?.getCurrentLanguage();
        console.log('全站翻译：当前语言', currentLang, '（默认中文，不自动翻译）');
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
                            // 如果LanguageManager还没加载，再等一会
                            setTimeout(startInit, 200);
                        }
                    }, 100);
                });
            } else {
                // DOM已加载，但LanguageManager可能还没加载
                setTimeout(() => {
                    if (window.LanguageManager) {
                        init();
                    } else {
                        setTimeout(startInit, 200);
                    }
                }, 100);
            }
        }
    }
    
    startInit();
})();
