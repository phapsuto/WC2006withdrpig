import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MatchList from './components/MatchList';
import MatchDetail from './components/MatchDetail';
import BetSlip from './components/BetSlip';
import Standings from './components/Standings';
import NewsHub from './components/NewsHub';
import AdminDashboard from './components/AdminDashboard';
import Profile from './components/Profile';
import OracleChat from './components/OracleChat';
import { subscribeToFootballData, getApiConfig } from './services/api';
import { useLanguage } from './utils/LanguageContext';
import './App.css';

function App() {
  const { language, changeLanguage, t } = useLanguage();
  const [apiMode, setApiMode] = useState(getApiConfig().apiMode || 'DEMO');
  const [matches, setMatches] = useState([]);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [activeBet, setActiveBet] = useState(null);
  const [activePage, setActivePage] = useState('DASHBOARD'); // 'DASHBOARD', 'NEWS_HUB', 'STANDINGS', 'ORACLE', 'PROFILE', 'ADMIN_PORTAL'
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showBetSlipModal, setShowBetSlipModal] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Centralized simulated Google User state
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('wc2026_user_profile');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Failed to load user', e);
      return null;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Subscribe to real-time football data
  useEffect(() => {
    const unsubscribe = subscribeToFootballData((data) => {
      setMatches(data);
      setActiveMatchId(prev => {
        if (!prev && data.length > 0) {
          // Priority: LIVE > Today's match closest to now > Next upcoming > Most recent finished
          const liveMatch = data.find(m => m.status === 'LIVE');
          if (liveMatch) return liveMatch.id;
          
          const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
          
          // Find today's matches
          const todayMatches = data.filter(m => (m.date || '').startsWith(todayStr));
          if (todayMatches.length > 0) {
            // Pick the first upcoming today, or the last finished today
            const todayUpcoming = todayMatches.find(m => m.status === 'UPCOMING');
            if (todayUpcoming) return todayUpcoming.id;
            return todayMatches[todayMatches.length - 1].id;
          }
          
          // Find next upcoming match (closest to now)
          const upcoming = data
            .filter(m => m.status === 'UPCOMING')
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          if (upcoming.length > 0) return upcoming[0].id;
          
          // Fallback: most recent finished match
          const finished = data
            .filter(m => m.status === 'FINISHED')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          if (finished.length > 0) return finished[0].id;
          
          return data[0].id;
        }
        return prev;
      });
    });

    return () => unsubscribe();
  }, [apiMode]);

  // Listen to configuration changes from Admin Portal & URL Admin bypass
  useEffect(() => {
    const handleConfigUpdate = () => {
      const currentConfig = getApiConfig();
      setApiMode(currentConfig.apiMode || 'DEMO');
    };
    window.addEventListener('api-config-saved', handleConfigUpdate);

    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || params.get('admin') === 'admin123') {
      setTimeout(() => {
        setActivePage('ADMIN_PORTAL');
      }, 0);
    }

    return () => window.removeEventListener('api-config-saved', handleConfigUpdate);
  }, []);

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

        if (activeBet.value !== updatedValue || activeBet.match !== updatedMatch) {
          setTimeout(() => {
            setActiveBet(prev => {
              if (!prev || prev.match.id !== updatedMatch.id) return prev;
              return {
                ...prev,
                match: updatedMatch,
                value: updatedValue
              };
            });
          }, 0);
        }
      }
    }
  }, [matches, activeBet]);

  // Real-time Bet resolution observer
  useEffect(() => {
    if (!user || !user.betHistory || user.betHistory.length === 0 || matches.length === 0) return;
    
    let balanceChange = 0;
    let updated = false;
    
    const updatedHistory = user.betHistory.map(bet => {
      if (bet.status !== 'PENDING') return bet;
      
      const match = matches.find(m => m.id === bet.matchId);
      if (!match || match.status !== 'FINISHED') return bet;
      
      updated = true;
      let won = false;
      const homeScore = match.homeScore;
      const awayScore = match.awayScore;
      
      if (bet.betKey.includes('1x2-home')) {
        won = homeScore > awayScore;
      } else if (bet.betKey.includes('1x2-draw')) {
        won = homeScore === awayScore;
      } else if (bet.betKey.includes('1x2-away')) {
        won = awayScore > homeScore;
      } else if (bet.betKey.includes('ou-over')) {
        const lineParts = bet.betKey.split('_');
        let line;
        if (lineParts.length > 1) {
          line = parseFloat(lineParts[1]);
        } else {
          const parts = lineParts[0].split('-');
          line = parseFloat(parts[parts.length - 1]) || 2.5;
        }
        won = (homeScore + awayScore) > line;
      } else if (bet.betKey.includes('ou-under')) {
        const lineParts = bet.betKey.split('_');
        let line;
        if (lineParts.length > 1) {
          line = parseFloat(lineParts[1]);
        } else {
          const parts = lineParts[0].split('-');
          line = parseFloat(parts[parts.length - 1]) || 2.5;
        }
        won = (homeScore + awayScore) < line;
      } else if (bet.betKey.includes('handicap-home')) {
        const lineParts = bet.betKey.split('_');
        let line;
        if (lineParts.length > 1) {
          line = parseFloat(lineParts[1]);
        } else {
          const parts = lineParts[0].split('-');
          line = parseFloat(parts[parts.length - 1]) || 0;
        }
        won = (homeScore + line) > awayScore;
      } else if (bet.betKey.includes('handicap-away')) {
        const lineParts = bet.betKey.split('_');
        let line;
        if (lineParts.length > 1) {
          line = parseFloat(lineParts[1]);
        } else {
          const parts = lineParts[0].split('-');
          line = parseFloat(parts[parts.length - 1]) || 0;
        }
        won = (awayScore + line) > homeScore;
      }
      
      const status = won ? 'WON' : 'LOST';
      const payout = won ? bet.payout : 0;
      if (won) {
        balanceChange += payout;
      }
      
      return { ...bet, status };
    });
    
    if (updated) {
      setTimeout(() => {
        setUser(prevUser => {
          if (!prevUser) return null;
          let finalBalance = prevUser.balance + balanceChange;
          let refilled = false;
          if (finalBalance < 10) {
            finalBalance = 10000;
            refilled = true;
          }
          const updatedUser = {
            ...prevUser,
            balance: finalBalance,
            betHistory: updatedHistory
          };
          localStorage.setItem('wc2026_user_profile', JSON.stringify(updatedUser));
          if (refilled) {
            setTimeout(() => {
              alert(t('refilledCoinsAlert'));
            }, 500);
          }
          return updatedUser;
        });
      }, 0);
    }
  }, [matches, user, t]);

  const activeMatch = matches.find((m) => m.id === activeMatchId);

  // User auth actions
  const handleSelectMockAccount = (name, email, initials) => {
    const newUser = {
      name,
      email,
      initials,
      balance: 10000, // 10,000 xu Heo Vàng cược vui
      bookmarks: [],
      favoriteTeams: [],
      betHistory: [],
      language
    };
    setUser(newUser);
    localStorage.setItem('wc2026_user_profile', JSON.stringify(newUser));
    setShowLoginModal(false);
  };

  const handleCustomGoogleAccount = () => {
    const name = prompt('Nhập Tên Google của bạn:');
    if (!name) return;
    const email = prompt('Nhập Email Google của bạn:');
    if (!email) return;
    const initials = name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 3);
    handleSelectMockAccount(name, email, initials);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('wc2026_user_profile');
    setActivePage('DASHBOARD');
  };

  const handleResetBalance = () => {
    if (!user) return;
    const updatedUser = {
      ...user,
      balance: 10000
    };
    setUser(updatedUser);
    localStorage.setItem('wc2026_user_profile', JSON.stringify(updatedUser));
  };

  const handleClearBetHistory = () => {
    if (!user) return;
    const updatedUser = {
      ...user,
      betHistory: []
    };
    setUser(updatedUser);
    localStorage.setItem('wc2026_user_profile', JSON.stringify(updatedUser));
  };


  const handleToggleFavoriteTeam = (teamName) => {
    if (!user) return;
    const favoriteTeams = [...(user.favoriteTeams || [])];
    const index = favoriteTeams.indexOf(teamName);
    if (index > -1) {
      favoriteTeams.splice(index, 1);
    } else {
      favoriteTeams.push(teamName);
    }
    const updatedUser = { ...user, favoriteTeams };
    setUser(updatedUser);
    localStorage.setItem('wc2026_user_profile', JSON.stringify(updatedUser));
  };

  const handleToggleBookmark = (matchId) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const bookmarks = [...(user.bookmarks || [])];
    const index = bookmarks.indexOf(matchId);
    if (index > -1) {
      bookmarks.splice(index, 1);
    } else {
      bookmarks.push(matchId);
    }
    const updatedUser = { ...user, bookmarks };
    setUser(updatedUser);
    localStorage.setItem('wc2026_user_profile', JSON.stringify(updatedUser));
  };

  const handlePlaceBet = (betSlip, stake) => {
    if (!user) {
      setShowLoginModal(true);
      return Promise.reject('Not logged in');
    }
    if (user.balance < stake) {
      alert(t('alertInsufficientBalance'));
      return Promise.reject('Insufficient balance');
    }

    const betId = "BET-" + Math.floor(Math.random() * 900000 + 100000);
    const newBet = {
      id: betId,
      matchId: betSlip.match.id,
      matchTeams: `${betSlip.match.home.name} vs ${betSlip.match.away.name}`,
      optionLabel: betSlip.label,
      betKey: betSlip.key,
      odds: betSlip.value,
      stake: stake,
      payout: stake * betSlip.value,
      status: 'PENDING',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    let newBalance = user.balance - stake;
    let refilled = false;
    if (newBalance < 10) {
      newBalance = 10000;
      refilled = true;
    }

    const updatedUser = {
      ...user,
      balance: newBalance,
      betHistory: [...(user.betHistory || []), newBet]
    };

    setUser(updatedUser);
    localStorage.setItem('wc2026_user_profile', JSON.stringify(updatedUser));
    
    if (refilled) {
      setTimeout(() => {
        alert(t('refilledCoinsAlert'));
      }, 500);
    }

    return Promise.resolve({ success: true, betId });
  };

  const handleAddBet = (match, label, value, key) => {
    setActiveBet({
      match,
      label,
      value,
      key
    });
  };

  if (isMobile) {
    return (
      <div className="app-container min-h-screen font-body-md bg-background text-on-background relative overflow-x-hidden mobile-content-container px-4">
        {/* Background Decorative Ambient Glows */}
        <div className="ambient-glow-1"></div>
        <div className="ambient-glow-2"></div>

        {/* Mobile Top Header */}
        <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/70 backdrop-blur-3xl border-b border-white/40 shadow-[0px_10px_30px_rgba(0,0,0,0.04)] mobile-header-notch flex justify-between items-center px-4">
          <h1 
            className="font-display-lg text-[22px] font-black text-primary tracking-tighter cursor-pointer"
            onClick={() => { setActivePage('DASHBOARD'); setActiveMatchId(null); }}
          >
            World Cup 2026
          </h1>
          {user ? (
            <button 
              onClick={() => setActivePage('PROFILE')}
              className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shadow border border-white/40 active:scale-95 duration-200"
            >
              {user.initials || user.name.charAt(0)}
            </button>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="w-9 h-9 rounded-full bg-white/50 border border-white/60 flex items-center justify-center text-primary active:scale-95 duration-200"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>account_circle</span>
            </button>
          )}
        </header>

        {/* Mobile Page Content Switcher */}
        {activePage === 'ADMIN_PORTAL' ? (
          <div className="w-full">
            <AdminDashboard setActivePage={setActivePage} />
          </div>
        ) : activePage === 'DASHBOARD' ? (
          <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
            {/* Hero Mascot Card */}
            <div className="bento-tile mobile-mascot-card flex flex-col items-center text-center p-6">
              <div className="w-full h-40 rounded-xl overflow-hidden mb-4 relative mobile-mascot-image-container flex items-center justify-center border border-white/30">
                <div className="mobile-mascot-glow"></div>
                <img 
                  alt="Heo Hồng Mascot" 
                  className="w-[70%] h-[70%] object-contain drop-shadow-xl z-10" 
                  src="/drpig_mascot.png" 
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500'; }}
                />
                <div className="absolute bottom-3 left-3 text-left z-10">
                  <span className="inline-block px-2.5 py-0.5 bg-white/85 backdrop-blur-md rounded-full font-bold text-[10px] text-primary mb-1 shadow-sm border border-white/20">
                    {t('withHeoHong')}
                  </span>
                  <h2 className="text-base font-black text-on-surface leading-tight">{t('wc2026Season')}</h2>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant max-w-[280px]">
                {t('heroDescSub')}
              </p>
            </div>

            {/* Live Match Bento Card */}
            {(() => {
              const liveMatch = matches.find(m => m.status === 'LIVE') || matches[0];
              if (!liveMatch) return null;
              const isLive = liveMatch.status === 'LIVE';
              return (
                <div 
                  onClick={() => setActiveMatchId(liveMatch.id)}
                  className={`bento-tile p-5 cursor-pointer hover:border-primary/20 transition-all active:scale-98 duration-200 ${isLive ? 'live-match-glow-border' : ''}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                      {isLive ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
                          <span className="text-danger uppercase tracking-wider text-[10px] font-black">{t('liveText')}</span>
                        </>
                      ) : (
                        <span className="text-primary uppercase tracking-wider text-[10px] font-black">{t('featuredText')}</span>
                      )}
                    </h3>
                    <span className="text-[10px] font-bold text-secondary">
                      {isLive ? `Phút ${liveMatch.minute}'` : t('kickoffSchedule')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white/45 rounded-2xl p-4 border border-white/60 shadow-inner">
                    <div className="flex flex-col items-center gap-1.5 w-1/3">
                      <img 
                        src={`https://flagcdn.com/w40/${liveMatch.home.flag}.png`} 
                        alt={liveMatch.home.name} 
                        className="w-10 h-7 object-cover rounded shadow-sm border border-black/5" 
                      />
                      <span className="font-bold text-[11px] text-on-surface truncate w-full text-center">{liveMatch.home.name}</span>
                    </div>
                    <div className="text-center w-1/3">
                      {isLive || liveMatch.status === 'FINISHED' ? (
                        <div className="text-xl font-black text-primary tracking-tighter">{liveMatch.homeScore} - {liveMatch.awayScore}</div>
                      ) : (
                        <div className="text-xs font-black text-on-surface-variant/80">VS</div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1.5 w-1/3">
                      <img 
                        src={`https://flagcdn.com/w40/${liveMatch.away.flag}.png`} 
                        alt={liveMatch.away.name} 
                        className="w-10 h-7 object-cover rounded shadow-sm border border-black/5" 
                      />
                      <span className="font-bold text-[11px] text-on-surface truncate w-full text-center">{liveMatch.away.name}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 2-Column Bento Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Oracle banner */}
              <div 
                onClick={() => setActivePage('ORACLE')}
                className="bento-tile p-4 bg-gradient-to-br from-white/70 to-tertiary-fixed/20 flex flex-col justify-between aspect-square cursor-pointer hover:brightness-102 duration-200"
              >
                <div>
                  <span className="material-symbols-outlined text-3xl text-tertiary mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                  <h3 className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">{t('navOracle')}</h3>
                  <p className="font-black text-xs text-primary leading-tight">{t('withHeoHong')}</p>
                </div>
                <button className="w-full py-1 bg-white/85 rounded-xl text-primary font-bold text-[10px] shadow-sm border border-white/50">
                  {t('askNow')}
                </button>
              </div>
              {/* Quick Bet */}
              <div 
                onClick={() => {
                  const liveMatch = matches.find(m => m.status === 'LIVE') || matches[0];
                  if (liveMatch) {
                    setActiveMatchId(liveMatch.id);
                  }
                }}
                className="bento-tile p-4 flex flex-col justify-between aspect-square cursor-pointer hover:brightness-102 duration-200"
              >
                <div>
                  <span className="material-symbols-outlined text-3xl text-secondary mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                  <h3 className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">{t('quickBetHeading')}</h3>
                  <p className="font-black text-xs text-secondary leading-tight">{t('chooseOdds')}</p>
                </div>
                <button className="w-full py-1 bg-primary text-white rounded-xl font-bold text-[10px] shadow-sm border border-primary/25">
                  {t('chooseOdds')}
                </button>
              </div>
            </div>

            {/* Matches List */}
            <div className="mt-2">
              <MatchList 
                matches={matches} 
                onSelectMatch={setActiveMatchId} 
                activeMatchId={null}
                user={user}
                onToggleBookmark={handleToggleBookmark}
              />
            </div>
          </div>
        ) : activePage === 'NEWS_HUB' ? (
          <div className="w-full">
            <NewsHub matches={matches} />
          </div>
        ) : activePage === 'STANDINGS' ? (
          <div className="w-full">
            <Standings matches={matches} isFullPage={true} />
          </div>
        ) : activePage === 'ORACLE' ? (
          <div className="w-full">
            <OracleChat />
          </div>
        ) : (
          <div className="w-full">
            <Profile 
              user={user}
              onLogout={handleLogout}
              onResetBalance={handleResetBalance}
              onSelectMatch={(id) => { setActivePage('DASHBOARD'); setActiveMatchId(id); }}
              matches={matches}
              onToggleFavoriteTeam={handleToggleFavoriteTeam}
            />
          </div>
        )}

        <footer className="w-full mt-8 mb-24 px-4 text-center text-[10px] text-on-surface-variant/75 leading-relaxed">
          <p>{t('bettingLegalWarning')}</p>
          <p className="font-bold mt-2">{t('copyrightFooter')}</p>
        </footer>

        {/* Mobile Slide-Up Match Detail Bottom Sheet */}
        {activeMatchId && activeMatch && (
          <div className="mobile-match-detail-sheet">
            <div className="mobile-sheet-drag-handle"></div>
            <MatchDetail 
              match={activeMatch} 
              onAddBet={(matchItem, label, value, key) => {
                handleAddBet(matchItem, label, value, key);
                setShowBetSlipModal(true);
              }}
              activeBetId={activeBet ? activeBet.key : null}
              onClose={() => setActiveMatchId(null)}
              user={user}
              onToggleBookmark={handleToggleBookmark}
              matches={matches}
            />
          </div>
        )}

        {/* Mobile Floating Bet Slip FAB */}
        {activeBet && !showBetSlipModal && (
          <button 
            onClick={() => setShowBetSlipModal(true)}
            className="mobile-betslip-fab"
          >
            <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
            <span>{t('liveBetLabel')} ({activeBet.label} x{activeBet.value.toFixed(2)})</span>
          </button>
        )}

        {/* Mobile Bet Slip Slide-Up Modal Sheet */}
        {showBetSlipModal && activeBet && (
          <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={() => setShowBetSlipModal(false)}>
            <div className="modal-content bento-glass animate-scale-up" onClick={e => e.stopPropagation()}>
              <div className="mobile-sheet-drag-handle"></div>
              <BetSlip 
                activeBet={activeBet} 
                onClearBet={() => { setActiveBet(null); setShowBetSlipModal(false); }} 
                matches={matches}
                user={user}
                onPlaceBet={(slip, stake) => {
                  return handlePlaceBet(slip, stake).then(res => {
                    setTimeout(() => setShowBetSlipModal(false), 800);
                    return res;
                  });
                }}
                onClearBetHistory={handleClearBetHistory}
              />
            </div>
          </div>
        )}

        {/* Mobile Bottom Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 w-full z-50 bg-white/85 backdrop-blur-3xl border-t border-white/40 pb-safe shadow-[0px_-8px_30px_rgba(0,0,0,0.03)] pb-2 pt-2">
          <ul className="flex justify-around items-center h-14 px-2">
            <li className="flex-1">
              <button 
                onClick={() => { setActivePage('DASHBOARD'); setActiveMatchId(null); }}
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-200 ${
                  activePage === 'DASHBOARD' ? 'text-primary font-black scale-102' : 'text-on-surface-variant/80'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: activePage === 'DASHBOARD' ? "'FILL' 1" : "'FILL' 0" }}>sports_soccer</span>
                <span className="text-[9px] font-bold tracking-tight">{t('navMatches')}</span>
                {activePage === 'DASHBOARD' && <span className="mobile-tab-indicator"></span>}
              </button>
            </li>
            <li className="flex-1">
              <button 
                onClick={() => setActivePage('NEWS_HUB')}
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-200 ${
                  activePage === 'NEWS_HUB' ? 'text-primary font-black scale-102' : 'text-on-surface-variant/80'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: activePage === 'NEWS_HUB' ? "'FILL' 1" : "'FILL' 0" }}>article</span>
                <span className="text-[9px] font-bold tracking-tight">{t('navNews')}</span>
                {activePage === 'NEWS_HUB' && <span className="mobile-tab-indicator"></span>}
              </button>
            </li>
            <li className="flex-1">
              <button 
                onClick={() => setActivePage('STANDINGS')}
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-200 ${
                  activePage === 'STANDINGS' ? 'text-primary font-black scale-102' : 'text-on-surface-variant/80'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: activePage === 'STANDINGS' ? "'FILL' 1" : "'FILL' 0" }}>format_list_numbered</span>
                <span className="text-[9px] font-bold tracking-tight">{t('navStandings')}</span>
                {activePage === 'STANDINGS' && <span className="mobile-tab-indicator"></span>}
              </button>
            </li>
            <li className="flex-1">
              <button 
                onClick={() => setActivePage('ORACLE')}
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-200 ${
                  activePage === 'ORACLE' ? 'text-primary font-black scale-102' : 'text-on-surface-variant/80'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: activePage === 'ORACLE' ? "'FILL' 1" : "'FILL' 0" }}>auto_awesome</span>
                <span className="text-[9px] font-bold tracking-tight">{t('navOracle')}</span>
                {activePage === 'ORACLE' && <span className="mobile-tab-indicator"></span>}
              </button>
            </li>
            <li className="flex-1">
              <button 
                onClick={() => setActivePage('PROFILE')}
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-200 ${
                  activePage === 'PROFILE' ? 'text-primary font-black scale-102' : 'text-on-surface-variant/80'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: activePage === 'PROFILE' ? "'FILL' 1" : "'FILL' 0" }}>account_circle</span>
                <span className="text-[9px] font-bold tracking-tight">{t('navProfile')}</span>
                {activePage === 'PROFILE' && <span className="mobile-tab-indicator"></span>}
              </button>
            </li>
          </ul>
        </nav>

        {/* Mock Login Modal */}
        {showLoginModal && (
          <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={() => setShowLoginModal(false)}>
            <div className="modal-content bento-glass animate-scale-up" style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '16px' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <svg viewBox="0 0 24 24" width="42" height="42" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Đăng nhập bằng Google</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Chọn tài khoản để tiếp tục với AI Football World Cup 2026</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <button 
                  className="flex items-center gap-3 p-3 w-full bg-white/40 hover:bg-white/80 transition-colors border border-white/60 rounded-xl"
                  onClick={() => handleSelectMockAccount('DrTo Fan', 'drto.fan@gmail.com', 'DT')}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContext: 'center', fontSize: '0.8rem', fontWeight: 800, justifyContent: 'center' }}>DT</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>DrTo Fan</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>drto.fan@gmail.com</div>
                  </div>
                </button>

                <button 
                  className="flex items-center gap-3 p-3 w-full bg-white/40 hover:bg-white/80 transition-colors border border-white/60 rounded-xl"
                  onClick={() => handleSelectMockAccount('Nguyen Van A', 'nguyenvana@gmail.com', 'NVA')}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContext: 'center', fontSize: '0.8rem', fontWeight: 800, justifyContent: 'center' }}>NA</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Nguyen Van A</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>nguyenvana@gmail.com</div>
                  </div>
                </button>

                <button 
                  className="flex items-center justify-center p-3 w-full bg-transparent hover:bg-white/40 transition-colors border border-dashed border-white/60 rounded-xl text-on-surface-variant font-bold text-xs"
                  onClick={handleCustomGoogleAccount}
                >
                  Sử dụng tài khoản khác...
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tablet & Desktop view
  return (
    <div className="app-container min-h-screen font-body-md bg-background text-on-background relative overflow-x-hidden pb-12">
      {/* Background Decorative Ambient Glows */}
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>
      
      <Navbar 
        activePage={activePage}
        setActivePage={setActivePage}
        user={user}
        onGoogleLoginClick={() => setShowLoginModal(true)}
      />

      {activePage === 'ADMIN_PORTAL' ? (
        <div className="pt-28 px-4 md:px-8 w-full max-w-7xl mx-auto">
          <AdminDashboard setActivePage={setActivePage} />
        </div>
      ) : (
        <main className="pt-28 pb-16 px-4 md:px-8 w-full max-w-7xl mx-auto flex flex-col gap-6 relative z-10">
          
          {/* Grid Layout containing Hero Mascot & AI Oracle Banner (only on Dashboard homepage when no match is selected) */}
          {activePage === 'DASHBOARD' && !activeMatchId && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Hero Mascot Tile */}
              <div className="bento-tile md:col-span-8 flex flex-col lg:flex-row items-center gap-4 lg:gap-8 min-h-[320px] p-6 lg:p-8">
                <div className="flex-1 space-y-4">
                  <span className="inline-block px-3 py-1 bg-secondary-container/20 text-secondary border border-secondary/20 rounded-full font-bold text-xs uppercase tracking-wider">
                    {t('wc2026Season')}
                  </span>
                  <h1 className="text-3xl md:text-5xl font-black text-on-background leading-tight">
                    {t('heroHeading')} <span className="text-primary">Heo Hồng 🐷</span>
                  </h1>
                  <p className="text-base text-on-surface-variant max-w-md">
                    {t('heroDesc')}
                  </p>
                  <button 
                    onClick={() => {
                      const firstLive = matches.find(m => m.status === 'LIVE');
                      if (firstLive) setActiveMatchId(firstLive.id);
                      else if (matches.length > 0) setActiveMatchId(matches[0].id);
                    }}
                    className="mt-4 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:brightness-110 transition-all flex items-center gap-2 w-fit shadow-md"
                  >
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                    {t('predictNowBtn')}
                  </button>
                </div>
                <div className="w-full lg:w-5/12 h-64 lg:h-full relative rounded-xl overflow-hidden bg-white/40 border border-white/50 shadow-inner flex items-center justify-center">
                  <img 
                    alt="Cute 3D pig mascot playing soccer" 
                    className="w-[85%] h-[85%] object-contain drop-shadow-xl" 
                    src="/drpig_mascot.png" 
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=80'; }}
                  />
                </div>
              </div>

              {/* Oracle AI Prediction */}
              <div className="bento-tile md:col-span-4 bg-gradient-to-br from-tertiary-container/10 to-tertiary/20 text-on-surface flex flex-col justify-between p-6 lg:p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-tertiary text-[24px]">auto_awesome</span>
                      <h2 className="text-lg font-bold">{t('navOracle')}</h2>
                    </div>
                    <p className="text-xs text-on-surface-variant/80">{language === 'vi' ? 'Dự đoán trận đấu bằng AI' : 'AI Match Predictions'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-white/45 rounded-xl border border-white/60 backdrop-blur-md space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>USA vs ENG</span>
                    <span className="text-tertiary">{language === 'vi' ? 'Độ tin cậy 82%' : '82% Confidence'}</span>
                  </div>
                  <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-tertiary to-primary w-[82%] rounded-full shadow-[0_0_10px_rgba(0,107,91,0.3)]"></div>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {language === 'vi' 
                      ? 'Heo Hồng 🐷 dự kiến USA có lợi thế sân nhà cực lớn. Trận đấu hứa hẹn đôi công rực lửa, khả năng xuất hiện nhiều góc và bàn thắng!'
                      : 'Piggy 🐷 predicts USA will have a huge home advantage. The match promises high offensive tempo, likely with many corners and goals!'}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* Main Content Layout Grid */}
          <div className={activePage === 'NEWS_HUB' || activePage === 'STANDINGS' || activePage === 'PROFILE' || activePage === 'ORACLE' ? 'w-full' : 'grid grid-cols-1 md:grid-cols-12 gap-6'}>
            
            {/* Left Column: MatchList, Detail, News, Standings, Oracle or Profile */}
            <div className={activePage === 'NEWS_HUB' || activePage === 'STANDINGS' || activePage === 'PROFILE' || activePage === 'ORACLE' ? 'col-span-12' : 'col-span-12 md:col-span-8 flex flex-col gap-6'}>
              {activePage === 'NEWS_HUB' ? (
                <NewsHub matches={matches} />
              ) : activePage === 'STANDINGS' ? (
                <Standings matches={matches} isFullPage={true} />
              ) : activePage === 'ORACLE' ? (
                <OracleChat />
              ) : activePage === 'PROFILE' ? (
                <Profile 
                  user={user}
                  onLogout={handleLogout}
                  onResetBalance={handleResetBalance}
                  onSelectMatch={setActiveMatchId}
                  matches={matches}
                  onToggleFavoriteTeam={handleToggleFavoriteTeam}
                />
              ) : activeMatch ? (
                <div className="flex flex-col gap-6">
                  {/* Split Screen View on desktop/tablet */}
                  <div className="hidden md:grid grid-cols-12 gap-6">
                    <div className="col-span-5">
                      <MatchList 
                        matches={matches} 
                        onSelectMatch={setActiveMatchId} 
                        activeMatchId={activeMatchId}
                        user={user}
                        onToggleBookmark={handleToggleBookmark}
                      />
                    </div>
                    <div className="col-span-7">
                      <MatchDetail 
                        match={activeMatch} 
                        onAddBet={handleAddBet}
                        activeBetId={activeBet ? activeBet.key : null}
                        onClose={() => setActiveMatchId(null)}
                        user={user}
                        onToggleBookmark={handleToggleBookmark}
                        matches={matches}
                      />
                    </div>
                  </div>

                  <div className="md:hidden">
                    <MatchDetail 
                      match={activeMatch} 
                      onAddBet={handleAddBet}
                      activeBetId={activeBet ? activeBet.key : null}
                      onClose={() => setActiveMatchId(null)}
                      user={user}
                      onToggleBookmark={handleToggleBookmark}
                      matches={matches}
                    />
                  </div>
                </div>
              ) : (
                <MatchList 
                  matches={matches} 
                  onSelectMatch={setActiveMatchId} 
                  activeMatchId={null}
                  user={user}
                  onToggleBookmark={handleToggleBookmark}
                />
              )}
            </div>

            {/* Right Column Sidebar (Only visible in Dashboard layout) */}
            {activePage === 'DASHBOARD' && (
              <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
                
                {/* Mascot Promo Card */}
                <div className="bento-tile bg-gradient-to-br from-white/70 to-secondary-fixed/10 p-4 sm:p-6 flex items-center gap-4">
                  <img 
                    src="/drpig_mascot.png" 
                    alt="Heo Hồng Mascot" 
                    className="w-16 h-16 object-cover rounded-full border-2 border-accent-gold shadow-[0_0_8px_rgba(200,168,75,0.3)] flex-shrink-0" 
                  />
                  <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-sm text-secondary">{t('clashWc2026')}</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {t('clashWc2026Desc')}
                    </p>
                  </div>
                </div>

                {/* Bet Slip */}
                <BetSlip 
                  activeBet={activeBet} 
                  onClearBet={() => setActiveBet(null)} 
                  matches={matches}
                  user={user}
                  onPlaceBet={handlePlaceBet}
                  onClearBetHistory={handleClearBetHistory}
                />

                {/* Mini Standings (only show in Dashboard list view) */}
                {!activeMatchId && <Standings matches={matches} />}

                {/* Mini Promo Card */}
                <div className="bento-tile p-4 sm:p-6 space-y-3">
                  <h4 className="font-bold text-xs flex items-center gap-1.5 text-primary uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[16px] text-primary">trophy</span> {t('giftAndPredictions')}
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {t('giftPromoDesc')}
                  </p>
                  <a 
                    href="#gift" 
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-primary-fixed/20 hover:bg-primary-fixed/40 transition-colors text-primary font-bold text-xs"
                    onClick={(e) => { e.preventDefault(); alert(t('giftPromoAlert')); }}
                  >
                    <span>{t('giftPromoDetail')}</span> 
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Apple-style Mock Google Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={() => setShowLoginModal(false)}>
          <div className="modal-content bento-glass animate-scale-up" style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '16px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <svg viewBox="0 0 24 24" width="42" height="42" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{t('loginGoogleTitle')}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{t('loginGoogleDesc')}</p>
            
            {/* Choose Display Language in Login Modal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '1rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{t('chooseLanguageLabel')}</span>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button 
                  onClick={() => changeLanguage('vi')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    language === 'vi' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-white/50 border border-white/60 hover:bg-white/80'
                  }`}
                >
                  <span>🇻🇳</span> {t('vietnameseOption')}
                </button>
                <button 
                  onClick={() => changeLanguage('en')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    language === 'en' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-white/50 border border-white/60 hover:bg-white/80'
                  }`}
                >
                  <span>🇬🇧</span> {t('englishOption')}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              <button 
                className="flex items-center gap-3 p-3 w-full bg-white/40 hover:bg-white/80 transition-colors border border-white/60 rounded-xl"
                onClick={() => handleSelectMockAccount('DrTo Fan', 'drto.fan@gmail.com', 'DT')}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContext: 'center', fontSize: '0.8rem', fontWeight: 800, justifyContent: 'center' }}>DT</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>DrTo Fan</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>drto.fan@gmail.com</div>
                </div>
              </button>

              <button 
                className="flex items-center gap-3 p-3 w-full bg-white/40 hover:bg-white/80 transition-colors border border-white/60 rounded-xl"
                onClick={() => handleSelectMockAccount('Nguyen Van A', 'nguyenvana@gmail.com', 'NVA')}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContext: 'center', fontSize: '0.8rem', fontWeight: 800, justifyContent: 'center' }}>NA</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Nguyen Van A</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>nguyenvana@gmail.com</div>
                </div>
              </button>

              <button 
                className="flex items-center justify-center p-3 w-full bg-transparent hover:bg-white/40 transition-colors border border-dashed border-white/60 rounded-xl text-on-surface-variant font-bold text-xs"
                onClick={handleCustomGoogleAccount}
              >
                {t('useAnotherAccount')}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-12 py-6 border-t border-white/30 text-center text-xs text-on-surface-variant/75 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <p className="max-w-xl text-left md:text-center leading-relaxed">
          {t('bettingLegalWarning')}
        </p>
        <p className="font-bold">
          {t('copyrightFooter')}
        </p>
      </footer>

    </div>
  );
}

export default App;
