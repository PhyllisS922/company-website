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
        'main p',
        'main li',
        'main .section-title',
        'main .accent-title'
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
     * 翻译单个元素
     */
    async function translateElement(element) {
        const originalText = element.textContent.trim();
        if (!originalText) return;
        
        // 保存原文
        element.setAttribute('data-original-text', originalText);
        
        // 检查缓存
        const cached = window.TranslationService?.getFromCache(originalText, 'en');
        if (cached) {
            element.textContent = cached;
            element.setAttribute('data-translated', 'true');
            return;
        }
        
        // 如果没有翻译服务，暂时不翻译
        // 实际实现需要后端API支持
        console.log('需要翻译:', originalText.substring(0, 50) + '...');
    }

    /**
     * 翻译所有内容
     */
    async function translateAll() {
        const lang = window.LanguageManager?.getCurrentLanguage();
        if (lang === 'zh') {
            // 中文模式，显示原文（中文）
            restoreOriginalText();
        } else {
            // 英文模式，需要翻译
            const elements = getTranslatableElements();
            console.log(`找到 ${elements.length} 个需要翻译的元素`);
            
            // 批量翻译
            for (const element of elements) {
                await translateElement(element);
            }
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

