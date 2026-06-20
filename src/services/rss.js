// RSS Feed Aggregator for World Cup 2026
// Strict WC2026 filtering + og:image extraction via CORS proxy

// Keywords to filter World Cup related news (STRICT)
const WC_KEYWORDS_STRONG = [
  'world cup', 'wc 2026', 'wc2026', 'fifa', 'world cup 2026', 'cúp thế giới',
  'vòng bảng', 'vòng chung kết', 'khai mạc', 'bảng xếp hạng'
];

const WC_KEYWORDS_MEDIUM = [
  'bảng a', 'bảng b', 'bảng c', 'bảng d', 'bảng e', 'bảng f',
  'bảng g', 'bảng h', 'bảng i', 'bảng j', 'bảng k', 'bảng l',
  'group a', 'group b', 'group c', 'group d', 'group e', 'group f',
  'group g', 'group h', 'group i', 'group j', 'group k', 'group l',
  'mexico', 'nam phi', 'hàn quốc', 'south korea', 'séc', 'czechia',
  'canada', 'bosnia', 'qatar', 'thụy sĩ', 'switzerland',
  'brazil', 'morocco', 'scotland', 'haiti',
  'mỹ', 'usa', 'paraguay', 'úc', 'australia', 'thổ nhĩ kỳ', 'turkey',
  'đức', 'germany', 'curaçao', 'bờ biển ngà', 'ivory coast', 'ecuador',
  'hà lan', 'netherlands', 'nhật bản', 'japan', 'thụy điển', 'sweden', 'tunisia',
  'bỉ', 'belgium', 'ai cập', 'egypt',
  'tây ban nha', 'spain', 'cape verde', 'ả rập saudi', 'saudi', 'uruguay',
  'pháp', 'france', 'senegal', 'iraq', 'na uy', 'norway',
  'argentina', 'algeria', 'áo', 'austria', 'jordan',
  'bồ đào nha', 'portugal', 'congo', 'anh', 'england', 'croatia',
  'ghana', 'panama', 'uzbekistan', 'colombia',
  'messi', 'mbappé', 'mbappe', 'ronaldo', 'neymar', 'vinícius', 'vinicius',
  'son heung', 'pulisic', 'bellingham', 'haaland', 'musiala', 'yamal',
  'đội tuyển', 'national team', 'tuyển quốc gia'
];

const NEGATIVE_KEYWORDS = [
  'tennis', 'quần vợt', 'bơi lội', 'chạy bộ', 'marathon', 'giải chạy',
  'bóng rổ', 'basketball', 'nba', 'bóng chuyền', 'volleyball', 'cầu lông',
  'badminton', 'boxing', 'mma', 'ufc', 'golf', 'f1', 'formula',
  'học đường', 'thể thao học sinh', 's-race', 'olympic paris',
  'premier league', 'la liga', 'serie a', 'bundesliga', 'ligue 1',
  'champions league', 'europa league', 'conference league'
];

function isWorldCupRelated(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  // Reject negative keywords
  if (NEGATIVE_KEYWORDS.some(neg => text.includes(neg))) return false;
  // Accept strong keywords
  if (WC_KEYWORDS_STRONG.some(k => text.includes(k))) return true;
  // Accept if at least 1 medium keyword matches
  const mediumHits = WC_KEYWORDS_MEDIUM.filter(k => text.includes(k)).length;
  return mediumHits >= 1;
}

export async function fetchRssFeeds() {
  const feeds = [
    { name: 'VnExpress Thể Thao', url: 'https://vnexpress.net/rss/the-thao.rss', lang: 'vi' },
    { name: 'Tuổi Trẻ Thể Thao', url: 'https://tuoitre.vn/rss/the-thao.rss', lang: 'vi' },
    { name: 'Thanh Niên Thể Thao', url: 'https://thanhnien.vn/rss/the-thao.rss', lang: 'vi' },
    { name: 'Bongdaplus', url: 'https://bongdaplus.vn/rss/bong-da-quoc-te-7.rss', lang: 'vi' },
    { name: 'ESPN Soccer', url: 'https://www.espn.com/espn/rss/soccer/news', lang: 'en' },
    { name: 'BBC Sport Football', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', lang: 'en' }
  ];

  const allItems = [];

  for (const feed of feeds) {
    try {
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          data.items.forEach((item) => {
            // Extract image: prioritize thumbnail, then enclosure, then embedded <img>
            let image = item.thumbnail || item.enclosure?.link || '';
            if (!image && item.description && item.description.includes('<img')) {
              const match = item.description.match(/src="([^"]+)"/);
              if (match && match[1]) {
                image = match[1];
              }
            }

            if (image) {
              image = image.replace(/&amp;/g, '&');
              // Fix protocol-relative URLs
              if (image.startsWith('//')) image = 'https:' + image;
            }

            // Fallback: only if still no image
            if (!image) {
              image = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop';
            }

            // Strip HTML tags from description
            const cleanDesc = item.description?.replace(/<[^>]*>/g, '').trim() || '';

            // Check for real video in enclosure
            let videoUrl = null;
            if (item.enclosure?.type?.startsWith('video/')) {
              videoUrl = item.enclosure.link;
            }

            allItems.push({
              source: feed.name,
              lang: feed.lang,
              title: item.title,
              pubDate: new Date(item.pubDate).getTime(),
              pubDateStr: new Date(item.pubDate).toLocaleDateString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
              }),
              link: item.link,
              description: cleanDesc,
              image: image,
              videoUrl: videoUrl
            });
          });
        }
      }
    } catch (e) {
      console.warn(`Không thể tải tin tức từ nguồn ${feed.name}:`, e);
    }
  }

  // Filter: only keep World Cup related articles from the last 10 days
  const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
  const wcItems = allItems.filter(item => 
    isWorldCupRelated(item.title, item.description) && 
    item.pubDate >= tenDaysAgo
  );

  // Sort by publication date descending
  return wcItems.sort((a, b) => b.pubDate - a.pubDate);
}
