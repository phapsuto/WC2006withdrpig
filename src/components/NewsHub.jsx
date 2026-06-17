import { useState, useEffect } from 'react';
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
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  Flame, 
  CheckCircle2 
} from 'lucide-react';

export default function NewsHub({ matches = [] }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstLoadDone, setFirstLoadDone] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [activeTab, setActiveTab] = useState('fulltext'); // 'fulltext' | 'ai' | 'social'

  const loadNews = async (isManual = false) => {
    if (isManual || !firstLoadDone) {
      setLoading(true);
    }
    try {
      const response = await fetch('/data/news.json');
      if (response.ok) {
        const news = await response.json();
        setArticles(news);
      } else {
        const news = await fetchRssFeeds();
        setArticles(news);
      }
      setFirstLoadDone(true);
    } catch (e) {
      console.error('Không thể tải tin tức từ JSON, chuyển hướng RSS:', e);
      try {
        const news = await fetchRssFeeds();
        setArticles(news);
      } catch (err) {
        console.error('Không thể tải tin tức dự phòng:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews(false);
  }, []);

  useEffect(() => {
    const hasLiveMatch = matches.some(m => m.status === 'LIVE');
    const intervalMs = hasLiveMatch ? 5 * 60 * 1000 : 20 * 60 * 1000; // Faster update when live
    
    const interval = setInterval(() => {
      loadNews(false);
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [matches, firstLoadDone]);

  const handleCardClick = (article) => {
    setSelectedArticle(article);
    setActiveTab('fulltext');
    // Scroll detail view to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Estimate reading time helper
  const getReadingTime = (text) => {
    if (!text) return 2;
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / 150); // average speed in Vietnamese reading
    return minutes < 1 ? 1 : minutes;
  };

  if (selectedArticle) {
    const readingTime = getReadingTime(selectedArticle.contentVi || selectedArticle.content);
    return (
      <div className="bento-glass p-5 md:p-8 space-y-6 animate-fade-in">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/20">
          <button 
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/40 border border-white/60 text-xs font-black text-on-surface hover:bg-white/80 hover:border-primary/30 active:scale-95 transition-all w-fit shadow-sm"
          >
            <ArrowLeft size={14} /> Quay lại tin tức
          </button>
          
          <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant/80">
            <Clock size={13} />
            <span>{readingTime} phút đọc</span>
          </div>
        </div>

        {/* Article Title */}
        <h1 className="text-xl md:text-3xl font-black text-on-background leading-tight tracking-tight">
          {selectedArticle.titleVi || selectedArticle.title}
        </h1>
        
        {/* Meta details */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
            {selectedArticle.source}
          </span>
          <span className="text-on-surface-variant/40">•</span>
          <span className="bg-white/30 px-2 py-1 rounded-lg text-on-surface">{selectedArticle.pubDateStr}</span>
          {selectedArticle.url && (selectedArticle.url.includes('en') || selectedArticle.url.includes('sport') || selectedArticle.url.includes('bbc')) && (
            <>
              <span className="text-on-surface-variant/40">•</span>
              <span className="flex items-center gap-1 text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg text-[10px] font-extrabold shadow-sm">
                <Languages size={11} /> Đã dịch sang tiếng Việt
              </span>
            </>
          )}
        </div>

        {/* Featured Image */}
        {selectedArticle.image && (
          <div className="w-full h-[220px] md:h-[420px] rounded-2xl overflow-hidden bg-black border border-white/30 shadow-md relative group">
            <img 
              src={selectedArticle.image} 
              alt={selectedArticle.titleVi || selectedArticle.title} 
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
        )}

        {/* Segmented Detail Tabs Bar (Glassmorphic) */}
        <div className="flex gap-1.5 p-1.5 bg-white/30 border border-white/40 rounded-2xl overflow-x-auto no-scrollbar w-fit shadow-inner">
          {[
            { key: 'fulltext', label: '📖 Đọc toàn văn' },
            { key: 'ai', label: '🐷 AI Tóm tắt & Lời bình' },
            { key: 'social', label: '💬 Phản ứng MXH' }
          ].map(tab => (
            <button 
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all border border-transparent whitespace-nowrap active:scale-98 ${
                activeTab === tab.key 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-on-surface-variant hover:text-primary hover:bg-white/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content area */}
        <div className="text-sm text-on-surface leading-relaxed pt-2">
          {activeTab === 'fulltext' && (
            <div className="space-y-6">
              {selectedArticle.titleVi && selectedArticle.titleVi !== selectedArticle.title && (
                <div className="p-4 bg-white/50 border-l-4 border-accent-gold rounded-2xl text-xs space-y-1 shadow-sm">
                  <span className="text-[10px] font-black uppercase text-accent-gold">Tiêu đề gốc tiếng Anh</span>
                  <p className="italic text-on-surface font-semibold">"{selectedArticle.title}"</p>
                </div>
              )}

              <div className="space-y-4 text-justify font-medium text-base text-on-surface-variant/90 tracking-wide leading-relaxed">
                {(selectedArticle.contentVi || selectedArticle.content || "Nội dung đang được cập nhật...").split('\n\n').map((para, idx) => (
                  <p key={idx} className="first-letter:font-bold first-letter:text-lg first-letter:text-primary">
                    {para}
                  </p>
                ))}
              </div>

              {/* Citations Box */}
              <div className="mt-8 p-4 bg-white/50 border border-white/60 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
                <div>
                  <span className="text-[9px] font-black text-on-surface-variant/75 uppercase tracking-wide">Cung cấp bởi</span>
                  <div className="font-extrabold text-primary uppercase text-sm">{selectedArticle.source}</div>
                </div>
                <a 
                  href={selectedArticle.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary text-white text-xs font-black rounded-xl hover:brightness-105 active:scale-95 transition-all shadow-sm shadow-secondary/15"
                >
                  Bài viết gốc <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="p-5 bg-white/55 border border-white/60 rounded-2xl space-y-3 shadow-md">
                <h4 className="text-xs font-black text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles size={15} className="text-secondary animate-pulse" />
                  Tóm tắt nhanh từ AI Tiên Tri
                </h4>
                
                <div 
                  className="text-xs text-on-surface-variant space-y-2 list-disc list-inside leading-relaxed font-bold border-t border-white/30 pt-3"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.summary || '<ul><li>Đang cập nhật tóm tắt tự động...</li></ul>' }}
                />
              </div>

              {/* Prophet mascot bubble comments (Pink gradient bubble) */}
              <div className="p-5 bg-gradient-to-br from-white/95 to-secondary-fixed/30 border border-secondary/15 rounded-2xl flex items-start gap-4 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -mr-6 -mt-6"></div>
                <img 
                  src="/drpig_mascot.png" 
                  alt="Heo Hồng Mascot" 
                  className="w-12 h-12 rounded-full border-2 border-secondary/40 flex-shrink-0 shadow-sm"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=120&auto=format&fit=crop' }}
                />
                <div className="space-y-1.5 z-10">
                  <span className="text-[10px] font-black text-secondary uppercase tracking-wider flex items-center gap-1">
                    Nhận định Heo Hồng Tiên Tri 🐷
                    <CheckCircle2 size={11} className="text-secondary" />
                  </span>
                  <p className="text-sm text-on-surface font-extrabold italic leading-relaxed">
                    "{selectedArticle.drpigComment || '🐷 Heo Hồng 🐷: Trận này các fen cứ bình tĩnh, kèo nảy lửa thế này cứ đi nhẹ cửa EV dương là ngon ăn nhé! Chúc anh em hốt bạc!'}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-5">
              <h4 className="text-xs font-black text-on-background flex items-center gap-1.5 uppercase tracking-wide">
                <TrendingUp size={16} className="text-secondary" />
                Thảo luận toàn cầu (Reddit & X/Twitter)
              </h4>

              {/* Reddit Comment Section */}
              <div className="p-4 bg-white/50 border-l-4 border-[#ff4500] border-t border-r border-b border-white/50 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center flex-wrap gap-2 text-[10px] font-bold">
                  <span className="text-[#ff4500] font-black flex items-center gap-1">
                    r/soccer Reddit Chatter 💬
                  </span>
                  <div className="flex gap-3 text-on-surface-variant/80">
                    <span>▲ {selectedArticle.socialMentions?.reddit?.upvotes || 124} Upvotes</span>
                    <span>💬 {selectedArticle.socialMentions?.reddit?.commentsCount || 45} Bình luận</span>
                  </div>
                </div>
                <div className="p-3 bg-white/70 border border-white/60 rounded-xl">
                  <span className="text-[8px] font-black text-on-surface-variant/75 uppercase tracking-wider">Bình luận nổi bật nhất</span>
                  <p className="text-xs font-bold italic text-on-surface mt-1 leading-relaxed">
                    "{selectedArticle.socialMentions?.reddit?.topComment || 'The tempo of this tournament has been absolutely insane, hoping for another classic here.'}"
                  </p>
                </div>
              </div>

              {/* X/Twitter Post Section */}
              <div className="p-4 bg-white/50 border-l-4 border-on-background border-t border-r border-b border-white/50 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center flex-wrap gap-2 text-[10px] font-bold">
                  <span className="text-on-background font-black">X / Twitter Feed 🐦</span>
                  <div className="flex gap-3 text-on-surface-variant/80">
                    <span>♥ {selectedArticle.socialMentions?.x?.likes || 512} Likes</span>
                    <span>🔄 {selectedArticle.socialMentions?.x?.reposts || 89} Reposts</span>
                  </div>
                </div>
                <div className="p-3 bg-white/70 border border-white/60 rounded-xl">
                  <span className="text-[8px] font-black text-on-surface-variant/75 uppercase tracking-wider">Bài viết thịnh hành</span>
                  <p className="text-xs font-extrabold text-on-surface mt-1 leading-relaxed">
                    "{selectedArticle.socialMentions?.x?.hotPost || 'Matchday approaches! Predictions on who steals the headlines this time? ⚽🔥'}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List View (Bento Grid layout)
  return (
    <div className="bento-glass p-5 md:p-6 flex flex-col gap-6">
      
      {/* Header section */}
      <div className="flex justify-between items-center pb-2 border-b border-white/40">
        <h3 className="font-black text-base flex items-center gap-2 text-primary">
          <Newspaper size={18} className="text-primary" />
          Tin Nóng World Cup 2026 Premium
        </h3>
        
        <button 
          onClick={() => loadNews(true)} 
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/40 border border-white/60 text-xs font-bold text-on-surface hover:bg-white/80 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={12} className="animate-spin text-primary" />
              Đang làm mới...
            </>
          ) : (
            'Làm mới tin tức'
          )}
        </button>
      </div>

      {/* Main Container */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
            <Loader2 size={36} className="animate-spin text-primary" />
            <span className="text-xs font-black tracking-wide">Đang tổng hợp nguồn tin tức quốc tế...</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-on-surface-variant">
            <Newspaper size={44} className="opacity-30 mb-2" />
            <p className="text-xs font-bold">Chưa có tin tức mới. Nhấn nút làm mới hoặc chạy trình cào tin tự động!</p>
          </div>
        ) : (
          (() => {
            const liveArticles = articles.filter(a => a.isLive);
            const normalArticles = articles.filter(a => !a.isLive);
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* 🔴 LIVE ARTICLES - Highlighted Full Width (Span 12) */}
                {liveArticles.map((article) => (
                  <div 
                    key={article.id} 
                    onClick={() => handleCardClick(article)}
                    className="col-span-12 p-5 bg-gradient-to-br from-secondary/15 to-primary/5 hover:from-secondary/20 hover:to-primary/10 border-2 border-secondary/20 hover:border-secondary/50 rounded-2xl shadow-md transition-all cursor-pointer flex flex-col md:flex-row gap-5 items-center justify-between group active:scale-[0.99] duration-300"
                  >
                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-danger/10 border border-danger/25 text-danger text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></span>
                          TRỰC TIẾP TRẬN ĐẤU
                        </span>
                        <span className="text-[10px] text-on-surface-variant/80 font-bold">Cập nhật: {article.pubDateStr}</span>
                      </div>
                      
                      <h2 className="text-base md:text-lg font-black text-on-background leading-snug group-hover:text-primary transition-colors">
                        {article.titleVi || article.title}
                      </h2>
                      
                      {article.liveInfo && (
                        <div className="flex items-center gap-3 p-2.5 bg-white/65 border border-white/80 rounded-xl w-fit shadow-sm">
                          <strong className="text-xs font-black text-secondary">{article.liveInfo.home}</strong>
                          <span className="text-sm font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent px-1">
                            {article.liveInfo.score}
                          </span>
                          <strong className="text-xs font-black text-secondary">{article.liveInfo.away}</strong>
                          <span className="text-[10px] text-on-surface-variant/80 border-l border-white/80 pl-2.5 ml-1 font-extrabold flex items-center gap-1">
                            <Flame size={12} className="text-secondary animate-pulse" /> Phút {article.liveInfo.minute}'
                          </span>
                        </div>
                      )}
                      
                      <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed font-semibold">
                        {(article.contentVi || article.content || '').substring(0, 180)}...
                      </p>
                    </div>

                    {article.image && (
                      <div className="w-full md:w-[150px] h-[100px] rounded-xl overflow-hidden bg-black border border-white/30 flex-shrink-0 shadow-sm">
                        <img 
                          src={article.image} 
                          alt="Live Match" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* CARD 1: FEATURED ARTICLE - Left Column (Span 8) */}
                {normalArticles.slice(0, 1).map((article) => (
                  <div 
                    key={article.id} 
                    onClick={() => handleCardClick(article)}
                    className="col-span-12 lg:col-span-8 flex flex-col bg-white/40 hover:bg-white/80 border border-white/60 hover:border-primary/30 rounded-2xl overflow-hidden transition-all shadow-sm cursor-pointer group active:scale-[0.99] duration-300"
                  >
                    <div className="w-full h-[200px] sm:h-[260px] overflow-hidden bg-black relative">
                      <img 
                        src={article.image} 
                        alt={article.titleVi || article.title} 
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                        referrerPolicy="no-referrer" 
                      />
                      <span className="absolute top-3 left-3 px-2 py-1 rounded bg-secondary text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                        TIN ĐẶC BIỆT
                      </span>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-bold">
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary uppercase font-black">{article.source}</span>
                          <span>{article.pubDateStr}</span>
                        </div>
                        <h3 className="text-base md:text-lg font-black text-on-surface group-hover:text-primary transition-colors leading-snug">
                          {article.titleVi || article.title}
                        </h3>
                        <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed font-semibold">
                          {(article.contentVi || article.content || '').substring(0, 240)}...
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-[10px] text-on-surface-variant/80 font-black pt-3 border-t border-dashed border-white/60">
                        <span className="flex items-center gap-1"><ThumbsUp size={11} /> {article.socialMentions?.x?.likes || 14}</span>
                        <span className="flex items-center gap-1"><MessageCircle size={11} /> {article.socialMentions?.reddit?.commentsCount || 8}</span>
                        <span className="ml-auto text-primary font-black uppercase tracking-wider">Chi tiết toàn văn ➔</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* CARD 2: PIG PROPHET CORNER - Right Column (Span 4) */}
                <div className="col-span-12 lg:col-span-4 bg-gradient-to-br from-white/95 to-secondary-fixed/20 border border-secondary/15 rounded-2xl p-5 flex flex-col justify-between gap-6 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <img 
                        src="/drpig_mascot.png" 
                        alt="Heo Hồng AI" 
                        className="w-8 h-8 rounded-full border border-primary/20"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=120&auto=format&fit=crop' }}
                      />
                      <span className="text-[10px] font-black text-secondary uppercase tracking-wider">Lời bàn Tiên tri Heo Hồng 🐷</span>
                    </div>
                    
                    <h3 className="text-sm font-black text-on-surface leading-snug">
                      Nhận định nóng từ Heo Con!
                    </h3>
                    
                    <p className="text-xs text-on-surface-variant leading-relaxed font-extrabold italic bg-white/40 p-3.5 rounded-xl border border-white/60">
                      "{normalArticles[0]?.drpigComment || 'Chào các fen! Giải đấu WC 2026 đang diễn biến cực kỳ khó lường, cứ thong thả theo kèo EV dương của tôi mà đặt là ấm êm nhé! 🐷⚽'}"
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/50 text-[10px] font-bold text-on-surface-variant/75">
                    <span>Mô hình: Gemini-2.5-Flash</span>
                    <span className="px-2 py-0.5 rounded bg-tertiary text-white font-black">EV+ DỰ BÁO</span>
                  </div>
                </div>

                {/* CARD 3: SOCIAL HASHTAGS TRENDS (SPAN 4) */}
                <div className="col-span-12 lg:col-span-4 bg-white/40 border border-white/50 rounded-2xl p-5 flex flex-col justify-between gap-5 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={16} className="text-secondary" />
                      <span className="text-[10px] font-black text-secondary uppercase tracking-wide">Xu hướng WC2026 💬</span>
                    </div>
                    
                    <h4 className="text-xs text-on-surface-variant font-bold">Chủ đề fan thảo luận nóng nhất hôm nay:</h4>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center p-2.5 bg-white/50 border border-white/60 rounded-xl text-xs hover:bg-white/70 transition-colors">
                        <span className="font-bold text-on-surface-variant">#WorldCup2026</span>
                        <span className="text-primary font-black">12.4k post</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-white/50 border border-white/60 rounded-xl text-xs hover:bg-white/70 transition-colors">
                        <span className="font-bold text-on-surface-variant">#HeoHồngTiênTri</span>
                        <span className="text-secondary font-black">8.9k post</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-white/50 border border-white/60 rounded-xl text-xs hover:bg-white/70 transition-colors">
                        <span className="font-bold text-on-surface-variant">#SanAztecaKèoNóng</span>
                        <span className="text-tertiary font-black">Hot 🔥</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-on-surface-variant/75 font-semibold pt-2.5 border-t border-white/45 flex justify-between">
                    <span>Quét thảo luận Reddit & X</span>
                    <span>Tự động làm mới</span>
                  </div>
                </div>

                {/* SECONDARY STORIES (SPAN 8) */}
                {normalArticles.slice(1, 3).map((article) => (
                  <div 
                    key={article.id} 
                    onClick={() => handleCardClick(article)}
                    className="col-span-12 md:col-span-6 lg:col-span-4 flex flex-col bg-white/40 hover:bg-white/80 border border-white/50 hover:border-primary/20 rounded-2xl overflow-hidden transition-all shadow-sm cursor-pointer group active:scale-[0.99] duration-300"
                  >
                    <div className="w-full h-[140px] overflow-hidden bg-black relative">
                      <img 
                        src={article.image} 
                        alt={article.titleVi || article.title} 
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[9px] text-on-surface-variant/80 font-bold">
                          <span className="text-secondary font-black">{article.source}</span>
                          <span>{article.pubDateStr}</span>
                        </div>
                        <h3 className="text-xs font-black text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {article.titleVi || article.title}
                        </h3>
                        <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed font-semibold">
                          {(article.contentVi || article.content || '').substring(0, 150)}...
                        </p>
                      </div>
                      
                      <div className="flex gap-3 text-[10px] text-on-surface-variant/75 font-bold pt-2 border-t border-white/30">
                        <span>👍 {article.socialMentions?.x?.likes || 5}</span>
                        <span>💬 {article.socialMentions?.reddit?.commentsCount || 2}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* SMALL LIST STORIES (SPAN 12 -> MOBILE FRIENDLY WITH THUMBNAIL ON RIGHT) */}
                <div className="col-span-12 border-t border-dashed border-white/60 pt-6 mt-2">
                  <h4 className="text-xs font-black text-on-surface-variant/70 uppercase tracking-wider mb-4">Các tin bài thể thao liên quan khác</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {normalArticles.slice(3, 15).map((article) => (
                      <div 
                        key={article.id} 
                        onClick={() => handleCardClick(article)}
                        className="p-3.5 bg-white/30 hover:bg-white/60 border border-white/50 hover:border-primary/20 rounded-2xl transition-all shadow-sm cursor-pointer flex gap-4 justify-between items-center group active:scale-[0.99] duration-300"
                      >
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[9px] text-on-surface-variant/80 font-bold">
                            <span className="text-primary font-black uppercase">{article.source}</span>
                            <span>•</span>
                            <span>{article.pubDateStr.split(' ')[0]}</span>
                          </div>
                          <h3 className="text-xs font-extrabold text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {article.titleVi || article.title}
                          </h3>
                        </div>
                        
                        {article.image && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-black border border-white/30 flex-shrink-0 shadow-sm">
                            <img 
                              src={article.image} 
                              alt="Thumbnail" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              referrerPolicy="no-referrer" 
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
