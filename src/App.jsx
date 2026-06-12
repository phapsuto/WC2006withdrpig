import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MatchList from './components/MatchList';
import MatchDetail from './components/MatchDetail';
import BetSlip from './components/BetSlip';
import SettingsModal from './components/SettingsModal';
import Standings from './components/Standings';
import NewsHub from './components/NewsHub';
import { subscribeToFootballData, getApiConfig } from './services/api';
import { Trophy, ArrowRight } from 'lucide-react';
import './App.css';

function App() {
  const [apiMode, setApiMode] = useState(getApiConfig().apiMode || 'DEMO');
  const [matches, setMatches] = useState([]);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [activeBet, setActiveBet] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activePage, setActivePage] = useState('DASHBOARD'); // 'DASHBOARD' or 'NEWS_HUB'

  // Subscribe to real-time football data
  useEffect(() => {
    const unsubscribe = subscribeToFootballData((data) => {
      setMatches(data);
      if (!activeMatchId && data.length > 0) {
        const liveMatch = data.find(m => m.status === 'LIVE');
        if (liveMatch) {
          setActiveMatchId(liveMatch.id);
        } else {
          setActiveMatchId(data[0].id);
        }
      }
    });

    return () => unsubscribe();
  }, [apiMode]);

  // Keep the active bet's odds and match data updated when the simulator ticks
  useEffect(() => {
    if (activeBet && matches.length > 0) {
      const updatedMatch = matches.find(m => m.id === activeBet.match.id);
      if (updatedMatch) {
        let updatedValue = activeBet.value;
        if (activeBet.key.includes('1x2-home')) updatedValue = updatedMatch.odds.h2h.home;
        else if (activeBet.key.includes('1x2-draw')) updatedValue = updatedMatch.odds.h2h.draw;
        else if (activeBet.key.includes('1x2-away')) updatedValue = updatedMatch.odds.h2h.away;
        else if (activeBet.key.includes('handicap-home')) updatedValue = updatedMatch.odds.handicap.home;
        else if (activeBet.key.includes('handicap-away')) updatedValue = updatedMatch.odds.handicap.away;
        else if (activeBet.key.includes('ou-over')) updatedValue = updatedMatch.odds.overUnder.over;
        else if (activeBet.key.includes('ou-under')) updatedValue = updatedMatch.odds.overUnder.under;

        setActiveBet(prev => ({
          ...prev,
          match: updatedMatch,
          value: updatedValue
        }));
      }
    }
  }, [matches]);

  const activeMatch = matches.find((m) => m.id === activeMatchId);

  const handleAddBet = (match, label, value, key) => {
    setActiveBet({
      match,
      label,
      value,
      key
    });
  };

  const handleConfigSaved = () => {
    const currentConfig = getApiConfig();
    setApiMode(currentConfig.apiMode || 'DEMO');
  };

  return (
    <div className="app-container">
      <Navbar 
        apiMode={apiMode} 
        setApiMode={(mode) => {
          setApiMode(mode);
          const currentConfig = getApiConfig();
          currentConfig.apiMode = mode;
          localStorage.setItem('football_app_config', JSON.stringify(currentConfig));
        }} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="dashboard-grid">
        {/* Left Column: Matches list, detailed views or NewsHub */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {activePage === 'NEWS_HUB' ? (
            <NewsHub />
          ) : activeMatch ? (
            <div className="main-content-layout">
              <div className="desktop-split-view" style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '1.5rem' }}>
                <div className="match-list-wrapper">
                  <MatchList 
                    matches={matches} 
                    onSelectMatch={setActiveMatchId} 
                    activeMatchId={activeMatchId}
                  />
                </div>
                <div className="match-detail-wrapper">
                  <MatchDetail 
                    match={activeMatch} 
                    onAddBet={handleAddBet}
                    activeBetId={activeBet ? activeBet.key : null}
                    onClose={() => setActiveMatchId(null)}
                  />
                </div>
              </div>

              <div className="mobile-single-view">
                <MatchDetail 
                  match={activeMatch} 
                  onAddBet={handleAddBet}
                  activeBetId={activeBet ? activeBet.key : null}
                  onClose={() => setActiveMatchId(null)}
                />
              </div>
            </div>
          ) : (
            <MatchList 
              matches={matches} 
              onSelectMatch={setActiveMatchId} 
              activeMatchId={null}
            />
          )}
        </div>

        {/* Right Sidebar: Mascot, Bet Slip, and Standings */}
        <div className="sidebar">
          {/* Drpig Mascot Promo Card */}
          <div className="mascot-promo-card">
            <img src="/drpig_mascot.png" alt="Drpig Mascot" className="mascot-promo-img" />
            <div className="mascot-promo-text">
              <span className="mascot-promo-title">Đại chiến WC2026!</span>
              <span className="mascot-promo-desc">
                Cùng chú heo <strong>Drpig 🐷</strong> nhận định chuẩn xác, bắt trọn từng khoảnh khắc kèo trực tiếp hấp dẫn nhất!
              </span>
            </div>
          </div>

          {/* Bet Slip */}
          <BetSlip 
            activeBet={activeBet} 
            onClearBet={() => setActiveBet(null)} 
            matches={matches}
          />

          {/* Standings */}
          <Standings matches={matches} />

          {/* Mini standings/info card */}
          <div className="card" style={{ padding: '1rem' }}>
            <h4 style={{ fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              <Trophy size={14} /> Nhận định & Quà tặng
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
              Tham gia dự đoán tỷ số cùng Drpig nhận ngay phần quà áo đấu Labubu hồng cầu thủ giới hạn!
            </p>
            <a 
              href="#gift" 
              className="mode-btn" 
              onClick={(e) => { e.preventDefault(); alert("Chương trình quà tặng Drpig Labubu đang chuẩn bị ra mắt!"); }}
              style={{ display: 'inline-flex', justifyContent: 'center', background: 'rgba(255, 45, 120, 0.04)', color: 'var(--primary)', border: '1px solid var(--border)', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              Xem chi tiết <ArrowRight size={12} style={{ marginLeft: 4 }} />
            </a>
          </div>
        </div>
      </main>

      <footer className="footer-disclaimer">
        <p>⚠️ Cảnh báo: Cá độ bóng đá là hành vi vi phạm pháp luật tại Việt Nam. Mọi thông tin về tỷ lệ cược và đặt cược trên trang web này chỉ mang tính chất mô phỏng và tham khảo giải trí vui vẻ, không có giá trị thực tế hoặc quy đổi.</p>
      </footer>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onConfigSaved={handleConfigSaved}
      />
    </div>
  );
}

export default App;
