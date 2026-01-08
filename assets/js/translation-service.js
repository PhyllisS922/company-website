/**
 * 翻译服务模块
 * 使用OpenAI API进行翻译，带缓存机制
 */

(function() {
    'use strict';

    const CACHE_KEY_PREFIX = 'translation_cache_';
    const CACHE_EXPIRY_DAYS = 365; // 缓存有效期1年
    
    // 翻译缓存（内存缓存）
    const memoryCache = new Map();

    /**
     * 生成缓存键
     */
    function getCacheKey(text, targetLang) {
        // 使用文本内容的简单哈希作为缓存键
        return CACHE_KEY_PREFIX + targetLang + '_' + hashString(text);
    }

    /**
     * 简单的字符串哈希函数
     */
    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * 从缓存获取翻译
     */
    function getFromCache(text, targetLang) {
        const cacheKey = getCacheKey(text, targetLang);
        
        // 先检查内存缓存
        if (memoryCache.has(cacheKey)) {
            return memoryCache.get(cacheKey);
        }
        
        // 检查localStorage
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                // 检查是否过期
                const now = Date.now();
                if (data.expiry && data.expiry > now) {
                    memoryCache.set(cacheKey, data.translation);
                    return data.translation;
                } else {
                    // 过期，删除
                    localStorage.removeItem(cacheKey);
                }
            }
        } catch (e) {
            console.warn('读取翻译缓存失败:', e);
        }
        
        return null;
    }

    /**
     * 保存翻译到缓存
     */
    function saveToCache(text, targetLang, translation) {
        const cacheKey = getCacheKey(text, targetLang);
        const expiry = Date.now() + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        
        // 保存到内存缓存
        memoryCache.set(cacheKey, translation);
        
        // 保存到localStorage
        try {
            const data = {
                translation: translation,
                expiry: expiry,
                timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
            console.warn('保存翻译缓存失败:', e);
        }
    }

    /**
     * 批量翻译文本
     * 注意：这个函数需要后端API支持，或者使用前端OpenAI SDK
     * 由于安全考虑，API密钥不应该暴露在前端
     * 这里提供一个接口，实际实现需要根据你的架构调整
     */
    async function translateBatch(texts, targetLang = 'zh') {
        // 过滤已缓存的文本
        const textsToTranslate = [];
        const cachedResults = [];
        const indices = [];
        
        texts.forEach((text, index) => {
            const cached = getFromCache(text, targetLang);
            if (cached) {
                cachedResults[index] = cached;
            } else {
                textsToTranslate.push(text);
                indices.push(index);
            }
        });
        
        // 如果所有文本都已缓存，直接返回
        if (textsToTranslate.length === 0) {
            return cachedResults;
        }
        
        // 调用翻译API
        const translations = await callTranslationAPI(textsToTranslate, targetLang);
        
        // 保存到缓存
        textsToTranslate.forEach((text, i) => {
            saveToCache(text, targetLang, translations[i]);
        });
        
        // 合并结果
        translations.forEach((translation, i) => {
            cachedResults[indices[i]] = translation;
        });
        
        return cachedResults;
    }

    /**
     * 调用翻译API（后端代理）
     * 需要先部署后端API，然后更新API_ENDPOINT
     */
    async function callTranslationAPI(texts, targetLang) {
        // 翻译API端点
        const API_ENDPOINT = 'https://backend-translation-api.vercel.app/api/translate';
        
        console.log('调用翻译API:', { textsCount: texts.length, targetLang });
        
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    texts: texts,
                    targetLang: targetLang
                })
            });
            
            console.log('API响应状态:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API错误响应:', errorText);
                throw new Error(`API error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('API返回数据:', data);
            console.log('翻译结果数量:', data.translations?.length || 0);
            
            return data.translations || texts;
            
        } catch (error) {
            console.error('翻译API调用失败:', error);
            // 失败时返回原文
            return texts;
        }
    }

    /**
     * 翻译单个文本
     */
    async function translate(text, targetLang = 'zh') {
        // 检查缓存
        const cached = getFromCache(text, targetLang);
        if (cached) {
            return cached;
        }
        
        // 调用API翻译
        const result = await callTranslationAPI([text], targetLang);
        const translation = result[0];
        
        // 保存到缓存
        saveToCache(text, targetLang, translation);
        
        return translation;
    }

    // 导出API
    window.TranslationService = {
        translate: translate,
        translateBatch: translateBatch,
        getFromCache: getFromCache,
        clearCache: function() {
            memoryCache.clear();
            // 清除localStorage中的翻译缓存
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(CACHE_KEY_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        }
    };
})();

