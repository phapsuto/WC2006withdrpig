import React, { useState } from 'react';
import { ShieldAlert, Trophy } from 'lucide-react';

export default function MatchList({ matches, onSelectMatch, activeMatchId }) {
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, LIVE, UPCOMING, FINISHED

  const filteredMatches = matches.filter((match) => {
    if (activeTab === 'ALL') return true;
    return match.status === activeTab;
  });

  const liveCount = matches.filter(m => m.status === 'LIVE').length;

  return (
    <div className="card">
      <div className="section-header">
        <h3 className="section-title">
          <Trophy size={18} className="text-primary" />
          Bảng thi đấu & Tỷ số
        </h3>
        {liveCount > 0 && (
          <span className="live-badge">
            <span className="live-dot"></span>
            {liveCount} Trực tiếp
          </span>
        )}
      </div>

      <div className="filter-tabs">
        <button 
          className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          Tất cả
        </button>
        <button 
          className={`tab-btn ${activeTab === 'LIVE' ? 'active' : ''}`}
          onClick={() => setActiveTab('LIVE')}
        >
          Trực tiếp ({liveCount})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'UPCOMING' ? 'active' : ''}`}
          onClick={() => setActiveTab('UPCOMING')}
        >
          Sắp đá
        </button>
        <button 
          className={`tab-btn ${activeTab === 'FINISHED' ? 'active' : ''}`}
          onClick={() => setActiveTab('FINISHED')}
        >
          Đã xong
        </button>
      </div>

      <div className="matches-list">
        {filteredMatches.length === 0 ? (
          <div className="betslip-empty-state">
            <ShieldAlert size={36} />
            <p>Không có trận đấu nào trong mục này</p>
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isLive = match.status === 'LIVE';
            const isFinished = match.status === 'FINISHED';
            const isSelected = match.id === activeMatchId;

            return (
              <div 
                key={match.id} 
                className={`match-row ${isSelected ? 'active-row' : ''}`}
                style={isSelected ? { background: 'var(--bg-accent)', borderLeft: '3px solid var(--primary)' } : {}}
                onClick={() => onSelectMatch(match.id)}
              >
                <div className="match-time-col">
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {match.league.name}
                  </span>
                  {isLive ? (
                    <span className="live">
                      <span className="live-dot"></span>
                      {match.minute}'
                    </span>
                  ) : isFinished ? (
                    <span>FT</span>
                  ) : (
                    <span>Sắp diễn ra</span>
                  )}
                </div>

                <div className="match-teams-col">
                  <div className={`team-row ${match.homeScore > match.awayScore && isFinished ? 'winner' : 'loser'}`}>
                    <div className="team-info">
                      <img 
                        src={`https://flagcdn.com/w40/${match.home.flag}.png`} 
                        alt={match.home.name} 
                        className="team-flag"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span>{match.home.name}</span>
                    </div>
                    {(isLive || isFinished) && (
                      <span className="team-score">{match.homeScore}</span>
                    )}
                  </div>
                  <div className={`team-row ${match.awayScore > match.homeScore && isFinished ? 'winner' : 'loser'}`}>
                    <div className="team-info">
                      <img 
                        src={`https://flagcdn.com/w40/${match.away.flag}.png`} 
                        alt={match.away.name} 
                        className="team-flag"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span>{match.away.name}</span>
                    </div>
                    {(isLive || isFinished) && (
                      <span className="team-score">{match.awayScore}</span>
                    )}
                  </div>
                </div>

                <div className="match-odds-col">
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    Tỷ lệ cược
                  </span>
                  <span className="mini-odd-tag">
                    {match.odds.h2h.home.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
