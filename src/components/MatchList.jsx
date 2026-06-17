import { useState } from 'react';
import { predictMatch } from '../utils/aiPredictor';
import { convertToUserTimezone } from '../services/worldcup26api';
import { useLiveMatchClock } from '../services/useLiveMatchClock';

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
    const dateStr = match.localDateObj.toLocaleDateString('vi-VN', {
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
      match.home?.name || 'Unknown',
      match.away?.name || 'Unknown',
      0,
      0,
      'UPCOMING',
      0
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
          Lịch thi đấu & Tỷ số
        </h3>
        {liveCount > 0 && (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-danger/20 bg-danger/10 text-danger text-[10px] font-black uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
            {liveCount} Trực tiếp
          </span>
        )}
      </div>

      {/* AI Prediction Performance Tracker */}
      {finishedMatches.length > 0 && (
        <div className="p-4 bg-gradient-to-br from-primary-container/10 to-tertiary-container/10 border border-white/50 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-secondary tracking-wide flex items-center gap-1">
              🤖 HIỆU SUẤT DỰ ĐOÁN AI (TRACK RECORD)
            </span>
            <span className="text-[9px] text-on-surface-variant/70 font-semibold">
              Mô hình ELO & Poisson
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black text-on-background tracking-tighter flex items-center gap-0.5">
              🎯 {accuracyRate}%
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-on-surface leading-none mb-1">
                Đúng {correctCount} trên {finishedMatches.length} trận đã kết thúc
              </div>
              <div className="text-[10px] text-on-surface-variant/85 leading-tight">
                Tỷ lệ chính xác dựa trên dự đoán pre-match trước giờ bóng lăn.
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
          <span className="text-[10px] font-bold text-on-surface-variant/70 whitespace-nowrap uppercase">Bảng đấu:</span>
          <select 
            value={selectedGroupFilter} 
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs font-bold text-on-surface outline-none cursor-pointer focus:ring-0 p-0"
          >
            <option value="ALL" className="bg-[#f2f4f6] text-on-background">Tất cả các bảng (A - L)</option>
            {Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i)).map(g => (
              <option key={g} value={g} className="bg-[#f2f4f6] text-on-background">Bảng {g}</option>
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
          Tất cả
        </button>
        <button 
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
            activeTab === 'LIVE' 
              ? 'bg-white/95 text-primary shadow-sm' 
              : 'text-on-surface-variant hover:bg-white/20 hover:text-on-surface'
          }`}
          onClick={() => setActiveTab('LIVE')}
        >
          <span>Live</span>
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
          Sắp đá
        </button>
        <button 
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
            activeTab === 'FINISHED' 
              ? 'bg-white/95 text-primary shadow-sm' 
              : 'text-on-surface-variant hover:bg-white/20 hover:text-on-surface'
          }`}
          onClick={() => setActiveTab('FINISHED')}
        >
          Đã xong
        </button>
      </div>

      {/* Grouped matches list */}
      <div className="flex flex-col divide-y divide-white/25 max-h-[600px] overflow-y-auto pr-1">
        {Object.keys(groupedMatches).length === 0 ? (
          <div className="py-12 text-center text-xs text-on-surface-variant/80 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[36px] text-outline">shield_alert</span>
            <p className="font-bold">Không có trận đấu nào trong mục này</p>
          </div>
        ) : (
          Object.keys(groupedMatches).map((dateHeader) => (
            <div key={dateHeader} className="flex flex-col">
              {/* Date Header: livescores.com style */}
              <div className="py-2.5 px-1 text-[11px] font-black text-on-surface-variant/80 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="material-symbols-outlined text-[15px] text-secondary">calendar_today</span>
                <span>{dateHeader}</span>
              </div>

              <div className="flex flex-col gap-1.5 pb-3">
                {groupedMatches[dateHeader].map((match) => {
                  const isLive = match.status === 'LIVE';
                  const isFinished = match.status === 'FINISHED';
                  const isSelected = match.id === activeMatchId;
                  const isBookmarked = user?.bookmarks?.includes(match.id);
                  
                  const prediction = predictMatch(
                    match.home?.name || 'Unknown',
                    match.away?.name || 'Unknown',
                    match.homeScore,
                    match.awayScore,
                    match.status,
                    match.minute
                  );
                  const { homeWin, draw, awayWin } = prediction.probabilities;

                  const kickoffHour = match.localDateObj.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  });

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
                            title={isBookmarked ? 'Bỏ theo dõi' : 'Theo dõi trận đấu'}
                          >
                            <span 
                              className="material-symbols-outlined text-[14px]"
                              style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              star
                            </span>
                          </button>
                          <span className="text-[9px] font-bold text-on-surface-variant/70 uppercase">
                            Bảng {match.group}
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
                              alt={match.home.name} 
                              className="w-5 h-3.5 object-cover rounded shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <span className="text-xs font-semibold truncate max-w-[80px] sm:max-w-[120px]">{match.home.name}</span>
                          </div>
                          {(isLive || isFinished) && (
                            <span className="text-xs font-black font-mono">{match.homeScore}</span>
                          )}
                        </div>
                        <div className={`flex items-center justify-between ${match.awayScore > match.homeScore && isFinished ? 'font-bold' : 'text-on-surface-variant/90'}`}>
                          <div className="flex items-center gap-2">
                            <img 
                              src={`https://flagcdn.com/w40/${match.away.flag}.png`} 
                              alt={match.away.name} 
                              className="w-5 h-3.5 object-cover rounded shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <span className="text-xs font-semibold truncate max-w-[80px] sm:max-w-[120px]">{match.away.name}</span>
                          </div>
                          {(isLive || isFinished) && (
                            <span className="text-xs font-black font-mono">{match.awayScore}</span>
                          )}
                        </div>
                      </div>

                      {/* Right odds & AI prediction column */}
                      <div className="col-span-3 flex flex-col items-end gap-1.5 pl-1 border-l border-white/20">
                        <span className="text-[9px] text-on-surface-variant/75 text-right font-medium">
                          AI: {homeWin}%|{awayWin}%
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
          ))
        )}
      </div>
    </div>
  );
}
