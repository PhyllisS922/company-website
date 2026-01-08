/**
 * 语言管理模块
 * 管理网站的语言状态和切换
 */

(function() {
    'use strict';

        const STORAGE_KEY = 'site_language';
        const DEFAULT_LANG = 'zh'; // 默认中文（确认）
    
    let currentLang = DEFAULT_LANG;

    /**
     * 初始化语言管理器
     */
    function init() {
        console.log('初始化语言管理器...');
        
        // 从localStorage读取语言设置
        const savedLang = localStorage.getItem(STORAGE_KEY);
        if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
            currentLang = savedLang;
            console.log('从localStorage读取语言:', currentLang);
        } else {
            console.log('使用默认语言:', currentLang);
        }
        
        // 更新页面语言属性
        updatePageLanguage();
        
        // 延迟绑定按钮，确保DOM已完全加载
        setTimeout(() => {
            bindLanguageSwitch();
            // 绑定后再次更新按钮文本，确保显示正确
            updateLanguageButton();
        }, 100);
        
        // 也立即更新一次（如果DOM已加载）
        if (document.readyState !== 'loading') {
            setTimeout(() => {
                updateLanguageButton();
            }, 200);
        }
        
        // 监听DOMContentLoaded，确保按钮已存在
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    updateLanguageButton();
                }, 100);
            });
        }
    }

    /**
     * 更新页面语言属性
     */
    function updatePageLanguage() {
        document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
        document.documentElement.setAttribute('data-lang', currentLang);
        
        // 更新按钮文本
        updateLanguageButton();
    }
    
    /**
     * 更新语言切换按钮文本
     */
    function updateLanguageButton() {
        const langSwitches = document.querySelectorAll('.lang-switch');
        
        if (langSwitches.length === 0) {
            return;
        }
        
        // 防止重复更新（避免触发MutationObserver循环）
        const targetText = currentLang === 'zh' ? 'EN' : '中文';
        
        langSwitches.forEach((switchBtn) => {
            // 只在文本不同时才更新，避免不必要的DOM变化
            if (switchBtn.textContent !== targetText) {
                switchBtn.textContent = targetText;
            }
        });
    }

    /**
     * 绑定语言切换按钮
     */
    function bindLanguageSwitch() {
        const langSwitches = document.querySelectorAll('.lang-switch');
        console.log('找到语言切换按钮:', langSwitches.length, '个');
        
        if (langSwitches.length === 0) {
            console.warn('⚠ 未找到语言切换按钮！');
            return;
        }
        
        langSwitches.forEach((switchBtn, index) => {
            console.log(`绑定按钮 ${index + 1}:`, switchBtn);
            
            // 使用多种方式绑定，确保能捕获点击
            switchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('✓ 按钮被点击！(click事件)');
                toggleLanguage();
            }, true); // 使用捕获阶段
            
            // 也绑定mousedown事件作为备用
            switchBtn.addEventListener('mousedown', (e) => {
                console.log('✓ 按钮被按下！(mousedown事件)');
            });
            
            // 检查按钮是否可点击
            console.log(`按钮 ${index + 1} 样式:`, window.getComputedStyle(switchBtn));
            console.log(`按钮 ${index + 1} 是否可见:`, switchBtn.offsetParent !== null);
            
            console.log(`✓ 按钮 ${index + 1} 事件已绑定`);
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
    console.log('✓ 语言管理器模块已加载，准备初始化...');
    console.log('当前页面状态:', document.readyState);
    
    // 页面加载完成后初始化
    function startInit() {
        // 立即更新一次按钮（如果DOM已加载）
        if (document.readyState !== 'loading') {
            const savedLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
            currentLang = (savedLang === 'zh' || savedLang === 'en') ? savedLang : DEFAULT_LANG;
            updateLanguageButton();
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                init();
            });
        } else {
            // DOM已加载，延迟一点确保所有元素都已渲染
            setTimeout(() => {
                init();
            }, 50);
        }
    }
    
    // 立即执行（不等待）
    startInit();
    
    // 也使用window.onload作为保障
    window.addEventListener('load', () => {
        setTimeout(() => {
            updateLanguageButton();
        }, 100);
    });
})();

