// RSS Feed Aggregator for World Cup 2026
// Only shows World Cup & football-related news — NO fake placeholder videos

// Keywords to filter World Cup related news
const WC_KEYWORDS = [
  'world cup', 'wc 2026', 'fifa', 'world cup 2026',
  'bảng a', 'bảng b', 'bảng c', 'bảng d', 'bảng e', 'bảng f',
  'bảng g', 'bảng h', 'bảng i', 'bảng j', 'bảng k', 'bảng l',
  'group a', 'group b', 'group c', 'group d', 'group e', 'group f',
  'group g', 'group h', 'group i', 'group j', 'group k', 'group l',
  // Country & team names (Vietnamese + English)
  'mexico', 'nam phi', 'hàn quốc', 'south korea', 'séc', 'czechia',
  'canada', 'bosnia', 'qatar', 'thụy sĩ', 'switzerland',
  'brazil', 'morocco', 'scotland', 'haiti',
  'mỹ', 'usa', 'paraguay', 'úc', 'australia', 'thổ nhĩ kỳ', 'turkey', 'türkiye',
  'đức', 'germany', 'curaçao', 'bờ biển ngà', 'ivory coast', 'ecuador',
  'hà lan', 'netherlands', 'nhật bản', 'japan', 'thụy điển', 'sweden', 'tunisia',
  'bỉ', 'belgium', 'ai cập', 'egypt',
  'tây ban nha', 'spain', 'cape verde', 'ả rập saudi', 'saudi', 'uruguay',
  'pháp', 'france', 'senegal', 'iraq', 'na uy', 'norway',
  'argentina', 'algeria', 'áo', 'austria', 'jordan',
  'bồ đào nha', 'portugal', 'congo', 'anh', 'england', 'croatia',
  'ghana', 'panama', 'uzbekistan', 'colombia',
  // Star players
  'messi', 'mbappé', 'mbappe', 'ronaldo', 'neymar', 'vinícius', 'vinicius',
  'son heung', 'pulisic', 'bellingham', 'haaland', 'musiala',
  'pedri', 'yamal', 'griezmann', 'modric', 'kane',
  // Vietnamese football terms
  'vòng bảng', 'vòng chung kết', 'tuyển', 'đội tuyển', 'khai mạc',
  'bóng đá', 'world cup', 'giải vô địch', 'cúp thế giới',
  'kết quả', 'tỷ số', 'bàn thắng', 'penalty', 'var'
];

function isWorldCupRelated(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  return WC_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
}

export async function fetchRssFeeds() {
  const feeds = [
    { name: 'VnExpress Thể Thao', url: 'https://vnexpress.net/rss/the-thao.rss', lang: 'vi' },
    { name: 'Bongdaplus', url: 'https://bongdaplus.vn/rss/bong-da-quoc-te-7.rss', lang: 'vi' },
    { name: 'ESPN Soccer', url: 'https://www.espn.com/espn/rss/soccer/news', lang: 'en' }
  ];

  const allItems = [];

  for (const feed of feeds) {
    try {
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          data.items.forEach((item) => {
            // Extract image from description if it contains an <img> tag and thumbnail is missing
            let image = item.thumbnail || item.enclosure?.link || '';
            if (!image && item.description && item.description.includes('<img')) {
              const match = item.description.match(/src="([^"]+)"/);
              if (match && match[1]) {
                image = match[1];
              }
            }

            if (image) {
              image = image.replace(/&amp;/g, '&');
            }

            // Fallback default soccer image if still empty
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
              videoUrl: videoUrl // Only real videos from RSS, NO fake placeholders
            });
          });
        }
      }
    } catch (e) {
      console.warn(`Không thể tải tin tức từ nguồn ${feed.name}:`, e);
    }
  }

  // Filter: only keep World Cup related articles from the last 7 days (1 week)
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const wcItems = allItems.filter(item => 
    isWorldCupRelated(item.title, item.description) && 
    item.pubDate >= oneWeekAgo
  );

  // If filter returns too few results (< 3), fallback to all items from the last 7 days
  const recentAllItems = allItems.filter(item => item.pubDate >= oneWeekAgo);
  const finalItems = wcItems.length >= 3 ? wcItems : (recentAllItems.length >= 3 ? recentAllItems : allItems);

  // Sort by publication date descending
  return finalItems.sort((a, b) => b.pubDate - a.pubDate);
}
