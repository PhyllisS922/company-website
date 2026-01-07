#!/usr/bin/env python3
"""
洞察页面新闻自动抓取脚本
功能：
1. 从配置的RSS源抓取新闻
2. 使用关键词和AI筛选相关内容
3. 自动分类（政策类/行业类，地区/行业）
4. 生成JSON数据文件

设计目标：
- 政策/制度观察：每天6-10条（新马为主）
- 行业/市场动态：每天12-20条（行业广泛）
- 强调连续性>爆点，环境感知>结论输出
"""

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urlparse

try:
    import feedparser
    from openai import OpenAI
except ImportError:
    print("错误：缺少必要的Python库")
    print("请运行: pip install -r requirements.txt")
    sys.exit(1)

# 配置
BASE_DIR = Path(__file__).parent.parent
CONFIG_FILE = BASE_DIR / "data-sources.json"
OUTPUT_FILE = BASE_DIR / "assets/data/insights-data.json"
API_KEY_FILE = BASE_DIR / ".env"

# 初始化OpenAI客户端（如果配置了API密钥）
openai_client = None
# 优先从环境变量读取（GitHub Actions使用）
api_key = os.getenv("OPENAI_API_KEY")

# 如果环境变量没有，尝试从.env文件读取
if not api_key and API_KEY_FILE.exists():
    from dotenv import load_dotenv
    load_dotenv(API_KEY_FILE)
    api_key = os.getenv("OPENAI_API_KEY")

# 如果找到API密钥，初始化客户端
if api_key:
    openai_client = OpenAI(api_key=api_key)
    print("✓ AI筛选已启用")
else:
    print("⚠ 未找到OPENAI_API_KEY，将仅使用关键词筛选")


def load_config() -> Dict:
    """加载配置文件"""
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def format_date(date_str: str) -> str:
    """格式化日期为 DD-MM-YY 格式（日-月-年）"""
    try:
        # 尝试解析各种日期格式
        dt = feedparser._parse_date(date_str)
        return dt.strftime("%d-%m-%y")
    except:
        return datetime.now().strftime("%d-%m-%y")


def extract_summary(entry: Dict) -> str:
    """提取新闻摘要"""
    if 'summary' in entry:
        return entry['summary']
    elif 'description' in entry:
        return entry['description']
    elif 'content' in entry and len(entry['content']) > 0:
        return entry['content'][0].get('value', '')
    return ''


def check_keywords(text: str, keywords: List[str]) -> bool:
    """检查文本是否包含关键词"""
    text_lower = text.lower()
    for keyword in keywords:
        if keyword.lower() in text_lower:
            return True
    return False


def ai_check_relevance(title: str, summary: str, prompt: str) -> bool:
    """使用AI判断新闻相关性"""
    if not openai_client:
        return True  # 如果没有AI，默认通过
    
    try:
        full_text = f"标题：{title}\n摘要：{summary[:300]}"
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",  # 使用更便宜的模型
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": full_text}
            ],
            temperature=0.1,
            max_tokens=10
        )
        result = response.choices[0].message.content.strip().lower()
        return "relevant" in result
    except Exception as e:
        print(f"⚠ AI筛选出错: {e}，使用关键词筛选")
        return True


def classify_industry(title: str, summary: str, industry_keywords: Dict) -> Optional[str]:
    """根据关键词分类行业"""
    text = f"{title} {summary}".lower()
    for industry, keywords in industry_keywords.items():
        if check_keywords(text, keywords):
            return industry
    return None


def fetch_and_filter_news(config: Dict) -> Dict:
    """抓取并筛选新闻，区分政策类和行业类"""
    all_news = {
        "recent_observations": {
            "马来西亚": [],
            "新加坡": []
        },
        "industry_observations": []
    }
    
    # 获取配置
    sources = [s for s in config['sources'] if s.get('enabled', True)]
    # 按优先级排序（priority越小越优先）
    sources.sort(key=lambda x: x.get('priority', 999))
    
    ai_config = config.get('ai_filtering', {})
    ai_enabled = ai_config.get('enabled', False) and openai_client is not None
    target_counts = config.get('target_daily_count', {})
    
    policy_target = target_counts.get('policy', {'min': 6, 'max': 10})
    industry_target = target_counts.get('industry', {'min': 12, 'max': 20})
    
    policy_prompt = ai_config.get('prompt_policy', '')
    industry_prompt = ai_config.get('prompt_industry', '')
    
    print(f"\n开始抓取 {len(sources)} 个数据源...")
    print(f"目标：政策类 {policy_target['min']}-{policy_target['max']} 条，行业类 {industry_target['min']}-{industry_target['max']} 条")
    
    # 分别收集政策类和行业类新闻
    policy_news = []  # 政策类新闻（按地区分类）
    industry_news = []  # 行业类新闻（按行业分类）
    
    for source in sources:
        source_type = source.get('type', 'media')  # 'policy' 或 'media'
        region = source.get('region', '')
        
        print(f"\n处理: {source['name']} ({region}, {source_type})")
        try:
            feed = feedparser.parse(source['url'])
            print(f"  找到 {len(feed.entries)} 条新闻")
            if len(feed.entries) == 0:
                print(f"  ⚠ 警告：该RSS源可能无效或无法访问")
                if hasattr(feed, 'bozo') and feed.bozo:
                    print(f"  ⚠ RSS解析错误：{str(feed.bozo_exception) if hasattr(feed, 'bozo_exception') else '未知错误'}")
                continue
            if hasattr(feed, 'bozo') and feed.bozo:
                print(f"  ⚠ RSS解析警告：{str(feed.bozo_exception) if hasattr(feed, 'bozo_exception') else '未知错误'}")
            
            matched_count = 0
            for entry in feed.entries:
                title = entry.get('title', '')
                summary = extract_summary(entry)
                link = entry.get('link', '#')
                date = format_date(entry.get('published', ''))
                
                # 关键词筛选（如果关键词列表为空，则跳过筛选）
                keywords = source.get('keywords', [])
                if keywords and len(keywords) > 0:
                    if not check_keywords(f"{title} {summary}", keywords):
                        continue
                
                matched_count += 1
                
                news_item = {
                    "date": date,
                    "title": title,
                    "link": link,
                    "summary": summary[:200] if summary else "",
                    "source": source['name'],
                    "region": region
                }
                
                # 根据数据源类型和AI筛选进行分类
                if source_type == 'policy':
                    # 政策类：使用政策提示词筛选
                    if ai_enabled and policy_prompt:
                        if not ai_check_relevance(title, summary, policy_prompt):
                            continue
                    
                    # 政策类新闻进入recent_observations
                    # 如果region是"东盟"，根据内容判断是否与新马相关，或默认分配到两个地区
                    if region in ['新加坡', '马来西亚']:
                        policy_news.append(news_item)
                    elif region == '东盟':
                        # 东盟的政策类新闻，如果标题或摘要包含新马关键词，分配到相应地区
                        # 否则同时添加到两个地区（因为东盟政策通常影响整个区域）
                        title_lower = title.lower()
                        summary_lower = summary.lower()
                        if 'singapore' in title_lower or '新加坡' in title or 'malaysia' in title_lower or '马来西亚' in title:
                            # 如果明确提到新马，根据内容分配到对应地区
                            if 'singapore' in title_lower or '新加坡' in title:
                                news_item['region'] = '新加坡'
                                policy_news.append(news_item)
                            elif 'malaysia' in title_lower or '马来西亚' in title:
                                news_item['region'] = '马来西亚'
                                policy_news.append(news_item)
                        else:
                            # 没有明确提到新马，但通过筛选，说明与区域相关，可以添加到两个地区
                            # 为了避免重复，只添加到第一个地区（马来西亚），或者可以根据其他逻辑分配
                            news_item['region'] = '马来西亚'  # 默认分配到马来西亚
                            policy_news.append(news_item)
                
                else:
                    # 行业类：使用行业提示词筛选
                    if ai_enabled and industry_prompt:
                        if not ai_check_relevance(title, summary, industry_prompt):
                            continue
                    
                    # 行业分类
                    industry = classify_industry(title, summary, config.get('industry_keywords', {}))
                    if industry:
                        industry_item = news_item.copy()
                        industry_item['industry'] = industry
                        industry_news.append(industry_item)
                    else:
                        # 如果没有匹配到具体行业，但通过了筛选，也可以作为行业新闻
                        industry_news.append(news_item)
            
            print(f"  通过筛选: {matched_count} 条")
        
        except Exception as e:
            print(f"  ✗ 错误: {e}")
            continue
    
    # 按日期排序（最新的在前）
    policy_news.sort(key=lambda x: x['date'], reverse=True)
    industry_news.sort(key=lambda x: x['date'], reverse=True)
    
    # 分配政策类新闻到各地区（控制数量：每个地区固定5条）
    target_per_region = 5  # 马来西亚和新加坡各5条
    
    for item in policy_news:
        region = item['region']
        if region in all_news['recent_observations']:
            current_count = len(all_news['recent_observations'][region])
            if current_count < target_per_region:
                all_news['recent_observations'][region].append(item)
    
    # 分配行业类新闻（控制数量）
    for item in industry_news:
        if len(all_news['industry_observations']) < industry_target['max']:
            all_news['industry_observations'].append(item)
    
    # 最终统计
    total_policy = sum(len(items) for items in all_news['recent_observations'].values())
    total_industry = len(all_news['industry_observations'])
    
    print(f"\n筛选结果：")
    print(f"  政策类: {total_policy} 条（目标: {policy_target['min']}-{policy_target['max']}）")
    print(f"  行业类: {total_industry} 条（目标: {industry_target['min']}-{industry_target['max']}）")
    
    return all_news


def generate_display_format(news_data: Dict) -> Dict:
    """生成前端显示格式"""
    formatted = {
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "recent_observations": {
            "马来西亚": [],
            "新加坡": []
        },
        "industry_observations": []
    }
    
    # 格式化近期观察（政策类）
    for region, items in news_data['recent_observations'].items():
        for item in items:
            formatted['recent_observations'][region].append({
                "text": f"[{item['date']} · {region}] {item['title']}",
                "link": item['link']
            })
    
    # 格式化行业观察
    for item in news_data['industry_observations']:
        # 处理可能没有industry字段的情况
        industry = item.get('industry', '其他')
        formatted['industry_observations'].append({
            "text": f"[{item['date']} · {industry}] {item['title']}",
            "link": item['link']
        })
    
    return formatted


def main():
    """主函数"""
    print("=" * 50)
    print("洞察页面新闻自动抓取脚本")
    print("=" * 50)
    
    # 加载配置
    config = load_config()
    
    # 抓取和筛选新闻
    news_data = fetch_and_filter_news(config)
    
    # 生成显示格式
    output_data = generate_display_format(news_data)
    
    # 确保输出目录存在
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    # 保存JSON文件
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ 完成！已生成 {OUTPUT_FILE}")
    print(f"  马来西亚: {len(output_data['recent_observations']['马来西亚'])} 条")
    print(f"  新加坡: {len(output_data['recent_observations']['新加坡'])} 条")
    print(f"  行业观察: {len(output_data['industry_observations'])} 条")
    print(f"  更新时间: {output_data['last_updated']}")


if __name__ == "__main__":
    main()
