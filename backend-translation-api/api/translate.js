/**
 * Vercel Serverless Function for Translation
 * 翻译API端点
 */

export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理OPTIONS请求（CORS预检）
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { texts, targetLang } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Invalid request: texts array required' });
    }

    if (!targetLang || !['zh', 'en'].includes(targetLang)) {
      return res.status(400).json({ error: 'Invalid request: targetLang must be "zh" or "en"' });
    }

    // 获取OpenAI API密钥
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: API key not found' });
    }

    // 准备翻译提示
    const sourceLang = targetLang === 'zh' ? 'English' : 'Chinese';
    const targetLangName = targetLang === 'zh' ? 'Chinese' : 'English';
    
    // 将多个文本合并为一次API调用
    const combinedText = texts.map((text, index) => `${index + 1}. ${text}`).join('\n---\n');
    
    const prompt = `Translate the following ${sourceLang} text to ${targetLangName}. Each item is separated by "---". Return only the translated text in the same format, without any additional commentary or formatting.`;

    // 调用OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: combinedText }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(500).json({ error: 'Translation service error', details: errorData });
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content.trim();

    // 分割翻译结果
    const translatedTexts = translatedText.split('---').map((text, index) => {
      // 移除编号前缀（如 "1. "）
      return text.replace(/^\d+\.\s*/, '').trim();
    });

    // 确保返回数量匹配
    if (translatedTexts.length !== texts.length) {
      console.warn(`Translation count mismatch: expected ${texts.length}, got ${translatedTexts.length}`);
      // 如果数量不匹配，返回原文
      return res.status(200).json({ translations: texts });
    }

    return res.status(200).json({ translations: translatedTexts });

  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

