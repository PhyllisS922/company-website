/**
 * 全站翻译模块
 * 自动翻译页面内容（需要后端API支持）
 */

(function() {
    'use strict';

    // 标记需要翻译的元素选择器
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
        'main .motion-entrance li'
    ];

    // 排除的元素（不需要翻译）
    const EXCLUDE_SELECTORS = [
        'nav a',
        '.lang-switch',
        '.motion-group-item a', // 新闻链接由insights-loader.js处理
        'footer',
        'header'
    ];

    /**
     * 获取需要翻译的元素
     */
    function getTranslatableElements() {
        const elements = [];
        const excludeElements = new Set();
        
        // 收集排除的元素
        EXCLUDE_SELECTORS.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                excludeElements.add(el);
            });
        });
        
        // 收集需要翻译的元素
        TRANSLATABLE_SELECTORS.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                // 检查是否在排除列表中
                let shouldExclude = false;
                for (const excludeEl of excludeElements) {
                    if (excludeEl.contains(el) || excludeEl === el) {
                        shouldExclude = true;
                        break;
                    }
                }
                
                if (!shouldExclude && el.textContent.trim()) {
                    // 检查是否已经有翻译数据
                    if (!el.hasAttribute('data-original-text')) {
                        elements.push(el);
                    }
                }
            });
        });
        
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
            if (text && !el.hasAttribute('data-original-text')) {
                // 保存原文
                el.setAttribute('data-original-text', text);
                textsToTranslate.push(text);
                elementMap.set(index, el);
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
     * 恢复原文
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
        // 监听语言切换事件
        document.addEventListener('languageChanged', (e) => {
            console.log('全站翻译：语言切换为', e.detail?.lang);
            translateAll();
        });
        
        // 初始翻译（如果当前是英文）
        const currentLang = window.LanguageManager?.getCurrentLanguage();
        if (currentLang === 'en') {
            translateAll();
        }
    }

    // 等待语言管理器加载
    if (window.LanguageManager) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(init, 500);
        });
    }
})();

