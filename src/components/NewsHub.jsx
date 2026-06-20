import { useState, useEffect, useCallback } from 'react';
import { fetchRssFeeds } from '../services/rss';
import { 
  Newspaper, 
  Loader2, 
  Sparkles, 
  Languages, 
  ExternalLink, 
  ArrowLeft, 
  Clock, 
  TrendingUp, 
  Flame, 
  CheckCircle2,
  Play,
  Calendar,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

// ── PERSISTENT NEWS STORAGE ──────────────────────────────
const NEWS_STORAGE_KEY = 'wc2026_news_data';
const NEWS_STORAGE_TS_KEY = 'wc2026_news_timestamp';
const NEWS_MAX_AGE_DAYS = 30;

// WHITELIST: Article MUST contain at least one of these to be WC-related
const WC_REQUIRED_KEYWORDS = [
  'world cup', 'worldcup', 'wc 2026', 'wc2026', 'fifa', 
  'world cup 2026', 'vòng chung kết', 'vòng bảng', 'bảng đấu',
  'đội tuyển', 'đt ', 'tuyển quốc gia',
  'bóng đá', 'bong da', 'football', 'soccer',
  'trận đấu', 'bàn thắng', 'penalty', 'thẻ đỏ', 'thẻ vàng',
  'huấn luyện viên', 'hlv', 'cầu thủ', 'tiền đạo', 'thủ môn',
  'hậu vệ', 'tiền vệ', 'trung vệ',
  'messi', 'ronaldo', 'mbappe', 'mbappé', 'haaland', 'vinicius',
  'neymar', 'salah', 'kane', 'bellingham', 'saka',
  'argentina', 'brazil', 'france', 'germany', 'england', 'spain', 'portugal',
  'pháp', 'đức', 'anh', 'tây ban nha', 'bồ đào nha', 'brazil',
  'mexico', 'mỹ', 'usa', 'hàn quốc', 'nhật bản', 'maroc', 'morocco',
  'bỉ', 'hà lan', 'croatia', 'uruguay', 'colombia', 'ecuador',
  'senegal', 'cameroon', 'nigeria', 'ghana', 'tunisia',
  'group a', 'group b', 'group c', 'group d', 'group e', 'group f',
  'group g', 'group h', 'group i', 'group j', 'group k', 'group l',
  'bảng a', 'bảng b', 'bảng c', 'bảng d', 'bảng e', 'bảng f',
  'nam phi', 'hàn quốc', 'thụy sĩ', 'thổ nhĩ kỳ', 'bờ biển ngà',
  'tỉ số', 'tỷ số', 'xếp hạng', 'kết quả', 'lịch thi đấu',
  'sân vận động', 'stadium', 'var ', 'trọng tài',
  'dự đoán', 'nhận định', 'soi kèo', 'kèo',
  'vô địch', 'champion', 'knockout', 'vòng 16', 'tứ kết', 'bán kết', 'chung kết',
];

// BLACKLIST: Even if it passes whitelist, reject these
const NEWS_BLACKLIST = [
  'esport', 'pickleball', 'tennis', 'boxing', 'golf', 'nba ',
  'formula 1', 'f1 grand prix', 'mma', 'ufc', 'muay thái',
  'asiad', 'sea games', 'olympic 2028', 's-race', 'giải chạy',
  'marathon', 'bơi lội', 'cầu lông', 'bóng rổ', 'bóng chuyền',
  'karate', 'judo', 'taekwondo', 'wushu', 'đấu kiếm',
];

const filterFootballNews = (articles) => {
  return articles.filter(article => {
    const title = (article.titleVi || article.title || '').toLowerCase();
    const desc = (article.descriptionVi || article.description || '').toLowerCase();
    const combined = title + ' ' + desc;
    // BLACKLIST check first
    if (NEWS_BLACKLIST.some(kw => combined.includes(kw))) return false;
    // Filter out fake "[LIVE]" articles
    if (title.startsWith('[live]') || title.includes('[trực tiếp]')) return false;
    const url = article.url || article.link || '';
    if (url.includes('worldcup26.ir/live-match')) return false;
    // WHITELIST: MUST contain at least one WC/football keyword
    const hasWcKeyword = WC_REQUIRED_KEYWORDS.some(kw => combined.includes(kw));
    if (!hasWcKeyword) return false;
    return true;
  });
};

const cleanOldArticles = (articles) => {
  const cutoff = Date.now() - (NEWS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  return articles.filter(article => {
    const pubDate = new Date(article.pubDate || article.publishedAt || 0).getTime();
    // Keep articles without valid dates (assume recent)
    return pubDate === 0 || pubDate > cutoff;
  });
};

const persistNews = (articles) => {
  try {
    const cleaned = cleanOldArticles(articles);
    localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(cleaned));
    localStorage.setItem(NEWS_STORAGE_TS_KEY, Date.now().toString());
  } catch (e) {
    console.warn('[News Storage] Failed to persist:', e.message);
  }
};

const loadPersistedNews = () => {
  try {
    const raw = localStorage.getItem(NEWS_STORAGE_KEY);
    if (raw) {
      let articles = JSON.parse(raw);
      // Apply filter on cached data too (catches stale fake/irrelevant articles)
      articles = filterFootballNews(articles);
      console.log(`[News Storage] Loaded ${articles.length} cached articles (filtered)`);
      return articles;
    }
  } catch (e) {
    console.warn('[News Storage] Failed to load:', e.message);
  }
  return [];
};

export default function NewsHub({ matches = [] }) {
  // Initialize from persistent storage for instant load
  const [articles, setArticles] = useState(() => loadPersistedNews());
  const [loading, setLoading] = useState(() => loadPersistedNews().length === 0);
  const [firstLoadDone, setFirstLoadDone] = useState(() => loadPersistedNews().length > 0);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [activeTab, setActiveTab] = useState('fulltext');
  const [imgErrors, setImgErrors] = useState({});

  const loadNews = useCallback(async (isManual = false) => {
    if (isManual || !firstLoadDone) setLoading(true);
    try {
      const response = await fetch('/data/news.json');
      if (response.ok) {
        let news = await response.json();
        // Client-side filter: remove non-football articles
        news = filterFootballNews(news);
        // Clean old articles (> 30 days)
        news = cleanOldArticles(news);
        setArticles(news);
        // Persist to localStorage permanently
        persistNews(news);
        console.log(`[News] Loaded ${news.length} WC articles, persisted to storage`);
      } else {
        const news = filterFootballNews(await fetchRssFeeds());
        setArticles(news);
        persistNews(news);
      }
      setFirstLoadDone(true);
    } catch (e) {
      console.error('News load failed, trying RSS fallback:', e);
      try {
        const news = filterFootballNews(await fetchRssFeeds());
        setArticles(news);
        persistNews(news);
      } catch (err) {
        console.error('RSS fallback also failed:', err);
        // Keep showing cached articles from localStorage (already loaded in useState init)
      }
    } finally {
      setLoading(false);
    }
  }, [firstLoadDone]);

  // On mount: if we have cached data, still fetch fresh in background
  useEffect(() => { loadNews(false); }, [loadNews]);

  useEffect(() => {
    const hasLive = matches.some(m => m.status === 'LIVE');
    const interval = setInterval(() => loadNews(false), hasLive ? 5 * 60000 : 20 * 60000);
    return () => clearInterval(interval);
  }, [matches, firstLoadDone, loadNews]);

  const handleCardClick = (article) => {
    setSelectedArticle(article);
    setActiveTab('fulltext');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getReadingTime = (text) => {
    if (!text) return 2;
    return Math.max(1, Math.ceil(text.split(/\s+/).length / 150));
  };

  const handleImgError = (id) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  const getFallbackImg = () => 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop';

  const getArticleImage = (article) => {
    if (imgErrors[article.id]) return getFallbackImg();
    return article.image || getFallbackImg();
  };

  const [currentTime] = useState(() => Date.now());

  const formatTimeAgo = (pubDate) => {
    if (!pubDate) return '';
    const diff = currentTime - pubDate;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  // ==========================================
  // ARTICLE DETAIL VIEW
  // ==========================================
  if (selectedArticle) {
    const readingTime = getReadingTime(selectedArticle.contentVi || selectedArticle.content);
    return (
      <div className="space-y-0">
        {/* Hero Image */}
        <div className="relative w-full h-[220px] md:h-[400px] -mx-4 -mt-4 mb-0 overflow-hidden" style={{ marginLeft: '-1rem', marginRight: '-1rem', marginTop: '-1rem', width: 'calc(100% + 2rem)' }}>
          <img 
            src={getArticleImage(selectedArticle)} 
            alt={selectedArticle.titleVi || selectedArticle.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => handleImgError(selectedArticle.id)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Back Button Overlay */}
          <button 
            onClick={() => setSelectedArticle(null)}
            className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold hover:bg-black/60 active:scale-95 transition-all"
          >
            <ArrowLeft size={14} /> Quay lại
          </button>

          {/* Title on Hero */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider">
                {selectedArticle.source}
              </span>
              {selectedArticle.isLive && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/90 text-white text-[9px] font-black uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  TRỰC TIẾP
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-3xl font-black text-white leading-tight drop-shadow-lg">
              {selectedArticle.titleVi || selectedArticle.title}
            </h1>
          </div>
        </div>

        {/* Meta Bar */}
        <div className="flex flex-wrap items-center gap-3 py-4 px-1 border-b border-white/20 text-xs text-on-surface-variant font-bold">
          <span className="flex items-center gap-1"><Calendar size={12} /> {selectedArticle.pubDateStr}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {readingTime} phút đọc</span>
          {(selectedArticle.url?.includes('en') || selectedArticle.url?.includes('bbc') || selectedArticle.url?.includes('espn')) && (
            <span className="flex items-center gap-1 text-primary bg-primary/8 px-2 py-0.5 rounded-md">
              <Languages size={11} /> Đã dịch Việt
            </span>
          )}
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 p-1 bg-white/20 border border-white/30 rounded-xl mt-4 mb-4">
          {[
            { key: 'fulltext', label: '📖 Toàn văn' },
            { key: 'ai', label: '🐷 AI Tóm tắt' },
            { key: 'social', label: '💬 MXH' }
          ].map(tab => (
            <button 
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-3 py-2.5 text-xs font-black rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.key 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-on-surface-variant hover:bg-white/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="text-sm leading-relaxed">
          {activeTab === 'fulltext' && (
            <div className="space-y-5">
              {selectedArticle.titleVi && selectedArticle.titleVi !== selectedArticle.title && (
                <div className="p-3.5 bg-white/30 border-l-3 border-accent-gold rounded-xl text-xs">
                  <span className="text-[10px] font-black uppercase text-accent-gold block mb-1">Tiêu đề gốc</span>
                  <p className="italic text-on-surface font-semibold">"{selectedArticle.title}"</p>
                </div>
              )}

              <div className="space-y-4 text-on-surface-variant/90 font-medium leading-[1.8] text-[0.95rem]">
                {(selectedArticle.contentVi || selectedArticle.content || "Nội dung đang được cập nhật...").split('\n\n').map((para, idx) => (
                  <p key={idx} className={idx === 0 ? 'first-letter:text-2xl first-letter:font-black first-letter:text-primary first-letter:float-left first-letter:mr-1' : ''}>
                    {para}
                  </p>
                ))}
              </div>

              {/* Source Link */}
              <div className="mt-6 p-4 bg-white/30 border border-white/40 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black text-on-surface-variant/60 uppercase">Nguồn</span>
                  <div className="font-black text-primary text-sm">{selectedArticle.source}</div>
                </div>
                <a 
                  href={selectedArticle.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-sm"
                >
                  Xem gốc <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-5">
              <div className="p-5 bg-white/40 border border-white/50 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles size={15} className="text-secondary animate-pulse" />
                  Tóm tắt nhanh AI
                </h4>
                <div 
                  className="text-sm text-on-surface-variant space-y-2 font-bold border-t border-white/30 pt-3 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.summary || '<ul><li>Đang cập nhật tóm tắt tự động...</li></ul>' }}
                />
              </div>

              <div className="p-5 bg-gradient-to-br from-white/90 to-pink-50/50 border border-secondary/15 rounded-2xl flex items-start gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/5 rounded-full -mr-5 -mt-5" />
                <img 
                  src="/drpig_mascot.png" 
                  alt="Heo Hồng" 
                  className="w-11 h-11 rounded-full border-2 border-secondary/40 flex-shrink-0"
                  onError={(e) => { e.target.src = getFallbackImg() }}
                />
                <div className="z-10">
                  <span className="text-[10px] font-black text-secondary uppercase flex items-center gap-1 mb-1">
                    Nhận định Heo Hồng 🐷 <CheckCircle2 size={11} />
                  </span>
                  <p className="text-sm text-on-surface font-bold italic leading-relaxed">
                    "{selectedArticle.drpigComment || '🐷 Heo Hồng 🐷: Trận này cứ bình tĩnh, kèo nảy lửa thế này đi nhẹ cửa EV dương là ngon ăn!'}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4">
              <div className="p-4 bg-white/40 border-l-4 border-[#ff4500] rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-[#ff4500] font-black">r/soccer Reddit 💬</span>
                  <div className="flex gap-3 text-on-surface-variant/80">
                    <span>▲ {selectedArticle.socialMentions?.reddit?.upvotes || 124}</span>
                    <span>💬 {selectedArticle.socialMentions?.reddit?.commentsCount || 45}</span>
                  </div>
                </div>
                <div className="p-3 bg-white/50 border border-white/60 rounded-xl">
                  <p className="text-xs font-bold italic text-on-surface leading-relaxed">
                    "{selectedArticle.socialMentions?.reddit?.topComment || 'Great analysis on the tactical setup.'}"
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white/40 border-l-4 border-black rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="font-black">X / Twitter 🐦</span>
                  <div className="flex gap-3 text-on-surface-variant/80">
                    <span>♥ {selectedArticle.socialMentions?.x?.likes || 512}</span>
                    <span>🔄 {selectedArticle.socialMentions?.x?.reposts || 89}</span>
                  </div>
                </div>
                <div className="p-3 bg-white/50 border border-white/60 rounded-xl">
                  <p className="text-xs font-bold text-on-surface leading-relaxed">
                    "{selectedArticle.socialMentions?.x?.hotPost || 'Matchday! Who steals the headlines? ⚽🔥'}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // NEWS LIST VIEW — Magazine Layout
  // ==========================================
  const liveArticles = articles.filter(a => a.isLive);
  const normalArticles = articles.filter(a => !a.isLive);
  const featuredArticle = normalArticles[0];
  const secondaryArticles = normalArticles.slice(1, 4);
  const remainingArticles = normalArticles.slice(4);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-black text-lg flex items-center gap-2 text-on-background">
          <Newspaper size={20} className="text-primary" />
          Tin Nóng WC 2026
        </h2>
        <button 
          onClick={() => loadNews(true)} 
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/50 border border-white/60 text-xs font-bold text-on-surface hover:bg-white/80 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 size={13} className="animate-spin text-primary" /> Đang tải...</>
          ) : (
            <><RefreshCw size={13} /> Làm mới</>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
          <Loader2 size={36} className="animate-spin text-primary" />
          <span className="text-xs font-bold">Đang tổng hợp tin tức quốc tế...</span>
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-on-surface-variant">
          <Newspaper size={44} className="opacity-30 mb-2" />
          <p className="text-xs font-bold">Chưa có tin tức mới</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* 🔴 LIVE MATCH BANNER */}
          {liveArticles.map(article => (
            <div 
              key={article.id}
              onClick={() => handleCardClick(article)}
              className="relative p-5 bg-gradient-to-r from-red-500/10 to-primary/5 border-2 border-red-400/25 hover:border-red-400/50 rounded-2xl cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black uppercase flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" /> TRỰC TIẾP
                </span>
                <span className="text-[10px] text-on-surface-variant font-bold">{article.pubDateStr}</span>
              </div>
              
              <h3 className="text-base font-black text-on-background group-hover:text-primary transition-colors leading-snug mb-2">
                {article.titleVi || article.title}
              </h3>

              {article.liveInfo && (
                <div className="flex items-center gap-3 p-2.5 bg-white/60 border border-white/70 rounded-xl w-fit">
                  <strong className="text-sm font-black text-primary">{article.liveInfo.home}</strong>
                  <span className="text-lg font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {article.liveInfo.score}
                  </span>
                  <strong className="text-sm font-black text-secondary">{article.liveInfo.away}</strong>
                  <span className="text-[10px] font-bold border-l border-white/50 pl-2.5 flex items-center gap-1">
                    <Flame size={12} className="text-red-500" /> Phút {article.liveInfo.minute}'
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* 🌟 FEATURED ARTICLE — Full-width Hero Card */}
          {featuredArticle && (
            <div 
              onClick={() => handleCardClick(featuredArticle)}
              className="relative rounded-2xl overflow-hidden cursor-pointer group active:scale-[0.995] transition-transform"
            >
              <div className="w-full h-[200px] sm:h-[280px] md:h-[320px] overflow-hidden bg-gray-100">
                <img 
                  src={getArticleImage(featuredArticle)} 
                  alt={featuredArticle.titleVi || featuredArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                  onError={() => handleImgError(featuredArticle.id)}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-sm text-white text-[9px] font-black uppercase">
                    {featuredArticle.source}
                  </span>
                  <span className="text-white/70 text-[10px] font-bold">
                    {formatTimeAgo(featuredArticle.pubDate)}
                  </span>
                </div>
                <h2 className="text-base md:text-xl font-black text-white leading-snug group-hover:text-blue-200 transition-colors">
                  {featuredArticle.titleVi || featuredArticle.title}
                </h2>
                <p className="text-xs text-white/70 mt-2 line-clamp-2 font-semibold leading-relaxed hidden sm:block">
                  {(featuredArticle.contentVi || featuredArticle.content || '').substring(0, 160)}...
                </p>
              </div>
            </div>
          )}

          {/* 📰 SECONDARY STORIES — 3-column grid */}
          {secondaryArticles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {secondaryArticles.map(article => (
                <div 
                  key={article.id}
                  onClick={() => handleCardClick(article)}
                  className="bg-white/40 hover:bg-white/70 border border-white/50 hover:border-primary/20 rounded-2xl overflow-hidden cursor-pointer group transition-all active:scale-[0.98]"
                >
                  {/* Thumbnail */}
                  <div className="w-full h-[140px] overflow-hidden bg-gray-100 relative">
                    <img 
                      src={getArticleImage(article)} 
                      alt={article.titleVi || article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={() => handleImgError(article.id)}
                    />
                    {article.videoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-md">
                          <Play size={14} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant/80">
                      <span className="text-primary font-black">{article.source}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(article.pubDate)}</span>
                    </div>
                    <h3 className="text-sm font-black text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {article.titleVi || article.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed font-medium">
                      {(article.contentVi || article.content || '').substring(0, 120)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 📋 REMAINING STORIES — Compact list with thumbnails */}
          {remainingArticles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-on-surface-variant/60 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} /> Tin tức mới nhất
              </h3>
              
              <div className="space-y-2">
                {remainingArticles.map(article => (
                  <div 
                    key={article.id}
                    onClick={() => handleCardClick(article)}
                    className="flex gap-3.5 p-3 bg-white/30 hover:bg-white/60 border border-white/40 hover:border-primary/15 rounded-xl cursor-pointer transition-all group active:scale-[0.99]"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 md:w-24 md:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img 
                        src={getArticleImage(article)} 
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={() => handleImgError(article.id)}
                      />
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-on-surface-variant/70">
                        <span className="text-primary font-black uppercase">{article.source}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(article.pubDate)}</span>
                      </div>
                      <h4 className="text-xs font-black text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {article.titleVi || article.title}
                      </h4>
                    </div>
                    
                    <ChevronRight size={16} className="text-on-surface-variant/30 flex-shrink-0 self-center" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Heo Hồng Prophet Corner */}
          <div className="p-5 bg-gradient-to-br from-white/80 to-pink-50/40 border border-secondary/15 rounded-2xl flex items-start gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -mr-8 -mt-8" />
            <img 
              src="/drpig_mascot.png" 
              alt="Heo Hồng AI" 
              className="w-10 h-10 rounded-full border-2 border-primary/20 flex-shrink-0"
              onError={(e) => { e.target.src = getFallbackImg() }}
            />
            <div className="z-10 space-y-1">
              <span className="text-[10px] font-black text-secondary uppercase tracking-wider flex items-center gap-1">
                Lời bàn Heo Hồng 🐷 <CheckCircle2 size={11} />
              </span>
              <p className="text-sm text-on-surface font-bold italic leading-relaxed">
                "{normalArticles[0]?.drpigComment || 'Chào các fen! World Cup 2026 đang nóng lắm, cứ thong thả theo dõi nhé! 🐷⚽'}"
              </p>
              <span className="text-[9px] text-on-surface-variant/60 font-semibold">Mô hình: Gemini-2.5-Flash</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
