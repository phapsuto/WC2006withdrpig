import React from 'react';
import { TEAMS } from '../services/simulator';

export default function Standings({ matches = [] }) {
  // Define groups
  const groupA = ['MEX', 'CAN', 'BIH', 'RSA'];
  const groupB = ['USA', 'KOR', 'CZE', 'PAR'];

  const calculateGroupStats = (teamKeys) => {
    // Initialize stats
    const stats = {};
    teamKeys.forEach((key) => {
      stats[key] = {
        key,
        name: TEAMS[key].name,
        flag: TEAMS[key].flag,
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

    // Populate stats based on matches
    matches.forEach((match) => {
      const homeKey = Object.keys(TEAMS).find(k => TEAMS[k].name === match.home.name);
      const awayKey = Object.keys(TEAMS).find(k => TEAMS[k].name === match.away.name);

      if (!homeKey || !awayKey) return;
      if (!teamKeys.includes(homeKey) || !teamKeys.includes(awayKey)) return;

      // Only count LIVE and FINISHED matches
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

    // Calculate goal difference and sort
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

  const renderGroup = (groupName, teamsList) => {
    const sortedTeams = calculateGroupStats(teamsList);
    return (
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {groupName}
        </div>
        <table className="standings-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Đội bóng</th>
              <th>Trận</th>
              <th>H/S</th>
              <th>Điểm</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, idx) => (
              <tr key={team.key}>
                <td className="standings-team-cell">
                  <span style={{ color: 'var(--text-muted)', marginRight: 2, fontSize: '0.65rem' }}>{idx + 1}</span>
                  <img 
                    src={`https://flagcdn.com/w20/${team.flag}.png`} 
                    alt={team.name} 
                    style={{ width: 14, height: 10, borderRadius: 2, objectFit: 'cover' }} 
                  />
                  <span>{team.name}</span>
                </td>
                <td>{team.played}</td>
                <td>{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{team.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <h4 style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        🏆 Bảng Xếp Hạng World Cup 2026
      </h4>
      {renderGroup('Bảng A', groupA)}
      {renderGroup('Bảng B', groupB)}
    </div>
  );
}
