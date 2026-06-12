import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart2, ListTodo, Users, BadgePercent, ArrowUp, ArrowDown, MessageSquare, ThumbsUp, Newspaper, Loader2, RefreshCw } from 'lucide-react';
import { getDrpigPrediction, getDynamicSocialReactions } from '../services/gemini';

export default function MatchDetail({ match, onAddBet, activeBetId, onClose }) {
  const [activeTab, setActiveTab] = useState('ODDS'); // STATS, TIMELINE, LINEUPS, ODDS, NEWS
  const [aiPrediction, setAiPrediction] = useState('');
  const [aiReactions, setAiReactions] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // Reset tab to ODDS when match changes
  useEffect(() => {
    setActiveTab('ODDS');
    setAiPrediction('');
    setAiReactions([]);
  }, [match.id]);

  // Fetch AI insights when news tab is selected
  useEffect(() => {
    if (activeTab === 'NEWS' && !aiPrediction) {
      fetchAiInsights();
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
            <div className="context-news-list">
              {loadingAi ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="news-card shimmer" style={{ height: 94, border: 'none' }}></div>
                ))
              ) : (
                <>
                  {/* Dynamic Gemini Reactions */}
                  {aiReactions && aiReactions.length > 0 && (
                    aiReactions.map((item, i) => (
                      <div key={`ai-react-${i}`} className="news-card">
                        <div className="news-body">
                          <div className="news-card-header">
                            <span className="news-card-source">{item.source}</span>
                            <span className="news-card-time">{item.time}</span>
                          </div>
                          <h4 className="news-card-title">{item.title}</h4>
                          <p className="news-card-summary">{item.summary}</p>
                          <div className="news-card-engagement">
                            <span><ThumbsUp size={10} /> {item.upvotes?.toLocaleString()}</span>
                            <span><MessageSquare size={10} /> {item.comments?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Fallback Static News */}
                  {(!aiReactions || aiReactions.length === 0) && news && news.length > 0 && (
                    news.map((item, i) => (
                      <div key={`static-news-${i}`} className="news-card">
                        {item.image && (
                          <img src={item.image} alt={item.title} className="news-img" />
                        )}
                        <div className="news-body">
                          <div className="news-card-header">
                            <span className="news-card-source">
                              {item.source.includes('Reddit') ? 'Facebook - CĐV Việt Nam' : item.source.includes('X ') ? 'TikTok @vietnam_football' : item.source}
                            </span>
                            <span className="news-card-time">{item.time}</span>
                          </div>
                          <h4 className="news-card-title">{item.title}</h4>
                          <p className="news-card-summary">{item.summary}</p>
                          <div className="news-card-engagement">
                            <span><ThumbsUp size={10} /> {item.upvotes?.toLocaleString()}</span>
                            <span><MessageSquare size={10} /> {item.comments?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))
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
      </div>
    </div>
  );
}
