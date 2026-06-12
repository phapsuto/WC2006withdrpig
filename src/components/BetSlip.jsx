import React, { useState, useEffect } from 'react';
import { Ticket, X, CheckCircle2, Loader2, History, Trash2 } from 'lucide-react';
import { placeBet } from '../services/simulator';

export default function BetSlip({ activeBet, onClearBet, matches = [] }) {
  const [stake, setStake] = useState('100'); // Default stake: 100k
  const [isPlacing, setIsPlacing] = useState(false);
  const [betResult, setBetResult] = useState(null); // { success: true, betId: '...' }
  const [history, setHistory] = useState([]);

  // Load history from LocalStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('bet_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error('Failed to load bet history', e);
    }
  }, []);

  // Reset result state when activeBet changes
  useEffect(() => {
    setBetResult(null);
  }, [activeBet]);

  const { match, label, value } = activeBet || {};

  // Dynamically update bet results when matches update or finish
  useEffect(() => {
    if (history.length === 0 || matches.length === 0) return;

    let updated = false;
    const newHistory = history.map((bet) => {
      if (bet.status !== 'RUNNING') return bet;

      const liveMatch = matches.find((m) => m.id === bet.matchId);
      if (!liveMatch) return bet;

      // Check if match is finished
      if (liveMatch.status === 'FINISHED') {
        updated = true;
        const homeScore = liveMatch.homeScore;
        const awayScore = liveMatch.awayScore;
        let won = false;

        // Simple bet resolution logic
        if (bet.betKey.includes('1x2-home')) {
          won = homeScore > awayScore;
        } else if (bet.betKey.includes('1x2-draw')) {
          won = homeScore === awayScore;
        } else if (bet.betKey.includes('1x2-away')) {
          won = awayScore > homeScore;
        } else if (bet.betKey.includes('ou-over')) {
          // e.g. "ou-over-2.5"
          const parts = bet.betKey.split('-');
          const line = parseFloat(parts[parts.length - 1]) || 2.5;
          won = (homeScore + awayScore) > line;
        } else if (bet.betKey.includes('ou-under')) {
          const parts = bet.betKey.split('-');
          const line = parseFloat(parts[parts.length - 1]) || 2.5;
          won = (homeScore + awayScore) < line;
        } else if (bet.betKey.includes('handicap-home')) {
          // Simply check if home score + handicap line is greater than away score
          const parts = bet.betKey.split('-');
          const line = parseFloat(parts[parts.length - 1]) || 0;
          won = (homeScore + line) > awayScore;
        } else if (bet.betKey.includes('handicap-away')) {
          const parts = bet.betKey.split('-');
          const line = parseFloat(parts[parts.length - 1]) || 0;
          won = (awayScore + line) > homeScore;
        }

        return {
          ...bet,
          status: won ? 'WIN' : 'LOSE'
        };
      }
      return bet;
    });

    if (updated) {
      setHistory(newHistory);
      localStorage.setItem('bet_history', JSON.stringify(newHistory));
    }
  }, [matches, history]);

  const handleStakeChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setStake(val);
  };

  const handlePlaceBet = async () => {
    if (!stake || parseFloat(stake) <= 0) return;
    setIsPlacing(true);
    try {
      const result = await placeBet(activeBet, parseFloat(stake));
      setBetResult(result);
      
      const newHistoryItem = {
        id: result.betId,
        matchId: match.id,
        matchTitle: `${match.home.name} vs ${match.away.name}`,
        choice: label,
        betKey: activeBet.key,
        odds: value,
        stake: parseFloat(stake),
        status: 'RUNNING', // RUNNING, WIN, LOSE
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      
      const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('bet_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error(e);
    } finally {
      setIsPlacing(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Bạn muốn xóa toàn bộ lịch sử cược?")) {
      setHistory([]);
      localStorage.removeItem('bet_history');
    }
  };

  const potentialPayout = (stake && value) ? (parseFloat(stake) * value).toFixed(2) : '0.00';

  return (
    <div className="card bet-slip-card">
      <div className="section-header">
        <h3 className="section-title">
          <Ticket size={16} className="text-primary" />
          Phiếu cược
        </h3>
        {activeBet && !betResult && (
          <button className="modal-close" onClick={onClearBet}>
            <X size={16} />
          </button>
        )}
      </div>

      {betResult ? (
        <div className="success-msg">
          <CheckCircle2 size={36} className="text-primary" />
          <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Đặt cược thành công!</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Mã vé cược: <code style={{ background: 'var(--bg-tertiary)', padding: '2px 4px', borderRadius: 4 }}>{betResult.betId}</code>
          </p>
          <button 
            className="btn-primary" 
            style={{ marginTop: '0.75rem', width: 'auto', padding: '0.4rem 1.25rem', fontSize: '0.8rem' }}
            onClick={onClearBet}
          >
            Đóng
          </button>
        </div>
      ) : activeBet ? (
        <>
          <div className="bets-container" style={{ padding: '0.75rem' }}>
            <div className="bet-item">
              <div className="bet-item-header">
                <span>{match.league.name}</span>
              </div>
              <div className="bet-match-title" style={{ fontSize: '0.8rem' }}>
                {match.home.name} vs {match.away.name}
              </div>
              <div className="bet-choice-row">
                <span className="bet-choice-name" style={{ fontSize: '0.8rem' }}>{label}</span>
                <span className="bet-choice-odds" style={{ fontSize: '0.9rem' }}>{value.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="betslip-footer">
            <div className="stake-input-container">
              <span className="stake-label">Tiền cược</span>
              <div className="stake-input-wrapper">
                <input
                  type="text"
                  className="stake-input"
                  value={stake}
                  onChange={handleStakeChange}
                  placeholder="0"
                />
                <span className="currency-symbol">K</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
              <div className="summary-row">
                <span>Tỷ lệ cược</span>
                <span className="summary-value">{value.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Thắng dự kiến</span>
                <span className="summary-value payout">
                  {potentialPayout} K
                </span>
              </div>
            </div>

            <button 
              className="bet-button btn-primary" 
              onClick={handlePlaceBet}
              disabled={isPlacing || !stake || parseFloat(stake) <= 0}
            >
              {isPlacing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Đặt cược ngay'
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="betslip-empty-state">
          <Ticket size={36} strokeWidth={1.5} />
          <p style={{ fontSize: '0.8rem' }}>Phiếu cược trống</p>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Chọn bất kỳ tỷ lệ cược nào ở bảng chi tiết để đặt cược.
          </span>
        </div>
      )}

      {/* Bet History section */}
      {history.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <div className="bet-history-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <History size={12} />
              Lịch sử cược ({history.length})
            </span>
            <button 
              onClick={clearHistory} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              title="Xóa lịch sử"
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div className="bet-history-list">
            {history.map((bet) => (
              <div key={bet.id} className="history-item">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                  <span className="history-bet-title">{bet.matchTitle}</span>
                  <span className="history-bet-choice">{bet.choice} (x{bet.odds.toFixed(2)})</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tiền: {bet.stake}K • {bet.time}</span>
                </div>
                <span className={`history-status ${bet.status.toLowerCase()}`}>
                  {bet.status === 'RUNNING' ? 'Đang chạy' : bet.status === 'WIN' ? 'Thắng' : 'Thua'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
