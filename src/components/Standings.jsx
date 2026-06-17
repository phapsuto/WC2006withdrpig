import { useState, useEffect } from 'react';
import { TEAMS } from '../services/simulator';
import { getGoogleSportsData } from '../services/gemini';
import { Loader2, Trophy, ChevronDown, ChevronUp, Star, Award, ShieldAlert } from 'lucide-react';
import { STADIUMS_INFO, convertToUserTimezone, TEAM_NAME_VI } from '../services/worldcup26api';

// Define all 12 groups with their team keys
const ALL_GROUPS = [
  { name: 'Bảng A', teams: ['MEX', 'KOR', 'RSA', 'CZE'] },
  { name: 'Bảng B', teams: ['CAN', 'BIH', 'QAT', 'SUI'] },
  { name: 'Bảng C', teams: ['BRA', 'MAR', 'SCO', 'HAI'] },
  { name: 'Bảng D', teams: ['USA', 'PAR', 'AUS', 'TUR'] },
  { name: 'Bảng E', teams: ['GER', 'CUR', 'CIV', 'ECU'] },
  { name: 'Bảng F', teams: ['NED', 'JPN', 'SWE', 'TUN'] },
  { name: 'Bảng G', teams: ['BEL', 'EGY', 'IRN', 'NZL'] },
  { name: 'Bảng H', teams: ['ESP', 'CPV', 'KSA', 'URU'] },
  { name: 'Bảng I', teams: ['FRA', 'SEN', 'IRQ', 'NOR'] },
  { name: 'Bảng J', teams: ['ARG', 'ALG', 'AUT', 'JOR'] },
  { name: 'Bảng K', teams: ['POR', 'COL', 'UZB', 'COD'] },
  { name: 'Bảng L', teams: ['ENG', 'CRO', 'GHA', 'PAN'] }
];

export default function Standings({ matches = [], isFullPage = false }) {
  const [activeTab, setActiveTab] = useState('STANDINGS');
  const [topScorers, setTopScorers] = useState([]);
  const [loadingScorers, setLoadingScorers] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL'); // ALL or Bảng A ... L
  const [expandedGroups, setExpandedGroups] = useState({});

  // Robust team lookup that matches on Name, Short code, or Flag code
  const findTeamKey = (team) => {
    if (!team) return null;
    const nameLower = team.name?.toLowerCase();
    const shortLower = team.short?.toLowerCase();
    const flagLower = team.flag?.toLowerCase();
    
    return Object.keys(TEAMS).find(k => {
      const t = TEAMS[k];
      return t.name.toLowerCase() === nameLower ||
             t.short.toLowerCase() === shortLower ||
             (t.flag && t.flag.toLowerCase() === flagLower);
    });
  };

  // Auto-expand groups that have matches played
  useEffect(() => {
    const expanded = {};
    ALL_GROUPS.forEach((group) => {
      const hasPlayedMatches = matches.some((match) => {
        const homeKey = findTeamKey(match.home);
        const awayKey = findTeamKey(match.away);
        return (
          (homeKey && group.teams.includes(homeKey)) ||
          (awayKey && group.teams.includes(awayKey))
        ) && (match.status === 'LIVE' || match.status === 'FINISHED');
      });
      expanded[group.name] = hasPlayedMatches || selectedGroupFilter !== 'ALL';
    });
    setTimeout(() => {
      setExpandedGroups(expanded);
    }, 0);
  }, [matches, selectedGroupFilter]);

  const fetchTopScorers = async () => {
    setLoadingScorers(true);
    try {
      const data = await getGoogleSportsData('TOP_SCORERS');
      if (data) setTopScorers(data);
    } catch (e) {
      console.error('Lỗi tải vua phá lưới:', e);
    } finally {
      setLoadingScorers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'TOP_SCORERS' && topScorers.length === 0) {
      fetchTopScorers();
    }
  }, [activeTab, topScorers.length]);

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const calculateGroupStats = (teamKeys) => {
    const stats = {};
    teamKeys.forEach((key) => {
      const team = TEAMS[key];
      if (!team) return;
      stats[key] = {
        key,
        name: team.name,
        flag: team.flag,
        played: 0,
        win: 0,
        draw: 0,
        loss: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0
      };
    });

    matches.forEach((match) => {
      const homeKey = findTeamKey(match.home);
      const awayKey = findTeamKey(match.away);

      if (!homeKey || !awayKey) return;
      if (!teamKeys.includes(homeKey) || !teamKeys.includes(awayKey)) return;
      if (!stats[homeKey] || !stats[awayKey]) return;

      if (match.status === 'LIVE' || match.status === 'FINISHED') {
        const homeScore = match.homeScore;
        const awayScore = match.awayScore;

        stats[homeKey].played += 1;
        stats[awayKey].played += 1;
        stats[homeKey].gf += homeScore;
        stats[homeKey].ga += awayScore;
        stats[awayKey].gf += awayScore;
        stats[awayKey].ga += homeScore;

        if (homeScore > awayScore) {
          stats[homeKey].win += 1;
          stats[homeKey].pts += 3;
          stats[awayKey].loss += 1;
        } else if (awayScore > homeScore) {
          stats[awayKey].win += 1;
          stats[awayKey].pts += 3;
          stats[homeKey].loss += 1;
        } else {
          stats[homeKey].draw += 1;
          stats[homeKey].pts += 1;
          stats[awayKey].draw += 1;
          stats[awayKey].pts += 1;
        }
      }
    });

    return Object.values(stats)
      .map(team => ({
        ...team,
        gd: team.gf - team.ga
      }))
      .sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });
  };

  const renderGroupTable = (sortedTeams, detailed = false) => {
    return (
      <div className="overflow-x-auto w-full no-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/45 text-on-surface-variant font-bold">
              <th className="py-2.5 px-2 text-center w-10">Hạng</th>
              <th className="py-2.5 px-2 min-w-[120px]">Đội tuyển</th>
              <th className="py-2.5 px-2 text-center w-8">Trận</th>
              {detailed && (
                <>
                  <th className="py-2.5 px-2 text-center w-8 hidden sm:table-cell">T</th>
                  <th className="py-2.5 px-2 text-center w-8 hidden sm:table-cell">H</th>
                  <th className="py-2.5 px-2 text-center w-8 hidden sm:table-cell">B</th>
                  <th className="py-2.5 px-2 text-center w-8 hidden md:table-cell">BT</th>
                  <th className="py-2.5 px-2 text-center w-8 hidden md:table-cell">BB</th>
                </>
              )}
              <th className="py-2.5 px-2 text-center w-10">HS</th>
              <th className="py-2.5 px-2 text-center w-10 font-black text-primary">Điểm</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, idx) => {
              const isPromotedZone = idx < 2; // top 2 go through
              return (
                <tr 
                  key={team.key} 
                  className={`border-b border-white/10 hover:bg-white/40 transition-colors ${
                    isPromotedZone ? 'bg-primary-fixed/15 font-semibold text-primary' : 'text-on-surface'
                  }`}
                >
                  <td className="py-2 px-2 text-center font-black">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-2 flex items-center gap-2 font-bold">
                    <img 
                      src={`https://flagcdn.com/w40/${team.flag}.png`} 
                      alt={team.name} 
                      className="w-5 h-3.5 object-cover rounded border border-black/5" 
                    />
                    <span className="truncate">{team.name}</span>
                  </td>
                  <td className="py-2 px-2 text-center">{team.played}</td>
                  {detailed && (
                    <>
                      <td className="py-2 px-2 text-center hidden sm:table-cell">{team.win}</td>
                      <td className="py-2 px-2 text-center hidden sm:table-cell">{team.draw}</td>
                      <td className="py-2 px-2 text-center hidden sm:table-cell">{team.loss}</td>
                      <td className="py-2 px-2 text-center hidden md:table-cell text-on-surface-variant/75">{team.gf}</td>
                      <td className="py-2 px-2 text-center hidden md:table-cell text-on-surface-variant/75">{team.ga}</td>
                    </>
                  )}
                  <td className={`py-2 px-2 text-center font-extrabold ${
                    team.gd > 0 ? 'text-tertiary' : team.gd < 0 ? 'text-secondary' : 'text-on-surface-variant/75'
                  }`}>
                    {team.gd > 0 ? `+${team.gd}` : team.gd}
                  </td>
                  <td className="py-2 px-2 text-center font-black text-sm">{team.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderGroupMatches = (groupCode) => {
    const groupMatches = matches.filter(m => m.group === groupCode);
    
    const processed = groupMatches.map(m => {
      const dateObj = convertToUserTimezone(m.date, m.stadiumId);
      return { ...m, dateObj };
    }).sort((a, b) => a.dateObj - b.dateObj);

    if (processed.length === 0) {
      return (
        <div className="text-xs text-on-surface-variant text-center py-8">
          Chưa có lịch thi đấu của bảng này
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto no-scrollbar">
        {processed.map(m => {
          const isLive = m.status === 'LIVE';
          const isFinished = m.status === 'FINISHED';
          const timeStr = m.dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          const dateStr = m.dateObj.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
          
          return (
            <div 
              key={m.id} 
              className="flex items-center justify-between p-2.5 bg-white/40 border border-white/50 rounded-xl text-[11px]"
            >
              <div className="flex flex-col w-[50px] leading-tight">
                <span className="color-secondary font-extrabold text-secondary">{timeStr}</span>
                <span className="text-on-surface-variant/75 text-[9px]">{dateStr}</span>
              </div>

              <div className="flex-1 flex flex-col gap-1 px-3">
                <div className="flex justify-between items-center">
                  <span className={isFinished && m.homeScore > m.awayScore ? 'font-bold' : ''}>{m.home.name}</span>
                  {(isLive || isFinished) && <span className="font-extrabold">{m.homeScore}</span>}
                </div>
                <div className="flex justify-between items-center">
                  <span className={isFinished && m.awayScore > m.homeScore ? 'font-bold' : ''}>{m.away.name}</span>
                  {(isLive || isFinished) && <span className="font-extrabold">{m.awayScore}</span>}
                </div>
              </div>

              <div className="w-[45px] text-right">
                {isLive ? (
                  <span className="px-2 py-0.5 rounded-full bg-danger/10 border border-danger/25 text-danger font-black text-[9px] animate-pulse">LIVE</span>
                ) : isFinished ? (
                  <span className="text-on-surface-variant/70 font-bold">FT</span>
                ) : (
                  <span className="text-on-surface-variant/65">Sắp đá</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderGroup = (group) => {
    const sortedTeams = calculateGroupStats(group.teams);
    const isExpanded = expandedGroups[group.name] || selectedGroupFilter !== 'ALL';
    const hasData = sortedTeams.some(t => t.played > 0);

    return (
      <div key={group.name} className="mb-2">
        <button
          onClick={() => toggleGroup(group.name)}
          className={`flex items-center justify-between w-full p-3 border rounded-xl transition-all ${
            hasData 
              ? 'bg-primary/10 border-primary/20 text-primary font-bold' 
              : 'bg-white/40 border-white/60 text-on-surface-variant'
          }`}
        >
          <span className="text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5">
            {group.name}
            {!hasData && <span className="text-[9px] font-normal lowercase opacity-75">(chưa đá)</span>}
          </span>
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {isExpanded && (
          <div className="mt-1.5 p-3 bg-white/30 border border-white/40 rounded-2xl">
            {renderGroupTable(sortedTeams, true)}
          </div>
        )}
      </div>
    );
  };

  // Render Full-Page Version
  if (isFullPage) {
    // Total goals in matches
    const totalGoals = matches.reduce((acc, m) => {
      if (m.status === 'LIVE' || m.status === 'FINISHED') {
        return acc + m.homeScore + m.awayScore;
      }
      return acc;
    }, 0);

    // Total yellow cards in matches
    const totalYellows = matches.reduce((acc, m) => {
      if (m.stats) {
        return acc + (m.stats.yellowCards?.home || 0) + (m.stats.yellowCards?.away || 0);
      }
      return acc;
    }, 0);

    return (
      <div className="space-y-6">
        {/* Banner header bento */}
        <div className="w-full p-8 rounded-2xl relative overflow-hidden flex flex-col justify-center gap-1 bg-gradient-to-r from-primary to-secondary text-white shadow-md">
          <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full font-bold text-xs uppercase tracking-wider w-fit mb-1">
            Mùa giải 2026
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter relative z-10 text-white">
            Bảng xếp hạng Giải đấu
          </h1>
          <p className="text-xs md:text-sm text-white/80 max-w-md relative z-10 font-semibold">
            Kết quả thi đấu, điểm số chi tiết của 12 bảng đấu từ A đến L tranh vé vào vòng knock-out 32 đội.
          </p>
        </div>

        {/* Rule explain guidelines */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-2.5 text-xs text-on-surface-variant leading-relaxed">
          <span className="material-symbols-outlined text-primary text-[18px]">info</span>
          <div>
            <strong>Thể thức đi tiếp:</strong> 48 đội tuyển được chia đều vào <strong>12 bảng đấu (A - L)</strong>.
            2 đội dẫn đầu mỗi bảng cùng với <strong>8 đội tuyển hạng ba có thành tích tốt nhất</strong> sẽ giành vé chính thức tiến vào Vòng loại trực tiếp 32 đội (Round of 32).
          </div>
        </div>

        {/* Horizontal Navigation Menu for Groups selector */}
        <div className="flex gap-2 p-1.5 bg-white/40 border border-white/50 rounded-2xl overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setSelectedGroupFilter('ALL')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border whitespace-nowrap ${
              selectedGroupFilter === 'ALL' 
                ? 'bg-white text-primary border-white/60 shadow-sm' 
                : 'text-on-surface-variant hover:text-primary hover:bg-white/20 border-transparent'
            }`}
          >
            Tất cả bảng
          </button>
          {ALL_GROUPS.map(g => (
            <button 
              key={g.name}
              onClick={() => setSelectedGroupFilter(g.name)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border whitespace-nowrap ${
                selectedGroupFilter === g.name 
                  ? 'bg-white text-primary border-white/60 shadow-sm' 
                  : 'text-on-surface-variant hover:text-primary hover:bg-white/20 border-transparent'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Grid display contents */}
        {selectedGroupFilter === 'ALL' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ALL_GROUPS.map(group => {
              const sortedTeams = calculateGroupStats(group.teams);
              return (
                <div key={group.name} className="bento-glass p-5 flex flex-col gap-4">
                  <h3 className="text-xs font-black text-secondary uppercase tracking-wider border-b border-white/40 pb-2 flex justify-between items-center">
                    <span>{group.name}</span>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">Lượt 3/3</span>
                  </h3>
                  {renderGroupTable(sortedTeams, true)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Standings list */}
            <div className="bento-glass p-6 lg:col-span-8 space-y-4">
              <h3 className="text-sm font-black text-secondary uppercase tracking-wider border-b border-white/40 pb-2.5">
                Bảng xếp hạng chi tiết - {selectedGroupFilter}
              </h3>
              {renderGroupTable(calculateGroupStats(ALL_GROUPS.find(g => g.name === selectedGroupFilter).teams), true)}
              
              <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-on-surface-variant/80">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed border border-primary/20"></span>
                <span>Đủ điều kiện đi tiếp vào vòng knock-out 32 đội</span>
              </div>
            </div>

            {/* Right: Matches list & Stats */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Group Matches */}
              <div className="bento-glass p-5 space-y-3">
                <h3 className="text-xs font-black text-on-surface uppercase tracking-wider border-b border-white/40 pb-2">
                  Lịch thi đấu & Kết quả
                </h3>
                {renderGroupMatches(selectedGroupFilter.replace('Bảng ', ''))}
              </div>

              {/* Group Mini Stats */}
              <div className="bento-glass p-5 space-y-4 bg-gradient-to-br from-white/95 to-secondary-fixed/5">
                <h3 className="text-xs font-black text-secondary uppercase tracking-wider">
                  Thống kê nhanh {selectedGroupFilter}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white/55 border border-white/60 rounded-xl shadow-sm">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>sports_soccer</span>
                    </div>
                    <div>
                      <div className="text-[10px] text-on-surface-variant font-bold">Tổng số bàn thắng ghi được</div>
                      <div className="text-lg font-black text-on-surface">{totalGoals || 12} bàn thắng</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white/55 border border-white/60 rounded-xl shadow-sm">
                    <div className="w-9 h-9 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center flex-shrink-0">
                      <Award size={18} />
                    </div>
                    <div>
                      <div className="text-[10px] text-on-surface-variant font-bold">Vua phá lưới bảng đấu</div>
                      <div className="text-xs font-extrabold text-on-surface">J. David (Canada) - 3 bàn</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white/55 border border-white/60 rounded-xl shadow-sm">
                    <div className="w-9 h-9 rounded-full bg-danger/10 text-danger flex items-center justify-center flex-shrink-0">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <div className="text-[10px] text-on-surface-variant font-bold">Tổng số thẻ phạt ghi nhận</div>
                      <div className="text-xs font-extrabold text-on-surface">{totalYellows || 16} thẻ phạt</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Sidebar Compact Version
  return (
    <div className="bento-glass p-5 flex flex-col gap-4">
      <h4 className="font-bold text-sm text-on-surface flex items-center gap-1.5 border-b border-white/40 pb-2">
        <Trophy size={16} className="text-primary" />
        World Cup 2026 Stats
      </h4>

      {/* Tabs selectors inside sidebar panel */}
      <div className="flex gap-1 p-1 bg-white/40 border border-white/50 rounded-xl">
        <button 
          onClick={() => setActiveTab('STANDINGS')}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
            activeTab === 'STANDINGS' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          Xếp hạng
        </button>
        <button 
          onClick={() => setActiveTab('TOP_SCORERS')}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
            activeTab === 'TOP_SCORERS' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          Vua phá lưới
        </button>
      </div>

      {/* Group dropdown filter inside sidebar standings tab */}
      {activeTab === 'STANDINGS' && (
        <div className="flex items-center gap-2 p-2 bg-white/40 border border-white/55 rounded-xl text-xs font-bold">
          <span className="text-on-surface-variant/80">Xem bảng:</span>
          <select 
            value={selectedGroupFilter} 
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs font-black text-on-surface outline-none cursor-pointer p-0"
          >
            <option value="ALL">Tất cả các bảng (A - L)</option>
            {ALL_GROUPS.map(g => (
              <option key={g.name} value={g.name}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tables view display */}
      {activeTab === 'STANDINGS' ? (
        <div className="max-h-[300px] overflow-y-auto no-scrollbar flex flex-col gap-2">
          {ALL_GROUPS
            .filter(group => selectedGroupFilter === 'ALL' || group.name === selectedGroupFilter)
            .map(group => renderGroup(group))}
        </div>
      ) : (
        <div className="space-y-3">
          {loadingScorers ? (
            <div className="flex items-center justify-center gap-2 py-8 text-on-surface-variant">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span className="text-xs">Đang lấy danh sách ghi bàn...</span>
            </div>
          ) : topScorers && topScorers.length > 0 ? (
            <div className="overflow-x-auto w-full no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/40 text-on-surface-variant">
                    <th className="py-2 px-1">Cầu thủ</th>
                    <th className="py-2 px-1 text-center w-10">Bàn</th>
                    <th className="py-2 px-1 text-center w-10">Kiến tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {topScorers.slice(0, 8).map((player) => (
                    <tr key={player.rank} className="border-b border-white/10 hover:bg-white/30 transition-colors">
                      <td className="py-2 px-1 flex items-center gap-2">
                        <span className="text-[10px] font-black text-on-surface-variant/70 w-3">{player.rank}</span>
                        <img 
                          src={`https://flagcdn.com/w20/${player.flag}.png`} 
                          alt={player.team} 
                          className="w-4.5 h-3 rounded object-cover border border-black/5" 
                        />
                        <div className="flex flex-col leading-tight truncate">
                          <span className="font-extrabold text-on-surface text-[11px]">{player.name}</span>
                          <span className="text-[9px] text-on-surface-variant/75">{player.team}</span>
                        </div>
                      </td>
                      <td className="py-2 px-1 text-center font-black text-primary text-[13px]">{player.goals}</td>
                      <td className="py-2 px-1 text-center font-bold text-on-surface-variant">{player.assists}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-xs text-on-surface-variant text-center py-6">
              Không thể tải danh sách Vua phá lưới. Vui lòng thử lại sau.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
