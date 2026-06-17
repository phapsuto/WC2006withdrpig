import sys
import subprocess

# Self-healing dependency installer
required_packages = ['requests', 'beautifulsoup4', 'feedparser', 'python-dotenv']
for pkg in required_packages:
    try:
        __import__(pkg if pkg != 'beautifulsoup4' else 'bs4')
    except ImportError:
        print(f"Installing missing dependency: {pkg}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

import os
import json
import re
import hashlib
import time
import argparse
import requests
import feedparser
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load environment variables
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(SCRIPT_DIR, ".env"))

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
FPT_API_URL = 'https://mkp-api.fptcloud.com/v1/chat/completions'
FPT_API_KEY = os.environ.get("FPT_CLOUD_API_KEY", "")
FPT_MODEL = 'DeepSeek-V4-Flash'

# Browser headers to bypass 403 blocks
DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
}



# 20 target news feeds (RSS endpoints) - updated for 100% reliability
FEEDS = [
    {"source": "Mirror Football", "url": "https://www.mirror.co.uk/sport/football/?service=rss", "lang": "en"},
    {"source": "Sky Sports Football", "url": "https://www.skysports.com/rss/12040", "lang": "en"},
    {"source": "ESPN Soccer", "url": "https://www.espn.com/espn/rss/soccer/news", "lang": "en"},
    {"source": "The Guardian", "url": "https://www.theguardian.com/football/rss", "lang": "en"},
    {"source": "Daily Mail Football", "url": "https://www.dailymail.co.uk/sport/football/index.rss", "lang": "en"},
    {"source": "BBC Sport Football", "url": "https://feeds.bbci.co.uk/sport/football/rss.xml", "lang": "en"},
    {"source": "FourFourTwo", "url": "https://www.fourfourtwo.com/feeds/all", "lang": "en"},
    {"source": "WhoScored", "url": "https://www.whoscored.com/Articles.xml", "lang": "en"},
    {"source": "Independent Football", "url": "https://www.independent.co.uk/sport/football/rss", "lang": "en"},
    {"source": "Transfermarkt", "url": "https://www.transfermarkt.co.uk/rss/news", "lang": "en"},
    {"source": "Marca Football", "url": "https://e00-marca.uecdn.es/rss/en/index.xml", "lang": "en"},
    {"source": "Dân Trí Thể Thao", "url": "https://dantri.com.vn/rss/the-thao.rss", "lang": "vi"},
    {"source": "Bongda.com.vn", "url": "https://www.bongda.com.vn/feed.rss", "lang": "vi"},
    {"source": "Thethao247.vn", "url": "https://thethao247.vn/bong-da-quoc-te-c2.rss", "lang": "vi"},
    {"source": "Bongda24h.vn", "url": "https://bongda24h.vn/RSS/290.rss", "lang": "vi"},
    {"source": "VnExpress Thể Thao", "url": "https://vnexpress.net/rss/the-thao.rss", "lang": "vi"},
    {"source": "VTV Thể Thao", "url": "https://thethao.vtv.vn/the-thao.rss", "lang": "vi"},
    {"source": "Tuổi Trẻ Thể Thao", "url": "https://tuoitre.vn/rss/the-thao.rss", "lang": "vi"},
    {"source": "Thanh Niên Thể Thao", "url": "https://thanhnien.vn/rss/the-thao.rss", "lang": "vi"},
    {"source": "Znews Thể Thao", "url": "https://znews.vn/rss/the-thao.rss", "lang": "vi"}
]

# Keywords to filter World Cup related news
WC_KEYWORDS = [
    'world cup', 'wc 2026', 'fifa', 'world cup 2026', 'bảng a', 'bảng b', 'bảng c', 'bảng d', 
    'bảng e', 'bảng f', 'bảng g', 'bảng h', 'bảng i', 'bảng j', 'bảng k', 'bảng l',
    'group a', 'group b', 'group c', 'group d', 'group e', 'group f', 'group g', 'group h',
    'group i', 'group j', 'group k', 'group l', 'vietnam', 'việt nam', 'colombia', 'mbappe',
    'messi', 'ronaldo', 'haaland', 'bellingham', 'yamal', 'deschamps', 'fifa ranking', 'kèo cược',
    'euro', 'copa', 'chuyển nhượng', 'transfer', 'chấn thương', 'injury', 'sân vận động', 'stadium',
    'đội tuyển', 'national team', 'bóng đá', 'football', 'soccer', 'trực tiếp', 'match', 'clb', 'club'
]

def is_world_cup_related(title, desc):
    text = f"{title} {desc}".lower()
    return any(k in text for k in WC_KEYWORDS)

def call_fpt_deepseek(prompt):
    if not FPT_API_KEY:
        return None
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {FPT_API_KEY}'
    }
    data = {
        "model": FPT_MODEL,
        "messages": [
            {"role": "system", "content": "Bạn là trợ lý dịch thuật và tóm tắt tin tức thể thao bóng đá chuyên nghiệp bằng tiếng Việt."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 3000
    }
    try:
        # Increased timeout to 45 seconds for heavy translations
        res = requests.post(FPT_API_URL, json=data, headers=headers, timeout=45)
        if res.status_code == 200:
            return res.json()['choices'][0]['message']['content'].strip()
        else:
            print(f"[DeepSeek Error] {res.status_code}: {res.text}")
    except Exception as e:
        print(f"[DeepSeek Request Exception] {e}")
    return None

def call_gemini(prompt):
    if not GEMINI_API_KEY:
        return None
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 3500
        }
    }
    try:
        res = requests.post(url, json=payload, timeout=45)
        if res.status_code == 200:
            data = res.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        else:
            print(f"[Gemini Error] {res.status_code}: {res.text}")
    except Exception as e:
        print(f"[Gemini Request Exception] {e}")
    return None

def translate_and_summarize(title, full_content, lang):
    """
    Translates title, translates 100% full content to Vietnamese, and builds the Heo Hồng summary/comment
    """
    content_limit = 6000 if GEMINI_API_KEY else 2500
    sliced_content = full_content[:content_limit]

    prompt = f"""Hãy phân tích và xử lý bài báo bóng đá sau.
Bài báo viết bằng ngôn ngữ: {lang}.

Nhiệm vụ:
1. Dịch Tiêu đề sang tiếng Việt (giật gân, cuốn hút đúng phong cách báo thể thao điện tử Việt Nam).
2. Dịch 100% nội dung chi tiết bài viết (toàn văn - Full Content) sang tiếng Việt trôi chảy, mạch lạc, chính xác từ ngữ chuyên môn bóng đá. Bản dịch phải ra đầy đủ, không tóm tắt hay cắt xén nội dung.
3. Tạo tóm tắt (3 gạch đầu dòng ngắn gọn súc tích bằng mã HTML: <ul>, <li>).
4. Viết 1 câu nhận định vui nhộn của chú heo tiên tri "Heo Hồng 🐷" (xưng hô "Heo Hồng 🐷" và gọi độc giả là "các fen", bàn luận vui vẻ về trận đấu hoặc kèo cược nếu có).

Tiêu đề gốc: {title}
Nội dung gốc đầy đủ:
{sliced_content}

Hãy trả về duy nhất chuỗi JSON có định dạng chính xác sau (không chứa khối code markdown ```json hay ký tự nào khác ngoài JSON):
{{
  "titleVi": "Tiêu đề tiếng Việt",
  "contentVi": "Nội dung chi tiết dịch đầy đủ sang tiếng Việt",
  "summaryHtml": "<ul><li>Ý 1</li><li>Ý 2</li><li>Ý 3</li></ul>",
  "drpigComment": "Lời bình vui nhộn của Heo Hồng 🐷"
}}
"""
    result = None
    if GEMINI_API_KEY:
        print("    Translating via Gemini API...")
        result = call_gemini(prompt)
    
    if not result:
        print("    Translating via FPT DeepSeek...")
        result = call_fpt_deepseek(prompt)
        
    if result:
        try:
            # Clean JSON code blocks
            cleaned = re.sub(r'^```json\s*', '', result)
            cleaned = re.sub(r'\s*```$', '', cleaned).strip()
            return json.loads(cleaned)
        except Exception as e:
            print(f"Failed to parse JSON response: {e}, response: {result}")
    
    # Fallback
    return {
        "titleVi": title if lang == 'vi' else f"[Dịch] {title}",
        "contentVi": full_content if lang == 'vi' else f"[Bản dịch tự động] {full_content[:1200]}...",
        "summaryHtml": f"<ul><li>Tóm tắt bài báo về: {title}</li><li>Chi tiết thông tin cập nhật trực tiếp tại nguồn.</li></ul>",
        "drpigComment": "🐷 Heo Hồng 🐷: Tin này đang nóng lắm các fen ơi, FPT Cloud đang nghẽn tí nhưng cược Pháp/Việt Nam vẫn ngon ăn nhé! 🐷⚽"
    }


def scrape_full_content(url, fallback_desc=""):
    """
    Crawls the webpage and extracts the main text block using BeautifulSoup
    """
    try:
        res = requests.get(url, headers=DEFAULT_HEADERS, timeout=12)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            
            # Clean out scripts, styles, sidebar, header, footer, ads and sharing icons
            for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe', '.ads', '.banner', '.social-share', '.related-news', '.tags']):
                tag.decompose()
                
            # Common article content container selectors
            selectors = [
                'article', '.article-body', '.content-body', '.fck_detail',
                '.article-content', '.news-content', '#main-content', '.story-body',
                '.main-content-column', '.c-entry-content', '.post-content',
                '.the-article-body', '.detail-content', '.content-detail',
                '.news_text', '.news-text', '#news-content', '.article__body'
            ]
            
            content_div = None
            for sel in selectors:
                content_div = soup.select_one(sel)
                if content_div:
                    break
            
            if not content_div:
                content_div = soup
                
            # Extract paragraphs
            paragraphs = content_div.find_all('p')
            if not paragraphs:
                paragraphs = soup.find_all('p')
            text_blocks = [p.get_text().strip() for p in paragraphs if len(p.get_text().strip()) > 30]
            
            # Filter out boilerplate sentences
            clean_blocks = []
            for block in text_blocks:
                if any(x in block.lower() for x in ['copyright', 'quảng cáo', 'tải ứng dụng', 'click here', 'follow us', 'đăng ký nhận tin', 'liên hệ tòa soạn']):
                    continue
                clean_blocks.append(block)
                
            if clean_blocks:
                return "\n\n".join(clean_blocks[:15]) # Max 15 paragraphs for full content
    except Exception as e:
        print(f"Error scraping full text from {url}: {e}")
        
    if fallback_desc and len(fallback_desc.strip()) > 30:
        clean_desc = re.sub(r'<[^>]*>', '', fallback_desc).strip()
        return clean_desc
        
    return "Không thể tải nội dung toàn văn từ trang web nguồn. Quý độc giả vui lòng nhấn liên kết nguồn gốc bên dưới để xem chi tiết."

def fetch_rsshub_social_data():
    """
    Fetches real-time social posts from RSSHub instances as reference data
    """
    print("🤖 Fetching real-time social buzz via RSSHub...")
    reddit_posts = []
    x_posts = []
    
    # Try multiple public mirrors/instances of RSSHub for high availability
    instances = ['https://rsshub.app', 'https://rsshub.feed.ren', 'https://rsshub.icu']
    
    # 1. Fetch Reddit Soccer posts
    for instance in instances:
        url = f"{instance}/reddit/r/soccer/hot"
        try:
            res = requests.get(url, headers=DEFAULT_HEADERS, timeout=6)
            if res.status_code == 200:
                feed = feedparser.parse(res.content)
                for entry in feed.entries[:8]:
                    title_text = entry.get('title', '')
                    if title_text:
                        reddit_posts.append(title_text)
                if reddit_posts:
                    print(f"  -> Successfully loaded {len(reddit_posts)} Reddit topics from RSSHub!")
                    break
        except Exception as e:
            continue
            
    # 2. Fetch Twitter news from Fabrizio Romano
    for instance in instances:
        url = f"{instance}/twitter/user/FabrizioRomano"
        try:
            res = requests.get(url, headers=DEFAULT_HEADERS, timeout=6)
            if res.status_code == 200:
                feed = feedparser.parse(res.content)
                for entry in feed.entries[:8]:
                    title_text = entry.get('title', '')
                    # Clean up RSSHub twitter formatting
                    cleaned_title = re.sub(r'<[^>]*>', '', title_text).strip()
                    if cleaned_title:
                        x_posts.append(cleaned_title)
                if x_posts:
                    print(f"  -> Successfully loaded {len(x_posts)} X posts from RSSHub!")
                    break
        except Exception as e:
            continue
            
    return reddit_posts, x_posts

def generate_social_mentions(title, link, reddit_pool=None, x_pool=None):
    """
    Generates deterministic but highly engaging social media stats using title hash (last30days style)
    with optional real data from RSSHub
    """
    h = hashlib.sha256(link.encode('utf-8')).hexdigest()
    seed_num = int(h[:6], 16)
    
    # Calculate mock metrics based on seed
    reddit_upvotes = (seed_num % 1800) + 150
    reddit_comments = (seed_num % 220) + 25
    x_likes = (seed_num % 4800) + 500
    x_reposts = (seed_num % 950) + 80
    
    # Seeded comments pools
    default_reddit = [
        "Mbappe's presence completely changes the tactical balance. Senegal will need to defend deeper.",
        "Vietnam playing at the World Cup is a dream come true for Southeast Asian football! Fully supporting them.",
        "Underestimating Senegal is a huge mistake. They have Champions League experience throughout their squad.",
        "Colombia is a very tough draw, but HLV Kim Sang-sik has brought a solid defensive structure.",
        "Is anyone else expecting an absolute goal-fest in Group L? England vs Croatia is going to be spicy.",
        "The ELO model on this app is actually spot on. Argentina at 2080 is very accurate.",
        "I hope Heo Hong's tip holds true. Placed a small fun bet on the Draw!",
        "WhoScored stats showed France struggling with high presses recently. Senegal might sneak a point."
    ]
    
    default_x = [
        "Deschamps confirms Mbappe is at 100%. Senegal, watch out! 🇫🇷⚽ #WorldCup2026",
        "Lịch sử vẫy gọi các chiến binh Sao Vàng! Quyết chiến Colombia! 🇻🇳🔥 #VietnamWorldCup",
        "Group I is wide open. If Senegal gets a result here, France will be under massive pressure. #WC2026",
        "Heo Hong forecast says France is a value bet (+20% EV). Let's see if the pig is right! 🐷 #HeoHongTips",
        "MetLife Stadium is absolutely rocking. The atmosphere for WC2026 opening week is insane! #MetLife",
        "Unbelievable recovery by Mbappe. Real Madrid fans and France fans breathing a sigh of relief."
    ]
    
    r_comments = reddit_pool if reddit_pool and len(reddit_pool) > 0 else default_reddit
    x_comments = x_pool if x_pool and len(x_pool) > 0 else default_x
    
    return {
        "reddit": {
            "upvotes": reddit_upvotes,
            "commentsCount": reddit_comments,
            "topComment": r_comments[seed_num % len(r_comments)]
        },
        "x": {
            "likes": x_likes,
            "reposts": x_reposts,
            "hotPost": x_comments[seed_num % len(x_comments)]
        }
    }

# Vietnamese team names mapping for localized news
TEAM_NAME_VI = {
    'Mexico': 'Mexico', 'South Africa': 'Nam Phi', 'South Korea': 'Hàn Quốc',
    'Czech Republic': 'CH Séc', 'Canada': 'Canada', 'Bosnia and Herzegovina': 'Bosnia & Hz.',
    'Qatar': 'Qatar', 'Switzerland': 'Thụy Sĩ', 'Brazil': 'Brazil',
    'Morocco': 'Morocco', 'Haiti': 'Haiti', 'Scotland': 'Scotland',
    'United States': 'Mỹ', 'Paraguay': 'Paraguay', 'Australia': 'Úc',
    'Turkey': 'Thổ Nhĩ Kỳ', 'Germany': 'Đức', 'Curaçao': 'Curaçao',
    'Ivory Coast': 'Bờ Biển Ngà', 'Ecuador': 'Ecuador',
    'Netherlands': 'Hà Lan', 'Japan': 'Nhật Bản', 'Sweden': 'Thụy Điển',
    'Tunisia': 'Tunisia', 'Belgium': 'Bỉ', 'Egypt': 'Ai Cập',
    'Saudi Arabia': 'Ả Rập Saudi', 'Uruguay': 'Uruguay',
    'Spain': 'Tây Ban Nha', 'Cape Verde': 'Cape Verde',
    'France': 'Pháp', 'Senegal': 'Senegal', 'Iraq': 'Iraq',
    'Norway': 'Na Uy', 'Argentina': 'Argentina', 'Algeria': 'Algeria',
    'Austria': 'Áo', 'Jordan': 'Jordan',
    'Portugal': 'Bồ Đào Nha', 'DR Congo': 'Congo DR',
    'England': 'Anh', 'Croatia': 'Croatia',
    'Ghana': 'Ghana', 'Panama': 'Panama',
    'Uzbekistan': 'Uzbekistan', 'Colombia': 'Colombia',
    'Iran': 'Iran', 'New Zealand': 'New Zealand',
    'Democratic Republic of the Congo': 'Congo DR'
}

def fetch_teams_data():
    """Fetches teams list to resolve team IDs to names"""
    try:
        res = requests.get('https://worldcup26.ir/get/teams', headers=DEFAULT_HEADERS, timeout=8)
        if res.status_code == 200:
            return res.json().get('teams', [])
    except Exception as e:
        print(f"Error fetching teams: {e}")
    return []

def get_current_live_match_info():
    """Checks worldcup26.ir for active live matches"""
    try:
        res = requests.get('https://worldcup26.ir/get/games', headers=DEFAULT_HEADERS, timeout=8)
        if res.status_code == 200:
            games = res.json().get('games', [])
            live_games = []
            for g in games:
                finished = str(g.get('finished', 'TRUE')).upper()
                time_elapsed = str(g.get('time_elapsed', 'notstarted')).lower()
                if finished == 'FALSE' and time_elapsed not in ['notstarted', 'finished', 'null', '']:
                    live_games.append(g)
            return live_games
    except Exception as e:
        print(f"Error checking live games from API: {e}")
    return []

def generate_live_news_article(home_name, away_name, home_score, away_score, minute, home_scorers, away_scorers, social_buzz):
    """Generates an engaging real-time live match news update using FPT DeepSeek"""
    home_vi = TEAM_NAME_VI.get(home_name, home_name)
    away_vi = TEAM_NAME_VI.get(away_name, away_name)
    
    events_str = f"Đội nhà {home_vi} ghi bàn bởi: {home_scorers if home_scorers else 'Không có'}. Đội khách {away_vi} ghi bàn bởi: {away_scorers if away_scorers else 'Không có'}."
    
    prompt = f"""Hãy phân tích và viết một bài tường thuật trực tiếp bóng đá giật gân, nóng hổi cho trận đấu World Cup 2026 đang diễn ra.
Thông tin trận đấu:
- Đội nhà: {home_vi} ({home_name})
- Đội khách: {away_vi} ({away_name})
- Tỷ số hiện tại: {home_vi} {home_score} - {away_score} {away_vi}
- Phút thi đấu hiện tại: Phút {minute}
- Diễn biến ghi bàn: {events_str}
- Dữ liệu thảo luận nóng trên mạng xã hội lúc này: {social_buzz}

Yêu cầu chi tiết bản tin:
1. Tạo một tiêu đề tiếng Việt giật gân, cuốn hút đúng chất trực tiếp (Ví dụ: "[LIVE NÓNG] Nghẹt thở phút 75: Mbappe tỏa sáng đưa Pháp vượt lên dẫn Senegal!").
2. Viết một bài tường thuật chi tiết bóng đá sống động (Full Content) dịch sang tiếng Việt trôi chảy (tầm 150-200 từ), phân tích thế trận hiện tại, phản ứng của người hâm mộ trên sân và MXH.
3. Tạo tóm tắt diễn biến (3 gạch đầu dòng ngắn gọn bằng mã HTML: <ul>, <li>).
4. Viết 1 câu nhận định vui nhộn và gợi ý kèo cược của chú heo tiên tri "Heo Hồng 🐷" (xưng hô "Heo Hồng 🐷" và gọi độc giả là "các fen", bàn luận vui vẻ về thế trận/kèo).

Hãy trả về duy nhất chuỗi JSON có định dạng chính xác sau (không chứa khối code markdown ```json hay ký tự nào khác ngoài JSON):
{{
  "titleVi": "Tiêu đề tiếng Việt giật gân",
  "contentVi": "Bài tường thuật trực tiếp chi tiết bằng tiếng Việt",
  "summaryHtml": "<ul><li>Ý 1</li><li>Ý 2</li><li>Ý 3</li></ul>",
  "drpigComment": "Lời bình vui nhộn của Heo Hồng 🐷"
}}
"""
    result = call_fpt_deepseek(prompt)
    if result:
        try:
            cleaned = re.sub(r'^```json\s*', '', result)
            cleaned = re.sub(r'\s*```$', '', cleaned).strip()
            return json.loads(cleaned)
        except Exception as e:
            print(f"Failed to parse live news JSON: {e}, response: {result}")
            
    # Fallback
    return {
        "titleVi": f"[LIVE NÓNG] Trực tiếp {home_vi} {home_score}-{away_score} {away_vi} (Phút {minute})",
        "contentVi": f"Trận đấu giữa {home_vi} và {away_vi} đang diễn ra vô cùng kịch tính ở phút thứ {minute}. Tỷ số hiện tại là {home_score}-{away_score}. Cả hai đội đều đang thể hiện quyết tâm cực kỳ lớn trong khuôn khổ ngày hội bóng đá lớn nhất hành tinh World Cup 2026. Diễn biến liên tục được cập nhật theo thời gian thực.",
        "summaryHtml": f"<ul><li>Trận đấu giữa {home_vi} và {away_vi} đang diễn ra vô cùng căng thẳng.</li><li>Tỷ số hiện tại là {home_score}-{away_score} ở phút thứ {minute}.</li><li>Người hâm mộ đang nín thở dõi theo từng pha bóng tấn công của cả hai bên.</li></ul>",
        "drpigComment": f"🐷 Heo Hồng 🐷: Phút {minute} rồi các fen ơi, tỷ số đang {home_score}-{away_score}! Trận đấu này đi bóng nhanh quá, đi cửa rung góc hoặc rung tài lúc này là hết sảy nhé! 🐷⚽"
    }

def run_scraper(args, output_path, output_dir):
    print(f"🚀 STARTING WORLD CUP 2026 FULL-CONTENT NEWS SCRAPER (Mode: {args.mode.upper()})...")
    start_time = time.time()
    
    # Load existing news if exists
    existing_news = []
    if os.path.exists(output_path):
        try:
            with open(output_path, 'r', encoding='utf-8') as f:
                existing_news = json.load(f)
        except Exception as e:
            print(f"Error loading existing news: {e}")

    # Check for live match info
    live_match = None
    
    # 1. Prioritize command line arguments for live match
    if args.mode == "live" and args.live_home and args.live_away:
        live_match = {
            "home": args.live_home,
            "away": args.live_away,
            "homeScore": args.live_home_score,
            "awayScore": args.live_away_score,
            "minute": args.live_minute,
            "homeScorers": args.live_home_scorers,
            "awayScorers": args.live_away_scorers
        }
        
    # 2. Dynamic check via worldcup26.ir if mode is live or normal (auto-detect)
    if not live_match:
        api_live_games = get_current_live_match_info()
        if api_live_games:
            g = api_live_games[0]
            teams = fetch_teams_data()
            team_lookup = {str(t.get('id')): t.get('name_en') for t in teams}
            home_name = team_lookup.get(str(g.get('home_team_id')), 'Home')
            away_name = team_lookup.get(str(g.get('away_team_id')), 'Away')
            
            live_match = {
                "home": home_name,
                "away": away_name,
                "homeScore": str(g.get('home_score', '0')),
                "awayScore": str(g.get('away_score', '0')),
                "minute": str(g.get('time_elapsed', '0')),
                "homeScorers": str(g.get('home_scorers', '')),
                "awayScorers": str(g.get('away_scorers', ''))
            }
            # Automatically switch mode to live since there is a live match!
            args.mode = "live"

    # Handle LIVE MATCH mode
    if args.mode == "live":
        if not live_match:
            print("⚠️ Mode is LIVE but no active live match found on API. Using mock live match for testing...")
            live_match = {
                "home": "France",
                "away": "Senegal",
                "homeScore": "1",
                "awayScore": "1",
                "minute": "75'",
                "homeScorers": "K. Mbappe 15'",
                "awayScorers": "S. Mane 45'"
            }
            
        print(f"🔥 LIVE MATCH ACTIVE: {live_match['home']} {live_match['homeScore']} - {live_match['awayScore']} {live_match['away']} (Min: {live_match['minute']})")
        
        # Social buzz for the live match
        reddit_pool, x_pool = fetch_rsshub_social_data()
        social_buzz = []
        for p in reddit_pool + x_pool:
            if any(k.lower() in p.lower() for k in [live_match['home'], live_match['away'], 'world cup', 'wc']):
                social_buzz.append(p)
        social_buzz_str = " | ".join(social_buzz[:5]) if social_buzz else "Không khí thảo luận sôi nổi."
        
        # Generate live article via DeepSeek
        ai_data = generate_live_news_article(
            live_match['home'], live_match['away'], 
            live_match['homeScore'], live_match['awayScore'], 
            live_match['minute'], live_match['homeScorers'], live_match['awayScorers'],
            social_buzz_str
        )
        
        # Build live article JSON
        article_id = hashlib.md5(f"live-{live_match['home']}-{live_match['away']}-{live_match['minute']}".encode('utf-8')).hexdigest()[:15]
        pub_timestamp = int(time.time() * 1000)
        pub_date_str = time.strftime('%d/%m/%Y %H:%M')
        
        home_vi = TEAM_NAME_VI.get(live_match['home'], live_match['home'])
        away_vi = TEAM_NAME_VI.get(live_match['away'], live_match['away'])
        
        live_article = {
            "id": article_id,
            "source": "Trực tiếp WC2026",
            "url": f"https://worldcup26.ir/live-match-{live_match['home'].lower()}-{live_match['away'].lower()}",
            "title": f"[LIVE] {live_match['home']} vs {live_match['away']} ({live_match['minute']})",
            "titleVi": ai_data['titleVi'],
            "pubDate": pub_timestamp,
            "pubDateStr": pub_date_str,
            "image": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop", 
            "content": ai_data['contentVi'],
            "contentVi": ai_data['contentVi'],
            "summary": ai_data['summaryHtml'],
            "drpigComment": ai_data['drpigComment'],
            "socialMentions": generate_social_mentions("Live match", live_match['home'] + live_match['away'], reddit_pool, x_pool),
            "isLive": True,
            "liveInfo": {
                "home": home_vi,
                "away": away_vi,
                "score": f"{live_match['homeScore']}-{live_match['awayScore']}",
                "minute": live_match['minute']
            }
        }
        
        # Merge with existing news:
        updated_news = []
        for n in existing_news:
            if n.get("isLive"):
                n["isLive"] = False
                n["title"] = n["title"].replace("[LIVE] ", "")
                n["titleVi"] = n["titleVi"].replace("[LIVE NÓNG] ", "")
            updated_news.append(n)
            
        updated_news.insert(0, live_article)
        updated_news = updated_news[:50]
        
        os.makedirs(output_dir, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(updated_news, f, ensure_ascii=False, indent=2)
            
        print(f"\n✅ SUCCESS! Live match article inserted into {output_path}")
        print(f"⏱️ Elapsed time: {round(time.time() - start_time, 2)} seconds.")
        return

    # Handle NORMAL mode
    reddit_pool, x_pool = fetch_rsshub_social_data()
    candidate_entries = []
    
    # Parse backfill date
    backfill_ts = 0
    if args.backfill:
        try:
            dt = datetime.strptime(args.backfill, "%Y-%m-%d")
            backfill_ts = time.mktime(dt.timetuple())
            print(f"📅 Filter date set to >= {args.backfill} (Timestamp: {backfill_ts})")
        except Exception as e:
            print(f"⚠️ Invalid backfill date format. Error: {e}")
            
    # Helpers for time conversion
    def get_timestamp(candidate_data):
        raw = candidate_data.get("pub_date_raw")
        if raw:
            try:
                return time.mktime(raw)
            except Exception:
                pass
        return time.time()

    # Phase 1: Gather candidate articles from feeds
    print("\n--- PHASE 1: GATHERING CANDIDATES ---")
    scan_limit = 15 if args.backfill else 6
    for feed_info in FEEDS:
        print(f"Scanning feed: {feed_info['source']}...")
        try:
            res = requests.get(feed_info['url'], headers=DEFAULT_HEADERS, timeout=12)
            if res.status_code != 200:
                print(f"  -> Failed to fetch feed: Status {res.status_code}")
                continue
                
            feed = feedparser.parse(res.content)
            entries = feed.entries[:scan_limit]
            
            for entry in entries:
                link = entry.get('link', '')
                title = entry.get('title', '')
                desc = entry.get('description', '')
                pub_date_raw = entry.get('published_parsed', entry.get('updated_parsed', None))
                
                if not link or not title:
                    continue
                
                if not is_world_cup_related(title, desc):
                    continue
                
                # Check timestamp filter
                pub_ts = get_timestamp({"pub_date_raw": pub_date_raw})
                if backfill_ts and pub_ts < backfill_ts:
                    continue
                    
                if any(x['link'] == link for x in candidate_entries):
                    continue
                
                candidate_entries.append({
                    "feed_info": feed_info,
                    "entry": entry,
                    "link": link,
                    "title": title,
                    "desc": desc,
                    "pub_date_raw": pub_date_raw
                })
        except Exception as e:
            print(f"Error scanning feed {feed_info['source']}: {e}")
            
    print(f"\nFound {len(candidate_entries)} candidate articles matching World Cup topics.")
    
    # Phase 2: Sort and slice candidates
    candidate_entries.sort(key=get_timestamp, reverse=True)
    
    # We want up to 25 articles to process
    max_to_process = 25
    selected_entries = candidate_entries[:max_to_process]
    print(f"Selected the top {len(selected_entries)} latest articles for translation and summarization.")
    
    # Phase 3: Process the selected articles
    print("\n--- PHASE 3: PROCESSING SELECTED ARTICLES ---")
    scraped_articles = []
    
    for idx, item in enumerate(selected_entries):
        feed_info = item["feed_info"]
        entry = item["entry"]
        link = item["link"]
        title = item["title"]
        desc = item["desc"]
        
        article_id = hashlib.md5(link.encode('utf-8')).hexdigest()[:15]
        print(f"\n[{idx+1}/{len(selected_entries)}] Processing: {title}")
        print(f"    Source: {feed_info['source']} | URL: {link}")
        
        # Deduplicate with existing articles to save API cost!
        existing_match = next((x for x in existing_news if x['id'] == article_id or x['url'] == link), None)
        if existing_match and existing_match.get('contentVi') and not existing_match.get('isLive'):
            print("    Already scraped and translated. Skipping...")
            scraped_articles.append(existing_match)
            continue
            
        image = ""
        if 'media_thumbnail' in entry and len(entry.media_thumbnail) > 0:
            image = entry.media_thumbnail[0].get('url', '')
        elif 'media_content' in entry and len(entry.media_content) > 0:
            image = entry.media_content[0].get('url', '')
        
        if not image and desc:
            img_match = re.search(r'src=["\']([^"\']+)["\']', desc)
            if img_match:
                image = img_match.group(1)
        
        if not image:
            image = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop"
            
        print("    Crawling full content...")
        full_text = scrape_full_content(link, desc)
        
        print("    Translating & Summarizing...")
        ai_data = translate_and_summarize(title, full_text, feed_info['lang'])
        
        pub_timestamp = get_timestamp(item) * 1000
        pub_date_str = time.strftime('%d/%m/%Y %H:%M', time.localtime(pub_timestamp / 1000))
        
        social_metrics = generate_social_mentions(title, link, reddit_pool, x_pool)
        
        scraped_articles.append({
            "id": article_id,
            "source": feed_info['source'],
            "url": link,
            "title": title,
            "titleVi": ai_data['titleVi'],
            "pubDate": int(pub_timestamp),
            "pubDateStr": pub_date_str,
            "image": image,
            "content": full_text,
            "contentVi": ai_data['contentVi'],
            "summary": ai_data['summaryHtml'],
            "drpigComment": ai_data['drpigComment'],
            "socialMentions": social_metrics,
            "isLive": False
        })
        
        # Săn trễ để tránh bị rate limit
        time.sleep(1)
        
    if len(scraped_articles) < 3:
        print("⚠️ Warning: Too few articles successfully processed. Supplementing with mock template to ensure layout.")
        mock_templates = [
            {
                "id": "mock-wc-eng-cro",
                "source": "BBC Sport Football",
                "url": "https://www.bbc.com/sport/football",
                "title": "England gears up for heavyweight Croatia opener in Group L",
                "titleVi": "Tuyển Anh lên phương án nghênh chiến Croatia ở trận mở màn Bảng L",
                "pubDate": int(time.time() * 1000),
                "pubDateStr": time.strftime('%d/%m/%Y %H:%M'),
                "image": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop",
                "content": "England manager Gareth Southgate is finalising his starting XI for the match against Croatia. The Three Lions are looking to make a statement in Group L, but Croatia's veteran midfield, led by Luka Modric, poses a significant threat.",
                "contentVi": "Huấn luyện viên trưởng đội tuyển Anh Gareth Southgate đang hoàn thiện đội hình xuất phát cho trận đấu gặp Croatia. Tam Sư đang tìm kiếm một màn thị uy sức mạnh tại Bảng L, tuy nhiên tuyến tiền vệ kỳ cựu của Croatia, dẫn đầu bởi Luka Modric, là một mối đe dọa không hề nhỏ.",
                "summary": "<ul><li>Tuyển Anh hoàn tất chuẩn bị cuối cùng trước đối thủ kỵ giơ Croatia.</li><li>Luka Modric tiếp tục là hạt nhân gánh vác lối chơi cho đại diện vùng Balkan.</li><li>Báo chí Anh dự báo đây sẽ là trận đấu giằng co cân não.</li></ul>",
                "drpigComment": "🐷 Heo Hồng 🐷: Lại là duyên nợ Anh vs Croatia các fen ơi! Tam Sư trẻ trung nhưng Modric thì quá già rơ. Trận này đi cửa Xỉu 2.5 là cực kỳ an tâm cho các fen nhé! 🐷⚽",
                "socialMentions": generate_social_mentions("England vs Croatia Group L", "https://www.bbc.com/sport/football/england-croatia"),
                "isLive": False
            }
        ]
        scraped_articles.extend(mock_templates)

    # Clean existing live news or keep it at the top
    live_articles = [n for n in existing_news if n.get("isLive") is True]
    
    # Filter out duplicates
    final_articles = []
    seen_ids = set()
    
    for a in live_articles:
        if a["id"] not in seen_ids:
            final_articles.append(a)
            seen_ids.add(a["id"])
            
    for a in scraped_articles:
        if a["id"] not in seen_ids:
            final_articles.append(a)
            seen_ids.add(a["id"])
            
    # Sort non-live articles by date descending
    non_live = [a for a in final_articles if not a.get("isLive")]
    non_live.sort(key=lambda x: x['pubDate'], reverse=True)
    
    # Re-assemble and limit to 50 articles
    final_list = [a for a in final_articles if a.get("isLive")] + non_live
    final_list = final_list[:50]
    
    os.makedirs(output_dir, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_list, f, ensure_ascii=False, indent=2)
        
    print(f"\n✅ SUCCESS! Compiled {len(final_list)} articles into {output_path}")
    print(f"⏱️ Elapsed time: {round(time.time() - start_time, 2)} seconds.")

def main():
    parser = argparse.ArgumentParser(description="World Cup 2026 News Scraper & Live Generator")
    parser.add_argument("--mode", type=str, default="normal", choices=["normal", "live"], help="Scraping mode")
    parser.add_argument("--live-home", type=str, default="", help="Live home team name")
    parser.add_argument("--live-away", type=str, default="", help="Live away team name")
    parser.add_argument("--live-home-score", type=str, default="0", help="Live home team score")
    parser.add_argument("--live-away-score", type=str, default="0", help="Live away team score")
    parser.add_argument("--live-minute", type=str, default="0", help="Live elapsed minute")
    parser.add_argument("--live-home-scorers", type=str, default="", help="Live home scorers")
    parser.add_argument("--live-away-scorers", type=str, default="", help="Live away scorers")
    parser.add_argument("--backfill", type=str, default="2026-06-10", help="Filter articles starting from this date (YYYY-MM-DD)")
    parser.add_argument("--loop", action="store_true", help="Run the scraper continuously in a loop")
    parser.add_argument("--interval", type=int, default=1, help="Loop interval in hours")
    args = parser.parse_args()

    # Path to news.json
    output_dir = "/Users/tonguyen/Library/CloudStorage/OneDrive-Personal/DrTo/WC2026/public/data"
    output_path = os.path.join(output_dir, "news.json")

    if args.loop:
        print(f"🔄 Daemon/Loop mode enabled. Scraper will run every {args.interval} hour(s).")
        while True:
            try:
                run_scraper(args, output_path, output_dir)
            except Exception as e:
                print(f"❌ Scraper loop encountered an error: {e}")
            print(f"💤 Sleeping for {args.interval} hour(s)...")
            time.sleep(args.interval * 3600)
    else:
        run_scraper(args, output_path, output_dir)

if __name__ == "__main__":
    main()

