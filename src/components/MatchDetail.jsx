import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart2, ListTodo, Users, BadgePercent, ArrowUp, ArrowDown, MessageSquare, ThumbsUp, Newspaper, Loader2, RefreshCw, Cpu, CheckCircle2, Share2 } from 'lucide-react';
import { getDrpigPrediction, getDynamicSocialReactions, getSportsAnalytics } from '../services/gemini';

const getSocialAvatar = (source, index) => {
  const AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
  ];
  const srcLower = source.toLowerCase();
  if (srcLower.includes('romano') || srcLower.includes('sky') || srcLower.includes('espn') || srcLower.includes('goal')) {
    return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80';
  }
  if (srcLower.includes('quân') || srcLower.includes('cương') || srcLower.includes('huy')) {
    return 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80';
  }
  return AVATARS[index % AVATARS.length];
};

const SOCCER_CLIPS = [
  '/videos/clip_1.mp4',
  '/videos/clip_2.mp4',
  '/videos/clip_3.mp4',
  '/videos/clip_4.mp4'
];

export default function MatchDetail({ match, onAddBet, activeBetId, onClose }) {
  const [activeTab, setActiveTab] = useState('ODDS'); // STATS, TIMELINE, LINEUPS, ODDS, NEWS, ANALYTICS
  const [aiPrediction, setAiPrediction] = useState('');
  const [aiReactions, setAiReactions] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedSocial, setSelectedSocial] = useState(null);

  // Reset tab to ODDS when match changes
  useEffect(() => {
    setActiveTab('ODDS');
    setAiPrediction('');
    setAiReactions([]);
    setAnalyticsData(null);
    setSelectedSocial(null);
  }, [match.id]);

  // Fetch AI insights when tabs are selected
  useEffect(() => {
    if (activeTab === 'NEWS' && !aiPrediction) {
      fetchAiInsights();
    }
    if (activeTab === 'ANALYTICS' && !analyticsData) {
      fetchAnalytics();
    }
  }, [match.id, activeTab]);

  const fetchAiInsights = async () => {
    setLoadingAi(true);
    try {
      const pred = await getDrpigPrediction(match);
      setAiPrediction(pred);
      const react = await getDynamicSocialReactions(match);
      setAiReactions(react);
    } catch (e) {
      console.error('Lỗi khi tải thông tin từ Gemini:', e);
    } finally {
      setLoadingAi(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await getSportsAnalytics(match);
      setAnalyticsData(data);
    } catch (e) {
      console.error('Lỗi khi tải AI Phân tích xG:', e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const { home, away, homeScore, awayScore, status, minute, league, stats, timeline, lineups, odds, news } = match;

  const isLive = status === 'LIVE';
  const isFinished = status === 'FINISHED';

  // Helper to show odds direction transition arrows
  const renderOddsArrow = (market, outcome) => {
    const direction = odds._direction?.[market]?.[outcome];
    if (direction === 'up') return <ArrowUp size={12} className="text-secondary" style={{ marginLeft: 4 }} />;
    if (direction === 'down') return <ArrowDown size={12} className="text-danger" style={{ marginLeft: 4 }} />;
    return null;
  };

  const getOddsClass = (market, outcome) => {
    const direction = odds._direction?.[market]?.[outcome];
    if (direction === 'up') return 'up';
    if (direction === 'down') return 'down';
    return '';
  };

  return (
    <div className="card match-detail-view">
      <div className="match-detail-header">
        <button className="back-to-list" onClick={onClose}>
          <ArrowLeft size={14} /> Quay lại
        </button>
        <span className="detail-league">{league.name}</span>
        
        <div className="detail-scoreboard">
          <div className="scoreboard-team">
            <img 
              src={`https://flagcdn.com/w80/${home.flag}.png`} 
              alt={home.name} 
              className="scoreboard-team-flag" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="scoreboard-team-name">{home.name}</span>
          </div>

          {(isLive || isFinished) ? (
            <div className="scoreboard-score">
              {homeScore} <span className="scoreboard-divider">-</span> {awayScore}
            </div>
          ) : (
            <div className="scoreboard-score" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
              VS
            </div>
          )}

          <div className="scoreboard-team">
            <img 
              src={`https://flagcdn.com/w80/${away.flag}.png`} 
              alt={away.name} 
              className="scoreboard-team-flag" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="scoreboard-team-name">{away.name}</span>
          </div>
        </div>

        <span className={`detail-status-badge ${isLive ? 'live' : ''}`}>
          {isLive ? `Trực tiếp • ${minute}'` : isFinished ? 'Kết thúc' : 'Sắp diễn ra'}
        </span>
      </div>

      <div className="detail-tabs">
        <button 
          className={`detail-tab ${activeTab === 'ODDS' ? 'active' : ''}`}
          onClick={() => setActiveTab('ODDS')}
        >
          <BadgePercent size={14} style={{ marginRight: 6 }} /> Kèo cược
        </button>
        <button 
          className={`detail-tab ${activeTab === 'ANALYTICS' ? 'active' : ''}`}
          onClick={() => setActiveTab('ANALYTICS')}
        >
          <Cpu size={14} style={{ marginRight: 6 }} /> AI Phân tích xG
        </button>
        <button 
          className={`detail-tab ${activeTab === 'STATS' ? 'active' : ''}`}
          onClick={() => setActiveTab('STATS')}
        >
          <BarChart2 size={14} style={{ marginRight: 6 }} /> Thống kê
        </button>
        <button 
          className={`detail-tab ${activeTab === 'TIMELINE' ? 'active' : ''}`}
          onClick={() => setActiveTab('TIMELINE')}
        >
          <ListTodo size={14} style={{ marginRight: 6 }} /> Diễn biến
        </button>
        <button 
          className={`detail-tab ${activeTab === 'NEWS' ? 'active' : ''}`}
          onClick={() => setActiveTab('NEWS')}
        >
          <Newspaper size={14} style={{ marginRight: 6 }} /> MXH & Tin tức
        </button>
        <button 
          className={`detail-tab ${activeTab === 'LINEUPS' ? 'active' : ''}`}
          onClick={() => setActiveTab('LINEUPS')}
        >
          <Users size={14} style={{ marginRight: 6 }} /> Đội hình
        </button>
      </div>

      <div className="detail-content">
        {/* ODDS TAB */}
        {activeTab === 'ODDS' && (
          <div className="odds-detail-section">
            <div>
              <div className="odds-card-header">Kèo Châu Âu (1X2)</div>
              <div className="odds-grid">
                <button 
                  className={`odd-button ${activeBetId === `${match.id}-1x2-home` ? 'selected' : ''}`}
                  onClick={() => onAddBet(match, `1X2 - ${home.name}`, odds.h2h.home, `${match.id}-1x2-home`)}
                >
                  <span className="odd-label">{home.name}</span>
                  <span className={`odd-value ${getOddsClass('h2h', 'home')}`}>
                    {odds.h2h.home.toFixed(2)}
                    {renderOddsArrow('h2h', 'home')}
                  </span>
                </button>
                <button 
                  className={`odd-button ${activeBetId === `${match.id}-1x2-draw` ? 'selected' : ''}`}
                  onClick={() => onAddBet(match, '1X2 - Hòa', odds.h2h.draw, `${match.id}-1x2-draw`)}
                >
                  <span className="odd-label">Hòa</span>
                  <span className={`odd-value ${getOddsClass('h2h', 'draw')}`}>
                    {odds.h2h.draw.toFixed(2)}
                    {renderOddsArrow('h2h', 'draw')}
                  </span>
                </button>
                <button 
                  className={`odd-button ${activeBetId === `${match.id}-1x2-away` ? 'selected' : ''}`}
                  onClick={() => onAddBet(match, `1X2 - ${away.name}`, odds.h2h.away, `${match.id}-1x2-away`)}
                >
                  <span className="odd-label">{away.name}</span>
                  <span className={`odd-value ${getOddsClass('h2h', 'away')}`}>
                    {odds.h2h.away.toFixed(2)}
                    {renderOddsArrow('h2h', 'away')}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <div className="odds-card-header">Kèo Châu Á (Handicap {odds.handicap.line})</div>
              <div className="odds-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <button 
                  className={`odd-button ${activeBetId === `${match.id}-handicap-home` ? 'selected' : ''}`}
                  onClick={() => onAddBet(match, `Chấp ${odds.handicap.line} - ${home.name}`, odds.handicap.home, `${match.id}-handicap-home`)}
                >
                  <span className="odd-label">{home.name} ({odds.handicap.line})</span>
                  <span className={`odd-value ${getOddsClass('handicap', 'home')}`}>
                    {odds.handicap.home.toFixed(2)}
                    {renderOddsArrow('handicap', 'home')}
                  </span>
                </button>
                <button 
                  className={`odd-button ${activeBetId === `${match.id}-handicap-away` ? 'selected' : ''}`}
                  onClick={() => onAddBet(match, `Được chấp ${odds.handicap.line.startsWith('-') ? odds.handicap.line.replace('-', '+') : `-${odds.handicap.line}`} - ${away.name}`, odds.handicap.away, `${match.id}-handicap-away`)}
                >
                  <span className="odd-label">{away.name} ({odds.handicap.line.startsWith('-') ? odds.handicap.line.replace('-', '+') : `-${odds.handicap.line}`})</span>
                  <span className={`odd-value ${getOddsClass('handicap', 'away')}`}>
                    {odds.handicap.away.toFixed(2)}
                    {renderOddsArrow('handicap', 'away')}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <div className="odds-card-header">Tài Xỉu (Over/Under {odds.overUnder.line})</div>
              <div className="odds-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <button 
                  className={`odd-button ${activeBetId === `${match.id}-ou-over` ? 'selected' : ''}`}
                  onClick={() => onAddBet(match, `Tài ${odds.overUnder.line}`, odds.overUnder.over, `${match.id}-ou-over`)}
                >
                  <span className="odd-label">Tài ({odds.overUnder.line})</span>
                  <span className={`odd-value ${getOddsClass('overUnder', 'over')}`}>
                    {odds.overUnder.over.toFixed(2)}
                    {renderOddsArrow('overUnder', 'over')}
                  </span>
                </button>
                <button 
                  className={`odd-button ${activeBetId === `${match.id}-ou-under` ? 'selected' : ''}`}
                  onClick={() => onAddBet(match, `Xỉu ${odds.overUnder.line}`, odds.overUnder.under, `${match.id}-ou-under`)}
                >
                  <span className="odd-label">Xỉu ({odds.overUnder.line})</span>
                  <span className={`odd-value ${getOddsClass('overUnder', 'under')}`}>
                    {odds.overUnder.under.toFixed(2)}
                    {renderOddsArrow('overUnder', 'under')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'STATS' && (
          <div className="stats-container">
            {stats ? (
              Object.keys(stats).map((key) => {
                const labelMap = {
                  possession: "Kiểm soát bóng (%)",
                  shots: "Tổng số cú sút",
                  shotsOnTarget: "Sút trúng đích",
                  fouls: "Phạm lỗi",
                  corners: "Phạt góc",
                  yellowCards: "Thẻ vàng",
                  redCards: "Thẻ đỏ"
                };
                const valHome = stats[key].home;
                const valAway = stats[key].away;
                const total = valHome + valAway === 0 ? 1 : valHome + valAway;
                const pctHome = (valHome / total) * 100;
                
                return (
                  <div key={key} className="stat-row">
                    <div className="stat-label-container">
                      <span className="stat-value">{valHome}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {labelMap[key] || key}
                      </span>
                      <span className="stat-value">{valAway}</span>
                    </div>
                    <div className="stat-bar-bg">
                      <div className="stat-bar-home" style={{ width: `${pctHome}%` }}></div>
                      <div className="stat-bar-away" style={{ width: `${100 - pctHome}%` }}></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="betslip-empty-state">Chưa có thông số thống kê cho trận đấu này.</div>
            )}
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'TIMELINE' && (
          <div className="timeline-container">
            {timeline && timeline.length > 0 ? (
              timeline.map((event, i) => (
                <div key={i} className={`timeline-event ${event.type === 'GOAL' ? 'live-goal' : ''}`}>
                  <span className="event-time">{event.minute}'</span>
                  <div className="event-details">
                    <div>
                      <strong style={{ marginRight: 8 }}>
                        {event.type === 'GOAL' ? '⚽ Bàn thắng!' : event.type === 'RED' ? '🟥 Thẻ đỏ' : '🟨 Thẻ vàng'}
                      </strong>
                      <span style={{ color: 'var(--text-primary)' }}>{event.detail}</span>
                    </div>
                    <span className={`event-team-indicator ${event.team}`}>
                      {event.team === 'home' ? home.short : away.short}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="betslip-empty-state">Trận đấu chưa có diễn biến đặc biệt nào.</div>
            )}
          </div>
        )}

        {/* NEWS & AI REACTION TAB */}
        {activeTab === 'NEWS' && (
          <div className="news-tab-container">
            {/* Drpig AI Prediction Card */}
            <div className="ai-prediction-card">
              <div className="ai-prediction-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <img src="/drpig_mascot.png" alt="Drpig AI" style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid var(--primary)' }} />
                  <strong>Nhận Định AI từ Drpig 🐷</strong>
                </div>
                <button 
                  onClick={fetchAiInsights} 
                  disabled={loadingAi}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}
                  title="Cập nhật nhận định mới"
                >
                  <RefreshCw size={14} className={loadingAi ? 'animate-spin' : ''} />
                </button>
              </div>
              
              {loadingAi ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.5rem 0' }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Drpig đang soi kèo và suy nghĩ...</span>
                </div>
              ) : (
                <p className="ai-prediction-text">
                  {aiPrediction || 'Drpig đang nghiên cứu trận đấu này. Click nút xoay để xem nhận định của heo 🐷!'}
                </p>
              )}
            </div>

            {/* Social Reactions & News feed */}
            <div className="context-news-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {loadingAi ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="news-card shimmer" style={{ height: 120, border: 'none' }}></div>
                ))
              ) : (
                <>
                  {/* Dynamic Gemini Reactions */}
                  {aiReactions && aiReactions.length > 0 && (
                    aiReactions.map((item, i) => {
                      const videoUrl = item.hasVideo ? SOCCER_CLIPS[i % SOCCER_CLIPS.length] : null;

                      return (
                        <div key={`ai-react-${i}`} className="social-post-card card glass-card" onClick={() => setSelectedSocial({ ...item, videoUrl })}>
                          <div className="social-post-header">
                            <div className="social-post-author-info">
                              <div className="social-post-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                                <img src={getSocialAvatar(item.source, i)} alt={item.source} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                              <div className="social-post-meta">
                                <span className="social-post-author-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                  {item.source}
                                  <CheckCircle2 size={12} fill="#1d9bf0" color="white" />
                                </span>
                                <span className="social-post-time">{item.time}</span>
                              </div>
                            </div>
                            {videoUrl && (
                              <span style={{ fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                CLIP 🎥
                              </span>
                            )}
                          </div>

                          <div className="social-post-title">{item.title}</div>
                          <p className="social-post-summary">{item.summary}</p>

                          {videoUrl && (
                            <div className="social-post-video-container" onClick={(e) => e.stopPropagation()}>
                              <video src={videoUrl} controls autoPlay muted loop playsInline className="social-post-video" />
                            </div>
                          )}

                          <div className="social-post-engagement">
                            <div className="social-post-engagement-item">
                              <ThumbsUp size={12} />
                              <span>{item.upvotes?.toLocaleString()}</span>
                            </div>
                            <div className="social-post-engagement-item">
                              <MessageSquare size={12} />
                              <span>{item.comments?.toLocaleString()}</span>
                            </div>
                            <div className="social-post-engagement-item" style={{ marginLeft: 'auto' }}>
                              <Share2 size={12} />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Fallback Static News */}
                  {(!aiReactions || aiReactions.length === 0) && news && news.length > 0 && (
                    news.map((item, i) => {
                      const videoUrl = i % 2 === 0 ? SOCCER_CLIPS[i % SOCCER_CLIPS.length] : null;
                      const resolvedSource = item.source.includes('Reddit') ? 'Facebook - CĐV Việt Nam' : item.source.includes('X ') ? 'TikTok @vietnam_football' : item.source;
                      return (
                        <div key={`static-news-${i}`} className="social-post-card card glass-card" onClick={() => setSelectedSocial({ ...item, videoUrl })}>
                          <div className="social-post-header">
                            <div className="social-post-author-info">
                              <div className="social-post-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                                <img src={getSocialAvatar(resolvedSource, i)} alt={resolvedSource} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                              <div className="social-post-meta">
                                <span className="social-post-author-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                  {resolvedSource}
                                  <CheckCircle2 size={12} fill="#1d9bf0" color="white" />
                                </span>
                                <span className="social-post-time">{item.time}</span>
                              </div>
                            </div>
                            {videoUrl && (
                              <span style={{ fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                CLIP 🎥
                              </span>
                            )}
                          </div>
                          
                          <div className="social-post-title">{item.title}</div>
                          <p className="social-post-summary">{item.summary}</p>

                          {videoUrl && (
                            <div className="social-post-video-container" onClick={(e) => e.stopPropagation()}>
                              <video src={videoUrl} controls autoPlay muted loop playsInline className="social-post-video" />
                            </div>
                          )}
                          
                          <div className="social-post-engagement">
                            <div className="social-post-engagement-item">
                              <ThumbsUp size={12} />
                              <span>{item.upvotes?.toLocaleString()}</span>
                            </div>
                            <div className="social-post-engagement-item">
                              <MessageSquare size={12} />
                              <span>{item.comments?.toLocaleString()}</span>
                            </div>
                            <div className="social-post-engagement-item" style={{ marginLeft: 'auto' }}>
                              <Share2 size={12} />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* LINEUPS TAB */}
        {activeTab === 'LINEUPS' && (
          <div className="lineups-container">
            {lineups ? (
              <>
                <div className="lineup-split-view">
                  <div className="lineup-column">
                    <h4>
                      <img 
                        src={`https://flagcdn.com/w40/${home.flag}.png`} 
                        alt={home.name} 
                        className="team-flag" 
                        style={{ width: 18, height: 12 }} 
                      /> 
                      {home.name}
                    </h4>
                    <div className="player-list">
                      {lineups.home.map((player) => (
                        <div key={player.number} className="player-row">
                          <div className="player-info-left">
                            <span className="player-jersey-icon" style={{ backgroundColor: home.color || 'var(--primary)', color: home.textColor || 'white' }}>
                              {player.number}
                            </span>
                            <span>{player.name}</span>
                          </div>
                          <span className="player-role-badge">{player.role || 'MF'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="lineup-column">
                    <h4>
                      <img 
                        src={`https://flagcdn.com/w40/${away.flag}.png`} 
                        alt={away.name} 
                        className="team-flag" 
                        style={{ width: 18, height: 12 }} 
                      /> 
                      {away.name}
                    </h4>
                    <div className="player-list">
                      {lineups.away.map((player) => (
                        <div key={player.number} className="player-row">
                          <div className="player-info-left">
                            <span className="player-jersey-icon" style={{ backgroundColor: away.color || 'var(--secondary)', color: away.textColor || 'white' }}>
                              {player.number}
                            </span>
                            <span>{player.name}</span>
                          </div>
                          <span className="player-role-badge">{player.role || 'MF'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tactical Pitch Board */}
                <div className="tactical-pitch-wrapper">
                  <div className="tactical-pitch-title">Sa bàn Chiến thuật Trực quan</div>
                  <div className="tactical-pitch">
                    {/* Pitch markings */}
                    <div className="pitch-center-line"></div>
                    <div className="pitch-center-circle"></div>
                    <div className="pitch-penalty-area-top"></div>
                    <div className="pitch-penalty-area-bottom"></div>

                    {/* Home Team Players (bottom half of screen) */}
                    {lineups.home.map((player) => (
                      <div 
                        key={`home-${player.number}`} 
                        className="pitch-player"
                        style={{ left: `${player.x}%`, top: `${player.y}%` }}
                        title={`${player.name} (#${player.number})`}
                      >
                        <span className="pitch-player-shirt" style={{ backgroundColor: home.color || 'var(--primary)', color: home.textColor || 'white' }}>
                          {player.number}
                        </span>
                        <span className="pitch-player-name">{player.name.split(' ').pop()}</span>
                      </div>
                    ))}

                    {/* Away Team Players (top half of screen - y inverted) */}
                    {lineups.away.map((player) => (
                      <div 
                        key={`away-${player.number}`} 
                        className="pitch-player"
                        style={{ left: `${player.x}%`, top: `${100 - player.y}%` }}
                        title={`${player.name} (#${player.number})`}
                      >
                        <span className="pitch-player-shirt" style={{ backgroundColor: away.color || 'var(--secondary)', color: away.textColor || 'white' }}>
                          {player.number}
                        </span>
                        <span className="pitch-player-name">{player.name.split(' ').pop()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="betslip-empty-state">
                Đội hình ra sân chưa được cập nhật.
              </div>
            )}
          </div>
        )}

        {/* AI ANALYTICS TAB */}
        {activeTab === 'ANALYTICS' && (
          <div className="analytics-tab-container" style={{ padding: '0.5rem 0' }}>
            {loadingAnalytics ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.85rem' }}>Drpig đang phân tích xG, SHAP và tối ưu vốn Kelly...</span>
              </div>
            ) : analyticsData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* 1. Expected Goals (xG) Section */}
                <div className="analytics-card" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h4 className="analytics-card-title" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    ⚽ Chỉ số bàn thắng kỳ vọng (xG)
                  </h4>
                  <div className="xg-comparison-container" style={{ margin: '0.75rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 700 }}>
                      <span style={{ color: 'var(--primary)' }}>{home.name}: {analyticsData.homeXG?.toFixed(2)} xG</span>
                      <span style={{ color: 'var(--secondary)' }}>{away.name}: {analyticsData.awayXG?.toFixed(2)} xG</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="stat-bar-bg" style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
                      <div className="stat-bar-home" style={{ width: `${(analyticsData.homeXG / (analyticsData.homeXG + analyticsData.awayXG || 1)) * 100}%`, background: 'var(--primary)' }}></div>
                      <div className="stat-bar-away" style={{ width: `${(analyticsData.awayXG / (analyticsData.homeXG + analyticsData.awayXG || 1)) * 100}%`, background: 'var(--secondary)' }}></div>
                    </div>
                  </div>
                  <p className="ai-prediction-text" style={{ fontSize: '0.75rem', lineHeight: 1.45, margin: 0, color: 'var(--text-secondary)' }}>
                    {analyticsData.xgTimeline}
                  </p>
                </div>

                {/* 2. Kelly Criterion Section */}
                <div className="analytics-card" style={{ border: '1px solid rgba(46, 204, 113, 0.25)', background: 'rgba(46, 204, 113, 0.04)', padding: '1rem', borderRadius: '8px' }}>
                  <h4 className="analytics-card-title" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#2ecc71', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    📈 Quản lý vốn Kelly Criterion
                  </h4>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ background: '#2ecc71', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '6px', textAlign: 'center', minWidth: 90 }}>
                      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 800, opacity: 0.9 }}>Tỷ lệ vốn</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{analyticsData.kellyCriterion?.stakePercent}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Kèo khuyên bắt:</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {analyticsData.kellyCriterion?.recommendedBet}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                    <img src="/drpig_mascot.png" alt="Drpig AI" style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--primary)' }} />
                    <p style={{ fontSize: '0.75rem', margin: 0, lineHeight: 1.4, fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                      {analyticsData.kellyCriterion?.rationale}
                    </p>
                  </div>
                </div>

                {/* 3. SHAP Explainability Section */}
                <div className="analytics-card" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h4 className="analytics-card-title" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    🤖 Trọng số quyết định của mô hình (SHAP)
                  </h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Các yếu tố tác động trực tiếp đến xác suất dự đoán của mô hình AI:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {analyticsData.shapExplainability?.map((item, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
                          <span style={{ color: 'var(--text-primary)' }}>{item.factor}</span>
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.weight}%</span>
                        </div>
                        <div style={{ background: 'var(--border)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ background: 'var(--primary)', height: '100%', width: `${item.weight}%`, borderRadius: 3 }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="betslip-empty-state">Không thể tải dữ liệu phân tích. Vui lòng thử lại.</div>
            )}
          </div>
        )}
      </div>

      {/* SOCIAL POST DETAIL MODAL */}
      {selectedSocial && (
        <div className="modal-overlay" onClick={() => setSelectedSocial(null)}>
          <div className="modal-content glass-card" style={{ maxWidth: '540px', width: '90%', padding: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ position: 'relative', width: '100%', height: selectedSocial.videoUrl ? '320px' : '200px', background: '#000' }}>
              {selectedSocial.videoUrl ? (
                <video src={selectedSocial.videoUrl} controls autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--bg-accent), #ffd8e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/drpig_mascot.png" alt="Mascot" style={{ width: 80, height: 80, opacity: 0.8 }} />
                </div>
              )}
              <button 
                className="modal-close"
                onClick={() => setSelectedSocial(null)}
                style={{ 
                  position: 'absolute', 
                  top: '1rem', 
                  right: '1rem', 
                  background: 'rgba(0,0,0,0.6)', 
                  border: 'none', 
                  color: 'white', 
                  width: 30, 
                  height: 30, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer' 
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="news-source-badge">{selectedSocial.source}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedSocial.time}</span>
              </div>
              
              <h4 style={{ fontSize: '1.1rem', fontWeight: 900, lineHeight: 1.35, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                {selectedSocial.title}
              </h4>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                {selectedSocial.summary}
              </p>

              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <span>👍 {selectedSocial.upvotes?.toLocaleString()} Thích</span>
                <span>💬 {selectedSocial.comments?.toLocaleString()} Bình luận</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
