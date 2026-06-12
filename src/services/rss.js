// RSS Feed Aggregator for World Cup 2026

export async function fetchRssFeeds() {
  const feeds = [
    { name: 'VnExpress Thể Thao', url: 'https://vnexpress.net/rss/the-thao.rss', lang: 'vi' },
    { name: 'Bongdaplus', url: 'https://bongdaplus.vn/rss/bong-da-quoc-te-7.rss', lang: 'vi' },
    { name: 'ESPN Soccer', url: 'https://www.espn.com/espn/rss/soccer/news', lang: 'en' }
  ];

  const allItems = [];

  for (const feed of feeds) {
    try {
      // Fetch feeds via rss2json API (free & no CORS issues)
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
              image: image
            });
          });
        }
      }
    } catch (e) {
      console.warn(`Không thể tải tin tức từ nguồn ${feed.name}:`, e);
    }
  }

  // Sort by publication date descending
  const sortedItems = allItems.sort((a, b) => b.pubDate - a.pubDate);

  // Add soccer video clips to some articles to make them interactive
  const SOCCER_CLIPS = [
    '/videos/clip_1.mp4',
    '/videos/clip_2.mp4',
    '/videos/clip_3.mp4',
    '/videos/clip_4.mp4'
  ];

  sortedItems.forEach((item, index) => {
    if (index % 3 === 0) {
      item.videoUrl = SOCCER_CLIPS[index % SOCCER_CLIPS.length];
    }
  });

  return sortedItems;
}
