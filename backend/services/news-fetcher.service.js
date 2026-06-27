/**
 * News Fetcher Service (v2)
 * Cào trực tiếp RSS + scrape full nội dung từ các báo VN.
 * KHÔNG dùng AI — lưu nội dung gốc tiếng Việt.
 * Mỗi trang có scraper riêng, đọc đúng cấu trúc HTML.
 */
const RssParser = require('rss-parser');
const cheerio = require('cheerio');
const crypto = require('crypto');
const News = require('../models/News');
const imageDownloader = require('./image-downloader.service');

const rssParser = new RssParser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
    ],
  },
});

// ─── RSS Feed Sources (chỉ VN) ──────────────────────────────────────────────

const VN_FEEDS = [
  {
    name: 'VnExpress',
    url: 'https://vnexpress.net/rss/the-thao.rss',
    scraper: 'vnexpress',
  },
  {
    name: 'Tuổi Trẻ',
    url: 'https://tuoitre.vn/rss/the-thao.rss',
    scraper: 'tuoitre',
  },
  {
    name: 'Thanh Niên',
    url: 'https://thanhnien.vn/rss/the-thao.rss',
    scraper: 'thanhnien',
  },
];

// BongDaPlus: RSS bị block → scrape trực tiếp HTML page
const BONGDAPLUS_PAGES = [
  {
    name: 'BongDaPlus',
    url: 'https://bongdaplus.vn/world-cup',
    scraper: 'bongdaplus',
  },
  {
    name: 'BongDaPlus',
    url: 'https://bongdaplus.vn/bong-da-quoc-te',
    scraper: 'bongdaplus',
  },
];

// ─── Football / WC2026 Keyword Filters ───────────────────────────────────────

const WC_KEYWORDS_STRONG = [
  'world cup', 'wc 2026', 'wc2026', 'fifa', 'world cup 2026',
  'cúp thế giới', 'vòng chung kết thế giới',
];

const WC_KEYWORDS_MEDIUM = [
  'vòng bảng', 'vòng chung kết', 'bảng xếp hạng',
  'bóng đá quốc tế', 'bóng đá thế giới', 'bóng đá',
  'đội tuyển quốc gia', 'tuyển quốc gia', 'đội tuyển',
  'messi', 'ronaldo', 'mbappé', 'mbappe', 'haaland',
  'vinicius', 'vinícius', 'bellingham', 'yamal', 'musiala',
  'son heung', 'pulisic', 'neymar', 'salah', 'de bruyne',
  'argentina', 'brazil', 'france', 'germany', 'england',
  'spain', 'portugal', 'netherlands', 'belgium', 'croatia',
  'pháp', 'đức', 'tây ban nha', 'bồ đào nha',
  'hà lan', 'bỉ', 'nhật bản', 'hàn quốc', 'úc', 'australia',
  'uruguay', 'colombia', 'mexico', 'usa', 'canada',
  'morocco', 'senegal', 'ghana', 'nigeria', 'cameroon',
  'group a', 'group b', 'group c', 'group d', 'group e', 'group f',
  'bảng a', 'bảng b', 'bảng c', 'bảng d', 'bảng e', 'bảng f',
  'bảng g', 'bảng h', 'bảng i', 'bảng j', 'bảng k', 'bảng l',
  'penalty', 'thẻ đỏ', 'thẻ vàng', 'hat-trick',
  'champions league', 'europa league', 'premier league',
  'la liga', 'serie a', 'bundesliga', 'ligue 1',
  'chuyển nhượng', 'transfer',
  'tỷ số', 'soi kèo', 'nhận định', 'dự đoán',
  'huấn luyện viên', 'đội hình', 'chiến thuật',
  'trọng tài', 'var', 'offside', 'bàn thắng',
  'cúp', 'giải đấu', 'vô địch',
  'thủ môn', 'tiền đạo', 'hậu vệ', 'tiền vệ',
  'đá bóng', 'sân cỏ', 'sân vận động', 'khung thành',
  'ghi bàn', 'lập công', 'kiến tạo', 'phản lưới',
  'hiệp 1', 'hiệp 2', 'bù giờ', 'loạt luân lưu',
  'vòng 16', 'tứ kết', 'bán kết', 'chung kết',
  'ngoại hạng anh', 'v-league', 'v.league',
  'manchester', 'liverpool', 'chelsea', 'arsenal',
  'real madrid', 'barcelona', 'bayern', 'psg', 'juventus',
  'inter milan', 'ac milan', 'napoli', 'dortmund',
  'man city', 'man utd', 'tottenham',
  'cầu thủ', 'đội bóng', 'câu lạc bộ', 'clb',
  'vòng loại', 'play-off', 'playoff',
  'football', 'soccer', 'trận đấu',
  'aff cup', 'đội tuyển việt nam',
];

const BLACKLIST = [
  'esport', 'e-sport', 'pickleball', 'tennis', 'quần vợt',
  'boxing', 'quyền anh', 'golf', 'nba', 'basketball', 'bóng rổ',
  'formula 1', 'f1', 'đua xe', 'mma', 'ufc', 'muay',
  'marathon', 'chạy bộ', 'giải chạy', 'bơi lội', 'bơi',
  'cầu lông', 'badminton', 'bóng chuyền', 'volleyball',
  'bóng bàn', 'điền kinh', 'cử tạ', 'xe đạp', 'đua thuyền',
  'võ cổ truyền', 'taekwondo', 'judo', 'karate', 'wushu',
  'cờ vua', 'chess', 'cờ tướng', 'billiards', 'bida',
  'đấu kiếm', 'bắn súng', 'bắn cung', 'trượt tuyết',
  'cricket', 'rugby', 'baseball', 'hockey',
  'thể thao học sinh', 'thể thao học đường', 'học sinh phổ thông',
  'hội khỏe phù đổng', 'đại hội thể thao',
  'giải chạy', 'run', 's-race',
  'olympic paris', 'olympic 2028',
  'ẩm thực', 'du lịch', 'giải trí', 'âm nhạc', 'phim',
  'bất động sản', 'chứng khoán', 'crypto',
  'nestlé', 'milo', 'quảng cáo', 'tài trợ',
];

function isFootballRelated(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  if (BLACKLIST.some(kw => text.includes(kw))) return false;
  if (WC_KEYWORDS_STRONG.some(kw => text.includes(kw))) return true;
  const mediumHits = WC_KEYWORDS_MEDIUM.filter(kw => text.includes(kw)).length;
  return mediumHits >= 1;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSourceHash(url) {
  return crypto.createHash('md5').update(url || '').digest('hex');
}

function makeSlug(text, hash) {
  if (!text) return hash;
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
    + '-' + hash.slice(0, 8);
}

function formatPubDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit',
  });
}

/**
 * Decode HTML entities (fix &agrave; &ocirc; &eacute; etc.)
 */
function decodeHtmlEntities(text) {
  if (!text) return '';
  const $ = cheerio.load(`<div>${text}</div>`, { decodeEntities: true });
  return $('div').text().trim();
}

/**
 * Fetch HTML page with timeout + user-agent
 */
async function fetchHtml(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    clearTimeout(timeout);
    return null;
  }
}

/**
 * Clean HTML content: giữ lại formatting, hình ảnh VÀ video, xóa junk.
 * Trả về HTML sạch với <p>, <img>, <video>, <iframe>, <figure>, <figcaption>, <h2>, <h3>, <blockquote>.
 */
function cleanHtml($, contentEl) {
  // Trusted video domains — giữ iframe từ các nguồn này
  const TRUSTED_VIDEO_DOMAINS = [
    'youtube.com', 'youtube-nocookie.com', 'youtu.be',
    'facebook.com', 'fb.com', 'fb.watch',
    'dailymotion.com', 'dai.ly',
    'vimeo.com', 'player.vimeo.com',
    'tiktok.com',
    'twitter.com', 'x.com',
    'vnexpress.net', 'vne.vn',
    'tuoitre.vn', 'cdn.tuoitre.vn',
    'thanhnien.vn', 'cdn.thanhnien.vn',
    'bongdaplus.vn', 'bongda.com.vn',
    'sporttv.vn', 'cdn.iframe.ly',
    'embed.dugout.com', 'playwire.com',
    'jwplatform.com', 'jwplayer.com',
    'streamable.com', 'gfycat.com',
  ];

  const isTrustedVideo = (src) => {
    if (!src) return false;
    try {
      const url = new URL(src.startsWith('//') ? 'https:' + src : src);
      return TRUSTED_VIDEO_DOMAINS.some(d => url.hostname.includes(d));
    } catch {
      return false;
    }
  };

  // Xóa junk nhưng GIỮ LẠI iframe video & video tags
  contentEl.find('script, style, noscript, form, input, button, textarea').remove();
  contentEl.find('[class*="ads"], [class*="banner"]').remove();
  contentEl.find('[class*="share"], [class*="comment"], [class*="related"]').remove();
  contentEl.find('[class*="relate"], [class*="widget"], [class*="popup"]').remove();
  contentEl.find('.box-tinlienquan, .banner-in-content').remove();
  contentEl.find('.VCSortableIn498497, .VCObjectBoxRelatedNewsContentWrapper').remove();
  contentEl.find('div[type="RelatedOneNews"], div[type="RelatedNews"]').remove();
  contentEl.find('.zone--timeline, .detail__tag, .detail__author').remove();

  // Xử lý iframe: chỉ xóa non-video iframes
  contentEl.find('iframe').each((_, iframe) => {
    const $iframe = $(iframe);
    const src = $iframe.attr('src') || $iframe.attr('data-src') || '';
    if (!isTrustedVideo(src)) {
      $iframe.remove();
    } else {
      // Fix src
      if (!$iframe.attr('src') && $iframe.attr('data-src')) {
        $iframe.attr('src', $iframe.attr('data-src'));
      }
      let iframeSrc = $iframe.attr('src') || '';
      if (iframeSrc.startsWith('//')) $iframe.attr('src', 'https:' + iframeSrc);
      // Responsive style
      $iframe.attr('style', 'width:100%;aspect-ratio:16/9;border:none;border-radius:8px;');
      $iframe.removeAttr('width');
      $iframe.removeAttr('height');
      $iframe.removeAttr('class');
      $iframe.attr('allowfullscreen', '');
    }
  });

  // Xử lý <video> tags — bỏ fake video (IE9 picture polyfill)
  contentEl.find('video').each((_, video) => {
    const $video = $(video);
    // Skip IE9 picture polyfill: <video style="display: none;"> inside <picture>
    const parentTag = $video.parent()[0]?.tagName?.toLowerCase();
    const style = $video.attr('style') || '';
    if (style.includes('display: none') || style.includes('display:none') || parentTag === 'picture') {
      $video.remove();
      return;
    }
    // Fix data-src
    const dataSrc = $video.attr('data-src') || '';
    if (dataSrc && !$video.attr('src')) $video.attr('src', dataSrc);
    // Source children
    $video.find('source').each((_, source) => {
      const $source = $(source);
      const srcData = $source.attr('data-src') || '';
      if (srcData && !$source.attr('src')) $source.attr('src', srcData);
      let sSrc = $source.attr('src') || '';
      if (sSrc.startsWith('//')) $source.attr('src', 'https:' + sSrc);
    });
    // Chỉ giữ video có src thật (mp4, webm, etc.)
    const vSrc = $video.attr('src') || '';
    const hasSources = $video.find('source[src]').length > 0;
    if (!vSrc && !hasSources) {
      $video.remove();
      return;
    }
    if (vSrc.startsWith('//')) $video.attr('src', 'https:' + vSrc);
    $video.attr('controls', '');
    $video.attr('preload', 'metadata');
    $video.attr('style', 'width:100%;max-width:100%;border-radius:8px;margin:12px 0;');
    $video.removeAttr('class');
    $video.removeAttr('autoplay');
    $video.removeAttr('muted');
  });

  // Fix lazy-loaded images: data-src → src
  contentEl.find('img').each((_, img) => {
    const $img = $(img);
    const dataSrc = $img.attr('data-src') || $img.attr('data-original') || $img.attr('data-lazy-src');
    if (dataSrc && !$img.attr('src')) {
      $img.attr('src', dataSrc);
    }
    const src = $img.attr('src') || '';
    if (src.startsWith('//')) $img.attr('src', 'https:' + src);
    $img.removeAttr('srcset');
    $img.removeAttr('data-src');
    $img.removeAttr('data-original');
    $img.removeAttr('data-lazy-src');
    $img.attr('style', 'max-width:100%;height:auto;border-radius:8px;margin:12px 0;');
    $img.removeAttr('class');
    $img.removeAttr('width');
    $img.removeAttr('height');
  });

  // Hàm wrap video trong responsive container
  const wrapVideo = (html) => `<div class="video-container">${html}</div>`;

  // Hàm check nếu element chứa video/iframe
  const hasMedia = ($el) => $el.find('img, video, iframe').length > 0;

  // Build clean HTML from content
  const parts = [];

  contentEl.children().each((_, child) => {
    const $child = $(child);
    const tagName = child.tagName?.toLowerCase();

    if (tagName === 'p' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'blockquote') {
      const innerHtml = $child.html()?.trim();
      const text = $child.text()?.trim();
      if (text && text.length > 5 && !text.includes('window.') && !text.includes('function(') && !text.includes('var ') && !text.includes('document.')) {
        parts.push(`<${tagName}>${innerHtml}</${tagName}>`);
      } else if (hasMedia($child)) {
        parts.push(`<${tagName}>${innerHtml}</${tagName}>`);
      }
    } else if (tagName === 'figure') {
      // Figure có thể chứa video hoặc ảnh
      const figHtml = $.html($child);
      if ($child.find('iframe, video').length > 0) {
        parts.push(wrapVideo(figHtml));
      } else {
        parts.push(figHtml);
      }
    } else if (tagName === 'img') {
      const src = $child.attr('src');
      if (src) parts.push($.html($child));
    } else if (tagName === 'video') {
      parts.push(wrapVideo($.html($child)));
    } else if (tagName === 'iframe') {
      const src = $child.attr('src') || '';
      if (isTrustedVideo(src)) {
        parts.push(wrapVideo($.html($child)));
      }
    } else if (tagName === 'div' || tagName === 'section' || tagName === 'article' || tagName === 'span') {
      // Đệ quy vào div/section để tìm p, img, video, iframe
      // Nếu div chứa video/iframe trực tiếp → lấy luôn
      const directVideos = $child.find('> iframe, > video');
      directVideos.each((_, v) => {
        const $v = $(v);
        const vTag = v.tagName?.toLowerCase();
        if (vTag === 'iframe' && isTrustedVideo($v.attr('src') || '')) {
          parts.push(wrapVideo($.html($v)));
        } else if (vTag === 'video') {
          parts.push(wrapVideo($.html($v)));
        }
      });

      $child.find('p, h2, h3, figure, img').each((_, inner) => {
        const $inner = $(inner);
        const innerTag = inner.tagName?.toLowerCase();
        if (innerTag === 'img') {
          const src = $inner.attr('src');
          if (src) parts.push($.html($inner));
        } else if (innerTag === 'figure') {
          if ($inner.find('iframe, video').length > 0) {
            parts.push(wrapVideo($.html($inner)));
          } else {
            parts.push($.html($inner));
          }
        } else {
          const text = $inner.text()?.trim();
          const html = $inner.html()?.trim();
          if (text && text.length > 5 && !text.includes('window.') && !text.includes('function(')) {
            parts.push(`<${innerTag}>${html}</${innerTag}>`);
          } else if (hasMedia($inner)) {
            parts.push(`<${innerTag}>${html}</${innerTag}>`);
          }
        }
      });

      // Tìm iframe/video sâu hơn trong nested divs (nếu chưa lấy)
      $child.find('iframe').each((_, iframe) => {
        const $iframe = $(iframe);
        const src = $iframe.attr('src') || '';
        // Chỉ lấy nếu parent không phải figure (đã lấy ở trên)
        const parentTag = $iframe.parent()[0]?.tagName?.toLowerCase();
        if (isTrustedVideo(src) && parentTag !== 'figure') {
          const alreadyAdded = parts.some(p => p.includes(src));
          if (!alreadyAdded) {
            parts.push(wrapVideo($.html($iframe)));
          }
        }
      });

      $child.find('video').each((_, video) => {
        const $video = $(video);
        const parentTag = $video.parent()[0]?.tagName?.toLowerCase();
        if (parentTag !== 'figure') {
          const videoHtml = $.html($video);
          const alreadyAdded = parts.some(p => p.includes(videoHtml));
          if (!alreadyAdded) {
            parts.push(wrapVideo(videoHtml));
          }
        }
      });
    }
  });

  return parts.join('\n');
}

// ─── Per-Site Scrapers ───────────────────────────────────────────────────────
// Mỗi trang có cấu trúc HTML riêng → scraper riêng để lấy đúng & đầy đủ

const SCRAPERS = {

  /**
   * VnExpress: Content nằm trong article .fck_detail
   * Description/sapo: p.description
   * Images: enclosure trong RSS hoặc og:image
   */
  vnexpress: {
    scrapeArticle: async (url) => {
      const html = await fetchHtml(url);
      if (!html) return { content: '', image: '', summary: '' };

      const $ = cheerio.load(html, { decodeEntities: true });

      // Image: og:image (chất lượng cao nhất)
      const image = $('meta[property="og:image"]').attr('content') || '';

      // Summary/sapo
      const summary = $('p.description').first().text().trim()
        || $('meta[property="og:description"]').attr('content') || '';

      // Content: VnExpress dùng article.fck_detail (cùng 1 element)
      let contentEl = $('article.fck_detail');
      if (!contentEl.length) contentEl = $('.fck_detail');
      if (!contentEl.length) {
        return { content: summary, image, summary };
      }

      // Lấy HTML sạch (giữ formatting + hình ảnh)
      const content = cleanHtml($, contentEl);

      return { content: content || summary, image, summary };
    },
  },

  /**
   * Tuổi Trẻ: Content nằm trong .detail-cmain hoặc .detail-content
   * Sapo: .detail-sapo
   * Images: enclosure trong RSS
   */
  tuoitre: {
    scrapeArticle: async (url) => {
      const html = await fetchHtml(url);
      if (!html) return { content: '', image: '', summary: '' };

      const $ = cheerio.load(html, { decodeEntities: true });

      const image = $('meta[property="og:image"]').attr('content') || '';

      // Summary/sapo
      const summary = $('div.detail-sapo, h2.detail-sapo').first().text().trim()
        || $('meta[property="og:description"]').attr('content') || '';

      // Content: .detail-cmain hoặc .detail-content .detail-cmain
      let contentEl = $('.detail-cmain');
      if (!contentEl.length) contentEl = $('.detail-content');
      if (!contentEl.length) contentEl = $('article .content');

      if (!contentEl.length) {
        return { content: summary, image, summary };
      }

      // Lấy HTML sạch (giữ formatting + hình ảnh)
      const content = cleanHtml($, contentEl);

      return { content: content || summary, image, summary };
    },
  },

  /**
   * Thanh Niên: Content nằm trong .detail__content hoặc .detail-content
   * Title trong RSS chứa nhiều HTML entities → cần decode
   * Images: parse từ description HTML trong RSS
   */
  thanhnien: {
    scrapeArticle: async (url) => {
      const html = await fetchHtml(url);
      if (!html) return { content: '', image: '', summary: '' };

      const $ = cheerio.load(html, { decodeEntities: true });

      const image = $('meta[property="og:image"]').attr('content') || '';

      const summary = $('div.detail-sapo, h2.sapo, .detail__sapo').first().text().trim()
        || $('meta[property="og:description"]').attr('content') || '';

      // Content: .detail__content hoặc .detail-content
      let contentEl = $('.detail__content');
      if (!contentEl.length) contentEl = $('.detail-content');
      if (!contentEl.length) contentEl = $('article .content');

      if (!contentEl.length) {
        return { content: summary, image, summary };
      }

      // Lấy HTML sạch (giữ formatting + hình ảnh)
      const content = cleanHtml($, contentEl);

      return { content: content || summary, image, summary };
    },
  },

  /**
   * BongDaPlus: RSS bị block → scrape danh sách bài từ trang category
   * Mỗi bài viết có cấu trúc .news-item hoặc tương tự
   */
  bongdaplus: {
    scrapeArticle: async (url) => {
      const html = await fetchHtml(url);
      if (!html) return { content: '', image: '', summary: '' };

      const $ = cheerio.load(html, { decodeEntities: true });

      const image = $('meta[property="og:image"]').attr('content') || '';

      const summary = $('meta[property="og:description"]').attr('content')
        || $('h2.sapo, .sapo, .detail-sapo').first().text().trim() || '';

      // Content: BongDaPlus dùng #postContent / div.content / section.details
      let contentEl = $('#postContent');
      if (!contentEl.length) contentEl = $('div.content');
      if (!contentEl.length) contentEl = $('div.cont-view');
      if (!contentEl.length) contentEl = $('section.details');
      if (!contentEl.length) contentEl = $('.detail-content');
      if (!contentEl.length) contentEl = $('.article-body');
      if (!contentEl.length) contentEl = $('.news-detail');

      if (!contentEl.length) {
        return { content: summary, image, summary };
      }

      // Lấy HTML sạch (giữ formatting + hình ảnh)
      const content = cleanHtml($, contentEl);

      return { content: content || summary, image, summary };
    },

    /**
     * Scrape danh sách bài viết từ trang category BongDaPlus
     * Trả về array items tương tự RSS items
     */
    scrapeListPage: async (pageUrl) => {
      const html = await fetchHtml(pageUrl, 15000);
      if (!html) return [];

      const $ = cheerio.load(html, { decodeEntities: true });
      const items = [];

      // BongDaPlus list: .list-news .news-item, hoặc .lstItem .item, hoặc .article-item
      const selectors = [
        '.list-news .news-item',
        '.lstItem .item',
        '.article-item',
        '.cate-list .item',
        '.news-lst .item',
        'section .art-lst .item',
        '.art-lst .item',
      ];

      let found = false;
      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((_, el) => {
            const $el = $(el);
            const linkEl = $el.find('a[href]').first();
            const link = linkEl.attr('href') || '';
            const title = linkEl.attr('title') || linkEl.text().trim() || $el.find('h3, h2, .title').text().trim();
            const img = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';

            if (link && title) {
              const fullUrl = link.startsWith('http') ? link : `https://bongdaplus.vn${link}`;
              items.push({
                title: decodeHtmlEntities(title),
                link: fullUrl,
                image: img.startsWith('//') ? 'https:' + img : img,
                pubDate: new Date(), // BongDaPlus không show date trong list
              });
            }
          });
          found = true;
          break;
        }
      }

      if (!found) {
        // Fallback: tìm tất cả link bài viết theo pattern URL
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href') || '';
          const text = $(el).text().trim();
          // BongDaPlus article URLs thường có dạng /ten-bai-viet-12345.html
          if (href.match(/\/[a-z0-9-]+-\d+\.html$/i) && text.length > 20) {
            const fullUrl = href.startsWith('http') ? href : `https://bongdaplus.vn${href}`;
            items.push({
              title: decodeHtmlEntities(text),
              link: fullUrl,
              image: '',
              pubDate: new Date(),
            });
          }
        });
      }

      // Deduplicate by URL
      const seen = new Set();
      return items.filter(item => {
        if (seen.has(item.link)) return false;
        seen.add(item.link);
        return true;
      });
    },
  },
};

// ─── Fetch & Process Functions ───────────────────────────────────────────────

/**
 * Fetch + process 1 RSS feed (VnExpress, Tuổi Trẻ, Thanh Niên)
 */
async function fetchRssFeed(feed) {
  const results = { fetched: 0, skipped: 0, errors: 0 };

  try {
    console.log(`[NewsFetcher] 📡 Fetching: ${feed.name}`);
    const parsed = await rssParser.parseURL(feed.url);

    if (!parsed.items || parsed.items.length === 0) {
      console.log(`[NewsFetcher] No items from ${feed.name}`);
      return results;
    }

    const scraper = SCRAPERS[feed.scraper];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const item of parsed.items) {
      try {
        const pubDate = new Date(item.pubDate || item.isoDate || Date.now());
        if (pubDate.getTime() < sevenDaysAgo) continue;

        const articleUrl = item.link || item.guid || '';
        if (!articleUrl) continue;

        // Decode title (đặc biệt quan trọng cho Thanh Niên)
        const title = decodeHtmlEntities(item.title || '');
        const description = decodeHtmlEntities(item.contentSnippet || item.content || '');

        // Filter: chỉ lấy bài về bóng đá
        if (!isFootballRelated(title, description)) {
          results.skipped++;
          continue;
        }

        // Dedup bằng URL hash
        const sourceHash = makeSourceHash(articleUrl);
        const existing = await News.findOne({ sourceHash });
        if (existing) {
          results.skipped++;
          continue;
        }

        // Scrape full content từ trang bài viết
        const scraped = await scraper.scrapeArticle(articleUrl);

        // Image: ưu tiên enclosure RSS → scraped → fallback
        let imageUrl = item.enclosure?.url
          || item.mediaThumbnail?.$?.url
          || item.mediaContent?.$?.url
          || scraped.image
          || '';

        // Parse image từ description HTML nếu chưa có
        if (!imageUrl && item.content) {
          const imgMatch = item.content.match(/src="([^"]+)"/);
          if (imgMatch) imageUrl = imgMatch[1];
        }

        if (imageUrl) {
          imageUrl = imageUrl.replace(/&amp;/g, '&');
          if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
        }

        // Download image local
        const localImage = await imageDownloader.downloadImage(imageUrl);

        // Lấy author nếu có
        const author = item.creator || item.author || '';

        // Build article data — nội dung gốc, không rewrite
        const content = scraped.content || description || '';
        const slug = makeSlug(title, sourceHash);

        const articleData = {
          title,
          slug,
          sourceHash,
          content,
          summary: scraped.summary || description || '',
          source: feed.name,
          sourceType: 'vn_rss',
          url: articleUrl,
          author: typeof author === 'string' ? author : '',
          image: imageUrl || imageDownloader.getFallbackImage(),
          localImage,
          pubDate,
          pubDateStr: formatPubDate(pubDate),
          isLive: false,
          tags: [],
        };

        await News.create(articleData);
        results.fetched++;
        console.log(`[NewsFetcher] ✅ ${feed.name}: "${title.substring(0, 60)}"`);

      } catch (itemError) {
        if (itemError.code === 11000) {
          results.skipped++;
        } else {
          results.errors++;
          console.warn(`[NewsFetcher] ❌ Item error: ${itemError.message}`);
        }
      }
    }

  } catch (feedError) {
    console.error(`[NewsFetcher] ❌ Feed error (${feed.name}): ${feedError.message}`);
    results.errors++;
  }

  return results;
}

/**
 * Fetch BongDaPlus bằng scrape HTML (không qua RSS)
 */
async function fetchBongDaPlus() {
  const results = { fetched: 0, skipped: 0, errors: 0 };

  try {
    console.log('[NewsFetcher] 📡 Scraping: BongDaPlus');
    const scraper = SCRAPERS.bongdaplus;

    for (const page of BONGDAPLUS_PAGES) {
      const items = await scraper.scrapeListPage(page.url);
      console.log(`[NewsFetcher] BongDaPlus ${page.url}: found ${items.length} articles`);

      for (const item of items.slice(0, 20)) { // Giới hạn 20 bài mỗi page
        try {
          if (!item.title || !item.link) continue;

          if (!isFootballRelated(item.title, '')) {
            results.skipped++;
            continue;
          }

          const sourceHash = makeSourceHash(item.link);
          const existing = await News.findOne({ sourceHash });
          if (existing) {
            results.skipped++;
            continue;
          }

          // Scrape full content
          const scraped = await scraper.scrapeArticle(item.link);
          const imageUrl = scraped.image || item.image || '';
          const localImage = await imageDownloader.downloadImage(imageUrl);

          const slug = makeSlug(item.title, sourceHash);

          const articleData = {
            title: item.title,
            slug,
            sourceHash,
            content: scraped.content || '',
            summary: scraped.summary || '',
            source: 'BongDaPlus',
            sourceType: 'vn_scrape',
            url: item.link,
            author: '',
            image: imageUrl || imageDownloader.getFallbackImage(),
            localImage,
            pubDate: item.pubDate || new Date(),
            pubDateStr: formatPubDate(item.pubDate || new Date()),
            isLive: false,
            tags: [],
          };

          await News.create(articleData);
          results.fetched++;
          console.log(`[NewsFetcher] ✅ BongDaPlus: "${item.title.substring(0, 60)}"`);

        } catch (itemError) {
          if (itemError.code === 11000) {
            results.skipped++;
          } else {
            results.errors++;
            console.warn(`[NewsFetcher] ❌ BDP item error: ${itemError.message}`);
          }
        }
      }

      // Delay giữa các page
      await new Promise(r => setTimeout(r, 1500));
    }

  } catch (error) {
    console.error(`[NewsFetcher] ❌ BongDaPlus error: ${error.message}`);
    results.errors++;
  }

  return results;
}

/**
 * Fetch tất cả nguồn VN (RSS + BongDaPlus scrape)
 */
async function fetchAll() {
  console.log('\n[NewsFetcher] ═══════════════════════════════════════');
  console.log('[NewsFetcher] 🚀 Bắt đầu cào tin từ các báo VN...');
  console.log('[NewsFetcher] ═══════════════════════════════════════\n');

  const allResults = { fetched: 0, skipped: 0, errors: 0 };

  // 1. Fetch RSS feeds (VnExpress, Tuổi Trẻ, Thanh Niên)
  for (const feed of VN_FEEDS) {
    const result = await fetchRssFeed(feed);
    allResults.fetched += result.fetched;
    allResults.skipped += result.skipped;
    allResults.errors += result.errors;
    // Delay 1.5s giữa các feed để tránh bị block
    await new Promise(r => setTimeout(r, 1500));
  }

  // 2. Scrape BongDaPlus
  const bdpResult = await fetchBongDaPlus();
  allResults.fetched += bdpResult.fetched;
  allResults.skipped += bdpResult.skipped;
  allResults.errors += bdpResult.errors;

  console.log(`\n[NewsFetcher] ═══════════════════════════════════════`);
  console.log(`[NewsFetcher] 📊 Kết quả: ${allResults.fetched} mới | ${allResults.skipped} bỏ qua | ${allResults.errors} lỗi`);
  console.log(`[NewsFetcher] ═══════════════════════════════════════\n`);

  return allResults;
}

/**
 * Cleanup bài viết cũ hơn 30 ngày
 */
async function cleanupOldArticles() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await News.deleteMany({ pubDate: { $lt: cutoff } });
  console.log(`[NewsFetcher] 🧹 Cleanup: xóa ${result.deletedCount} bài cũ`);
  return result.deletedCount;
}

module.exports = {
  fetchAll,
  cleanupOldArticles,
};
