import React, { useState, useEffect } from 'react';
import { fetchRssFeeds } from '../services/rss';
import { translateAndSummarizeNews } from '../services/gemini';
import { Newspaper, Loader2, Sparkles, Languages, ExternalLink, X, Play } from 'lucide-react';

export default function NewsHub() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAi, setExpandedAi] = useState({}); // Stores AI translated content per article
  const [loadingAi, setLoadingAi] = useState({}); // Stores loading state per article
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const news = await fetchRssFeeds();
      setArticles(news);
    } catch (e) {
      console.error('Không thể tải tin tức RSS:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAiTranslate = async (index, article, e) => {
    if (e) e.stopPropagation(); // Avoid triggering card click
    
    if (expandedAi[index]) {
      // Toggle off if already expanded
      setExpandedAi(prev => {
        const copy = { ...prev };
        delete copy[index];
        return copy;
      });
      return;
    }

    setLoadingAi(prev => ({ ...prev, [index]: true }));
    try {
      const result = await translateAndSummarizeNews(article);
      setExpandedAi(prev => ({ ...prev, [index]: result }));
      
      // Update selectedArticle if it is currently open
      if (selectedArticle && selectedArticle.link === article.link) {
        setSelectedArticle(prev => ({ ...prev, aiResult: result }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleCardClick = (article, index) => {
    setSelectedArticle({
      ...article,
      index,
      aiResult: expandedAi[index] || null
    });
  };

  return (
    <div className="card news-hub-card glass-card">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="section-title">
          <Newspaper size={18} className="text-primary" />
          Tin Nóng World Cup 2026 📰
        </h3>
        <button 
          onClick={loadNews} 
          disabled={loading}
          style={{
            background: 'rgba(255, 45, 120, 0.05)',
            border: '1px solid var(--border)',
            padding: '0.4rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--primary)',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Đang cập nhật...' : 'Làm mới tin'}
        </button>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', gap: '1rem', color: 'var(--text-secondary)' }}>
            <Loader2 size={36} className="animate-spin text-primary" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Đang tải tin tức từ VnExpress, Bongdaplus và ESPN...</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="betslip-empty-state">
            <Newspaper size={36} />
            <p>Không có tin tức nào được cập nhật</p>
          </div>
        ) : (
          <div className="magazine-layout">
            
            {/* HERO FEATURED STORY (First Article) */}
            {articles.slice(0, 1).map((article, idx) => {
              const hasAiResult = !!expandedAi[0];
              const isAiLoading = !!loadingAi[0];
              const isEn = article.lang === 'en';

              return (
                <div key="hero-news" className="magazine-hero-card card glass-card" onClick={() => handleCardClick(article, 0)}>
                  <div className="hero-image-wrapper">
                    <img src={article.image} alt={article.title} className="hero-news-image" referrerPolicy="no-referrer" />
                    {article.videoUrl && (
                      <div className="video-overlay-badge">
                        <Play size={12} fill="white" />
                        <span>CLIP TRỰC TIẾP</span>
                      </div>
                    )}
                  </div>
                  <div className="hero-news-body">
                    <div className="news-meta-row">
                      <span className="news-source-badge">{article.source}</span>
                      {isEn && (
                        <span className="lang-badge">
                          <Languages size={10} /> Tiếng Anh
                        </span>
                      )}
                      <span className="news-date">{article.pubDateStr}</span>
                    </div>
                    <h2 className="hero-news-title">
                      {article.title}
                    </h2>
                    <p className="hero-news-desc">
                      {article.description}
                    </p>

                    {article.videoUrl && (
                      <div className="video-player-container" style={{ margin: '1rem 0', borderRadius: 12, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                        <video src={article.videoUrl} controls autoPlay muted loop playsInline style={{ width: '100%', display: 'block', maxHeight: 300, objectFit: 'cover' }} />
                      </div>
                    )}
                    
                    <div className="hero-news-actions">
                      <button
                        onClick={(e) => handleAiTranslate(0, article, e)}
                        disabled={isAiLoading}
                        className="ai-btn"
                      >
                        {isAiLoading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Sparkles size={12} />
                        )}
                        <span>{hasAiResult ? 'Đóng Tóm Tắt AI 🐷' : 'Drpig Tóm Tắt & Bình Luận 🐷'}</span>
                      </button>
                    </div>

                    {hasAiResult && (
                      <div className="magazine-ai-box animate-scale-up" onClick={(e) => e.stopPropagation()}>
                        <div className="ai-box-header">
                          <img src="/drpig_mascot.png" alt="Drpig AI" className="ai-avatar" />
                          <span>Drpig Bình Luận 🐷</span>
                        </div>
                        <h4 className="ai-box-title">{expandedAi[0].translatedTitle}</h4>
                        <p className="ai-box-desc">{expandedAi[0].summary}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* SECONDARY STORIES GRID */}
            <div className="magazine-grid">
              {articles.slice(1).map((article, idx) => {
                const actualIndex = idx + 1;
                const hasAiResult = !!expandedAi[actualIndex];
                const isAiLoading = !!loadingAi[actualIndex];
                const isEn = article.lang === 'en';

                return (
                  <div key={actualIndex} className="magazine-grid-card card glass-card" onClick={() => handleCardClick(article, actualIndex)}>
                    <div className="grid-image-wrapper">
                      <img src={article.image} alt={article.title} className="grid-news-image" referrerPolicy="no-referrer" />
                      {article.videoUrl && (
                        <div className="video-overlay-badge-mini">
                          <Play size={8} fill="white" />
                          <span>CLIP</span>
                        </div>
                      )}
                    </div>
                    <div className="grid-news-body">
                      <div className="news-meta-row">
                        <span className="news-source-badge">{article.source}</span>
                        {isEn && <span className="lang-badge" style={{ fontSize: '0.6rem' }}><Languages size={8} /> EN</span>}
                      </div>
                      <h3 className="grid-news-title">
                        {article.title}
                      </h3>
                      <p className="grid-news-desc">
                        {article.description}
                      </p>
                      
                      <div className="grid-news-actions">
                        <button
                          onClick={(e) => handleAiTranslate(actualIndex, article, e)}
                          disabled={isAiLoading}
                          className="ai-btn-mini"
                          style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem' }}
                        >
                          {isAiLoading ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <Sparkles size={10} />
                          )}
                          <span>AI Tóm Tắt 🐷</span>
                        </button>
                      </div>

                      {hasAiResult && (
                        <div className="magazine-ai-box animate-scale-up" style={{ marginTop: '0.75rem', padding: '0.65rem' }} onClick={(e) => e.stopPropagation()}>
                          <div className="ai-box-header" style={{ fontSize: '0.7rem', marginBottom: '0.2rem' }}>
                            <img src="/drpig_mascot.png" alt="Drpig" className="ai-avatar" style={{ width: 14, height: 14 }} />
                            <span>Drpig AI 🐷</span>
                          </div>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                            <strong>{expandedAi[actualIndex].translatedTitle}:</strong> {expandedAi[actualIndex].summary}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>

      {/* DETAIL ARTICLE POPUP MODAL */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="modal-content glass-card" style={{ maxWidth: '640px', width: '92%', padding: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ position: 'relative', width: '100%', height: selectedArticle.videoUrl ? '340px' : '240px', background: '#000' }}>
              {selectedArticle.videoUrl ? (
                <video src={selectedArticle.videoUrl} controls autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src={selectedArticle.image} alt={selectedArticle.title} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <button 
                className="modal-close"
                onClick={() => setSelectedArticle(null)}
                style={{ 
                  position: 'absolute', 
                  top: '1rem', 
                  right: '1rem', 
                  background: 'rgba(0,0,0,0.6)', 
                  border: 'none', 
                  color: 'white', 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer' 
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <span className="news-source-badge">{selectedArticle.source}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedArticle.pubDateStr}</span>
                {selectedArticle.lang === 'en' && <span className="lang-badge"><Languages size={10} /> Tiếng Anh</span>}
              </div>
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.35, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                {selectedArticle.title}
              </h3>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '1.5rem' }}>
                {selectedArticle.description}
              </p>

              {/* Action for AI summary inside modal */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button
                  onClick={(e) => handleAiTranslate(selectedArticle.index, selectedArticle, e)}
                  disabled={loadingAi[selectedArticle.index]}
                  className="ai-btn"
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}
                >
                  {loadingAi[selectedArticle.index] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  <span>{selectedArticle.aiResult ? 'Đóng Nhận Định 🐷' : 'Dịch & Nhận Định AI 🐷'}</span>
                </button>
                <a 
                  href={selectedArticle.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="source-btn"
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}
                >
                  Xem nguồn gốc <ExternalLink size={12} />
                </a>
              </div>

              {/* AI result inside modal */}
              {(selectedArticle.aiResult || expandedAi[selectedArticle.index]) && (
                <div className="magazine-ai-box animate-scale-up" style={{ margin: 0 }}>
                  <div className="ai-box-header">
                    <img src="/drpig_mascot.png" alt="Drpig AI" className="ai-avatar" />
                    <span>Drpig Dịch & Nhận Định 🐷</span>
                  </div>
                  <h4 className="ai-box-title" style={{ fontSize: '0.85rem' }}>{(selectedArticle.aiResult || expandedAi[selectedArticle.index]).translatedTitle}</h4>
                  <p className="ai-box-desc" style={{ fontSize: '0.78rem', lineHeight: 1.45 }}>{(selectedArticle.aiResult || expandedAi[selectedArticle.index]).summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
