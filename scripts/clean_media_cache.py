import os
import sys
import json
import glob

# Add scripts directory to path to import scrape_news functions
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(SCRIPT_DIR)

from scrape_news import check_article_relevance

def clean_all_media():
    data_dir = os.path.join(os.path.dirname(SCRIPT_DIR), "public", "data")
    matches_list_path = os.path.join(data_dir, "matches_list.json")
    match_media_dir = os.path.join(data_dir, "match_media")
    
    if not os.path.exists(matches_list_path):
        print(f"❌ Error: matches_list.json not found at {matches_list_path}")
        return
        
    # 1. Load matches mapping
    print("Loading matches list...")
    with open(matches_list_path, 'r', encoding='utf-8') as f:
        matches = json.load(f)
        
    matches_map = {}
    for m in matches:
        m_id = m.get("id")
        home = m.get("home", {}).get("nameEn") or m.get("home", {}).get("name")
        away = m.get("away", {}).get("nameEn") or m.get("away", {}).get("name")
        if m_id and home and away:
            matches_map[m_id] = (home, away)
            
    print(f"Loaded {len(matches_map)} match mappings.")
    
    # 2. Iterate through media cache files
    media_files = glob.glob(os.path.join(match_media_dir, "media_*.json"))
    print(f"Found {len(media_files)} cached match media files to scan.")
    
    total_cleaned = 0
    total_files_updated = 0
    
    for file_path in media_files:
        filename = os.path.basename(file_path)
        match_id = filename.replace("media_", "").replace(".json", "")
        
        if match_id not in matches_map:
            print(f"⚠️ Warning: Match ID {match_id} not found in matches list. Skipping {filename}...")
            continue
            
        home, away = matches_map[match_id]
        
        # Load match media
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"❌ Error reading {filename}: {e}")
            continue
            
        orig_news_count = len(data.get("news", []))
        orig_clips_count = len(data.get("clips", []))
        
        # Filter news
        cleaned_news = []
        for n in data.get("news", []):
            if check_article_relevance(n, home, away):
                cleaned_news.append(n)
                
        # Filter clips
        home_lower = home.lower()
        away_lower = away.lower()
        short_home = home[:3].lower()
        short_away = away[:3].lower()
        
        cleaned_clips = []
        for c in data.get("clips", []):
            title = c.get("title", "").lower()
            summary = c.get("summary", "").lower()
            # Require clip to refer to playing teams
            if (home_lower in title or away_lower in title or
                short_home in title or short_away in title or
                home_lower in summary or away_lower in summary):
                cleaned_clips.append(c)
                
        news_removed = orig_news_count - len(cleaned_news)
        clips_removed = orig_clips_count - len(cleaned_clips)
        
        if news_removed > 0 or clips_removed > 0:
            print(f"🧹 Cleansed {filename} ({home} vs {away}):")
            if news_removed > 0:
                print(f"   - Removed {news_removed} unrelated news articles (was {orig_news_count}, now {len(cleaned_news)})")
            if clips_removed > 0:
                print(f"   - Removed {clips_removed} unrelated clips (was {orig_clips_count}, now {len(cleaned_clips)})")
                
            data["news"] = cleaned_news
            data["clips"] = cleaned_clips
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
            total_cleaned += (news_removed + clips_removed)
            total_files_updated += 1
            
    print(f"\n✅ Clean-up complete! Updated {total_files_updated} files, removing {total_cleaned} unrelated items.")

if __name__ == "__main__":
    clean_all_media()
