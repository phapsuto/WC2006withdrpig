import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { convertToUserTimezone } from '../services/worldcup26api';
import { useLiveMatchClock } from '../services/useLiveMatchClock';
import { useLanguage } from '../utils/LanguageContext';
import { Bell, ChevronRight, CalendarDays, Trophy } from 'lucide-react';
import { Segmented, DatePicker, ConfigProvider, Skeleton } from 'antd';

function LiveClockDisplay({ minute, second, isLive }) {
  const clock = useLiveMatchClock(minute, second, isLive);
  return (
    <span className="m-status live animate-pulse">
      {clock.formatted}
    </span>
  );
}

const MatchSkeleton = () => (
  <div className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-3 overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] bg-gray-50/50">
      <Skeleton.Button active size="small" shape="round" className="w-[60px]" />
      <Skeleton.Button active size="small" shape="circle" className="w-[24px] h-[24px]" />
    </div>
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3 w-[40%]">
        <Skeleton.Button active size="small" className="w-20" />
        <Skeleton.Avatar active size="default" shape="circle" />
      </div>
      <div className="flex flex-col items-center justify-center w-[20%] gap-1">
        <Skeleton.Input active size="small" className="w-16 h-8 !rounded-md" />
        <Skeleton.Button active size="small" className="w-10 h-4" />
      </div>
      <div className="flex items-center gap-3 w-[40%] justify-end">
        <Skeleton.Avatar active size="default" shape="circle" />
        <Skeleton.Button active size="small" className="w-20" />
      </div>
    </div>
  </div>
);


// ─── Smart Empty State Component ─────────────────────────────────────────────
function LeagueEmptyState({ leagueStatus, seasonInfo, activeTab, setActiveTab }) {
  const leagueName = seasonInfo?.leagueName || 'Giải đấu này';

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  // If user is filtering by LIVE/FINISHED/UPCOMING and there are no results
  if (activeTab !== 'ALL' && (leagueStatus === 'ACTIVE')) {
    const tabLabels = {
      LIVE: { icon: '⚽', title: 'Không có trận đấu trực tiếp', desc: 'Hiện tại không có trận đấu nào đang diễn ra. Hãy thử lại sau hoặc xem lịch sắp tới.' },
      FINISHED: { icon: '🏁', title: 'Chưa có trận đấu hoàn thành', desc: 'Chưa có trận đấu nào kết thúc trong khoảng thời gian được chọn.' },
      UPCOMING: { icon: '📅', title: 'Chưa có lịch thi đấu', desc: 'Chưa có trận đấu nào được lên lịch cho giai đoạn tới.' },
    };
    const info = tabLabels[activeTab] || tabLabels.LIVE;
    return (
      <div className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-[300px] flex flex-col items-center justify-center p-8 text-center border border-[#f0f0f0]">
        <div className="flex flex-col items-center gap-3 max-w-[300px]">
          <div className="text-4xl mb-1">{info.icon}</div>
          <h3 className="text-[16px] font-bold text-[var(--365-text-main)]">{info.title}</h3>
          <p className="text-[13px] text-[var(--365-text-sub)] leading-relaxed">{info.desc}</p>
          <button onClick={() => setActiveTab('ALL')} className="mt-3 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-full text-[13px] transition-colors">
            Xem tất cả trận đấu
          </button>
        </div>
      </div>
    );
  }

  // OFF_SEASON: Mùa giải đã kết thúc
  if (leagueStatus === 'OFF_SEASON') {
    const endDate = formatDate(seasonInfo?.endingAt);
    return (
      <div className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden border border-[#f0f0f0]">
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 pt-8 pb-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-orange-100">
            <span className="text-3xl">🏆</span>
          </div>
          <h3 className="text-[17px] font-bold text-[#151e22] mb-1">Mùa giải đã kết thúc</h3>
          <p className="text-[13px] text-[#6b7173] leading-relaxed max-w-[280px]">
            <span className="font-semibold text-[#151e22]">{leagueName}</span>
            {seasonInfo?.name ? ` (${seasonInfo.name})` : ''} đã kết thúc
            {endDate ? ` vào ngày ${endDate}` : ''}.
            Mùa giải mới chưa có lịch chính thức.
          </p>
        </div>
        <div className="px-6 py-4 flex flex-col gap-2 bg-white">
          <div className="flex items-center gap-2 text-[12px] text-[#6b7173]">
            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
            Đang trong giai đoạn nghỉ hè (off-season)
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[#6b7173]">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            Lịch mùa giải mới sẽ được cập nhật khi có thông báo chính thức
          </div>
        </div>
      </div>
    );
  }

  // UPCOMING_SEASON: Mùa giải chưa bắt đầu
  if (leagueStatus === 'UPCOMING_SEASON') {
    const startDate = formatDate(seasonInfo?.startingAt);
    return (
      <div className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden border border-[#f0f0f0]">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 pt-8 pb-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-blue-100">
            <span className="text-3xl">🗓️</span>
          </div>
          <h3 className="text-[17px] font-bold text-[#151e22] mb-1">Mùa giải chưa bắt đầu</h3>
          <p className="text-[13px] text-[#6b7173] leading-relaxed max-w-[280px]">
            <span className="font-semibold text-[#151e22]">{leagueName}</span>
            {seasonInfo?.name ? ` (${seasonInfo.name})` : ''} sẽ khởi tranh
            {startDate ? ` vào ngày ${startDate}` : ' trong thời gian tới'}.
          </p>
          {startDate && (
            <div className="mt-4 px-4 py-2 bg-[#2194ff]/10 rounded-full">
              <span className="text-[13px] font-bold text-[#2194ff]">Khai mạc: {startDate}</span>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-white text-center">
          <p className="text-[12px] text-[#6b7173]">Lịch thi đấu sẽ được cập nhật tự động khi mùa giải bắt đầu.</p>
        </div>
      </div>
    );
  }

  // NO_MATCHES_IN_RANGE or ACTIVE with 0 filtered results (generic fallback)
  return (
    <div className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-[280px] flex flex-col items-center justify-center p-8 text-center border border-[#f0f0f0]">
      <div className="flex flex-col items-center gap-3 max-w-[300px]">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-1">
          <CalendarDays size={30} className="text-gray-400" />
        </div>
        <h3 className="text-[16px] font-bold text-[var(--365-text-main)]">Chưa có trận đấu</h3>
        <p className="text-[13px] text-[var(--365-text-sub)] leading-relaxed">
          {leagueName} hiện không có trận đấu nào trong thời gian này.
        </p>
        {activeTab !== 'ALL' && (
          <button onClick={() => setActiveTab('ALL')} className="mt-2 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-full text-[13px] transition-colors">
            Xem tất cả trận đấu
          </button>
        )}
      </div>
    </div>
  );
}

export default function MatchList({ groupedMatches = { popular: [], countries: [] }, matches = [], leagueStatus = 'ACTIVE', seasonInfo = null, onSelectMatch, activeMatchId, user, onToggleBookmark, selectedDate, onDateChange, isLoadingMatches = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('filter') || 'ALL'; // ALL, LIVE, FINISHED, UPCOMING, SAVED
  const [expandedCountries, setExpandedCountries] = useState({});
  
  const setActiveTab = (val) => {
    setSearchParams(prev => {
      prev.set('filter', val);
      return prev;
    });
  };

  const { language, t } = useLanguage();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if ((groupedMatches.popular.length > 0 || groupedMatches.countries.length > 0) && isInitialLoad) {
      setTimeout(() => setIsInitialLoad(false), 300);
    } else if (groupedMatches.popular.length === 0 && groupedMatches.countries.length === 0 && !isInitialLoad) {
      setIsInitialLoad(true);
      setTimeout(() => setIsInitialLoad(false), 600);
    }
  }, [groupedMatches, isInitialLoad]);

  const toggleCountry = (countryId) => {
    setExpandedCountries(prev => ({
      ...prev,
      [countryId]: !prev[countryId]
    }));
  };

  // Helper to filter matches inside a league based on activeTab
  const filterLeagueMatches = (leagueMatches) => {
    return leagueMatches.map(match => {
      const localDateObj = convertToUserTimezone(match.date, match.stadiumId);
      return { ...match, localDateObj };
    }).filter((match) => {
      if (activeTab === 'SAVED') return user?.savedMatches?.includes(match.id);
      if (activeTab === 'LIVE') return match.status === 'LIVE';
      if (activeTab === 'UPCOMING') return match.status === 'UPCOMING';
      if (activeTab === 'FINISHED') return match.status === 'FINISHED';
      return true;
    }).sort((a, b) => a.localDateObj - b.localDateObj);
  };

  // Render a single match row
  const renderMatchRow = (match) => {
    const isSaved = user?.savedMatches?.includes(match.id);
    const isSelected = match.id === activeMatchId;
    const homeName = language === 'vi' ? match.home.name : match.home.nameEn || match.home.name;
    const awayName = language === 'vi' ? match.away.name : match.away.nameEn || match.away.name;

    return (
      <div 
        key={match.id}
        onClick={() => onSelectMatch(match.id)}
        className={`match-row-365 ${isSelected ? 'bg-orange-50/50' : ''}`}
        style={isSelected ? { borderLeft: '4px solid rgb(234, 76, 137)' } : { borderLeft: '4px solid transparent' }}
      >
        <div className="flex items-center justify-center">
          <Bell 
            size={16} 
            className={`cursor-pointer transition-colors ${isSaved ? 'text-[#ea4c89] fill-[#ea4c89]' : 'text-gray-300 hover:text-gray-400'}`} 
            onClick={(e) => { e.stopPropagation(); onToggleBookmark(match.id); }}
          />
        </div>

        <div className="flex items-center justify-center">
          {match.status === 'LIVE' ? (
            <LiveClockDisplay minute={match.minute} second={match.second || 0} isLive={true} />
          ) : match.status === 'FINISHED' ? (
            <span className="m-status">FT</span>
          ) : (
            <span className="m-status">
              {match.localDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          )}
        </div>

        <div className="m-team home">
          <span className={match.status === 'FINISHED' && match.homeScore > match.awayScore ? 'font-semibold' : ''}>{homeName}</span>
          <img src={match.home.flag !== 'xx' ? `https://flagcdn.com/w40/${match.home.flag}.png` : 'https://www.svgrepo.com/show/475656/google-color.svg'} alt={homeName} className="m-logo" />
        </div>

        <div className={`m-score ${match.status === 'LIVE' ? 'live' : ''}`}>
          {match.status === 'UPCOMING' ? '-' : `${match.homeScore} - ${match.awayScore}`}
        </div>

        <div className="m-team away">
          <img src={match.away.flag !== 'xx' ? `https://flagcdn.com/w40/${match.away.flag}.png` : 'https://www.svgrepo.com/show/475656/google-color.svg'} alt={awayName} className="m-logo" />
          <span className={match.status === 'FINISHED' && match.awayScore > match.homeScore ? 'font-semibold' : ''}>{awayName}</span>
        </div>
      </div>
    );
  };
  // Render a league block
  const renderLeague = (league, isPopular = false) => {
    const filteredMatches = filterLeagueMatches(league.matches);
    if (filteredMatches.length === 0) return null;

    return (
      <div key={league.leagueId} className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden mb-3">
        <div className="league-header-365 flex justify-between items-center cursor-pointer hover:bg-gray-50 border-b border-[#f5f5f5]">
          <div className="flex items-center gap-2">
            {league.leagueLogo ? (
              <img src={league.leagueLogo} alt={league.leagueName} className="w-5 h-5 object-contain" />
            ) : (
              <Trophy size={16} className="text-[#e3b044]" />
            )}
            <div className="flex flex-col">
              <span className="text-[11px] text-[#6b7173] leading-tight">{league.countryName}</span>
              <span className="title leading-tight">{league.leagueName}</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </div>

        {/* Match Rows */}
        <div className="flex flex-col">
          {filteredMatches.map(renderMatchRow)}
        </div>
        
        {isPopular && (
          <div className="py-2 text-center border-t border-[#f5f5f5] bg-gray-50/30 hover:bg-gray-50 cursor-pointer text-[var(--color-primary)] text-[13px] font-medium transition-colors">
            Xem chi tiết {league.leagueName}
          </div>
        )}
      </div>
    );
  };

  const hasAnyMatches = groupedMatches.popular.length > 0 || groupedMatches.countries.length > 0;

  // Generate date list for DatePicker strip (-3 days to +3 days)
  const getDatesStrip = () => {
    const dates = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const isToday = i === 0;
      const isYesterday = i === -1;
      const isTomorrow = i === 1;
      
      let label = `${d.getDate()}/${d.getMonth() + 1}`;
      if (isToday) label = 'Hôm nay';
      else if (isYesterday) label = 'Hôm qua';
      else if (isTomorrow) label = 'Ngày mai';
      else {
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        label = `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
      }

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');

      dates.push({
        value: `${year}-${month}-${day}`,
        label,
        isToday
      });
    }
    return dates;
  };

  return (
    <div className="w-full h-full flex flex-col gap-3">
      
      {/* 365Scores Date / Filter Strip */}
      <div className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        
        {/* Date Strip Component */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar p-2 border-b border-[#f0f0f0] whitespace-nowrap">
          <button 
            onClick={() => { 
              onDateChange('today'); 
              setActiveTab(activeTab === 'LIVE' ? 'ALL' : 'LIVE'); 
            }}
            className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors flex items-center gap-1 shrink-0 ${activeTab === 'LIVE' ? 'text-white border-transparent' : 'bg-transparent text-[#ff495c] border-[#ff495c] hover:bg-red-50'}`}
            style={activeTab === 'LIVE' ? { background: 'linear-gradient(to right, rgb(234, 76, 137), rgb(255, 140, 66))' } : {}}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === 'LIVE' ? 'bg-white' : 'bg-[#ff495c]'} animate-pulse`}></div>
            TRỰC TIẾP
          </button>
          
          <div className="w-[1px] h-4 bg-gray-300 mx-1 shrink-0"></div>

          {getDatesStrip().map(d => {
            const isActive = (selectedDate === d.value) || (selectedDate === 'today' && d.isToday);
            return (
              <button 
                key={d.value}
                onClick={() => {
                  onDateChange(d.isToday ? 'today' : d.value);
                  setActiveTab('ALL');
                }}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors shrink-0 ${isActive ? 'text-white border-transparent' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
                style={isActive ? { background: 'linear-gradient(to right, rgb(234, 76, 137), rgb(255, 140, 66))' } : {}}
              >
                {d.label}
              </button>
            );
          })}

          <DatePicker 
            className="border-none shadow-none font-semibold text-[var(--color-primary)] cursor-pointer w-0 p-0 m-0 overflow-hidden" 
            onChange={(date, dateString) => dateString && onDateChange(dateString)}
            id="hidden-datepicker"
          />
          <button 
            onClick={() => document.getElementById('hidden-datepicker').click()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 shrink-0 ml-1"
          >
            <CalendarDays size={16} />
          </button>
        </div>

        <div className="flex items-center p-2 overflow-x-auto no-scrollbar">
          <div className="min-w-max">
            <Segmented 
            options={[
              { label: t('tabAll') || 'Tất cả', value: 'ALL' },
              { label: 'Đã lưu', value: 'SAVED' },
              { label: t('tabFinished') || 'Đã kết thúc', value: 'FINISHED' },
              { label: t('tabUpcoming') || 'Lịch thi đấu', value: 'UPCOMING' }
            ]}
            value={activeTab === 'LIVE' ? 'ALL' : activeTab} // If Live is selected via red button, don't mess up Segmented
            onChange={(v) => setActiveTab(v)}
            className="font-semibold bg-gray-100 p-1"
          />
          </div>
        </div>
      </div>

      {/* Matches List */}
      <div className="flex flex-col gap-4 pb-20">
        {isLoadingMatches || isInitialLoad ? (
          <div className="flex flex-col gap-2">
            <MatchSkeleton />
            <MatchSkeleton />
            <MatchSkeleton />
            <MatchSkeleton />
          </div>
        ) : !hasAnyMatches ? (
          <LeagueEmptyState
            leagueStatus={leagueStatus}
            seasonInfo={seasonInfo}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        ) : (
          <>
            {/* --- TRẬN ĐẤU THẾ GIỚI --- */}
            {groupedMatches.popular.length > 0 && (
              <div className="flex flex-col">
                {groupedMatches.popular.map(league => renderLeague(league, false))}
              </div>
            )}

            {/* --- TRẬN ĐẤU THEO QUỐC GIA --- */}
            {groupedMatches.countries.length > 0 && (
              <div className="flex flex-col mt-4">
                <h3 className="text-[13px] font-semibold text-[var(--365-text-main)] mb-3 uppercase tracking-wide px-1">
                  Trận đấu Bóng đá hôm nay theo Quốc gia
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {groupedMatches.countries.map(country => (
                    <div key={country.countryId} className="flex flex-col">
                      <div 
                        onClick={() => toggleCountry(country.countryId)}
                        className={`flex flex-col bg-white border rounded-[8px] p-3 cursor-pointer hover:shadow-sm transition-all`}
                        style={expandedCountries[country.countryId] ? { borderColor: 'rgb(234, 76, 137)', backgroundColor: '#fff5f7' } : { borderColor: '#e5e5e5' }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {country.flagUrl ? (
                            <img src={country.flagUrl} alt={country.countryName} className="w-5 h-5 rounded-full object-cover border border-gray-100" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-200" />
                          )}
                          <span className="font-semibold text-[14px] text-[var(--365-text-main)] truncate">{country.countryName}</span>
                        </div>
                        <div className="text-[12px] text-[var(--365-text-sub)]">
                          ({country.matchCount}) trận đấu
                        </div>
                      </div>
                      
                      {/* Xổ dọc các giải đấu của quốc gia này nếu được click */}
                      {expandedCountries[country.countryId] && (
                        <div className="mt-2 col-span-full bg-gray-50 p-2 rounded-[8px] animate-fade-in">
                          {country.leagues.map(league => renderLeague(league, false))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
