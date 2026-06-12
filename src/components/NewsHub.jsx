import React, { useState, useEffect } from 'react';
import { fetchRssFeeds } from '../services/rss';
import { translateAndSummarizeNews } from '../services/gemini';
import { Newspaper, Loader2, Sparkles, Languages, ExternalLink } from 'lucide-react';

export default function NewsHub() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAi, setExpandedAi] = useState({}); // Stores AI translated content per article
  const [loadingAi, setLoadingAi] = useState({}); // Stores loading state per article

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

  const handleAiTranslate = async (index, article) => {
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="card news-hub-card">
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
            padding: '0.3rem 0.75rem',
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

      <div style={{ padding: '1.25rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', gap: '1rem', color: 'var(--text-secondary)' }}>
            <Loader2 size={36} className="animate-spin text-primary" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Đang cào dữ liệu tin tức nóng hổi từ VnExpress, Bongdaplus và ESPN...</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="betslip-empty-state">
            <Newspaper size={36} />
            <p>Không có tin tức nào được cập nhật</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {articles.map((article, idx) => {
              const hasAiResult = !!expandedAi[idx];
              const isAiLoading = !!loadingAi[idx];
              const isEn = article.lang === 'en';

              return (
                <div key={idx} className="news-card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <img 
                      src={article.image} 
                      alt={article.title} 
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '10px' }} 
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                              {article.source}
                            </span>
                            {isEn && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', background: 'var(--bg-accent)', color: 'var(--primary)', fontSize: '0.65rem', fontWeight: 800, padding: '1px 4px', borderRadius: '4px' }}>
                                <Languages size={10} /> Tiếng Anh
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{article.pubDateStr}</span>
                        </div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem', lineHeight: 1.35 }}>
                          {article.title}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {article.description}
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleAiTranslate(idx, article)}
                          disabled={isAiLoading}
                          className="mode-btn"
                          style={{
                            background: hasAiResult ? 'var(--primary)' : 'var(--bg-accent)',
                            color: hasAiResult ? 'white' : 'var(--primary)',
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.65rem',
                            border: '1px solid rgba(255, 45, 120, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            borderRadius: '6px'
                          }}
                        >
                          {isAiLoading ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Drpig đang dịch...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={12} />
                              <span>{hasAiResult ? 'Đóng Tóm Tắt AI 🐷' : isEn ? 'Dịch & Tóm Tắt AI 🐷' : 'Drpig Tóm Tắt AI 🐷'}</span>
                            </>
                          )}
                        </button>

                        <a 
                          href={article.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mode-btn"
                          style={{
                            background: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.65rem',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            borderRadius: '6px'
                          }}
                        >
                          <ExternalLink size={12} />
                          <span>Xem nguồn</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* AI translated and summarized card */}
                  {hasAiResult && (
                    <div style={{
                      marginTop: '0.25rem',
                      background: 'linear-gradient(135deg, var(--bg-accent), #ffeaf2)',
                      border: '1.5px solid rgba(255, 45, 120, 0.15)',
                      borderRadius: '12px',
                      padding: '0.85rem',
                      animation: 'scaleUp 0.2s ease-out'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.35rem' }}>
                        <img src="/drpig_mascot.png" alt="Drpig AI" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                        <span>Nhận định nhanh từ Drpig AI 🐷</span>
                      </div>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {expandedAi[idx].translatedTitle}
                      </h5>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                        {expandedAi[idx].summary}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
