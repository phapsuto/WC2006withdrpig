import { useState, useEffect } from 'react';
import { Trophy, ChevronRight, AlertCircle } from 'lucide-react';
import { Skeleton } from 'antd';
import { backendClient } from '../services/backendClient';
import { useSearchParams, useNavigate } from 'react-router-dom';

// ─── League list ─────────────────────────────────────────────────────────────
const LEAGUES = [
  { id: 732, name: 'World Cup 2026', shortName: 'WC 2026', logo: 'https://media.api-sports.io/football/leagues/15.png' },
];

// ─── Position colour helpers ──────────────────────────────────────────────────
function getPositionStyle(position, totalTeams, result) {
  if (result === 'champion') return { bar: '#10b981', bg: 'bg-emerald-50' };
  if (result === 'promoted') return { bar: '#3b82f6', bg: 'bg-blue-50' };
  if (result === 'playoff') return { bar: '#f59e0b', bg: 'bg-amber-50' };
  if (result === 'relegated') return { bar: '#ef4444', bg: 'bg-red-50' };
  if (position === 1) return { bar: '#10b981', bg: 'bg-emerald-50' };
  if (position <= 4) return { bar: '#3b82f6', bg: 'bg-blue-50' };
  if (position <= 6) return { bar: '#8b5cf6', bg: 'bg-purple-50' };
  if (position > totalTeams - 3) return { bar: '#ef4444', bg: 'bg-red-50' };
  return { bar: 'transparent', bg: '' };
}

function getWCPositionStyle(position) {
  if (position === 1) return { bar: '#10b981', bg: 'bg-emerald-50' };
  if (position === 2) return { bar: '#3b82f6', bg: 'bg-blue-50' };
  if (position === 3) return { bar: '#f59e0b', bg: 'bg-amber-50' };
  return { bar: 'transparent', bg: '' };
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const TableSkeleton = () => (
  <div className="flex flex-col divide-y divide-[#f0f0f0]">
    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
      <div key={i} className="flex items-center gap-3 px-3 py-2.5">
        <Skeleton.Button active size="small" className="w-5 h-5" />
        <Skeleton.Avatar active size="small" />
        <Skeleton.Input active size="small" className="flex-1" />
        {[1, 2, 3, 4, 5].map(j => <Skeleton.Button key={j} active size="small" className="w-7 h-5" />)}
      </div>
    ))}
  </div>
);

// ─── Group table ──────────────────────────────────────────────────────────────
function GroupTable({ groupName, teams, isGroupStage, onTeamClick }) {
  const total = teams.length;
  return (
    <div className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden border border-[#f0f0f0]">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-[#f0f0f0]">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-[#e3b044]" />
          <span className="text-[13px] font-bold text-[#151e22] uppercase tracking-wide">{groupName}</span>
        </div>
        <span className="text-[11px] text-[#6b7173]">{total} đội</span>
      </div>

      <div className="grid text-[10px] font-bold text-[#6b7173] uppercase tracking-wide px-3 py-2 border-b border-[#f0f0f0] bg-gray-50/40"
        style={{ gridTemplateColumns: '24px 1fr 32px 28px 28px 28px 36px 40px' }}>
        <span className="text-center">#</span>
        <span>Đội</span>
        <span className="text-center">Tr</span>
        <span className="text-center">T</span>
        <span className="text-center">H</span>
        <span className="text-center">B</span>
        <span className="text-center">HS</span>
        <span className="text-center font-black">Đ</span>
      </div>

      <div className="flex flex-col divide-y divide-[#f5f5f5]">
        {teams.map((team, idx) => {
          const pos = isGroupStage
            ? getWCPositionStyle(team.position)
            : getPositionStyle(team.position, total, team.result);
          return (
            <div
              key={team.teamId || idx}
              className={`grid items-center px-3 py-2 hover:bg-gray-50/80 transition-colors cursor-pointer relative ${pos.bg}`}
              style={{ gridTemplateColumns: '24px 1fr 32px 28px 28px 28px 36px 40px' }}
              onClick={() => onTeamClick && onTeamClick(team)}
            >
              {pos.bar !== 'transparent' && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: pos.bar }} />
              )}
              <span className={`text-[12px] font-bold text-center ${team.position === 1 ? 'text-[#e3b044]' : team.position <= 2 ? 'text-[#3b82f6]' : 'text-[#6b7173]'
                }`}>{team.position}</span>

              <div className="flex items-center gap-2 min-w-0">
                {team.logo ? (
                  <img src={team.logo} alt={team.name} className="w-[20px] h-[20px] object-contain flex-shrink-0"
                    onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <img src={`https://flagcdn.com/w40/${team.flag || 'xx'}.png`} alt={team.name}
                    className="w-[20px] h-[14px] object-cover rounded-[2px] flex-shrink-0" />
                )}
                <span className="text-[12px] font-semibold text-[#151e22] truncate">{team.name}</span>
              </div>

              <span className="text-[12px] text-[#6b7173] text-center">{team.played}</span>
              <span className="text-[12px] text-[#6b7173] text-center">{team.won}</span>
              <span className="text-[12px] text-[#6b7173] text-center">{team.draw}</span>
              <span className="text-[12px] text-[#6b7173] text-center">{team.lost}</span>
              <span className={`text-[12px] font-semibold text-center ${team.gd > 0 ? 'text-[#10b981]' : team.gd < 0 ? 'text-[#ef4444]' : 'text-[#6b7173]'
                }`}>{team.gd > 0 ? `+${team.gd}` : team.gd}</span>
              <span className="text-[13px] font-black text-[#151e22] text-center">{team.points}</span>
            </div>
          );
        })}
      </div>

      {isGroupStage && (
        <div className="flex gap-3 px-3 py-2 border-t border-[#f0f0f0] bg-gray-50/40">
          <div className="flex items-center gap-1.5 text-[10px] text-[#6b7173]">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>Vào vòng trong
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#6b7173]">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>Đứng thứ 3 tốt nhất
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty/error state ────────────────────────────────────────────────────────
function StandingsEmpty() {
  return (
    <div className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-10 flex flex-col items-center text-center gap-4 border border-[#f0f0f0]">
      <AlertCircle size={40} className="text-gray-300" />
      <h3 className="text-[16px] font-bold text-[#151e22]">Chưa có dữ liệu bảng xếp hạng</h3>
      <p className="text-[13px] text-[#6b7173] max-w-[300px] leading-relaxed">
        Giải đấu này có thể đang trong giai đoạn nghỉ hè hoặc dữ liệu chưa được Sportmonks cập nhật.
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Standings({ matches = [], isFullPage = false, leagueId: propLeagueId }) {
  const [searchParams] = useSearchParams();
  const urlLeagueId = searchParams.get('league') ? parseInt(searchParams.get('league')) : null;
  const [activeLeagueId, setActiveLeagueId] = useState(urlLeagueId || propLeagueId || 732);

  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleTeamClick = (team) => {
    navigate(`/team/${team.teamId || team.id}`);
  };

  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true);
      setError(null);
      setStandings(null);
      try {
        const data = await backendClient.getStandings(activeLeagueId);
        if (data.success && data.standings) {
          setStandings(data.standings);
        } else {
          setError(data.error || 'Không có dữ liệu');
        }
      } catch (e) {
        console.error('Standings fetch error:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStandings();
  }, [activeLeagueId]);

  const currentLeagueInfo = LEAGUES.find(l => l.id === activeLeagueId) || LEAGUES[0];
  const groupNames = standings ? Object.keys(standings.groups) : [];
  const isGroupStage = standings?.isGroupStage || false;

  // ── FULL PAGE ─────────────────────────────────────────────────────
  if (isFullPage) {
    return (
      <div className="flex flex-col gap-6 pb-20">

        {/* Page header + league selector */}
        <div className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-5 flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 border border-[#f0f0f0]">
              <Trophy size={22} className="text-[#e3b044]" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-[#151e22]">Bảng xếp hạng</h1>
              <p className="text-[13px] text-[#6b7173]">Dữ liệu thời gian thực từ Sportmonks</p>
            </div>
          </div>

          <div className="flex overflow-x-auto no-scrollbar border-t border-[#f0f0f0]">
            {LEAGUES.map(league => {
              const isActive = league.id === activeLeagueId;
              return (
                <button
                  key={league.id}
                  onClick={() => setActiveLeagueId(league.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-[13px] font-semibold whitespace-nowrap transition-colors border-b-[3px] ${isActive
                      ? 'text-[#2194ff] border-[#2194ff] bg-blue-50/30'
                      : 'text-[#6b7173] border-transparent hover:text-[#151e22] hover:bg-gray-50'
                    }`}
                >
                  <img src={league.logo} alt={league.shortName} className="w-[18px] h-[18px] object-contain" />
                  {league.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Season info */}
        {standings && (
          <div className="flex items-center gap-3">
            {standings.leagueLogo && (
              <img src={standings.leagueLogo} alt={standings.leagueName} className="w-8 h-8 object-contain" />
            )}
            <span className="text-[14px] font-bold text-[#151e22]">{standings.leagueName || currentLeagueInfo.name}</span>
            {standings.seasonName && (
              <span className="text-[12px] text-[#6b7173] bg-gray-100 px-2 py-0.5 rounded-full">
                Mùa {standings.seasonName}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className={`grid gap-4 ${isGroupStage ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden border border-[#f0f0f0]">
                <div className="px-4 py-3 bg-gray-50 border-b border-[#f0f0f0]">
                  <Skeleton.Input active size="small" className="w-32" />
                </div>
                <TableSkeleton />
              </div>
            ))}
          </div>
        ) : error || !standings ? (
          <StandingsEmpty />
        ) : (
          <div className={`grid gap-4 ${isGroupStage ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-[900px]'}`}>
            {groupNames.map(groupName => (
              <GroupTable
                key={groupName}
                groupName={groupName}
                teams={standings.groups[groupName]}
                isGroupStage={isGroupStage}
                onTeamClick={handleTeamClick}
              />
            ))}
          </div>
        )}

        {/* Domestic league legend */}
        {!loading && standings && !isGroupStage && (
          <div className="flex flex-wrap gap-4 px-1">
            {[
              { color: 'bg-emerald-500', label: 'Vô địch' },
              { color: 'bg-blue-500', label: 'Champions League' },
              { color: 'bg-purple-500', label: 'Europa League' },
              { color: 'bg-red-500', label: 'Xuống hạng' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-[#6b7173]">
                <div className={`w-[3px] h-4 rounded-full ${item.color}`}></div>
                {item.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── COMPACT / SIDEBAR VERSION ─────────────────────────────────────
  return (
    <div className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden border border-[#f0f0f0]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#f0f0f0]">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-[#e3b044]" />
          <span className="text-[15px] font-bold text-[#151e22]">Bảng xếp hạng</span>
        </div>
        <a href="/standings" className="text-[13px] text-[#2194ff] font-semibold hover:underline flex items-center gap-0.5">
          Xem đầy đủ <ChevronRight size={14} />
        </a>
      </div>

      {/* Quick league selector */}
      <div className="flex overflow-x-auto no-scrollbar p-2 gap-1 border-b border-[#f0f0f0]">
        {LEAGUES.map(l => (
          <button
            key={l.id}
            onClick={() => setActiveLeagueId(l.id)}
            className={`flex-shrink-0 px-3 py-2 rounded-[6px] text-[13px] font-semibold transition-colors flex items-center gap-2 ${l.id === activeLeagueId ? 'bg-[#2194ff]/10 text-[#2194ff]' : 'text-[#6b7173] hover:bg-gray-50'
              }`}
          >
            <img src={l.logo} alt={l.shortName} className="w-[18px] h-[18px] object-contain" />
            {l.shortName}
          </button>
        ))}
      </div>

      {/* Standings rows */}
      <div className="overflow-y-auto max-h-[480px]">
        {loading ? (
          <div className="p-3"><TableSkeleton /></div>
        ) : error || !standings ? (
          <div className="p-6 text-center text-[12px] text-[#6b7173]">
            Chưa có dữ liệu. Giải đấu có thể đang nghỉ hè.
          </div>
        ) : (
          groupNames.map(groupName => (
            <div key={groupName} className="border-b border-[#f0f0f0] last:border-0">
              <div className="px-4 py-2.5 bg-gray-50 text-[11px] font-bold text-[#6b7173] uppercase tracking-wide border-b border-[#f0f0f0]">
                {groupName}
              </div>
              {(standings.groups[groupName] || []).map((team, idx) => {
                const pos = isGroupStage
                  ? getWCPositionStyle(team.position)
                  : getPositionStyle(team.position, standings.groups[groupName].length, team.result);
                return (
                  <div
                    key={team.teamId || idx}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer relative ${pos.bg}`}
                    onClick={() => handleTeamClick(team)}
                  >
                    {pos.bar !== 'transparent' && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: pos.bar }} />
                    )}
                    <span className="text-[12px] text-[#6b7173] w-5 text-center font-bold">{team.position}</span>
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="w-[20px] h-[20px] object-contain" />
                    ) : (
                      <img src={`https://flagcdn.com/w40/${team.flag || 'xx'}.png`} alt={team.name} className="w-[20px] h-[14px] object-cover rounded-[1px]" />
                    )}
                    <span className="text-[13px] font-semibold text-[#151e22] flex-1 truncate">{team.name}</span>
                    <div className="flex items-center gap-3 text-[12px] text-[#6b7173] w-[80px] justify-end font-medium">
                      <span className="w-6 text-center">{team.played}</span>
                      <span className={`w-8 text-right ${team.gd > 0 ? 'text-[#10b981]' : team.gd < 0 ? 'text-[#ef4444]' : ''}`}>
                        {team.gd > 0 ? `+${team.gd}` : team.gd}
                      </span>
                    </div>
                    <span className="text-[14px] font-black text-[#151e22] w-8 text-right">{team.points}</span>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
