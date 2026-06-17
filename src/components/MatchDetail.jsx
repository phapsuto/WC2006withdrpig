import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, BarChart2, ListTodo, Users, BadgePercent, ArrowUp, ArrowDown, MessageSquare, ThumbsUp, Newspaper, Loader2, RefreshCw, Cpu, CheckCircle2, Share2, Send, Star } from 'lucide-react';
import { getHeoHongPrediction, getDynamicSocialReactions, getSportsAnalytics, chatWithHeoHong } from '../services/gemini';
import { predictMatch } from '../utils/aiPredictor';
import { STADIUMS_INFO, convertToUserTimezone } from '../services/worldcup26api';
import { useLiveMatchClock } from '../services/useLiveMatchClock';

const getSocialAvatar = (source, index) => {
  const AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
  ];
  const srcLower = source.toLowerCase();
  if (srcLower.includes('romano') || srcLower.includes('sky') || srcLower.includes('espn') || srcLower.includes('goal')) {
    return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80';
  }
  if (srcLower.includes('quân') || srcLower.includes('cương') || srcLower.includes('huy')) {
    return 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80';
  }
  return AVATARS[index % AVATARS.length];
};

const SOCCER_CLIPS = [
  '/videos/clip_1.mp4',
  '/videos/clip_2.mp4',
  '/videos/clip_3.mp4',
  '/videos/clip_4.mp4'
];

export default function MatchDetail({ match, onAddBet, activeBetId, onClose, user, onToggleBookmark }) {
  const [activeTab, setActiveTab] = useState('ODDS'); // STATS, TIMELINE, LINEUPS, ODDS, NEWS, ANALYTICS, CHAT
  const [aiPrediction, setAiPrediction] = useState('');
  const [aiReactions, setAiReactions] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedSocial, setSelectedSocial] = useState(null);
  
  // Chat States
  const [chatMessages, setChatMessages] = useState([
    { role: 'model', text: 'Chào các fen! Heo Hồng 🐷 đã sẵn sàng cùng anh em đàm đạo soi kèo trận đấu rực lửa này rồi đây. Anh em muốn hỏi gì về chiến thuật, tỉ số hay kèo tài xỉu nào? 🐷⚽' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef(null);

  const isBookmarked = user?.bookmarks?.includes(match.id);

  const fetchAiInsights = useCallback(async () => {
    setLoadingAi(true);
    try {
      const pred = await getHeoHongPrediction(match);
      setAiPrediction(pred);
      const react = await getDynamicSocialReactions(match);
      setAiReactions(react);
    } catch (e) {
      console.error('Lỗi khi tải thông tin từ Gemini:', e);
    } finally {
      setLoadingAi(false);
    }
  }, [match]);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const data = await getSportsAnalytics(match);
      setAnalyticsData(data);
    } catch (e) {
      console.error('Lỗi khi tải AI Phân tích xG:', e);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [match]);

  // Reset states when match changes
  useEffect(() => {
    setTimeout(() => {
      setActiveTab('ODDS');
      setAiPrediction('');
      setAiReactions([]);
      setAnalyticsData(null);
      setSelectedSocial(null);
      setChatMessages([
        { role: 'model', text: 'Chào các fen! Heo Hồng 🐷 đã sẵn sàng cùng anh em đàm đạo soi kèo trận đấu rực lửa này rồi đây. Anh em muốn hỏi gì về chiến thuật, tỉ số hay kèo tài xỉu nào? 🐷⚽' }
      ]);
      setChatInput('');
    }, 0);
  }, [match.id]);

  // Fetch AI insights when tabs are selected
  useEffect(() => {
    if (activeTab === 'NEWS' && !aiPrediction) {
      fetchAiInsights();
    }
    if (activeTab === 'ANALYTICS' && !analyticsData) {
      fetchAnalytics();
    }
  }, [activeTab, aiPrediction, analyticsData, fetchAiInsights, fetchAnalytics]);

  // Auto-scroll chat box to bottom
  useEffect(() => {
    if (activeTab === 'CHAT' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setSendingChat(true);

    try {
      const history = chatMessages.slice(1);
      const reply = await chatWithHeoHong(match, history, userMsg);
      setChatMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      console.error('Lỗi chat:', err);
      setChatMessages(prev => [...prev, { role: 'model', text: '🐷 Ối, Heo Hồng bị nghẹn hạt ngô rồi! Fen hỏi lại giùm nha! 🌽' }]);
    } finally {
      setSendingChat(false);
    }
  };

  const { home, away, homeScore, awayScore, status, minute, league, stats, timeline, lineups, odds, news, date, stadiumId } = match;

  const hasSmPred = match.sportmonksPredictions && match.sportmonksPredictions.probabilities;
  const smPred = hasSmPred ? match.sportmonksPredictions : null;

  const prediction = predictMatch(home.name, away.name, homeScore, awayScore, status, minute);
  const homeWin = smPred ? smPred.probabilities.homeWin : prediction.probabilities.homeWin;
  const draw = smPred ? smPred.probabilities.draw : prediction.probabilities.draw;
  const awayWin = smPred ? smPred.probabilities.awayWin : prediction.probabilities.awayWin;
  const over25 = smPred ? smPred.probabilities.over25 : prediction.probabilities.over25;
  const under25 = smPred ? smPred.probabilities.under25 : prediction.probabilities.under25;

  const homeElo = smPred ? smPred.analytics.homeElo : prediction.analytics.homeElo;
  const awayElo = smPred ? smPred.analytics.awayElo : prediction.analytics.awayElo;
  const mostLikelyScore = smPred ? smPred.analytics.mostLikelyScore : prediction.analytics.mostLikelyScore;
  const topScorelines = smPred ? smPred.analytics.topScorelines : prediction.analytics.topScorelines;

  const evHome = (homeWin / 100) * odds.h2h.home - 1;
  const evDraw = (draw / 100) * odds.h2h.draw - 1;
  const evAway = (awayWin / 100) * odds.h2h.away - 1;
  const evOver = (over25 / 100) * odds.overUnder.over - 1;
  const evUnder = (under25 / 100) * odds.overUnder.under - 1;

  const isLive = status === 'LIVE';
  const isFinished = status === 'FINISHED';

  const clock = useLiveMatchClock(minute, match.second || 0, isLive);

  // Helper to show odds direction transition arrows
  const renderOddsArrow = (market, outcome) => {
    const direction = odds._direction?.[market]?.[outcome];
    if (direction === 'up') return <ArrowUp size={12} className="text-secondary ml-1" />;
    if (direction === 'down') return <ArrowDown size={12} className="text-danger ml-1" />;
    return null;
  };

  const getOddsClass = (market, outcome) => {
    const direction = odds._direction?.[market]?.[outcome];
    if (direction === 'up') return 'text-secondary';
    if (direction === 'down') return 'text-danger';
    return 'text-on-background';
  };

  const getDetailedStats = () => {
    if (!stats) return null;
    
    const possessionHome = stats.possession?.home ?? 50;
    const possessionAway = stats.possession?.away ?? (100 - possessionHome);
    
    const shotsHome = stats.shots?.home ?? (homeScore * 2 + 5);
    const shotsAway = stats.shots?.away ?? (awayScore * 2 + 5);
    
    const sotHome = stats.shotsOnTarget?.home ?? Math.max(homeScore, Math.round(shotsHome * 0.4));
    const sotAway = stats.shotsOnTarget?.away ?? Math.max(awayScore, Math.round(shotsAway * 0.4));
    
    const xgHome = stats.xg?.home ?? parseFloat((homeScore * 0.35 + shotsHome * 0.06 + Math.random() * 0.3).toFixed(2));
    const xgAway = stats.xg?.away ?? parseFloat((awayScore * 0.35 + shotsAway * 0.06 + Math.random() * 0.3).toFixed(2));
    
    const attacksHome = stats.attacks?.home ?? Math.round(possessionHome * 1.6 + Math.random() * 10);
    const attacksAway = stats.attacks?.away ?? Math.round(possessionAway * 1.6 + Math.random() * 10);
    
    const dangHome = stats.dangerousAttacks?.home ?? Math.round(attacksHome * 0.45 + Math.random() * 5);
    const dangAway = stats.dangerousAttacks?.away ?? Math.round(attacksAway * 0.45 + Math.random() * 5);
    
    const passesHome = stats.passes?.home ?? Math.round(possessionHome * 8.5 + Math.random() * 40);
    const passesAway = stats.passes?.away ?? Math.round(possessionAway * 8.5 + Math.random() * 40);
    
    const accPassHome = stats.accuratePasses?.home ?? Math.round(passesHome * (0.75 + (possessionHome / 500)));
    const accPassAway = stats.accuratePasses?.away ?? Math.round(passesAway * (0.75 + (possessionAway / 500)));
    
    const foulsHome = stats.fouls?.home ?? (8 + Math.floor(Math.random() * 7));
    const foulsAway = stats.fouls?.away ?? (8 + Math.floor(Math.random() * 7));
    
    const cornersHome = stats.corners?.home ?? Math.round(shotsHome * 0.35 + Math.random() * 2);
    const cornersAway = stats.corners?.away ?? Math.round(shotsAway * 0.35 + Math.random() * 2);
    
    const offHome = stats.offsides?.home ?? Math.floor(Math.random() * 3);
    const offAway = stats.offsides?.away ?? Math.floor(Math.random() * 3);
    
    const savesHome = stats.saves?.home ?? Math.max(0, sotAway - awayScore);
    const savesAway = stats.saves?.away ?? Math.max(0, sotHome - homeScore);
    
    const tacklesHome = stats.tackles?.home ?? (10 + Math.floor(Math.random() * 10));
    const tacklesAway = stats.tackles?.away ?? (10 + Math.floor(Math.random() * 10));
    
    const clearancesHome = stats.clearances?.home ?? (12 + Math.floor(Math.random() * 12));
    const clearancesAway = stats.clearances?.away ?? (12 + Math.floor(Math.random() * 12));
    
    const ycHome = stats.yellowCards?.home ?? 0;
    const ycAway = stats.yellowCards?.away ?? 0;
    
    const rcHome = stats.redCards?.home ?? 0;
    const rcAway = stats.redCards?.away ?? 0;
    
    return {
      possession: { home: possessionHome, away: possessionAway, label: "Kiểm soát bóng (%)" },
      xg: { home: xgHome, away: xgAway, label: "Bàn thắng kỳ vọng (xG)" },
      shots: { home: shotsHome, away: shotsAway, label: "Tổng số cú sút" },
      shotsOnTarget: { home: sotHome, away: sotAway, label: "Sút trúng đích" },
      attacks: { home: attacksHome, away: attacksAway, label: "Số đợt tấn công" },
      dangerousAttacks: { home: dangHome, away: dangAway, label: "Tấn công nguy hiểm" },
      passes: { home: passesHome, away: passesAway, label: "Tổng số đường chuyền" },
      accuratePasses: { home: accPassHome, away: accPassAway, label: "Chuyền bóng chính xác", isAccuracy: true, totalHome: passesHome, totalAway: passesAway },
      saves: { home: savesHome, away: savesAway, label: "Cứu thua của thủ môn" },
      tackles: { home: tacklesHome, away: tacklesAway, label: "Tắc bóng thành công" },
      clearances: { home: clearancesHome, away: clearancesAway, label: "Giải vây bóng" },
      offsides: { home: offHome, away: offAway, label: "Việt vị" },
      corners: { home: cornersHome, away: cornersAway, label: "Phạt góc" },
      fouls: { home: foulsHome, away: foulsAway, label: "Phạm lỗi" },
      yellowCards: { home: ycHome, away: ycAway, label: "Thẻ vàng" },
      redCards: { home: rcHome, away: rcAway, label: "Thẻ đỏ" }
    };
  };

  const matchDateLocal = convertToUserTimezone(date, stadiumId);
  const stadium = STADIUMS_INFO[stadiumId] || { name: 'Sân vận động', city: 'Thành phố', country: 'Quốc gia' };
  
  const formattedKickoffDate = matchDateLocal.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });
  const formattedKickoffTime = matchDateLocal.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Redesigned Match Scoreboard Card (Hero Bento style) */}
      <div className="bento-glass p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Top Buttons: Back & Bookmark */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/40 border border-white/60 text-xs font-bold text-on-surface hover:bg-white/80 active:scale-95 transition-all"
          >
            <ArrowLeft size={14} />
            Quay lại
          </button>
          
          <button 
            onClick={() => onToggleBookmark && onToggleBookmark(match.id)}
            className="w-8 h-8 rounded-full bg-white/40 border border-white/60 flex items-center justify-center text-on-surface hover:bg-white/80 active:scale-95 transition-all"
            title={isBookmarked ? "Bỏ theo dõi" : "Theo dõi trận đấu"}
          >
            <Star size={16} fill={isBookmarked ? "var(--accent-gold)" : "none"} color={isBookmarked ? "var(--accent-gold)" : "currentColor"} />
          </button>
        </div>

        <div className="text-[10px] font-black tracking-widest text-primary/80 uppercase mt-4 mb-3">
          {league.name}
        </div>

        {/* Local time & Stadium Info */}
        <div className="flex flex-col items-center gap-1 text-center mb-6">
          <div className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-secondary">schedule</span>
            Giờ địa phương: <span className="text-secondary">{formattedKickoffTime}</span> ({formattedKickoffDate})
          </div>
          <div className="text-[11px] text-on-surface-variant/80 font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-primary">stadium</span>
            Sân: <strong className="text-on-surface">{stadium.name}</strong>, {stadium.city} ({stadium.country})
          </div>
        </div>

        {/* Scoreboard teams layout */}
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 max-w-2xl">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center gap-3 w-full">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center relative">
              <img 
                src={`https://flagcdn.com/w160/${home.flag}.png`} 
                alt={home.name} 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="text-lg md:text-xl font-extrabold text-on-surface text-center leading-tight">
              {home.name}
            </div>
            <span className="px-3 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary border border-primary/10">
              Đội nhà
            </span>
          </div>

          {/* Score & Time */}
          <div className="flex flex-col items-center justify-center gap-1 py-4 px-6 md:px-0">
            {isLive ? (
              <span className="flex items-center gap-1 px-3 py-0.5 rounded-full border border-danger/25 bg-danger/10 text-danger text-[10px] font-black uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
                Trực tiếp • {clock.formatted}
              </span>
            ) : isFinished ? (
              <span className="px-3 py-0.5 rounded-full bg-on-surface-variant/10 text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                Kết thúc
              </span>
            ) : (
              <span className="px-3 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                Sắp đá
              </span>
            )}
            
            <div className="flex items-center gap-4 mt-2">
              {(isLive || isFinished) ? (
                <div className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter flex items-center gap-3">
                  <span className="text-primary">{homeScore}</span>
                  <span className="text-on-surface-variant/40 font-medium">-</span>
                  <span className="text-secondary">{awayScore}</span>
                </div>
              ) : (
                <div className="text-2xl md:text-3xl font-black text-on-surface-variant/40 tracking-widest">
                  VS
                </div>
              )}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center gap-3 w-full">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center relative">
              <img 
                src={`https://flagcdn.com/w160/${away.flag}.png`} 
                alt={away.name} 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="text-lg md:text-xl font-extrabold text-on-surface text-center leading-tight">
              {away.name}
            </div>
            <span className="px-3 py-0.5 text-[10px] font-bold rounded-full bg-secondary/10 text-secondary border border-secondary/10">
              Sân khách
            </span>
          </div>
        </div>

        {/* AI win probability bar chart */}
        <div className="w-full max-w-lg mt-8 p-4 bg-white/40 border border-white/50 rounded-2xl">
          <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant/85 mb-1.5">
            <span className="text-primary">{home.name} ({homeWin}%)</span>
            <span>Hòa ({draw}%)</span>
            <span className="text-secondary">{away.name} ({awayWin}%)</span>
          </div>
          
          <div className="h-2 w-full bg-white/60 rounded-full overflow-hidden flex border border-white/30">
            <div style={{ width: `${homeWin}%` }} className="h-full bg-primary"></div>
            <div style={{ width: `${draw}%` }} className="h-full bg-on-surface-variant/20"></div>
            <div style={{ width: `${awayWin}%` }} className="h-full bg-secondary"></div>
          </div>
          
          <div className="flex justify-between items-center text-[9px] text-on-surface-variant/75 font-semibold mt-2">
            {hasSmPred ? (
              <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[8px] font-black uppercase tracking-wider">
                👑 Sportmonks Premium
              </span>
            ) : (
              <span>ELO: {homeElo}</span>
            )}
            <span className="text-tertiary font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[11px]">auto_awesome</span>
              Tỷ số dễ xảy ra: {mostLikelyScore}
            </span>
            {hasSmPred ? (
              <span className="opacity-0">ELO: 0</span>
            ) : (
              <span>ELO: {awayElo}</span>
            )}
          </div>
        </div>
      </div>

      {/* Segmented Control detail tabs navigation */}
      <div className="flex gap-1.5 p-1.5 bg-white/40 border border-white/50 rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { key: 'ODDS', icon: <BadgePercent size={14} />, label: 'Kèo cược' },
          { key: 'ANALYTICS', icon: <Cpu size={14} />, label: 'AI Nhận định' },
          { key: 'CHAT', icon: <MessageSquare size={14} />, label: 'Hỏi Heo Hồng' },
          { key: 'STATS', icon: <BarChart2 size={14} />, label: 'Thống kê' },
          { key: 'TIMELINE', icon: <ListTodo size={14} />, label: 'Diễn biến' },
          { key: 'NEWS', icon: <Newspaper size={14} />, label: 'Tin tức & MXH' },
          { key: 'LINEUPS', icon: <Users size={14} />, label: 'Đội hình' }
        ].map(tab => (
          <button 
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all border border-transparent whitespace-nowrap ${
              activeTab === tab.key 
                ? 'bg-white text-primary shadow-[0_2px_8px_rgba(0,98,157,0.08)] border-white/60' 
                : 'text-on-surface-variant hover:text-primary hover:bg-white/20'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panel Content wrapper */}
      <div className="bento-glass p-6">
        
        {/* ODDS MARKET TAB */}
        {activeTab === 'ODDS' && (
          <div className="flex flex-col gap-6">
            
            {/* 1X2 Market */}
            <div className="space-y-3">
              <div className="text-xs font-black text-primary tracking-wider uppercase border-l-3 border-primary pl-2.5">
                Kèo Châu Âu (1X2)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button 
                  onClick={() => onAddBet(match, `1X2 - ${home.name}`, odds.h2h.home, `${match.id}-1x2-home`)}
                  className={`flex flex-col gap-1.5 p-4 rounded-2xl border transition-all text-left shadow-sm active:scale-[0.98] ${
                    activeBetId === `${match.id}-1x2-home` 
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(0,98,157,0.2)]' 
                      : 'bg-white/50 hover:bg-white border-white/60 hover:border-primary/20'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-xs font-bold ${activeBetId === `${match.id}-1x2-home` ? 'text-white' : 'text-on-surface-variant'}`}>{home.name}</span>
                    <span className={`text-base font-black flex items-center ${activeBetId === `${match.id}-1x2-home` ? 'text-white' : getOddsClass('h2h', 'home')}`}>
                      {odds.h2h.home.toFixed(2)}
                      {renderOddsArrow('h2h', 'home')}
                    </span>
                  </div>
                  {evHome > 0.02 && (
                    <span className={`text-[10px] font-bold align-self-end mt-1 ${activeBetId === `${match.id}-1x2-home` ? 'text-white/90' : 'text-tertiary'}`}>
                      🔥 Thơm (+{(evHome * 100).toFixed(0)}% EV)
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => onAddBet(match, '1X2 - Hòa', odds.h2h.draw, `${match.id}-1x2-draw`)}
                  className={`flex flex-col gap-1.5 p-4 rounded-2xl border transition-all text-left shadow-sm active:scale-[0.98] ${
                    activeBetId === `${match.id}-1x2-draw` 
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(0,98,157,0.2)]' 
                      : 'bg-white/50 hover:bg-white border-white/60 hover:border-primary/20'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-xs font-bold ${activeBetId === `${match.id}-1x2-draw` ? 'text-white' : 'text-on-surface-variant'}`}>Hòa</span>
                    <span className={`text-base font-black flex items-center ${activeBetId === `${match.id}-1x2-draw` ? 'text-white' : getOddsClass('h2h', 'draw')}`}>
                      {odds.h2h.draw.toFixed(2)}
                      {renderOddsArrow('h2h', 'draw')}
                    </span>
                  </div>
                  {evDraw > 0.02 && (
                    <span className={`text-[10px] font-bold align-self-end mt-1 ${activeBetId === `${match.id}-1x2-draw` ? 'text-white/90' : 'text-tertiary'}`}>
                      🔥 Thơm (+{(evDraw * 100).toFixed(0)}% EV)
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => onAddBet(match, `1X2 - ${away.name}`, odds.h2h.away, `${match.id}-1x2-away`)}
                  className={`flex flex-col gap-1.5 p-4 rounded-2xl border transition-all text-left shadow-sm active:scale-[0.98] ${
                    activeBetId === `${match.id}-1x2-away` 
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(0,98,157,0.2)]' 
                      : 'bg-white/50 hover:bg-white border-white/60 hover:border-primary/20'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-xs font-bold ${activeBetId === `${match.id}-1x2-away` ? 'text-white' : 'text-on-surface-variant'}`}>{away.name}</span>
                    <span className={`text-base font-black flex items-center ${activeBetId === `${match.id}-1x2-away` ? 'text-white' : getOddsClass('h2h', 'away')}`}>
                      {odds.h2h.away.toFixed(2)}
                      {renderOddsArrow('h2h', 'away')}
                    </span>
                  </div>
                  {evAway > 0.02 && (
                    <span className={`text-[10px] font-bold align-self-end mt-1 ${activeBetId === `${match.id}-1x2-away` ? 'text-white/90' : 'text-tertiary'}`}>
                      🔥 Thơm (+{(evAway * 100).toFixed(0)}% EV)
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Handicap Market */}
            <div className="space-y-3">
              <div className="text-xs font-black text-primary tracking-wider uppercase border-l-3 border-primary pl-2.5">
                Kèo Châu Á (Handicap {odds.handicap.line})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button 
                  onClick={() => onAddBet(match, `Chấp ${odds.handicap.line} - ${home.name}`, odds.handicap.home, `${match.id}-handicap-home_${odds.handicap.line}`)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all shadow-sm active:scale-[0.98] ${
                    activeBetId && activeBetId.split('_')[0] === `${match.id}-handicap-home` 
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(0,98,157,0.2)]' 
                      : 'bg-white/50 hover:bg-white border-white/60 hover:border-primary/20'
                  }`}
                >
                  <span className={`text-xs font-bold ${activeBetId && activeBetId.split('_')[0] === `${match.id}-handicap-home` ? 'text-white' : 'text-on-surface-variant'}`}>{home.name} ({odds.handicap.line})</span>
                  <span className={`text-base font-black flex items-center ${activeBetId && activeBetId.split('_')[0] === `${match.id}-handicap-home` ? 'text-white' : getOddsClass('handicap', 'home')}`}>
                    {odds.handicap.home.toFixed(2)}
                    {renderOddsArrow('handicap', 'home')}
                  </span>
                </button>

                <button 
                  onClick={() => onAddBet(match, `Được chấp ${odds.handicap.line.startsWith('-') ? odds.handicap.line.replace('-', '+') : `-${odds.handicap.line}`} - ${away.name}`, odds.handicap.away, `${match.id}-handicap-away_${-parseFloat(odds.handicap.line)}`)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all shadow-sm active:scale-[0.98] ${
                    activeBetId && activeBetId.split('_')[0] === `${match.id}-handicap-away` 
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(0,98,157,0.2)]' 
                      : 'bg-white/50 hover:bg-white border-white/60 hover:border-primary/20'
                  }`}
                >
                  <span className={`text-xs font-bold ${activeBetId && activeBetId.split('_')[0] === `${match.id}-handicap-away` ? 'text-white' : 'text-on-surface-variant'}`}>{away.name} ({odds.handicap.line.startsWith('-') ? odds.handicap.line.replace('-', '+') : `-${odds.handicap.line}`})</span>
                  <span className={`text-base font-black flex items-center ${activeBetId && activeBetId.split('_')[0] === `${match.id}-handicap-away` ? 'text-white' : getOddsClass('handicap', 'away')}`}>
                    {odds.handicap.away.toFixed(2)}
                    {renderOddsArrow('handicap', 'away')}
                  </span>
                </button>
              </div>
            </div>

            {/* Over/Under Market */}
            <div className="space-y-3">
              <div className="text-xs font-black text-primary tracking-wider uppercase border-l-3 border-primary pl-2.5">
                Tài Xỉu (Over/Under {odds.overUnder.line})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button 
                  onClick={() => onAddBet(match, `Tài ${odds.overUnder.line}`, odds.overUnder.over, `${match.id}-ou-over_${odds.overUnder.line}`)}
                  className={`flex flex-col gap-1.5 p-4 rounded-2xl border transition-all text-left shadow-sm active:scale-[0.98] ${
                    activeBetId && activeBetId.split('_')[0] === `${match.id}-ou-over` 
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(0,98,157,0.2)]' 
                      : 'bg-white/50 hover:bg-white border-white/60 hover:border-primary/20'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-xs font-bold ${activeBetId && activeBetId.split('_')[0] === `${match.id}-ou-over` ? 'text-white' : 'text-on-surface-variant'}`}>Tài ({odds.overUnder.line})</span>
                    <span className={`text-base font-black flex items-center ${activeBetId && activeBetId.split('_')[0] === `${match.id}-ou-over` ? 'text-white' : getOddsClass('overUnder', 'over')}`}>
                      {odds.overUnder.over.toFixed(2)}
                      {renderOddsArrow('overUnder', 'over')}
                    </span>
                  </div>
                  {evOver > 0.02 && (
                    <span className={`text-[10px] font-bold align-self-end mt-1 ${activeBetId && activeBetId.split('_')[0] === `${match.id}-ou-over` ? 'text-white/90' : 'text-tertiary'}`}>
                      🔥 Thơm (+{(evOver * 100).toFixed(0)}% EV)
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => onAddBet(match, `Xỉu ${odds.overUnder.line}`, odds.overUnder.under, `${match.id}-ou-under_${odds.overUnder.line}`)}
                  className={`flex flex-col gap-1.5 p-4 rounded-2xl border transition-all text-left shadow-sm active:scale-[0.98] ${
                    activeBetId && activeBetId.split('_')[0] === `${match.id}-ou-under` 
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(0,98,157,0.2)]' 
                      : 'bg-white/50 hover:bg-white border-white/60 hover:border-primary/20'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-xs font-bold ${activeBetId && activeBetId.split('_')[0] === `${match.id}-ou-under` ? 'text-white' : 'text-on-surface-variant'}`}>Xỉu ({odds.overUnder.line})</span>
                    <span className={`text-base font-black flex items-center ${activeBetId && activeBetId.split('_')[0] === `${match.id}-ou-under` ? 'text-white' : getOddsClass('overUnder', 'under')}`}>
                      {odds.overUnder.under.toFixed(2)}
                      {renderOddsArrow('overUnder', 'under')}
                    </span>
                  </div>
                  {evUnder > 0.02 && (
                    <span className={`text-[10px] font-bold align-self-end mt-1 ${activeBetId && activeBetId.split('_')[0] === `${match.id}-ou-under` ? 'text-white/90' : 'text-tertiary'}`}>
                      🔥 Thơm (+{(evUnder * 100).toFixed(0)}% EV)
                    </span>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* AI ANALYTICS TAB */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-5">
            {loadingAnalytics ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-on-surface-variant">
                <Loader2 size={32} className="animate-spin text-primary" />
                <span className="text-xs font-bold">Heo Hồng đang phân tích sâu dữ liệu trận đấu...</span>
              </div>
            ) : analyticsData ? (
              <div className="space-y-6">
                
                {/* Expected Scorelines Card */}
                <div className="p-4 bg-white/50 border border-white/60 rounded-2xl">
                  <h4 className="text-xs font-black text-on-background flex items-center gap-1.5 mb-3">
                    <span className="material-symbols-outlined text-primary text-[18px]">target</span>
                    Top 3 Tỷ số có xác suất xảy ra cao nhất
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {topScorelines?.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`flex-1 p-3.5 rounded-xl border text-center ${
                          idx === 0 
                            ? 'bg-primary/10 border-primary/30 text-primary' 
                            : 'bg-white/40 border-white/60 text-on-surface'
                        }`}
                      >
                        <div className="text-[10px] font-black tracking-wider uppercase opacity-75">Khả năng {idx + 1}</div>
                        <div className="text-2xl font-black my-1">{item.score}</div>
                        <div className="text-xs font-black">{item.percent}% khả năng</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expected Goals Comparison Card */}
                <div className="p-4 bg-white/50 border border-white/60 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-on-background flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[18px]">sports_soccer</span>
                    Chỉ số xG (Bàn thắng kỳ vọng dự tính của AI)
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-primary">{home.name}: {analyticsData.homeXG?.toFixed(2)} xG</span>
                      <span className="text-secondary">{away.name}: {analyticsData.awayXG?.toFixed(2)} xG</span>
                    </div>
                    <div className="h-2 w-full bg-white/60 border border-white/30 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${(analyticsData.homeXG / (analyticsData.homeXG + analyticsData.awayXG || 1)) * 100}%` }} 
                        className="h-full bg-primary"
                      ></div>
                      <div 
                        style={{ width: `${(analyticsData.awayXG / (analyticsData.homeXG + analyticsData.awayXG || 1)) * 100}%` }} 
                        className="h-full bg-secondary"
                      ></div>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {analyticsData.xgTimeline}
                  </p>
                </div>

                {/* Tactical & Player Matchups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/50 border border-white/60 rounded-2xl space-y-2">
                    <h5 className="text-xs font-black text-on-background uppercase tracking-wider">
                      📋 Nhận định chiến thuật
                    </h5>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {analyticsData.tacticalReview}
                    </p>
                  </div>
                  <div className="p-4 bg-white/50 border border-white/60 rounded-2xl space-y-2">
                    <h5 className="text-xs font-black text-on-background uppercase tracking-wider">
                      ⚔️ Cặp đối đầu chủ chốt
                    </h5>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {analyticsData.keyPlayerMatchups}
                    </p>
                  </div>
                </div>

                {/* Head to Head & Injury List Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/50 border border-white/60 rounded-2xl space-y-2">
                    <h5 className="text-xs font-black text-on-background uppercase tracking-wider">
                      📊 Lịch sử đối đầu gần đây
                    </h5>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {analyticsData.headToHead}
                    </p>
                  </div>
                  <div className="p-4 bg-white/50 border border-white/60 rounded-2xl space-y-2">
                    <h5 className="text-xs font-black text-on-background uppercase tracking-wider">
                      🏥 Tình hình chấn thương & treo giò
                    </h5>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {analyticsData.injuryList}
                    </p>
                  </div>
                </div>

                {/* Kelly Criterion capital management recommendation */}
                <div className="p-4 bg-tertiary/10 border border-tertiary/20 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-tertiary flex items-center gap-1.5 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">trending_up</span>
                    Quản lý vốn AI (Công thức Kelly Criterion)
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-tertiary text-white rounded-xl text-center min-w-[90px] shadow-sm">
                      <div className="text-[9px] font-black uppercase opacity-90 leading-none mb-1">Vốn đề xuất</div>
                      <div className="text-xl font-black leading-none">{analyticsData.kellyCriterion?.stakePercent}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-on-surface-variant/80 font-bold">Kèo cược đề xuất của mô hình:</div>
                      <div className="text-sm font-black text-on-surface">
                        {analyticsData.kellyCriterion?.recommendedBet}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2.5 items-start p-3 bg-white/50 rounded-xl border border-white/50">
                    <img 
                      src="/drpig_mascot.png" 
                      alt="Heo Hồng" 
                      className="w-6 h-6 rounded-full border border-primary/20 flex-shrink-0"
                    />
                    <p className="text-xs text-on-surface-variant italic leading-relaxed">
                      "{analyticsData.kellyCriterion?.rationale}"
                    </p>
                  </div>
                </div>

                {/* SHAP Explainability parameters */}
                <div className="p-4 bg-white/50 border border-white/60 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-on-background">
                    ⚙️ Các nhân tố tác động chính đến Dự đoán AI
                  </h4>
                  <div className="space-y-3">
                    {analyticsData.shapExplainability?.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-on-surface-variant">{item.factor}</span>
                          <span className="text-primary font-black">{item.weight}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/60 border border-white/30 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${item.weight}%` }} 
                            className="h-full bg-primary"
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-xs text-on-surface-variant text-center py-6">
                Không thể lấy dữ liệu phân tích chi tiết. Vui lòng thử lại sau.
              </div>
            )}
          </div>
        )}

        {/* CHAT WITH DR.PIG TAB */}
        {activeTab === 'CHAT' && (
          <div className="flex flex-col h-[420px] bg-white/40 border border-white/60 rounded-2xl overflow-hidden shadow-inner">
            {/* Header chat banner */}
            <div className="px-4 py-3 bg-white/70 border-b border-white/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src="/drpig_mascot.png" 
                  alt="Heo Hồng AI" 
                  className="w-8 h-8 rounded-full border border-primary/30"
                />
                <div>
                  <div className="text-xs font-black text-on-surface">Cố vấn soi kèo Heo Hồng 🐷</div>
                  <div className="text-[9px] text-tertiary font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                    Trực tuyến • Trợ lý AI thế hệ mới
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setChatMessages([
                  { role: 'model', text: 'Chào các fen! Heo Hồng 🐷 đã sẵn sàng cùng anh em đàm đạo soi kèo trận đấu rực lửa này rồi đây. Anh em muốn hỏi gì về chiến thuật, tỉ số hay kèo tài xỉu nào? 🐷⚽' }
                ])}
                className="p-1.5 rounded-lg hover:bg-white/60 text-on-surface-variant/80 hover:text-primary active:scale-95 transition-all"
                title="Làm mới trò chuyện"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Messages box list */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
              {chatMessages.map((msg, idx) => {
                const isModel = msg.role === 'model';
                return (
                  <div 
                    key={idx}
                    className={`flex items-start gap-2 max-w-[85%] ${isModel ? 'self-start' : 'self-end flex-row-reverse'}`}
                  >
                    {isModel && (
                      <img 
                        src="/drpig_mascot.png" 
                        alt="Heo Hồng" 
                        className="w-6 h-6 rounded-full border border-primary/10 flex-shrink-0 mt-0.5"
                      />
                    )}
                    <div className={`p-3 rounded-2xl border text-xs leading-relaxed shadow-sm ${
                      isModel 
                        ? 'bg-white/80 border-white/90 text-on-surface rounded-tl-none' 
                        : 'bg-primary border-primary text-white rounded-tr-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              {sendingChat && (
                <div className="flex items-start gap-2 max-w-[85%] self-start">
                  <img 
                    src="/drpig_mascot.png" 
                    alt="Heo Hồng" 
                    className="w-6 h-6 rounded-full border border-primary/10 flex-shrink-0 mt-0.5"
                  />
                  <div className="p-3 bg-white/60 border border-white/60 rounded-2xl rounded-tl-none text-xs text-on-surface-variant flex items-center gap-1.5 shadow-sm">
                    <Loader2 size={12} className="animate-spin text-primary" />
                    <span>Heo Hồng đang soi dữ liệu...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Prompt Quick Tags */}
            <div className="px-4 py-2 border-t border-white/40 bg-white/10 flex gap-2 overflow-x-auto no-scrollbar">
              {[
                "Kèo nào thơm nhất trận này?",
                "Có nên bắt Tài không?",
                "Dự đoán đội thắng",
                "Xem chấn thương cốt lõi"
              ].map((text, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    setChatInput(text);
                  }}
                  className="px-3 py-1 bg-white/65 hover:bg-white text-[10px] font-bold text-on-surface-variant hover:text-primary border border-white/60 rounded-full whitespace-nowrap active:scale-95 transition-all"
                >
                  {text}
                </button>
              ))}
            </div>

            {/* Chat message input form */}
            <form onSubmit={handleSendChat} className="p-2.5 bg-white/70 border-t border-white/60 flex items-center gap-2">
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Hỏi Heo Hồng về kèo cược, tỉ số, phạt góc..."
                disabled={sendingChat}
                className="flex-1 bg-white/50 border border-white/60 rounded-xl px-3.5 py-2 text-xs text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:border-primary focus:bg-white transition-all"
              />
              <button 
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white active:scale-95 transition-all ${
                  sendingChat || !chatInput.trim() 
                    ? 'bg-on-surface-variant/20 cursor-not-allowed' 
                    : 'bg-primary hover:brightness-105 shadow-md shadow-primary/15'
                }`}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {/* STATS COMPARISON TAB */}
        {activeTab === 'STATS' && (
          <div className="space-y-4">
            {stats ? (() => {
              const detailedStats = getDetailedStats();
              return Object.keys(detailedStats).map((key) => {
                const stat = detailedStats[key];
                const valHome = stat.home;
                const valAway = stat.away;
                const total = valHome + valAway === 0 ? 1 : valHome + valAway;
                const pctHome = (valHome / total) * 100;
                
                let displayHome = key === 'xg' ? Number(valHome).toFixed(2) : valHome;
                let displayAway = key === 'xg' ? Number(valAway).toFixed(2) : valAway;
                
                if (stat.isAccuracy) {
                  const pctH = Math.round((valHome / stat.totalHome) * 100) || 0;
                  const pctA = Math.round((valAway / stat.totalAway) * 100) || 0;
                  displayHome = `${pctH}% (${valHome}/${stat.totalHome})`;
                  displayAway = `${pctA}% (${valAway}/${stat.totalAway})`;
                }
                
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-on-surface">{displayHome}</span>
                      <span className="text-on-surface-variant/80 font-semibold">{stat.label}</span>
                      <span className="text-on-surface">{displayAway}</span>
                    </div>
                    
                    <div className="h-2 w-full bg-white/60 border border-white/20 rounded-full overflow-hidden flex">
                      <div style={{ width: `${pctHome}%` }} className="h-full bg-primary rounded-l-full"></div>
                      <div style={{ width: `${100 - pctHome}%` }} className="h-full bg-secondary rounded-r-full"></div>
                    </div>
                  </div>
                );
              });
            })() : (
              <div className="text-xs text-on-surface-variant text-center py-6">
                Chưa có dữ liệu thống kê trực tiếp cho trận đấu này.
              </div>
            )}
          </div>
        )}

        {/* TIMELINE OF EVENTS TAB */}
        {activeTab === 'TIMELINE' && (
          <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:top-0 before:bottom-0 before:left-2 before:w-0.5 before:bg-white/60">
            {timeline && timeline.length > 0 ? (
              timeline.map((event, i) => (
                <div key={i} className={`flex items-start gap-3 relative ${event.type === 'GOAL' ? 'text-primary' : 'text-on-surface'}`}>
                  {/* Event indicator dot */}
                  <span className={`absolute -left-[22px] w-2.5 h-2.5 rounded-full border-2 ${
                    event.type === 'GOAL' 
                      ? 'bg-secondary border-secondary shadow-sm' 
                      : event.type === 'RED' 
                        ? 'bg-danger border-danger' 
                        : 'bg-accent-gold border-accent-gold'
                  }`}></span>
                  
                  <span className="text-xs font-black text-secondary/90 w-8">{event.minute}'</span>
                  <div className="flex-1 p-3 bg-white/50 border border-white/60 rounded-xl flex items-center justify-between text-xs shadow-sm">
                    <div>
                      <strong className="mr-2">
                        {event.type === 'GOAL' ? '⚽ Ghi bàn!' : event.type === 'RED' ? '🟥 Thẻ đỏ' : '🟨 Thẻ vàng'}
                      </strong>
                      <span className="text-on-surface-variant">{event.detail}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      event.team === 'home' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-secondary/10 text-secondary'
                    }`}>
                      {event.team === 'home' ? home.short : away.short}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-on-surface-variant text-center py-6">
                Trận đấu chưa diễn ra hoặc chưa có tình huống ghi nhận đặc biệt.
              </div>
            )}
          </div>
        )}

        {/* NEWS FEED & SOCIAL MEDIA REACTIONS TAB */}
        {activeTab === 'NEWS' && (
          <div className="space-y-4">
            
            {/* Drpig Mascot AI Insights prediction card */}
            <div className="p-4 bg-gradient-to-br from-white/95 to-secondary-fixed/5 border border-white/60 rounded-2xl space-y-2.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <img 
                    src="/drpig_mascot.png" 
                    alt="Heo Hồng Mascot" 
                    className="w-7 h-7 rounded-full border border-secondary/35"
                  />
                  <strong className="text-xs font-extrabold text-secondary">Nhận định Tiên Tri từ Heo Hồng 🐷</strong>
                </div>
                
                <button 
                  onClick={fetchAiInsights} 
                  disabled={loadingAi}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/60 border border-white/80 hover:bg-white text-secondary active:scale-95 transition-all"
                  title="Cập nhật nhận định"
                >
                  <RefreshCw size={12} className={loadingAi ? 'animate-spin' : ''} />
                </button>
              </div>

              {loadingAi ? (
                <div className="flex items-center gap-2 py-2 text-xs font-bold text-on-surface-variant">
                  <Loader2 size={14} className="animate-spin text-secondary" />
                  <span>Heo Hồng đang lắc mai rùa xin quẻ kèo cược...</span>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {aiPrediction || 'Heo Hồng đang nghiên cứu các nguồn tin tức bóng đá quốc tế. Click nút xoay tròn để xem quẻ soi kèo nóng hổi từ heo! 🐷'}
                </p>
              )}
            </div>

            {/* Social Posts and Scraped News Grid list */}
            <div className="flex flex-col gap-4">
              {loadingAi ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-28 w-full bg-white/30 rounded-2xl border border-white/40 animate-pulse"></div>
                ))
              ) : (
                <>
                  {/* Scraped dynamic reactions from Gemini */}
                  {aiReactions && aiReactions.length > 0 ? (
                    aiReactions.map((item, i) => {
                      const videoUrl = item.hasVideo ? SOCCER_CLIPS[i % SOCCER_CLIPS.length] : null;
                      return (
                        <div 
                          key={`ai-react-${i}`} 
                          onClick={() => setSelectedSocial({ ...item, videoUrl })}
                          className="p-4 bg-white/50 hover:bg-white border border-white/60 hover:border-primary/20 rounded-2xl transition-all cursor-pointer space-y-2.5 shadow-sm relative group"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/80 shadow-sm bg-white">
                                <img 
                                  src={getSocialAvatar(item.source, i)} 
                                  alt={item.source}
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div>
                                <div className="text-xs font-black text-on-surface flex items-center gap-0.5">
                                  {item.source}
                                  <CheckCircle2 size={12} fill="#1d9bf0" color="white" className="flex-shrink-0" />
                                </div>
                                <div className="text-[10px] text-on-surface-variant/80 font-bold">{item.time}</div>
                              </div>
                            </div>
                            
                            {videoUrl && (
                              <span className="px-2 py-0.5 rounded bg-primary text-white text-[9px] font-black uppercase tracking-wider">
                                VIDEO 🎥
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-black text-on-surface leading-snug group-hover:text-primary transition-colors">
                            {item.title}
                          </div>
                          
                          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                            {item.summary}
                          </p>

                          {videoUrl && (
                            <div className="rounded-xl overflow-hidden bg-black aspect-video max-h-[220px] w-full border border-white/30" onClick={e => e.stopPropagation()}>
                              <video src={videoUrl} controls autoPlay muted loop playsInline className="w-full h-full object-cover" />
                            </div>
                          )}

                          <div className="flex gap-4 text-[10px] text-on-surface-variant/80 font-black pt-2 border-t border-dashed border-white/40">
                            <span className="flex items-center gap-1">👍 {item.upvotes?.toLocaleString()}</span>
                            <span className="flex items-center gap-1">💬 {item.comments?.toLocaleString()}</span>
                            <span className="ml-auto"><Share2 size={12} /></span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* Fallback Static News */
                    news && news.length > 0 && (
                      news.map((item, i) => {
                        const videoUrl = i % 2 === 0 ? SOCCER_CLIPS[i % SOCCER_CLIPS.length] : null;
                        const resolvedSource = item.source.includes('Reddit') 
                          ? 'Facebook - CĐV Việt Nam' 
                          : item.source.includes('X ') 
                            ? 'TikTok @vietnam_football' 
                            : item.source;
                        
                        return (
                          <div 
                            key={`static-news-${i}`}
                            onClick={() => setSelectedSocial({ ...item, videoUrl })}
                            className="p-4 bg-white/50 hover:bg-white border border-white/60 hover:border-primary/20 rounded-2xl transition-all cursor-pointer space-y-2.5 shadow-sm relative group"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/80 shadow-sm bg-white">
                                  <img 
                                    src={getSocialAvatar(resolvedSource, i)} 
                                    alt={resolvedSource}
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <div>
                                  <div className="text-xs font-black text-on-surface flex items-center gap-0.5">
                                    {resolvedSource}
                                    <CheckCircle2 size={12} fill="#1d9bf0" color="white" className="flex-shrink-0" />
                                  </div>
                                  <div className="text-[10px] text-on-surface-variant/80 font-bold">{item.time}</div>
                                </div>
                              </div>
                              
                              {videoUrl && (
                                <span className="px-2 py-0.5 rounded bg-primary text-white text-[9px] font-black uppercase tracking-wider">
                                  VIDEO 🎥
                                </span>
                              )}
                            </div>

                            <div className="text-xs font-black text-on-surface leading-snug group-hover:text-primary transition-colors">
                              {item.title}
                            </div>
                            
                            <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                              {item.summary}
                            </p>

                            {videoUrl && (
                              <div className="rounded-xl overflow-hidden bg-black aspect-video max-h-[220px] w-full border border-white/30" onClick={e => e.stopPropagation()}>
                                <video src={videoUrl} controls autoPlay muted loop playsInline className="w-full h-full object-cover" />
                              </div>
                            )}

                            <div className="flex gap-4 text-[10px] text-on-surface-variant/80 font-black pt-2 border-t border-dashed border-white/40">
                              <span className="flex items-center gap-1">👍 {item.upvotes?.toLocaleString()}</span>
                              <span className="flex items-center gap-1">💬 {item.comments?.toLocaleString()}</span>
                              <span className="ml-auto"><Share2 size={12} /></span>
                            </div>
                          </div>
                        );
                      })
                    )
                  )}
                </>
              )}
            </div>

          </div>
        )}

        {/* LINEUPS & TACTICAL BOARD TAB */}
        {activeTab === 'LINEUPS' && (
          <div className="space-y-6">
            {lineups ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Home Lineup Column */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-on-surface flex items-center gap-2 border-b border-white/60 pb-2">
                      <img 
                        src={`https://flagcdn.com/w40/${home.flag}.png`} 
                        alt={home.name} 
                        className="w-5 h-3.5 object-cover rounded border border-black/10" 
                      /> 
                      {home.name} ra quân
                    </h4>
                    
                    <div className="flex flex-col gap-2">
                      {lineups.home.map((player) => (
                        <div key={player.number} className="flex justify-between items-center p-2.5 bg-white/45 border border-white/50 rounded-xl text-xs">
                          <div className="flex items-center gap-2.5">
                            <span 
                              style={{ backgroundColor: home.color || 'var(--primary)', color: home.textColor || 'white' }}
                              className="w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center border border-white shadow-sm"
                            >
                              {player.number}
                            </span>
                            <span className="font-bold text-on-surface">{player.name}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-white/70 border border-white/80 rounded text-[9px] font-black text-on-surface-variant">
                            {player.role || 'MF'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Away Lineup Column */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-on-surface flex items-center gap-2 border-b border-white/60 pb-2">
                      <img 
                        src={`https://flagcdn.com/w40/${away.flag}.png`} 
                        alt={away.name} 
                        className="w-5 h-3.5 object-cover rounded border border-black/10" 
                      /> 
                      {away.name} ra quân
                    </h4>
                    
                    <div className="flex flex-col gap-2">
                      {lineups.away.map((player) => (
                        <div key={player.number} className="flex justify-between items-center p-2.5 bg-white/45 border border-white/50 rounded-xl text-xs">
                          <div className="flex items-center gap-2.5">
                            <span 
                              style={{ backgroundColor: away.color || 'var(--secondary)', color: away.textColor || 'white' }}
                              className="w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center border border-white shadow-sm"
                            >
                              {player.number}
                            </span>
                            <span className="font-bold text-on-surface">{player.name}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-white/70 border border-white/80 rounded text-[9px] font-black text-on-surface-variant">
                            {player.role || 'MF'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tactical Pitch Board */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-on-surface uppercase tracking-wider">
                    Sa bàn chiến thuật
                  </h4>
                  
                  <div className="relative aspect-[3/4] sm:aspect-video w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#2e7d32] to-[#1b5e20] border-2 border-white/40 shadow-inner flex flex-col justify-between p-4">
                    {/* Pitch markings */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                      <div className="w-full h-px bg-white/20"></div>
                      <div className="w-full h-px bg-white/20"></div>
                    </div>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/35 pointer-events-none -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white/35 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
                    
                    {/* Penalty areas */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-16 border-b-2 border-x-2 border-white/35 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-16 border-t-2 border-x-2 border-white/35 pointer-events-none"></div>

                    {/* Players dots mapping */}
                    <div className="absolute inset-0 z-10">
                      {/* Home Team (Bottom half of screen) */}
                      {lineups.home.map((player) => (
                        <div 
                          key={`home-${player.number}`} 
                          style={{ left: `${player.x}%`, top: `${player.y}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
                          title={`${player.name} (#${player.number})`}
                        >
                          <span 
                            style={{ backgroundColor: home.color || 'var(--primary)', color: home.textColor || 'white' }}
                            className="w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center border-1.5 border-white shadow-md cursor-pointer group-hover:scale-110 transition-transform"
                          >
                            {player.number}
                          </span>
                          <span className="px-1.5 py-0.5 bg-black/55 text-white font-bold text-[8px] rounded whitespace-nowrap shadow">
                            {player.name.split(' ').pop()}
                          </span>
                        </div>
                      ))}

                      {/* Away Team (Top half of screen - y inverted) */}
                      {lineups.away.map((player) => (
                        <div 
                          key={`away-${player.number}`} 
                          style={{ left: `${player.x}%`, top: `${100 - player.y}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
                          title={`${player.name} (#${player.number})`}
                        >
                          <span 
                            style={{ backgroundColor: away.color || 'var(--secondary)', color: away.textColor || 'white' }}
                            className="w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center border-1.5 border-white shadow-md cursor-pointer group-hover:scale-110 transition-transform"
                          >
                            {player.number}
                          </span>
                          <span className="px-1.5 py-0.5 bg-black/55 text-white font-bold text-[8px] rounded whitespace-nowrap shadow">
                            {player.name.split(' ').pop()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-on-surface-variant text-center py-6">
                Đội hình ra sân của hai đội tuyển chưa được cập nhật chính thức.
              </div>
            )}
          </div>
        )}

      </div>

      {/* FULL TEXT SOCIAL POST ARTICLE DETAIL MODAL */}
      {selectedSocial && (
        <div className="modal-overlay" style={{ zIndex: 11000 }} onClick={() => setSelectedSocial(null)}>
          <div 
            onClick={e => e.stopPropagation()}
            className="modal-content bento-glass animate-scale-up" 
            style={{ maxWidth: '540px', width: '90%', padding: 0, overflow: 'hidden' }}
          >
            {/* Visual Header video/placeholder */}
            <div className="relative w-full h-[240px] bg-black">
              {selectedSocial.videoUrl ? (
                <video src={selectedSocial.videoUrl} controls autoPlay muted loop playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <img src="/drpig_mascot.png" alt="Mascot placeholder" className="w-20 h-20 opacity-75" />
                </div>
              )}
              
              <button 
                onClick={() => setSelectedSocial(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white border-none flex items-center justify-center text-sm font-bold active:scale-95 cursor-pointer hover:bg-black"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex gap-2 items-center text-[10px] font-bold">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/10">{selectedSocial.source}</span>
                <span className="text-on-surface-variant/80">{selectedSocial.time}</span>
              </div>
              
              <h4 className="text-base font-black leading-snug text-on-surface">
                {selectedSocial.title}
              </h4>
              
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {selectedSocial.summary}
              </p>

              <div className="flex gap-4 text-[10px] text-on-surface-variant/80 font-black pt-3.5 border-t border-white/40">
                <span>👍 {selectedSocial.upvotes?.toLocaleString()} lượt thích</span>
                <span>💬 {selectedSocial.comments?.toLocaleString()} bình luận</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
