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
from datetime import datetime, timedelta
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
ARCHIVE_DIR = BASE_DIR / "assets/data/archive"
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

# 成本监控
cost_tracker = {
    'ai_filter_calls': 0,
    'translation_calls': 0,
    'total_input_tokens': 0,
    'total_output_tokens': 0
}


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


def get_news_date(entry: Dict) -> Optional[datetime]:
    """获取新闻的发布日期（datetime对象）"""
    try:
        published = entry.get('published', '')
        if published:
            return feedparser._parse_date(published)
    except:
        pass
    return None


def is_within_date_range(news_date: Optional[datetime], days: int = 0) -> bool:
    """检查新闻日期是否在指定天数范围内（0=当天，1=昨天，2=前天）"""
    if not news_date:
        return False
    
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    target_date = today - timedelta(days=days)
    
    # 检查是否是同一天（忽略时间）
    return news_date.date() == target_date.date()


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
        is_relevant = "relevant" in result and "not relevant" not in result
        if not is_relevant:
            print(f"  ✗ AI筛选排除: {title[:60]}...")
        return is_relevant
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


def translate_text_batch(texts: List[str], target_lang: str = "中文") -> List[str]:
    """批量翻译文本（优化API调用）"""
    if not openai_client or not texts:
        return texts
    
    try:
        # 将多个文本合并为一次API调用
        combined_text = "\n---\n".join([f"{i+1}. {text}" for i, text in enumerate(texts)])
        
        prompt = f"将以下英文文本翻译成{target_lang}，保持专业术语的准确性。每个条目用---分隔，请按相同格式返回翻译结果，只返回翻译后的文本，不要其他内容。"
        
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": combined_text}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        # 成本监控
        cost_tracker['translation_calls'] += 1
        if hasattr(response, 'usage'):
            cost_tracker['total_input_tokens'] += response.usage.prompt_tokens
            cost_tracker['total_output_tokens'] += response.usage.completion_tokens
        
        translated = response.choices[0].message.content.strip()
        
        # 分割翻译结果
        results = [line.strip() for line in translated.split("---") if line.strip()]
        
        # 移除编号前缀（如 "1. "）
        results = [re.sub(r'^\d+\.\s*', '', result) for result in results]
        
        # 确保返回数量匹配
        if len(results) == len(texts):
            return results
        else:
            print(f"⚠ 翻译数量不匹配：期望 {len(texts)}，得到 {len(results)}")
            # 如果数量不匹配，返回原文
            return texts
            
    except Exception as e:
        print(f"⚠ 批量翻译出错: {e}，返回原文")
        return texts


def translate_news_items(news_items: List[Dict]) -> List[Dict]:
    """翻译新闻项（标题+摘要）"""
    if not openai_client:
        return news_items
    
    # 收集需要翻译的文本
    titles = [item['title'] for item in news_items]
    summaries = [item.get('summary', '') for item in news_items]
    
    print(f"  翻译 {len(news_items)} 条新闻...")
    
    # 批量翻译标题
    titles_zh = translate_text_batch(titles, "中文")
    
    # 批量翻译摘要（过滤空摘要）
    summaries_to_translate = [s for s in summaries if s]
    if summaries_to_translate:
        summaries_zh = translate_text_batch(summaries_to_translate, "中文")
        # 重新映射回原位置
        summaries_zh_full = []
        summary_idx = 0
        for s in summaries:
            if s:
                summaries_zh_full.append(summaries_zh[summary_idx])
                summary_idx += 1
            else:
                summaries_zh_full.append('')
    else:
        summaries_zh_full = [''] * len(news_items)
    
    # 更新新闻项
    for i, item in enumerate(news_items):
        item['title_zh'] = titles_zh[i] if i < len(titles_zh) else item['title']
        item['summary_zh'] = summaries_zh_full[i] if i < len(summaries_zh_full) else item.get('summary', '')
    
    return news_items


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
    
    # 用于去重的URL集合
    seen_urls: Set[str] = set()
    
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
                
                # URL去重
                if link in seen_urls:
                    continue
                seen_urls.add(link)
                
                # 获取新闻日期
                news_date = get_news_date(entry)
                date = format_date(entry.get('published', ''))
                
                # 时效性检查：优先当天，不足时扩展到2-3天
                is_today = is_within_date_range(news_date, days=0)
                is_yesterday = is_within_date_range(news_date, days=1)
                is_day_before = is_within_date_range(news_date, days=2)
                
                # 暂时不进行日期过滤，等收集完后再决定
                # 先收集所有新闻，然后根据数量决定是否扩展日期范围
                
                # 关键词筛选（如果关键词列表为空，则跳过筛选）
                keywords = source.get('keywords', [])
                if keywords and len(keywords) > 0:
                    if not check_keywords(f"{title} {summary}", keywords):
                        continue
                
                matched_count += 1
                
                news_item = {
                    "date": date,
                    "date_obj": news_date,  # 保存datetime对象用于日期过滤（不序列化到JSON）
                    "title": title,
                    "link": link,
                    "summary": summary[:200] if summary else "",
                    "source": source['name'],
                    "region": region,
                    "is_today": is_today,
                    "is_yesterday": is_yesterday,
                    "is_day_before": is_day_before
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
    policy_news.sort(key=lambda x: x.get('date_obj') or datetime.min, reverse=True)
    industry_news.sort(key=lambda x: x.get('date_obj') or datetime.min, reverse=True)
    
    # 时效性过滤：优先当天，不足时扩展到2-3天
    # 先筛选当天的政策类新闻
    today_policy = [item for item in policy_news if item.get('is_today', False)]
    today_industry = [item for item in industry_news if item.get('is_today', False)]
    
    # 如果当天新闻不足，扩展到昨天和前天
    if len(today_policy) < 10:  # 政策类目标10条
        yesterday_policy = [item for item in policy_news if item.get('is_yesterday', False) and item not in today_policy]
        day_before_policy = [item for item in policy_news if item.get('is_day_before', False) and item not in today_policy]
        policy_news_filtered = today_policy + yesterday_policy + day_before_policy
        if len(policy_news_filtered) > 0:
            print(f"  时效性：当天 {len(today_policy)} 条，扩展到2-3天，共 {len(policy_news_filtered)} 条")
        else:
            # 如果仍然没有，使用所有新闻（可能是日期解析问题）
            print(f"  时效性：当天 {len(today_policy)} 条，扩展到2-3天后仍为0，使用所有新闻")
            policy_news_filtered = policy_news[:10]  # 至少取前10条
    else:
        policy_news_filtered = today_policy
        print(f"  时效性：当天 {len(today_policy)} 条，足够")
    
    if len(today_industry) < 20:  # 行业类目标20条
        yesterday_industry = [item for item in industry_news if item.get('is_yesterday', False) and item not in today_industry]
        day_before_industry = [item for item in industry_news if item.get('is_day_before', False) and item not in today_industry]
        industry_news_filtered = today_industry + yesterday_industry + day_before_industry
        if len(industry_news_filtered) > 0:
            print(f"  时效性：当天 {len(today_industry)} 条，扩展到2-3天，共 {len(industry_news_filtered)} 条")
        else:
            # 如果仍然没有，使用所有新闻（可能是日期解析问题）
            print(f"  时效性：当天 {len(today_industry)} 条，扩展到2-3天后仍为0，使用所有新闻")
            industry_news_filtered = industry_news[:20]  # 至少取前20条
    else:
        industry_news_filtered = today_industry
        print(f"  时效性：当天 {len(today_industry)} 条，足够")
    
    # 分配政策类新闻到各地区（控制数量：每个地区固定5条）
    target_per_region = 5  # 马来西亚和新加坡各5条
    
    policy_items_to_translate = []
    for item in policy_news_filtered:
        region = item['region']
        if region in all_news['recent_observations']:
            current_count = len(all_news['recent_observations'][region])
            if current_count < target_per_region:
                all_news['recent_observations'][region].append(item)
                policy_items_to_translate.append(item)
    
    # 分配行业类新闻（控制数量）
    industry_items_to_translate = []
    for item in industry_news_filtered:
        if len(all_news['industry_observations']) < industry_target['max']:
            all_news['industry_observations'].append(item)
            industry_items_to_translate.append(item)
    
    # 翻译新闻（标题+摘要）
    if openai_client:
        print("\n开始翻译新闻...")
        if policy_items_to_translate:
            translate_news_items(policy_items_to_translate)
        if industry_items_to_translate:
            translate_news_items(industry_items_to_translate)
        print("✓ 翻译完成")
    
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
            title_zh = item.get('title_zh', item['title'])
            summary_zh = item.get('summary_zh', item.get('summary', ''))
            formatted['recent_observations'][region].append({
                "text": f"[{item['date']} · {region}] {item['title']}",
                "text_zh": f"[{item['date']} · {region}] {title_zh}",
                "link": item['link'],
                "summary": item.get('summary', ''),
                "summary_zh": summary_zh
            })
    
    # 格式化行业观察
    for item in news_data['industry_observations']:
        # 处理可能没有industry字段的情况
        industry = item.get('industry', '其他')
        title_zh = item.get('title_zh', item['title'])
        summary_zh = item.get('summary_zh', item.get('summary', ''))
        formatted['industry_observations'].append({
            "text": f"[{item['date']} · {industry}] {item['title']}",
            "text_zh": f"[{item['date']} · {industry}] {title_zh}",
            "link": item['link'],
            "summary": item.get('summary', ''),
            "summary_zh": summary_zh
        })
    
    return formatted


def archive_old_news(current_data: Dict) -> None:
    """归档超过3天的新闻"""
    # 确保归档目录存在
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    
    # 读取当前数据
    if not OUTPUT_FILE.exists():
        return
    
    try:
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            old_data = json.load(f)
    except:
        return
    
    if not old_data:
        return
    
    # 获取当前日期
    today = datetime.now()
    
    # 归档所有超过3天的新闻
    # 检查过去7天的数据，确保不会漏掉任何日期
    archived_dates = set()
    
    # 收集所有需要归档的新闻（超过3天）
    news_to_archive_by_date = {}  # {date: {recent_observations: {...}, industry_observations: [...]}}
    
    # 处理近期观察
    for region in ['马来西亚', '新加坡']:
        for item in old_data.get('recent_observations', {}).get(region, []):
            # 从日期字符串解析日期（格式：DD-MM-YY）
            date_str = item.get('date', '')
            if not date_str:
                continue
            
            try:
                # 解析日期 DD-MM-YY
                parts = date_str.split('-')
                if len(parts) == 3:
                    day, month, year = int(parts[0]), int(parts[1]), int(parts[2])
                    # 处理年份：YY -> 20YY
                    if year < 100:
                        year += 2000
                    news_date = datetime(year, month, day)
                    
                    # 计算天数差
                    days_diff = (today - news_date).days
                    
                    # 如果超过3天，需要归档
                    if days_diff > 3:
                        date_key = news_date.strftime("%Y-%m-%d")
                        if date_key not in news_to_archive_by_date:
                            news_to_archive_by_date[date_key] = {
                                'recent_observations': {'马来西亚': [], '新加坡': []},
                                'industry_observations': []
                            }
                        news_to_archive_by_date[date_key]['recent_observations'][region].append(item)
                        archived_dates.add(date_key)
            except:
                continue
    
    # 处理行业观察
    for item in old_data.get('industry_observations', []):
        date_str = item.get('date', '')
        if not date_str:
            continue
        
        try:
            # 解析日期 DD-MM-YY
            parts = date_str.split('-')
            if len(parts) == 3:
                day, month, year = int(parts[0]), int(parts[1]), int(parts[2])
                # 处理年份：YY -> 20YY
                if year < 100:
                    year += 2000
                news_date = datetime(year, month, day)
                
                # 计算天数差
                days_diff = (today - news_date).days
                
                # 如果超过3天，需要归档
                if days_diff > 3:
                    date_key = news_date.strftime("%Y-%m-%d")
                    if date_key not in news_to_archive_by_date:
                        news_to_archive_by_date[date_key] = {
                            'recent_observations': {'马来西亚': [], '新加坡': []},
                            'industry_observations': []
                        }
                    news_to_archive_by_date[date_key]['industry_observations'].append(item)
                    archived_dates.add(date_key)
        except:
            continue
    
    # 为每个日期创建归档文件（合并到已有文件或创建新文件）
    for date_key in archived_dates:
        archive_file = ARCHIVE_DIR / f"{date_key}.json"
        
        # 读取已有归档文件（如果存在）
        existing_archive = {}
        if archive_file.exists():
            try:
                with open(archive_file, 'r', encoding='utf-8') as f:
                    existing_archive = json.load(f)
            except:
                existing_archive = {}
        
        # 合并数据
        archive_data = news_to_archive_by_date[date_key]
        
        # 合并近期观察
        for region in ['马来西亚', '新加坡']:
            existing_items = existing_archive.get('recent_observations', {}).get(region, [])
            new_items = archive_data['recent_observations'][region]
            # 去重（基于link）
            existing_links = {item.get('link') for item in existing_items}
            for item in new_items:
                if item.get('link') not in existing_links:
                    existing_items.append(item)
                    existing_links.add(item.get('link'))
            
            if 'recent_observations' not in existing_archive:
                existing_archive['recent_observations'] = {}
            existing_archive['recent_observations'][region] = existing_items
        
        # 合并行业观察
        existing_industry = existing_archive.get('industry_observations', [])
        new_industry = archive_data['industry_observations']
        # 去重（基于link）
        existing_industry_links = {item.get('link') for item in existing_industry}
        for item in new_industry:
            if item.get('link') not in existing_industry_links:
                existing_industry.append(item)
                existing_industry_links.add(item.get('link'))
        existing_archive['industry_observations'] = existing_industry
        
        # 添加元数据
        existing_archive['archived_date'] = date_key
        existing_archive['last_updated'] = old_data.get('last_updated', '')
        
        # 保存归档文件
        with open(archive_file, 'w', encoding='utf-8') as f:
            json.dump(existing_archive, f, ensure_ascii=False, indent=2)
        print(f"✓ 已归档 {date_key} 的数据到 {archive_file}")
    
    if archived_dates:
        print(f"✓ 共归档 {len(archived_dates)} 个日期的数据: {', '.join(sorted(archived_dates))}")


def main():
    """主函数"""
    print("=" * 50)
    print("洞察页面新闻自动抓取脚本")
    print("=" * 50)
    
    # 加载配置
    config = load_config()
    
    # 归档旧新闻（在抓取新新闻之前）
    if OUTPUT_FILE.exists():
        print("\n检查需要归档的新闻...")
        try:
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                old_data = json.load(f)
            archive_old_news(old_data)
        except Exception as e:
            print(f"⚠ 归档检查出错: {e}")
    
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
    
    # 成本统计
    if openai_client and (cost_tracker['ai_filter_calls'] > 0 or cost_tracker['translation_calls'] > 0):
        print(f"\n成本统计:")
        print(f"  AI筛选调用: {cost_tracker['ai_filter_calls']} 次")
        print(f"  翻译调用: {cost_tracker['translation_calls']} 次")
        print(f"  输入tokens: {cost_tracker['total_input_tokens']}")
        print(f"  输出tokens: {cost_tracker['total_output_tokens']}")
        # gpt-4o-mini 价格：$0.15/1M input, $0.60/1M output
        input_cost = (cost_tracker['total_input_tokens'] / 1_000_000) * 0.15
        output_cost = (cost_tracker['total_output_tokens'] / 1_000_000) * 0.60
        total_cost = input_cost + output_cost
        print(f"  估算成本: ${total_cost:.4f} (输入: ${input_cost:.4f}, 输出: ${output_cost:.4f})")


if __name__ == "__main__":
    main()
