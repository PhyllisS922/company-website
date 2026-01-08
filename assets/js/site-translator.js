/**
 * 全站翻译模块
 * 自动翻译页面内容（需要后端API支持）
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
     * 翻译所有内容（批量优化）
     */
    async function translateAll() {
        const lang = window.LanguageManager?.getCurrentLanguage();
        if (lang === 'zh') {
            // 中文模式，显示原文（中文）
            restoreOriginalText();
            return;
        }
        
        // 英文模式，需要翻译
        const elements = getTranslatableElements();
        console.log(`全站翻译：找到 ${elements.length} 个需要翻译的元素`);
        
        if (elements.length === 0) return;
        
        // 批量收集文本
        const textsToTranslate = [];
        const elementMap = new Map();
        
        elements.forEach((el, index) => {
            const text = el.textContent.trim();
            // 过滤掉太短的文本（可能是装饰性文本）
            if (text && text.length > 1 && !el.hasAttribute('data-original-text')) {
                // 保存原文
                el.setAttribute('data-original-text', text);
                textsToTranslate.push(text);
                elementMap.set(index, el);
                console.log(`准备翻译元素 ${index}: "${text.substring(0, 50)}..."`);
            }
        });
        
        if (textsToTranslate.length === 0) return;
        
        // 批量翻译
        if (window.TranslationService) {
            try {
                console.log(`全站翻译：开始批量翻译 ${textsToTranslate.length} 个文本...`);
                const translations = await window.TranslationService.translateBatch(textsToTranslate, 'en');
                
                console.log('收到翻译结果:', translations);
                console.log('元素映射数量:', elementMap.size);
                
                // 应用翻译结果
                let translationIndex = 0;
                elementMap.forEach((el, originalIndex) => {
                    if (translationIndex < translations.length) {
                        const translatedText = translations[translationIndex];
                        console.log(`翻译元素 ${originalIndex}: "${el.textContent.substring(0, 30)}..." -> "${translatedText.substring(0, 30)}..."`);
                        el.textContent = translatedText;
                        el.setAttribute('data-translated', 'true');
                        translationIndex++;
                    } else {
                        console.warn(`元素 ${originalIndex} 没有对应的翻译结果`);
                    }
                });
                
                console.log('全站翻译：完成，已更新', translationIndex, '个元素');
            } catch (error) {
                console.error('全站翻译失败:', error);
            }
        } else {
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
        
        // 初始翻译（如果当前是英文）
        const currentLang = window.LanguageManager?.getCurrentLanguage();
        console.log('全站翻译：当前语言', currentLang);
        if (currentLang === 'en') {
            setTimeout(() => {
                translateAll();
            }, 500);
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

