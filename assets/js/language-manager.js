/**
 * 语言管理模块
 * 管理网站的语言状态和切换
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'site_language';
    const DEFAULT_LANG = 'zh'; // 默认中文
    
    let currentLang = DEFAULT_LANG;

    /**
     * 初始化语言管理器
     */
    function init() {
        // 从localStorage读取语言设置
        const savedLang = localStorage.getItem(STORAGE_KEY);
        if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
            currentLang = savedLang;
        }
        
        // 更新页面语言属性
        updatePageLanguage();
        
        // 绑定语言切换按钮事件
        bindLanguageSwitch();
    }

    /**
     * 更新页面语言属性
     */
    function updatePageLanguage() {
        document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
        document.documentElement.setAttribute('data-lang', currentLang);
    }

    /**
     * 绑定语言切换按钮
     */
    function bindLanguageSwitch() {
        const langSwitches = document.querySelectorAll('.lang-switch');
        langSwitches.forEach(switchBtn => {
            switchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleLanguage();
            });
        });
    }

    /**
     * 切换语言
     */
    function toggleLanguage() {
        const oldLang = currentLang;
        currentLang = currentLang === 'zh' ? 'en' : 'zh';
        console.log('语言切换:', oldLang, '->', currentLang);
        
        localStorage.setItem(STORAGE_KEY, currentLang);
        updatePageLanguage();
        
        // 触发语言切换事件
        const event = new CustomEvent('languageChanged', {
            detail: { lang: currentLang, oldLang: oldLang }
        });
        document.dispatchEvent(event);
        
        console.log('✓ 语言切换事件已触发');
    }

    /**
     * 获取当前语言
     */
    function getCurrentLanguage() {
        return currentLang;
    }

    /**
     * 设置语言
     */
    function setLanguage(lang) {
        if (lang === 'zh' || lang === 'en') {
            currentLang = lang;
            localStorage.setItem(STORAGE_KEY, currentLang);
            updatePageLanguage();
            
            const event = new CustomEvent('languageChanged', {
                detail: { lang: currentLang }
            });
            document.dispatchEvent(event);
        }
    }

    // 导出API
    window.LanguageManager = {
        init: init,
        getCurrentLanguage: getCurrentLanguage,
        setLanguage: setLanguage,
        toggleLanguage: toggleLanguage
    };

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    console.log('✓ 语言管理器模块已加载');
})();

