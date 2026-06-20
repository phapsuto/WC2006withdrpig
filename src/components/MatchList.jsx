import React, { useState, useEffect } from 'react';
import { predictMatch } from '../utils/aiPredictor';
import { convertToUserTimezone } from '../services/worldcup26api';
import { useLiveMatchClock } from '../services/useLiveMatchClock';
import { useLanguage } from '../utils/LanguageContext';

function LiveClockDisplay({ minute, second, isLive }) {
  const clock = useLiveMatchClock(minute, second, isLive);
  return (
    <span className="text-secondary font-black text-xs flex items-center gap-1">
      <span className="w-1.5 h-1.5 bg-danger rounded-full animate-pulse"></span>
      {clock.formatted}
    </span>
  );
}


export default function MatchList({ matches = [], onSelectMatch, activeMatchId, user, onToggleBookmark }) {
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, LIVE, UPCOMING, FINISHED
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL'); // ALL, A, B, C, ... L
  const { language, t } = useLanguage();
  const [apiStatus, setApiStatus] = useState(() => {
    // Check if mode is explicitly DEMO in localStorage
    try {
      const saved = window.localStorage.getItem('football_app_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.apiMode === 'DEMO') {
          return { online: false, message: 'mô phỏng' };
        }
      }
    } catch { /* ignore */ }
    return { online: true, message: '' };
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const matchListRef = React.useRef(null);
  const hasScrolledToToday = React.useRef(false);

  // Mark initial load complete once we have matches
  useEffect(() => {
    if (matches.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [matches, isInitialLoad]);

  // Auto-scroll to today's date group when matches first load
  useEffect(() => {
    if (matches.length > 0 && !hasScrolledToToday.current && matchListRef.current) {
      hasScrolledToToday.current = true;
      // Find today's date header and scroll to it
      setTimeout(() => {
        const todayEl = matchListRef.current?.querySelector('[data-today="true"]');
        if (todayEl) {
          todayEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, [matches]);

  useEffect(() => {
    const handleStatusChange = (e) => {
      if (e.detail) {
        setApiStatus(e.detail);
      }
    };
    window.addEventListener('football-api-status', handleStatusChange);
    return () => window.removeEventListener('football-api-status', handleStatusChange);
  }, []);

  // 1. Process matches to add localDateObj (User local time)
  const processedMatches = matches.map(match => {
    const localDateObj = convertToUserTimezone(match.date, match.stadiumId);
    return {
      ...match,
      localDateObj
    };
  });

  // 2. Filter matches by status tab and group filter
  const filteredMatches = processedMatches.filter((match) => {
    // Status tab filter
    let statusMatch = true;
    if (activeTab === 'LIVE') statusMatch = match.status === 'LIVE';
    else if (activeTab === 'UPCOMING') statusMatch = match.status === 'UPCOMING';
    else if (activeTab === 'FINISHED') statusMatch = match.status === 'FINISHED';

    // Group filter
    let groupMatch = true;
    if (selectedGroupFilter !== 'ALL') {
      groupMatch = match.group === selectedGroupFilter;
    }

    return statusMatch && groupMatch;
  });

  // 3. Sort chronologically by local date & time
  filteredMatches.sort((a, b) => a.localDateObj - b.localDateObj);

  // 4. Group matches by local date string
  const groupedMatches = {};
  filteredMatches.forEach(match => {
    const dateStr = match.localDateObj.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    if (!groupedMatches[dateStr]) {
      groupedMatches[dateStr] = [];
    }
    groupedMatches[dateStr].push(match);
  });

  const liveCount = matches.filter(m => m.status === 'LIVE').length;

  // Calculate AI historic accuracy rate
  const finishedMatches = matches.filter(m => m.status === 'FINISHED');
  let correctCount = 0;

  finishedMatches.forEach(match => {
    let actualOutcome = 'DRAW';
    if (match.homeScore > match.awayScore) actualOutcome = 'HOME_WIN';
    else if (match.homeScore < match.awayScore) actualOutcome = 'AWAY_WIN';

    const prediction = predictMatch(
      match.home?.nameEn || match.home?.name || 'Unknown',
      match.away?.nameEn || match.away?.name || 'Unknown',
      0,
      0,
      'UPCOMING',
      0,
      matches,
      match.odds
    );
    const { homeWin, draw, awayWin } = prediction.probabilities;

    let predictedOutcome = 'DRAW';
    if (homeWin > draw && homeWin > awayWin) {
      predictedOutcome = 'HOME_WIN';
    } else if (awayWin > homeWin && awayWin > draw) {
      predictedOutcome = 'AWAY_WIN';
    }

    if (predictedOutcome === actualOutcome) {
      correctCount++;
    }
  });

  const accuracyRate = finishedMatches.length > 0 
    ? ((correctCount / finishedMatches.length) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="bento-glass p-6 flex flex-col gap-4">
      {/* Card Header */}
      <div className="flex justify-between items-center pb-2 border-b border-white/40">
        <h3 className="font-bold text-base flex items-center gap-1.5 text-primary">
          <span className="material-symbols-outlined text-[20px] text-primary">trophy</span>
          {t('scheduleAndScores')}
        </h3>
        {liveCount > 0 && (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-danger/20 bg-danger/10 text-danger text-[10px] font-black uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
            {t('liveCountText', { count: liveCount })}
          </span>
        )}
      </div>

      {/* API Connection Warning Banner */}
      {!apiStatus.online && (
        <div 
          className="flex items-start gap-2.5 p-3.5 rounded-2xl text-[11px] leading-snug animate-fade-in shadow-inner"
          style={{ 
            backgroundColor: apiStatus.message?.includes('mô phỏng') ? 'rgba(0, 122, 255, 0.08)' : 'rgba(255, 149, 0, 0.1)', 
            border: apiStatus.message?.includes('mô phỏng') ? '1px solid rgba(0, 122, 255, 0.2)' : '1px solid rgba(255, 149, 0, 0.25)', 
            color: apiStatus.message?.includes('mô phỏng') ? '#005ecb' : '#a35f00' 
          }}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0" style={{ color: apiStatus.message?.includes('mô phỏng') ? '#007aff' : '#ff9500' }}>
            {apiStatus.message?.includes('mô phỏng') ? 'science' : 'signal_wifi_off'}
          </span>
          <div className="flex-1">
            <span className="font-black block mb-0.5" style={{ color: apiStatus.message?.includes('mô phỏng') ? '#0051b0' : '#b86b00' }}>
              {apiStatus.message?.includes('mô phỏng') ? 'Chế độ mô phỏng' : 'Mất kết nối API bóng đá'}
            </span>
            {apiStatus.message?.includes('mô phỏng') 
              ? 'Ứng dụng đang hiển thị các trận đấu giả lập để kiểm thử tính năng.' 
              : `Đang hiển thị dữ liệu lưu đệm thực tế gần nhất và tự động kết nối lại... (${apiStatus.message || 'Lỗi kết nối'})`}
          </div>
        </div>
      )}

      {/* AI Prediction Performance Tracker */}
      {finishedMatches.length > 0 && (
        <div className="p-4 bg-gradient-to-br from-primary-container/10 to-tertiary-container/10 border border-white/50 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-secondary tracking-wide flex items-center gap-1">
              {t('aiTrackRecord')}
            </span>
            <span className="text-[9px] text-on-surface-variant/70 font-semibold">
              {t('eloPoissonModels')}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black text-on-background tracking-tighter flex items-center gap-0.5">
              🎯 {accuracyRate}%
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-on-surface leading-none mb-1">
                {t('aiAccuracyText', { correct: correctCount, total: finishedMatches.length })}
              </div>
              <div className="text-[10px] text-on-surface-variant/85 leading-tight">
                {t('aiAccuracyDesc')}
              </div>
            </div>
          </div>
          
          <div className="h-1.5 w-full bg-white/50 rounded-full overflow-hidden border border-white/20">
            <div 
              style={{ width: `${accuracyRate}%` }} 
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
            ></div>
          </div>
        </div>
      )}

      {/* Filters Area */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Group Filter */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-white/40 border border-white/50 rounded-xl">
          <span className="text-[10px] font-bold text-on-surface-variant/70 whitespace-nowrap uppercase">{t('groupFilterLabel')}</span>
          <select 
            value={selectedGroupFilter} 
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs font-bold text-on-surface outline-none cursor-pointer focus:ring-0 p-0"
          >
            <option value="ALL" className="bg-[#f2f4f6] text-on-background">{t('allGroupsOption')}</option>
            {Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i)).map(g => (
              <option key={g} value={g} className="bg-[#f2f4f6] text-on-background">{t('groupLabel', { group: g })}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex gap-1 p-1 bg-white/40 border border-white/50 rounded-xl">
        <button 
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
            activeTab === 'ALL' 
              ? 'bg-white/95 text-primary shadow-sm' 
              : 'text-on-surface-variant hover:bg-white/20 hover:text-on-surface'
          }`}
          onClick={() => setActiveTab('ALL')}
        >
          {t('tabAll')}
        </button>
        <button 
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
            activeTab === 'LIVE' 
              ? 'bg-white/95 text-primary shadow-sm' 
              : 'text-on-surface-variant hover:bg-white/20 hover:text-on-surface'
          }`}
          onClick={() => setActiveTab('LIVE')}
        >
          <span>{t('tabLive')}</span>
          {liveCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-ping"></span>
          )}
        </button>
        <button 
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
            activeTab === 'UPCOMING' 
              ? 'bg-white/95 text-primary shadow-sm' 
              : 'text-on-surface-variant hover:bg-white/20 hover:text-on-surface'
          }`}
          onClick={() => setActiveTab('UPCOMING')}
        >
          {t('tabUpcoming')}
        </button>
        <button 
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
            activeTab === 'FINISHED' 
              ? 'bg-white/95 text-primary shadow-sm' 
              : 'text-on-surface-variant hover:bg-white/20 hover:text-on-surface'
          }`}
          onClick={() => setActiveTab('FINISHED')}
        >
          {t('tabFinished')}
        </button>
      </div>

      {/* Grouped matches list */}
      <div ref={matchListRef} className="flex flex-col divide-y divide-white/25 max-h-[600px] overflow-y-auto pr-1">
        {Object.keys(groupedMatches).length === 0 ? (
          isInitialLoad ? (
            <div className="py-12 text-center text-xs text-on-surface-variant/80 flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[36px] text-primary animate-spin" style={{animationDuration:'2s'}}>sports_soccer</span>
              <p className="font-bold text-primary">Đang tải dữ liệu trận đấu...</p>
              <p className="text-[10px] text-on-surface-variant/60">Kết nối Sportmonks API</p>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-on-surface-variant/80 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[36px] text-outline">info</span>
              <p className="font-bold">{t('noMatchesInCategory')}</p>
            </div>
          )
        ) : (
          Object.keys(groupedMatches).map((dateHeader) => {
            // Check if this date group is today
            const todayStr = new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
              weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric'
            });
            const isToday = dateHeader === todayStr;
            return (
            <div key={dateHeader} className="flex flex-col" data-today={isToday ? 'true' : undefined}>
              {/* Date Header: livescores.com style */}
              <div className={`py-2.5 px-1 text-[11px] font-black flex items-center gap-1.5 uppercase tracking-wide ${isToday ? 'text-primary' : 'text-on-surface-variant/80'}`}>
                <span className={`material-symbols-outlined text-[15px] ${isToday ? 'text-primary' : 'text-secondary'}`}>{isToday ? 'today' : 'calendar_today'}</span>
                <span>{dateHeader}{isToday ? ' — HÔM NAY' : ''}</span>
              </div>

              <div className="flex flex-col gap-1.5 pb-3">
                {groupedMatches[dateHeader].map((match) => {
                  const isLive = match.status === 'LIVE';
                  const isFinished = match.status === 'FINISHED';
                  const isSelected = match.id === activeMatchId;
                  const isBookmarked = user?.bookmarks?.includes(match.id);
                  
                  const prediction = predictMatch(
                    match.home?.nameEn || match.home?.name || 'Unknown',
                    match.away?.nameEn || match.away?.name || 'Unknown',
                    match.homeScore,
                    match.awayScore,
                    match.status,
                    match.minute,
                    matches,
                    match.odds
                  );
                  const { homeWin, awayWin } = prediction.probabilities;

                  const kickoffHour = match.localDateObj.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  });

                  const homeName = language === 'vi' ? match.home.name : match.home.nameEn;
                  const awayName = language === 'vi' ? match.away.name : match.away.nameEn;

                  return (
                    <div 
                      key={match.id} 
                      className={`grid grid-cols-12 items-center p-3 rounded-2xl cursor-pointer transition-all border border-transparent ${
                        isSelected 
                          ? 'bg-primary-fixed/20 border-l-4 border-l-primary shadow-sm' 
                          : 'bg-white/40 hover:bg-white/70 border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.01)]'
                      }`}
                      onClick={() => onSelectMatch(match.id)}
                    >
                      {/* Left status / kickoff / bookmark column */}
                      <div className="col-span-3 flex flex-col gap-1 pr-1 border-r border-white/20">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleBookmark(match.id);
                            }}
                            className={`flex items-center justify-center p-0.5 rounded-full hover:bg-white/50 transition-colors ${
                              isBookmarked ? 'text-secondary' : 'text-outline/60'
                            }`}
                            title={isBookmarked ? t('unfollow') : t('followMatch')}
                          >
                            <span 
                              className="material-symbols-outlined text-[14px]"
                              style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              star
                            </span>
                          </button>
                          <span className="text-[9px] font-bold text-on-surface-variant/70 uppercase">
                            {t('groupLabel', { group: match.group })}
                          </span>
                        </div>
                        
                        {isLive ? (
                          <LiveClockDisplay minute={match.minute} second={match.second || 0} isLive={isLive} />
                        ) : isFinished ? (
                          <span className="text-xs font-bold text-on-surface-variant/80">FT</span>
                        ) : (
                          <span className="text-xs font-black text-secondary">
                            {kickoffHour}
                          </span>
                        )}
                      </div>

                      {/* Middle team names / scores column */}
                      <div className="col-span-6 flex flex-col gap-1 px-2.5">
                        <div className={`flex items-center justify-between ${match.homeScore > match.awayScore && isFinished ? 'font-bold' : 'text-on-surface-variant/90'}`}>
                          <div className="flex items-center gap-2">
                            <img 
                              src={`https://flagcdn.com/w40/${match.home.flag}.png`} 
                              alt={homeName} 
                              className="w-5 h-3.5 object-cover rounded shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                              onError={(e) => { 
                                if (match.home.logo) {
                                  e.target.onerror = () => { e.target.style.display = 'none'; };
                                  e.target.src = match.home.logo;
                                  e.target.className = 'w-5 h-5 object-contain rounded';
                                } else {
                                  e.target.style.display = 'none';
                                }
                              }}
                            />
                            <span className="text-xs font-semibold truncate max-w-[80px] sm:max-w-[120px]">{homeName}</span>
                          </div>
                          {(isLive || isFinished) && (
                            <span className="text-xs font-black font-mono">{match.homeScore}</span>
                          )}
                        </div>
                        <div className={`flex items-center justify-between ${match.awayScore > match.homeScore && isFinished ? 'font-bold' : 'text-on-surface-variant/90'}`}>
                          <div className="flex items-center gap-2">
                            <img 
                              src={`https://flagcdn.com/w40/${match.away.flag}.png`} 
                              alt={awayName} 
                              className="w-5 h-3.5 object-cover rounded shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                              onError={(e) => { 
                                if (match.away.logo) {
                                  e.target.onerror = () => { e.target.style.display = 'none'; };
                                  e.target.src = match.away.logo;
                                  e.target.className = 'w-5 h-5 object-contain rounded';
                                } else {
                                  e.target.style.display = 'none';
                                }
                              }}
                            />
                            <span className="text-xs font-semibold truncate max-w-[80px] sm:max-w-[120px]">{awayName}</span>
                          </div>
                          {(isLive || isFinished) && (
                            <span className="text-xs font-black font-mono">{match.awayScore}</span>
                          )}
                        </div>
                      </div>

                      {/* Right odds & AI prediction column */}
                      <div className="col-span-3 flex flex-col items-end gap-1.5 pl-1 border-l border-white/20">
                        <span className="text-[9px] text-on-surface-variant/75 text-right font-medium">
                          {t('aiProbText', { home: homeWin, away: awayWin })}
                        </span>
                        <span className="bg-primary-fixed/40 border border-primary/10 text-primary px-1.5 py-0.5 rounded-lg text-[10px] font-black font-mono">
                          1: {match.odds.h2h.home.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
          })
        )}
      </div>
    </div>
  );
}
