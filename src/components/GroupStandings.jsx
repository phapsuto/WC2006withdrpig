import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';

const GroupStandings = ({ matches }) => {
  // Compute group standings based on matches
  const standings = useMemo(() => {
    const groups = {};

    matches.forEach(match => {
      // Initialize team if not exist
      if (!match.group) return; // Skip matches without a group (e.g. knockouts if any)
      
      const groupName = match.group;
      if (!groups[groupName]) {
        groups[groupName] = {};
      }

      const homeId = match.home?.id || match.home?.name;
      const awayId = match.away?.id || match.away?.name;
      
      if (!homeId || !awayId) return;

      if (!groups[groupName][homeId]) {
        groups[groupName][homeId] = {
          id: homeId,
          name: match.home.name,
          flag: match.home.flag,
          logo: match.home.logo,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
        };
      }
      
      if (!groups[groupName][awayId]) {
        groups[groupName][awayId] = {
          id: awayId,
          name: match.away.name,
          flag: match.away.flag,
          logo: match.away.logo,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
        };
      }

      // Only count FINISHED or LIVE matches
      if (match.status === 'FINISHED' || match.status === 'LIVE') {
        const homeScore = match.homeScore || 0;
        const awayScore = match.awayScore || 0;

        // Update stats
        groups[groupName][homeId].played += 1;
        groups[groupName][awayId].played += 1;

        groups[groupName][homeId].goalsFor += homeScore;
        groups[groupName][homeId].goalsAgainst += awayScore;

        groups[groupName][awayId].goalsFor += awayScore;
        groups[groupName][awayId].goalsAgainst += homeScore;

        if (homeScore > awayScore) {
          groups[groupName][homeId].won += 1;
          groups[groupName][homeId].points += 3;
          groups[groupName][awayId].lost += 1;
        } else if (homeScore < awayScore) {
          groups[groupName][awayId].won += 1;
          groups[groupName][awayId].points += 3;
          groups[groupName][homeId].lost += 1;
        } else {
          groups[groupName][homeId].drawn += 1;
          groups[groupName][homeId].points += 1;
          groups[groupName][awayId].drawn += 1;
          groups[groupName][awayId].points += 1;
        }
      }
    });

    // Convert object to sorted arrays
    const sortedGroups = {};
    Object.keys(groups).sort().forEach(groupName => {
      const teams = Object.values(groups[groupName]);
      // Sort by Points, then GD, then GF
      teams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const gdA = a.goalsFor - a.goalsAgainst;
        const gdB = b.goalsFor - b.goalsAgainst;
        if (gdB !== gdA) return gdB - gdA;
        return b.goalsFor - a.goalsFor;
      });
      sortedGroups[groupName] = teams;
    });

    return sortedGroups;
  }, [matches]);

  if (Object.keys(standings).length === 0) {
    return (
      <div className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-[280px] flex flex-col items-center justify-center p-8 text-center border border-[#f0f0f0]">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-1">
          <span className="material-symbols-outlined text-[30px] text-gray-400">table_chart</span>
        </div>
        <h3 className="text-[16px] font-bold text-[var(--365-text-main)]">Chưa có bảng xếp hạng</h3>
        <p className="text-[13px] text-[var(--365-text-sub)] leading-relaxed">
          Dữ liệu bảng xếp hạng sẽ tự động cập nhật khi vòng bảng bắt đầu.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 animate-fade-in w-full pb-10">
      <div className="px-1 pt-1 pb-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-[var(--color-primary)] text-[20px]">leaderboard</span>
        <div>
          <h2 className="text-[14px] font-bold text-[var(--365-text-main)] uppercase tracking-wide">Bảng Xếp Hạng</h2>
          <p className="text-[11px] text-[var(--365-text-sub)]">Cập nhật trực tiếp điểm số khi trận đấu đang diễn ra.</p>
        </div>
      </div>

      {Object.entries(standings).map(([groupName, teams]) => (
        <div key={groupName} className="bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden border border-[#f0f0f0]">
          {/* League/Group Header */}
          <div className="league-header-365 flex justify-between items-center bg-[#fcfcfc] border-b border-[#f5f5f5]">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-[#e3b044]" />
              <div className="flex flex-col">
                <span className="title leading-tight">Bảng {groupName}</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[320px]">
              <thead>
                <tr className="text-[11px] text-[var(--365-text-sub)] font-semibold border-b border-[#f0f0f0] bg-white">
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-2">Đội</th>
                  <th className="py-2.5 px-1 text-center w-8" title="Trận">T</th>
                  <th className="py-2.5 px-1 text-center w-8" title="Thắng">T</th>
                  <th className="py-2.5 px-1 text-center w-8" title="Hòa">H</th>
                  <th className="py-2.5 px-1 text-center w-8" title="Bại">B</th>
                  <th className="py-2.5 px-1 text-center w-8" title="Hiệu số">HS</th>
                  <th className="py-2.5 px-3 text-center w-10 text-[var(--365-text-main)] font-bold">Điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                {teams.map((team, index) => {
                  const isTop2 = index < 2;
                  return (
                    <tr key={team.id} className="hover:bg-gray-50/50 transition-colors bg-white">
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-[11px] font-semibold ${isTop2 ? 'bg-[#2194ff] text-white' : 'text-[var(--365-text-sub)]'}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={team.flag !== 'xx' ? `https://flagcdn.com/w40/${team.flag}.png` : 'https://www.svgrepo.com/show/475656/google-color.svg'} 
                            alt={team.name} 
                            className="w-5 h-5 object-cover rounded shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
                            onError={(e) => { 
                              if (team.logo) {
                                e.target.onerror = null;
                                e.target.src = team.logo;
                              }
                            }}
                          />
                          <span className={`text-[13px] ${isTop2 ? 'font-semibold text-[var(--365-text-main)]' : 'font-medium text-[var(--365-text-main)]'}`}>
                            {team.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-1 text-center text-[12px] font-medium text-[var(--365-text-sub)]">
                        {team.played}
                      </td>
                      <td className="py-3 px-1 text-center text-[12px] font-medium text-[var(--365-text-sub)]">
                        {team.won}
                      </td>
                      <td className="py-3 px-1 text-center text-[12px] font-medium text-[var(--365-text-sub)]">
                        {team.drawn}
                      </td>
                      <td className="py-3 px-1 text-center text-[12px] font-medium text-[var(--365-text-sub)]">
                        {team.lost}
                      </td>
                      <td className="py-3 px-1 text-center text-[12px] font-medium text-[var(--365-text-sub)]">
                        {team.goalsFor - team.goalsAgainst > 0 ? `+${team.goalsFor - team.goalsAgainst}` : team.goalsFor - team.goalsAgainst}
                      </td>
                      <td className="py-3 px-3 text-center text-[13px] font-bold text-[var(--365-text-main)]">
                        {team.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupStandings;
