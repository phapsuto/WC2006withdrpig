import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
// Sidebar365 removed — 2-column layout only
import MatchList from './components/MatchList';
import MatchDetail from './components/MatchDetailAntd';
import BetSlip from './components/BetSlip';
import Standings from './components/Standings';
import NewsHub from './components/NewsHub';
import AdminDashboard from './components/AdminDashboard';
import Profile from './components/Profile';
import PlayerDetail from './components/PlayerDetail';
import TeamDetail from './components/TeamDetail';
import AuthModal from './components/AuthModal';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import { subscribeToFootballData, getApiConfig } from './services/api';
import { useLanguage } from './utils/LanguageContext';
import { X, Flame, Ticket } from 'lucide-react';
import { Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Drawer, FloatButton, message } from 'antd';
import { backendClient } from './services/backendClient';
import './App.css';

function App() {
  const { language, changeLanguage, t } = useLanguage();
  const [apiMode, setApiMode] = useState(getApiConfig().apiMode || 'DEMO');
  const [matches, setMatches] = useState([]); // Flat array for activeMatch/bets
  const [groupedMatches, setGroupedMatches] = useState({ popular: [], countries: [] }); // Grouped data for MatchList
  const [leagueStatus, setLeagueStatus] = useState('ACTIVE'); // ACTIVE | OFF_SEASON | UPCOMING_SEASON | NO_MATCHES_IN_RANGE
  const [seasonInfo, setSeasonInfo] = useState(null);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [activeBet, setActiveBet] = useState(null);
  const [selectedDate, setSelectedDate] = useState('today');
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const path = location.pathname;
  let activePage = 'DASHBOARD';
  if (path.startsWith('/standings')) activePage = 'STANDINGS';
  else if (path.startsWith('/news')) activePage = 'NEWS_HUB';
  else if (path.startsWith('/oracle')) activePage = 'ORACLE';
  else if (path.startsWith('/profile')) activePage = 'PROFILE';
  else if (path.startsWith('/admin')) activePage = 'ADMIN_PORTAL';

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showBetSlipModal, setShowBetSlipModal] = useState(false);

  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('wc2026_theme');
      if (saved) return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      console.error(e);
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('wc2026_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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

  const currentLeagueId = searchParams.get('league') ? parseInt(searchParams.get('league')) : 732;

  // Fetch real data from Backend API
  useEffect(() => {
    const fetchMatches = async (isBackground = false) => {
      if (!isBackground) setIsLoadingMatches(true);
      try {
        const data = await backendClient.getGroupedMatches(selectedDate);
        if (data.success && data.data) {
          setGroupedMatches(data.data);

          // Flatten matches for global state (MatchDetail, BetSlip)
          let allMatches = [];
          data.data.popular.forEach(l => allMatches.push(...l.matches));
          data.data.countries.forEach(c => c.leagues.forEach(l => allMatches.push(...l.matches)));

          setMatches(allMatches);
          setLeagueStatus('ACTIVE'); // Fallback since grouping doesn't return leagueStatus yet
          setSeasonInfo(null);

          if (allMatches.length > 0) {
            setActiveMatchId(prev => {
              if (!prev) {
                const liveMatch = allMatches.find(m => m.status === 'LIVE');
                if (liveMatch) return liveMatch.id;

                const todayStr = new Date().toISOString().slice(0, 10);
                const todayMatches = allMatches.filter(m => (m.date || '').startsWith(todayStr));
                if (todayMatches.length > 0) {
                  const todayUpcoming = todayMatches.find(m => m.status === 'UPCOMING');
                  return todayUpcoming ? todayUpcoming.id : todayMatches[todayMatches.length - 1].id;
                }

                const upcoming = allMatches.filter(m => m.status === 'UPCOMING').sort((a, b) => new Date(a.date) - new Date(b.date));
                if (upcoming.length > 0) return upcoming[0].id;

                return allMatches[0].id;
              }
              return prev;
            });
          } else {
            setActiveMatchId(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch matches from backend:', error);
      } finally {
        if (!isBackground) setIsLoadingMatches(false);
      }
    };

    fetchMatches(false); // Initial fetch
    const intervalId = setInterval(() => fetchMatches(true), 30000); // Fetch every 30 seconds

    return () => clearInterval(intervalId);
  }, [currentLeagueId, selectedDate]);

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



  const activeMatch = matches.find((m) => m.id === activeMatchId);

  const handleSelectMockAccount = (name, email, initials) => {
    const newUser = {
      name,
      email,
      initials,
      balance: 500,
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
    setShowLoginModal(true);
  };

  const handleLogout = async () => {
    try {
      await backendClient.logout();
    } catch (err) {
      console.error(err);
    }
    setUser(null);
    localStorage.removeItem('wc2026_user_profile');
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    navigate('/matches');
  };

  const handleResetBalance = () => {
    if (!user) return;
    const updatedUser = { ...user, balance: 500 };
    setUser(updatedUser);
    localStorage.setItem('wc2026_user_profile', JSON.stringify(updatedUser));
  };

  const handleClearBetHistory = () => {
    if (!user) return;
    const updatedUser = { ...user, betHistory: [] };
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

  const handleToggleBookmark = async (matchId) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    try {
      // Optimistic update
      const savedMatches = [...(user.savedMatches || [])];
      const index = savedMatches.indexOf(matchId);
      if (index > -1) {
        savedMatches.splice(index, 1);
      } else {
        savedMatches.push(matchId);
      }
      
      const updatedUser = { ...user, savedMatches };
      setUser(updatedUser);
      localStorage.setItem('wc2026_user_profile', JSON.stringify(updatedUser));

      // API Call
      const res = await backendClient.toggleSaveMatch(matchId);
      if (res.success) {
        const confirmedUser = { ...user, savedMatches: res.savedMatches };
        setUser(confirmedUser);
        localStorage.setItem('wc2026_user_profile', JSON.stringify(confirmedUser));
      }
    } catch (e) {
      console.error('Failed to toggle bookmark:', e);
      // Revert optimistic on error if needed
    }
  };

  const handlePlaceBet = async (betSlip, stake) => {
    if (!user) {
      setShowLoginModal(true);
      return Promise.reject('Not logged in');
    }
    if (user.balance < stake) {
      message.error(t('alertInsufficientBalance'));
      return Promise.reject('Insufficient balance');
    }

    try {
      const betData = {
        matchId: betSlip.match.id,
        betKey: betSlip.key,
        betName: betSlip.label,
        odds: betSlip.value,
        amount: stake
      };
      
      const res = await backendClient.placeBet(betData);
      
      if (res.success && res.bet) {
        // Update local user balance (history will be fetched from backend in Profile)
        const updatedUser = {
          ...user,
          balance: user.balance - stake,
        };
        setUser(updatedUser);
        localStorage.setItem('wc2026_user_profile', JSON.stringify(updatedUser));
        
        message.success('Đặt cược thành công!');
        return Promise.resolve({ success: true, betId: res.bet._id });
      } else {
        message.error(res.message || 'Lỗi khi đặt cược');
        return Promise.reject(res.message || 'Lỗi khi đặt cược');
      }
    } catch (err) {
      console.error(err);
      message.error('Lỗi hệ thống');
      return Promise.reject('Lỗi hệ thống');
    }
  };

  const handleAddBet = (match, label, value, key) => {
    setActiveBet({ match, label, value, key });
    setShowBetSlipModal(true);
  };


  return (
    <div className="min-h-screen bg-white/70 text-[var(--365-text-main)] flex flex-col pt-[120px] pb-10 md:pb-20">
      <Navbar
        activePage={location.pathname}
        user={user}
        onGoogleLoginClick={() => setShowLoginModal(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* 2-Column Layout: List + Detail */}
      <main className="flex justify-center w-full px-4 lg:px-6">
        <div className="flex flex-col xl:flex-row w-full max-w-[1240px] gap-4 mt-6">

          {/* Center Column (Flex, MatchList or Content) */}
          <div className={`flex-1 flex flex-col gap-4 min-w-0 ${location.pathname === '/matches' && activeMatchId ? 'hidden xl:flex' : ''}`}>
            <Routes>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/news" element={<NewsHub matches={matches} />} />
              <Route path="/news/:slug" element={<NewsHub matches={matches} />} />
              <Route path="/player/:playerId" element={<PlayerDetail />} />
              <Route path="/team/:teamId" element={<TeamDetail onSelectMatch={setActiveMatchId} />} />
              <Route path="/standings" element={<Standings matches={matches} isFullPage={true} leagueId={currentLeagueId} />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/profile" element={
                <Profile
                  user={user}
                  onLogout={handleLogout}
                  onResetBalance={handleResetBalance}
                  onClearBetHistory={handleClearBetHistory}
                  onToggleFavoriteTeam={handleToggleFavoriteTeam}
                  setUser={setUser}
                  matches={matches}
                  onSelectMatch={setActiveMatchId}
                />
              } />
              <Route path="/matches" element={
                <MatchList 
                  groupedMatches={groupedMatches}
                  matches={matches}
                  leagueStatus={leagueStatus}
                  onSelectMatch={setActiveMatchId}
                  activeMatchId={activeMatchId}
                  user={user}
                  onToggleBookmark={handleToggleBookmark}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  isLoadingMatches={isLoadingMatches}
                />
              } />
              <Route path="/" element={<Navigate to="/matches" replace />} />
              <Route path="*" element={<Navigate to="/matches" replace />} />
            </Routes>
          </div>

          {/* Right Column — Detail (larger) */}
          {location.pathname === '/matches' && (
            <div className={`w-full xl:flex-[1.4] flex-none flex flex-col gap-3 ${!activeMatchId ? 'hidden xl:flex' : ''}`}>
              {activeMatchId && activeMatch ? (
                <div>
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
              ) : (
                <div className="flex flex-col gap-4">
                  <Standings matches={matches} />
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <Drawer
        placement={isMobile ? "bottom" : "right"}
        onClose={() => setShowBetSlipModal(false)}
        open={showBetSlipModal}
        width={400}
        height={isMobile ? "85vh" : "100%"}
        closable={false}
        styles={{
          body: { padding: 0, backgroundColor: '#f9fafb' },
          mask: { backdropFilter: 'blur(4px)' }
        }}
        className="rounded-t-2xl md:rounded-none overflow-hidden"
      >
        {/* Mobile Drag Handle */}
        {isMobile && (
          <div className="w-full flex justify-center py-2 bg-gray-50 absolute top-0 z-50 rounded-t-2xl">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
        )}
        
        {/* Desktop Close Button */}
        {!isMobile && (
          <button 
            onClick={() => setShowBetSlipModal(false)}
            className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X size={18} />
          </button>
        )}

        <div className={`h-full flex flex-col ${isMobile ? 'pt-4' : ''}`}>
          <BetSlip
            activeBet={activeBet}
            onClearBet={() => { setActiveBet(null); setShowBetSlipModal(false); }}
            user={user}
            onPlaceBet={handlePlaceBet}
            onClearBetHistory={handleClearBetHistory}
          />
        </div>
      </Drawer>

      <FloatButton
        icon={<img src="/gieo.png" alt="Gieo Quẻ" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
        type="default"
        style={{ right: 24, bottom: 24, width: 64, height: 64 }}
        badge={{ count: activeBet ? 1 : 0 }}
        onClick={() => setShowBetSlipModal(true)}
      />

      <AuthModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        setUser={setUser} 
      />
    </div>
  );
}

export default App;