import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, BarChart2, ListTodo, Users, BadgePercent, ArrowUp, ArrowDown, MessageSquare, Newspaper, Loader2, RefreshCw, Cpu, Send, Star, History, Play } from 'lucide-react';
import { getHeoHongPrediction, getSportsAnalytics, chatWithHeoHong } from '../services/gemini';
import { predictMatch } from '../utils/aiPredictor';
import { fetchSportmonksFixtureDetail, fetchSportmonksH2H } from '../services/api';
import { STADIUMS_INFO, convertToUserTimezone } from '../services/worldcup26api';
import { useLiveMatchClock } from '../services/useLiveMatchClock';
import { useLanguage } from '../utils/LanguageContext';

export default function MatchDetail({ match, onAddBet, activeBetId, onClose, user, onToggleBookmark, matches = [] }) {
  const [activeTab, setActiveTab] = useState('ODDS'); // STATS, TIMELINE, LINEUPS, ODDS, NEWS, ANALYTICS, CHAT
  const { t, language } = useLanguage();
  const [aiPrediction, setAiPrediction] = useState('');
  const [matchNews, setMatchNews] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedSocial, setSelectedSocial] = useState(null);
  
  // Chat States
  const [chatMessages, setChatMessages] = useState([
    { role: 'model', text: language === 'vi' ? 'Chào các fen! Heo Hồng 🐷 đã sẵn sàng cùng anh em đàm đạo gieo quẻ bóng đá trận đấu rực lửa này rồi đây. Anh em muốn hỏi gì về chiến thuật, tỉ số hay chọn cửa nào? 🐷⚽' : 'Hello fens! Heo Hong 🐷 is ready to discuss match predictions for this fiery clash. Ask me about tactics, score predictions, or which side to choose! 🐷⚽' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef(null);
  
  // Sportmonks enriched match data
  const [enrichedMatch, setEnrichedMatch] = useState(null);
  const [h2hData, setH2hData] = useState(null);
  const [loadingH2h, setLoadingH2h] = useState(false);
  const [socialReactions, setSocialReactions] = useState([]);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [currentTime] = useState(() => Date.now());

  const isBookmarked = user?.bookmarks?.includes(match.id);

  const fetchAiInsights = useCallback(async () => {
    setLoadingAi(true);
    try {
      const pred = await getHeoHongPrediction(match, matches);
      setAiPrediction(pred);
    } catch (e) {
      console.error('Lỗi khi tải thông tin từ Gemini:', e);
    } finally {
      setLoadingAi(false);
    }
  }, [match, matches]);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const data = await getSportsAnalytics(match, matches);
      setAnalyticsData(data);
    } catch (e) {
      console.error('Lỗi khi tải AI Phân tích xG:', e);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [match, matches]);

  // Reset states when match changes
  useEffect(() => {
    setTimeout(() => {
      setActiveTab('ODDS');
      setAiPrediction('');
      setMatchNews([]);
      setAnalyticsData(null);
      setSelectedSocial(null);
      setChatMessages([
        { role: 'model', text: language === 'vi' ? 'Chào các fen! Heo Hồng 🐷 đã sẵn sàng cùng anh em đàm đạo gieo quẻ bóng đá trận đấu rực lửa này rồi đây. Anh em muốn hỏi gì về chiến thuật, tỉ số hay chọn cửa nào? 🐷⚽' : 'Hello fens! Heo Hong 🐷 is ready to discuss match predictions for this fiery clash. Ask me about tactics, score predictions, or which side to choose! 🐷⚽' }
      ]);
      setChatInput('');
    }, 0);
  }, [match.id, language]);

  // Fetch match-specific media (news & clips) with on-demand crawl fallback
  useEffect(() => {
    if (!match.id) return;

    let isSubscribed = true;
    setLoadingSocial(true);
    setMatchNews([]);
    setSocialReactions([]);

    const TEAM_KEYWORDS = {
      // Vietnamese name keys (from TEAM_NAME_VI mapping)
      'Mỹ': ['united states', 'usa', 'mỹ', 'hoa kỳ', 'america', 'usmnt'],
      'Úc': ['australia', 'úc', 'socceroos'],
      'Hàn Quốc': ['korea', 'hàn quốc', 'han quoc'],
      'Nam Phi': ['south africa', 'nam phi'],
      'Séc': ['czech', 'séc', 'ch séc', 'czechia'],
      'Thụy Sĩ': ['switzerland', 'thụy sĩ', 'thuy si'],
      'Ma Rốc': ['morocco', 'maroc', 'ma rốc'],
      'Thổ Nhĩ Kỳ': ['turkey', 'türkiye', 'thổ nhĩ kỳ', 'tho nhi ky'],
      'Đức': ['germany', 'đức', 'duc'],
      'Bờ Biển Ngà': ['ivory coast', 'bờ biển ngà', "côte d'ivoire"],
      'Hà Lan': ['netherlands', 'hà lan', 'ha lan', 'holland'],
      'Nhật Bản': ['japan', 'nhật bản', 'nhat ban'],
      'Thụy Điển': ['sweden', 'thụy điển'],
      'Bỉ': ['belgium', 'bỉ'],
      'Ai Cập': ['egypt', 'ai cập'],
      'Tây Ban Nha': ['spain', 'tây ban nha'],
      'Ả Rập Xê Út': ['saudi', 'ả rập', 'saudi arabia'],
      'Pháp': ['france', 'pháp'],
      'Na Uy': ['norway', 'na uy'],
      'Áo': ['austria', 'áo'],
      'Bồ Đào Nha': ['portugal', 'bồ đào nha'],
      'Anh': ['england', 'anh quốc'],
      // English name keys (direct from Sportmonks)
      'United States': ['united states', 'usa', 'mỹ', 'hoa kỳ', 'america', 'usmnt'],
      'Australia': ['australia', 'úc', 'socceroos'],
      'Mexico': ['mexico', 'mê-hi-cô', 'mêhicô'],
      'Korea Republic': ['korea', 'hàn quốc', 'han quoc'],
      'South Africa': ['south africa', 'nam phi'],
      'Czechia': ['czech', 'séc', 'ch séc'],
      'Canada': ['canada'],
      'Qatar': ['qatar'],
      'Switzerland': ['switzerland', 'thụy sĩ', 'thuy si'],
      'Brazil': ['brazil', 'bra-xin'],
      'Morocco': ['morocco', 'maroc', 'ma rốc'],
      'Scotland': ['scotland'],
      'Haiti': ['haiti'],
      'Paraguay': ['paraguay'],
      'Türkiye': ['turkey', 'türkiye', 'thổ nhĩ kỳ', 'tho nhi ky'],
      'Germany': ['germany', 'đức', 'duc'],
      "Côte d'Ivoire": ['ivory coast', 'bờ biển ngà', "côte d'ivoire"],
      'Ecuador': ['ecuador'],
      'Netherlands': ['netherlands', 'hà lan', 'ha lan', 'holland'],
      'Japan': ['japan', 'nhật bản', 'nhat ban'],
      'Sweden': ['sweden', 'thụy điển'],
      'Tunisia': ['tunisia'],
      'Belgium': ['belgium', 'bỉ'],
      'Egypt': ['egypt', 'ai cập'],
      'Iran': ['iran'],
      'New Zealand': ['new zealand'],
      'Spain': ['spain', 'tây ban nha'],
      'Saudi Arabia': ['saudi', 'ả rập', 'saudi arabia'],
      'Uruguay': ['uruguay'],
      'France': ['france', 'pháp'],
      'Senegal': ['senegal'],
      'Iraq': ['iraq'],
      'Norway': ['norway', 'na uy'],
      'Argentina': ['argentina'],
      'Algeria': ['algeria'],
      'Austria': ['austria', 'áo'],
      'Jordan': ['jordan'],
      'Portugal': ['portugal', 'bồ đào nha'],
      'Colombia': ['colombia'],
      'England': ['england', 'anh quốc'],
      'Croatia': ['croatia'],
      'Ghana': ['ghana'],
      'Panama': ['panama'],
    };

    const getKeywords = (teamName, teamNameEn) => {
      const kw1 = TEAM_KEYWORDS[teamName];
      const kw2 = TEAM_KEYWORDS[teamNameEn];
      const result = new Set();
      if (kw1) kw1.forEach(k => result.add(k));
      if (kw2) kw2.forEach(k => result.add(k));
      if (teamName) result.add(teamName.toLowerCase());
      if (teamNameEn) result.add(teamNameEn.toLowerCase());
      return [...result];
    };

    const matchesKeyword = (text, kw) => {
      if (kw.length <= 2) {
        const words = text.split(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+/i);
        return words.some(word => word === kw);
      }
      return text.includes(kw);
    };

    const loadMedia = async () => {
      try {
        const resp = await fetch(`/data/match_media/media_${match.id}.json`);
        if (resp.ok) {
          const media = await resp.json();
          if (isSubscribed && media) {
            setMatchNews(media.news || []);
            setSocialReactions(media.clips || []);
            setLoadingSocial(false);
            return;
          }
        }
      } catch (e) {
        console.warn('[MatchDetail] Fetch media_id.json failed:', e);
      }

      // Trigger on-demand crawl
      try {
        const homeName = match.home?.name || 'Home';
        const awayName = match.away?.name || 'Away';
        const status = match.status || 'UPCOMING';
        
        const runResp = await fetch(`/api/run-scraper?mode=match&match_id=${match.id}&home=${encodeURIComponent(homeName)}&away=${encodeURIComponent(awayName)}&status=${status}`);
        if (runResp.ok) {
          const resp2 = await fetch(`/data/match_media/media_${match.id}.json`);
          if (resp2.ok) {
            const media2 = await resp2.json();
            if (isSubscribed && media2) {
              setMatchNews(media2.news || []);
              setSocialReactions(media2.clips || []);
              setLoadingSocial(false);
              return;
            }
          }
        }
      } catch (err) {
        console.error('[MatchDetail] On-demand scrape failed:', err);
      }

      // Fallback to global news filter
      if (!isSubscribed) return;
      try {
        let articles = [];
        const cached = localStorage.getItem('wc2026_news_data');
        if (cached) {
          try { articles = JSON.parse(cached); } catch { /* ignore */ }
        }
        if (!articles || articles.length === 0) {
          const resp = await fetch('/data/news.json');
          if (resp.ok) articles = await resp.json();
        }
        if (articles && articles.length > 0) {
          const homeKw = getKeywords(match.home?.name || '', match.home?.nameEn || '');
          const awayKw = getKeywords(match.away?.name || '', match.away?.nameEn || '');
          const allKw = [...new Set([...homeKw, ...awayKw])].filter(Boolean);

          const filtered = articles.filter(a => {
            const title = (a.titleVi || a.title || '').toLowerCase();
            const desc = (a.descriptionVi || a.description || '').toLowerCase();
            const combined = title + ' ' + desc;
            return allKw.some(kw => matchesKeyword(combined, kw));
          });
          setMatchNews(filtered.slice(0, 8));
        }
      } catch (fallbackErr) {
        console.error('[MatchDetail] Fallback load failed:', fallbackErr);
      }
      setSocialReactions([]);
      setLoadingSocial(false);
    };

    loadMedia();

    return () => {
      isSubscribed = false;
    };
  }, [match.id, match.home?.name, match.home?.nameEn, match.away?.name, match.away?.nameEn, match.status]);

  // Fetch Sportmonks enriched detail when match opens
  useEffect(() => {
    if (match.apiId) {
      fetchSportmonksFixtureDetail(match.apiId)
        .then(data => {
          if (data) {
            setEnrichedMatch(data);
            console.log(`[MatchDetail] Enriched match ${match.apiId} with Sportmonks detail`);
          }
        })
        .catch(e => console.error('[MatchDetail] Detail fetch error:', e));
    }
    // Reset H2H & Social
    setH2hData(null);
    setSocialReactions([]);
  }, [match.apiId]);

  // Fetch H2H when H2H or analytics tab is active
  useEffect(() => {
    if ((activeTab === 'H2H' || activeTab === 'ANALYTICS') && !h2hData && match.homeTeamId && match.awayTeamId) {
      setLoadingH2h(true);
      fetchSportmonksH2H(match.homeTeamId, match.awayTeamId)
        .then(data => { if (data) setH2hData(data); })
        .catch(e => console.error('[MatchDetail] H2H error:', e))
        .finally(() => setLoadingH2h(false));
    }
  }, [activeTab, h2hData, match.homeTeamId, match.awayTeamId]);



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

  // Use enriched data from Sportmonks detail endpoint if available
  const activeMatch = enrichedMatch || match;
  const { home, away, homeScore, awayScore, status, minute, league, stats, timeline, lineups, odds, date, stadiumId } = activeMatch;

  const hasSmPred = !!(match.sportmonksPredictions && match.sportmonksPredictions.probabilities);
  const prediction = predictMatch(home.name, away.name, homeScore, awayScore, status, minute, matches, odds);
  
  // Use our upgraded prediction engine directly to show state-of-the-art AI insights
  const homeWin = prediction.probabilities.homeWin;
  const draw = prediction.probabilities.draw;
  const awayWin = prediction.probabilities.awayWin;
  const over25 = prediction.probabilities.over25;
  const under25 = prediction.probabilities.under25;
  const btts = prediction.probabilities.btts;
  const homeCleanSheet = prediction.probabilities.homeCleanSheet;
  const awayCleanSheet = prediction.probabilities.awayCleanSheet;

  const homeElo = prediction.analytics.homeElo;
  const awayElo = prediction.analytics.awayElo;
  const mostLikelyScore = prediction.analytics.mostLikelyScore;
  const topScorelines = prediction.analytics.topScorelines;
  const heatmapGrid = prediction.analytics.heatmapGrid;
  const valueBets = prediction.analytics.valueBets;

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
    
    // Deterministic seed random based on match ID to satisfy purity constraints
    const seedRandom = (offset) => {
      const s = parseInt(match.id.replace('sm-', '').replace('wc26-', '')) || 0;
      const x = Math.sin(s + offset) * 10000;
      return x - Math.floor(x);
    };

    const hasRealStats = stats.source === 'sportmonks' || match.source === 'sportmonks';

    // xG
    const xgHome = stats.xg?.home ?? (hasRealStats ? null : parseFloat((homeScore * 0.35 + (stats.shots?.home || 5) * 0.06 + seedRandom(1) * 0.3).toFixed(2)));
    const xgAway = stats.xg?.away ?? (hasRealStats ? null : parseFloat((awayScore * 0.35 + (stats.shots?.away || 5) * 0.06 + seedRandom(2) * 0.3).toFixed(2)));

    const detailedList = [];

    // 1. Expected Goals (xG) - Hide if null (e.g. no add-on)
    if (xgHome !== null && xgAway !== null) {
      detailedList.push({
        key: 'xg',
        label: 'Expected Goals (xG)',
        home: xgHome,
        away: xgAway,
      });
    }

    // 2. Shots on target
    detailedList.push({
      key: 'shotsOnTarget',
      label: 'Shots on target',
      home: stats.shotsOnTarget?.home ?? Math.max(homeScore, Math.round((stats.shots?.home || 5) * 0.4)),
      away: stats.shotsOnTarget?.away ?? Math.max(awayScore, Math.round((stats.shots?.away || 5) * 0.4)),
    });

    // 3. Shots off target
    detailedList.push({
      key: 'shotsOffTarget',
      label: 'Shots off target',
      home: stats.shotsOffTarget?.home ?? Math.max(0, Math.round((stats.shots?.home || 8) * 0.45)),
      away: stats.shotsOffTarget?.away ?? Math.max(0, Math.round((stats.shots?.away || 8) * 0.45)),
    });

    // 4. Blocked shots
    detailedList.push({
      key: 'shotsBlocked',
      label: 'Blocked shots',
      home: stats.shotsBlocked?.home ?? Math.max(0, Math.round((stats.shots?.home || 8) * 0.15)),
      away: stats.shotsBlocked?.away ?? Math.max(0, Math.round((stats.shots?.away || 8) * 0.15)),
    });

    // 5. Possession (%)
    detailedList.push({
      key: 'possession',
      label: 'Possession (%)',
      home: stats.possession?.home ?? 50,
      away: stats.possession?.away ?? 50,
    });

    // 6. Corner kicks
    detailedList.push({
      key: 'corners',
      label: 'Corner kicks',
      home: stats.corners?.home ?? Math.round((stats.shots?.home || 10) * 0.35 + seedRandom(11) * 2),
      away: stats.corners?.away ?? Math.round((stats.shots?.away || 10) * 0.35 + seedRandom(12) * 2),
    });

    // 7. Offsides
    detailedList.push({
      key: 'offsides',
      label: 'Offsides',
      home: stats.offsides?.home ?? Math.floor(seedRandom(13) * 3),
      away: stats.offsides?.away ?? Math.floor(seedRandom(14) * 3),
    });

    // 8. Fouls
    detailedList.push({
      key: 'fouls',
      label: 'Fouls',
      home: stats.fouls?.home ?? (8 + Math.floor(seedRandom(9) * 7)),
      away: stats.fouls?.away ?? (8 + Math.floor(seedRandom(10) * 7)),
    });

    // 9. Throw-ins
    detailedList.push({
      key: 'throwIns',
      label: 'Throw-ins',
      home: stats.throwIns?.home ?? (15 + Math.floor(seedRandom(19) * 10)),
      away: stats.throwIns?.away ?? (15 + Math.floor(seedRandom(20) * 10)),
    });

    // 10. Yellow cards
    detailedList.push({
      key: 'yellowCards',
      label: 'Yellow cards',
      home: stats.yellowCards?.home ?? 0,
      away: stats.yellowCards?.away ?? 0,
    });

    // 11. Red cards
    detailedList.push({
      key: 'redCards',
      label: 'Red cards',
      home: stats.redCards?.home ?? 0,
      away: stats.redCards?.away ?? 0,
    });

    // 12. Crosses
    detailedList.push({
      key: 'crosses',
      label: 'Crosses',
      home: stats.crosses?.home ?? (10 + Math.floor(seedRandom(21) * 12)),
      away: stats.crosses?.away ?? (10 + Math.floor(seedRandom(22) * 12)),
    });

    // 13. Counter attacks
    detailedList.push({
      key: 'counterAttacks',
      label: 'Counter attacks',
      home: stats.counterAttacks?.home ?? Math.floor(seedRandom(23) * 5),
      away: stats.counterAttacks?.away ?? Math.floor(seedRandom(24) * 5),
    });

    // 14. Goalkeeper saves
    detailedList.push({
      key: 'saves',
      label: 'Goalkeeper saves',
      home: stats.saves?.home ?? Math.max(0, (stats.shotsOnTarget?.away || 0) - awayScore),
      away: stats.saves?.away ?? Math.max(0, (stats.shotsOnTarget?.home || 0) - homeScore),
    });

    // 15. Goal kicks
    detailedList.push({
      key: 'goalKicks',
      label: 'Goal kicks',
      home: stats.goalKicks?.home ?? (5 + Math.floor(seedRandom(25) * 6)),
      away: stats.goalKicks?.away ?? (5 + Math.floor(seedRandom(26) * 6)),
    });

    return detailedList;
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
            {t('backToList')}
          </button>
          
          <button 
            onClick={() => onToggleBookmark && onToggleBookmark(match.id)}
            className="w-8 h-8 rounded-full bg-white/40 border border-white/60 flex items-center justify-center text-on-surface hover:bg-white/80 active:scale-95 transition-all"
            title={isBookmarked ? t('unfollow') : t('followMatch')}
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
                onError={(e) => { 
                  if (home.logo) { e.target.onerror = () => { e.target.style.display = 'none'; }; e.target.src = home.logo; e.target.className = 'w-16 h-16 object-contain'; }
                  else { e.target.style.display = 'none'; }
                }}
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
                onError={(e) => { 
                  if (away.logo) { e.target.onerror = () => { e.target.style.display = 'none'; }; e.target.src = away.logo; e.target.className = 'w-16 h-16 object-contain'; }
                  else { e.target.style.display = 'none'; }
                }}
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

        {/* Goalscorers List */}
        {timeline && timeline.some(e => e.type === 'GOAL') && (
          <div className="w-full max-w-2xl mt-5 grid grid-cols-2 gap-6 text-[11px] border-t border-white/20 pt-3.5">
            {/* Home Goalscorers */}
            <div className="text-right space-y-1 pr-3 border-r border-white/10">
              {timeline
                .filter(e => e.type === 'GOAL' && e.team === 'home')
                .map((event, idx) => (
                  <div key={idx} className="flex justify-end items-center gap-1.5 text-on-surface-variant/90">
                    <span className="font-medium">{event.detail}</span>
                    <span className="font-extrabold text-primary">{event.minute}'</span>
                    <span className="text-[10px]">⚽</span>
                  </div>
                ))}
            </div>
            {/* Away Goalscorers */}
            <div className="text-left space-y-1 pl-3">
              {timeline
                .filter(e => e.type === 'GOAL' && e.team === 'away')
                .map((event, idx) => (
                  <div key={idx} className="flex justify-start items-center gap-1.5 text-on-surface-variant/90">
                    <span className="text-[10px]">⚽</span>
                    <span className="font-extrabold text-secondary">{event.minute}'</span>
                    <span className="font-medium">{event.detail}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

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
      <div className="flex gap-1.5 p-1.5 bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { key: 'ODDS', icon: <BadgePercent size={14} />, label: t('tabBettingOdds') },
          { key: 'ANALYTICS', icon: <Cpu size={14} />, label: t('tabAiPredictor') },
          { key: 'CHAT', icon: <MessageSquare size={14} />, label: language === 'vi' ? 'Hỏi Heo Hồng' : 'Ask Heo Hong' },
          { key: 'STATS', icon: <BarChart2 size={14} />, label: t('tabStats') },
          { key: 'H2H', icon: <History size={14} />, label: language === 'vi' ? 'Đối đầu' : 'Head to Head' },
          { key: 'TIMELINE', icon: <ListTodo size={14} />, label: t('tabTimeline') },
          { key: 'NEWS', icon: <Newspaper size={14} />, label: language === 'vi' ? 'Tin tức & MXH' : 'News & Social' },
          { key: 'LINEUPS', icon: <Users size={14} />, label: t('tabLineups') }
        ].map(tab => (
          <button 
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all border border-transparent whitespace-nowrap ${
              activeTab === tab.key 
                ? 'bg-white dark:bg-white/10 text-primary dark:text-primary shadow-[0_2px_8px_rgba(0,98,157,0.08)] border-white/60 dark:border-white/10' 
                : 'text-on-surface-variant hover:text-primary hover:bg-white/20 dark:hover:bg-white/5'
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
                {t('oddsEuro')}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button 
                  onClick={() => onAddBet(match, `1X2 - ${home.name}`, odds.h2h.home, `${match.id}-1x2-home`)}
                  className={`flex flex-col gap-1.5 p-4 rounded-2xl border transition-all text-left shadow-sm active:scale-[0.98] ${
                    activeBetId === `${match.id}-1x2-home` 
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(0,98,157,0.2)]' 
                      : 'bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border-white/60 dark:border-white/10 hover:border-primary/20 dark:hover:border-primary/30'
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
                  onClick={() => onAddBet(match, `1X2 - ${t('drawLabel')}`, odds.h2h.draw, `${match.id}-1x2-draw`)}
                  className={`flex flex-col gap-1.5 p-4 rounded-2xl border transition-all text-left shadow-sm active:scale-[0.98] ${
                    activeBetId === `${match.id}-1x2-draw` 
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(0,98,157,0.2)]' 
                      : 'bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border-white/60 dark:border-white/10 hover:border-primary/20 dark:hover:border-primary/30'
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
                      : 'bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border-white/60 dark:border-white/10 hover:border-primary/20 dark:hover:border-primary/30'
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
                {t('oddsHandicap')} ({odds.handicap.line})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button 
                  onClick={() => onAddBet(match, `${language === 'vi' ? 'Chấp' : 'Handicap'} ${odds.handicap.line} - ${home.name}`, odds.handicap.home, `${match.id}-handicap-home_${odds.handicap.line}`)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all shadow-sm active:scale-[0.98] ${
                    activeBetId && activeBetId.split('_')[0] === `${match.id}-handicap-home` 
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(0,98,157,0.2)]' 
                      : 'bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border-white/60 dark:border-white/10 hover:border-primary/20 dark:hover:border-primary/30'
                  }`}
                >
                  <span className={`text-xs font-bold ${activeBetId && activeBetId.split('_')[0] === `${match.id}-handicap-home` ? 'text-white' : 'text-on-surface-variant'}`}>{home.name} ({odds.handicap.line})</span>
                  <span className={`text-base font-black flex items-center ${activeBetId && activeBetId.split('_')[0] === `${match.id}-handicap-home` ? 'text-white' : getOddsClass('handicap', 'home')}`}>
                    {odds.handicap.home.toFixed(2)}
                    {renderOddsArrow('handicap', 'home')}
                  </span>
                </button>

                <button 
                  onClick={() => onAddBet(match, `${language === 'vi' ? 'Được chấp' : 'Receive Handicap'} ${odds.handicap.line.startsWith('-') ? odds.handicap.line.replace('-', '+') : `-${odds.handicap.line}`} - ${away.name}`, odds.handicap.away, `${match.id}-handicap-away_${-parseFloat(odds.handicap.line)}`)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all shadow-sm active:scale-[0.98] ${
                    activeBetId && activeBetId.split('_')[0] === `${match.id}-handicap-away` 
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(0,98,157,0.2)]' 
                      : 'bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border-white/60 dark:border-white/10 hover:border-primary/20 dark:hover:border-primary/30'
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
                {t('oddsOverUnder')} ({odds.overUnder.line})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button 
                  onClick={() => onAddBet(match, `${t('overLabel')} ${odds.overUnder.line}`, odds.overUnder.over, `${match.id}-ou-over_${odds.overUnder.line}`)}
                  className={`flex flex-col gap-1.5 p-4 rounded-2xl border transition-all text-left shadow-sm active:scale-[0.98] ${
                    activeBetId && activeBetId.split('_')[0] === `${match.id}-ou-over` 
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(0,98,157,0.2)]' 
                      : 'bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border-white/60 dark:border-white/10 hover:border-primary/20 dark:hover:border-primary/30'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-xs font-bold ${activeBetId && activeBetId.split('_')[0] === `${match.id}-ou-over` ? 'text-white' : 'text-on-surface-variant'}`}>{t('overLabel')} ({odds.overUnder.line})</span>
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
                  onClick={() => onAddBet(match, `${t('underLabel')} ${odds.overUnder.line}`, odds.overUnder.under, `${match.id}-ou-under_${odds.overUnder.line}`)}
                  className={`flex flex-col gap-1.5 p-4 rounded-2xl border transition-all text-left shadow-sm active:scale-[0.98] ${
                    activeBetId && activeBetId.split('_')[0] === `${match.id}-ou-under` 
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(0,98,157,0.2)]' 
                      : 'bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border-white/60 dark:border-white/10 hover:border-primary/20 dark:hover:border-primary/30'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-xs font-bold ${activeBetId && activeBetId.split('_')[0] === `${match.id}-ou-under` ? 'text-white' : 'text-on-surface-variant'}`}>{t('underLabel')} ({odds.overUnder.line})</span>
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

                {/* Score Probability Heatmap Grid */}
                <div className="p-4 bg-white/50 border border-white/60 rounded-2xl">
                  <h4 className="text-xs font-black text-on-background flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-primary text-[18px]">grid_on</span>
                    Bản đồ nhiệt xác suất tỷ số (Dixon-Coles)
                  </h4>
                  <div className="overflow-x-auto min-w-[280px]">
                    <div className="grid grid-cols-6 gap-1 text-center font-bold text-[9px]">
                      {/* Header row */}
                      <div className="p-1 text-on-surface-variant/70 flex items-center justify-center border border-white/20 bg-white/20 rounded-md">Nhà \ Khách</div>
                      <div className="p-1 bg-white/40 rounded-md flex items-center justify-center">0</div>
                      <div className="p-1 bg-white/40 rounded-md flex items-center justify-center">1</div>
                      <div className="p-1 bg-white/40 rounded-md flex items-center justify-center">2</div>
                      <div className="p-1 bg-white/40 rounded-md flex items-center justify-center">3</div>
                      <div className="p-1 bg-white/40 rounded-md flex items-center justify-center">4+</div>
                      
                      {/* Grid content */}
                      {heatmapGrid?.map((row, h) => (
                        <div key={`h-row-${h}`} className="contents">
                          <div className="p-1 bg-white/40 rounded-md flex items-center justify-center font-black text-on-surface-variant">
                            {h}
                          </div>
                          {row.map((cell, a) => {
                            const prob = cell.probability;
                            // Scale opacity up to 0.85
                            const opacity = Math.min(0.85, prob / 10);
                            return (
                              <div 
                                key={`c-${h}-${a}`} 
                                style={{ 
                                  backgroundColor: prob > 0.5 ? `rgba(236, 72, 153, ${opacity})` : 'rgba(255,255,255,0.2)',
                                  color: prob > 3 ? '#ffffff' : 'var(--md-sys-color-on-surface)'
                                }}
                                className={`p-1.5 rounded-md border border-black/[0.02] flex flex-col justify-center items-center ${
                                  prob > 3 ? 'font-black shadow-sm' : 'font-medium'
                                }`}
                              >
                                <span className="text-[10px] leading-tight">{cell.scoreText}</span>
                                <span className="text-[8px] opacity-80 leading-none mt-0.5">{prob}%</span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/80 mt-2 leading-relaxed">
                    * Ô có màu hồng càng đậm biểu hiện tỷ số có khả năng xuất hiện càng cao theo thuật toán phân phối Poisson hiệu chỉnh.
                  </p>
                </div>

                {/* Expected Goals Comparison Card */}
                <div className="p-4 bg-white/50 border border-white/60 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-on-background flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[18px]">sports_soccer</span>
                    Chỉ số xG (Bàn thắng kỳ vọng dự tính của AI)
                  </h4>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-primary">{home.name}: {prediction.analytics.expectedHomeGoals?.toFixed(2)} xG</span>
                        <span className="text-secondary">{away.name}: {prediction.analytics.expectedAwayGoals?.toFixed(2)} xG</span>
                      </div>
                      <div className="h-2 w-full bg-white/60 border border-white/30 rounded-full overflow-hidden flex">
                        <div 
                          style={{ width: `${(prediction.analytics.expectedHomeGoals / (prediction.analytics.expectedHomeGoals + prediction.analytics.expectedAwayGoals || 1)) * 100}%` }} 
                          className="h-full bg-primary animate-pulse"
                        ></div>
                        <div 
                          style={{ width: `${(prediction.analytics.expectedAwayGoals / (prediction.analytics.expectedHomeGoals + prediction.analytics.expectedAwayGoals || 1)) * 100}%` }} 
                          className="h-full bg-secondary"
                        ></div>
                      </div>
                    </div>
                    
                    {/* Strengths & Forms display */}
                    <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] border-t border-black/[0.05]">
                      <div>
                        <div className="font-black text-primary uppercase">Phong độ {home.name}:</div>
                        <div className="text-on-surface-variant font-medium">{prediction.analytics.homeFormDesc}</div>
                        {prediction.analytics.homeIsHost && (
                          <div className="text-[9px] text-secondary font-black mt-0.5">🏟️ Lợi thế nước chủ nhà (+10% Tấn công)</div>
                        )}
                      </div>
                      <div>
                        <div className="font-black text-secondary uppercase">Phong độ {away.name}:</div>
                        <div className="text-on-surface-variant font-medium">{prediction.analytics.awayFormDesc}</div>
                        {prediction.analytics.awayIsHost && (
                          <div className="text-[9px] text-secondary font-black mt-0.5">🏟️ Lợi thế nước chủ nhà (+10% Tấn công)</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {analyticsData.xgTimeline}
                  </p>
                </div>

                {/* BTTS & Clean Sheet Percentages Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* BTTS */}
                  <div className="p-3 bg-white/50 border border-white/60 rounded-2xl text-center flex flex-col justify-between">
                    <div className="text-[9px] font-black uppercase text-on-surface-variant/80 tracking-wider">Cả hai đội ghi bàn (BTTS)</div>
                    <div className="text-xl font-black text-primary my-1">{btts}%</div>
                    <div className="h-1.5 w-full bg-white/60 border border-white/30 rounded-full overflow-hidden">
                      <div style={{ width: `${btts}%` }} className="h-full bg-primary"></div>
                    </div>
                  </div>
                  {/* Home Clean Sheet */}
                  <div className="p-3 bg-white/50 border border-white/60 rounded-2xl text-center flex flex-col justify-between">
                    <div className="text-[9px] font-black uppercase text-on-surface-variant/80 tracking-wider">Sạch lưới ({home.name})</div>
                    <div className="text-xl font-black text-secondary my-1">{homeCleanSheet}%</div>
                    <div className="h-1.5 w-full bg-white/60 border border-white/30 rounded-full overflow-hidden">
                      <div style={{ width: `${homeCleanSheet}%` }} className="h-full bg-secondary"></div>
                    </div>
                  </div>
                  {/* Away Clean Sheet */}
                  <div className="p-3 bg-white/50 border border-white/60 rounded-2xl text-center flex flex-col justify-between">
                    <div className="text-[9px] font-black uppercase text-on-surface-variant/80 tracking-wider">Sạch lưới ({away.name})</div>
                    <div className="text-xl font-black text-on-surface-variant my-1">{awayCleanSheet}%</div>
                    <div className="h-1.5 w-full bg-white/60 border border-white/30 rounded-full overflow-hidden">
                      <div style={{ width: `${awayCleanSheet}%` }} className="h-full bg-on-surface-variant"></div>
                    </div>
                  </div>
                </div>

                {/* Value Bets Highlight Card */}
                {valueBets && valueBets.length > 0 && (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-primary flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      {language === 'vi' ? 'Gợi ý Cửa Sáng của Heo Hồng (+EV Value Bets)' : 'Heo Hong\'s Value Choices (+EV Value Bets)'}
                    </h4>
                    <div className="flex flex-col gap-2">
                      {valueBets.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/60 border border-white/80 rounded-xl hover:bg-white/80 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-on-surface">{item.label}</span>
                            <span className="text-[10px] text-on-surface-variant/70">{t('oddsLabel')}: {item.odds} • {language === 'vi' ? 'Lợi nhuận kỳ vọng' : 'Est. Yield'}: +{(item.ev * 100).toFixed(1)}%</span>
                          </div>
                          <span className="px-2.5 py-1 bg-primary text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm">
                            🔥 +{(item.ev * 100).toFixed(1)}% EV
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-on-surface-variant/85 italic leading-relaxed">
                      * {language === 'vi' ? 'Cửa sáng (+EV) là các lựa chọn có tỷ lệ trả thưởng cao hơn tỷ số xác suất thực của trận đấu. Chọn phe này đem lại lợi thế toán học lâu dài.' : 'Value Choices (+EV) are selections with higher payouts than their actual mathematical probability. Choosing these offers a long-term mathematical advantage.'}
                    </p>
                  </div>
                )}

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
                    {language === 'vi' ? 'Quản lý vốn AI (Công thức Kelly Criterion)' : 'AI Bankroll Management (Kelly Criterion)'}
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-tertiary text-white rounded-xl text-center min-w-[90px] shadow-sm">
                      <div className="text-[9px] font-black uppercase opacity-90 leading-none mb-1">{language === 'vi' ? 'Vốn đề xuất' : 'Rec. Stake'}</div>
                      <div className="text-xl font-black leading-none">{analyticsData.kellyCriterion?.stakePercent}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-on-surface-variant/80 font-bold">{language === 'vi' ? 'Quẻ đề xuất của mô hình:' : 'Model\'s Recommended Choice:'}</div>
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
                  <div className="text-xs font-black text-on-surface">{language === 'vi' ? 'Giải mã trận đấu cùng Heo Hồng 🐷' : 'Decode Match with Heo Hong 🐷'}</div>
                  <div className="text-[9px] text-tertiary font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                    {language === 'vi' ? 'Trực tuyến • Trợ lý AI thế hệ mới' : 'Online • Next-Gen AI Assistant'}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setChatMessages([
                  { role: 'model', text: language === 'vi' ? 'Chào các fen! Heo Hồng 🐷 đã sẵn sàng cùng anh em đàm đạo gieo quẻ bóng đá trận đấu rực lửa này rồi đây. Anh em muốn hỏi gì về chiến thuật, tỉ số hay chọn cửa nào? 🐷⚽' : 'Hello fens! Heo Hong 🐷 is ready to discuss match predictions for this fiery clash. Ask me about tactics, score predictions, or which side to choose! 🐷⚽' }
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
                    <span>{language === 'vi' ? 'Heo Hồng đang gieo quẻ dữ liệu...' : 'Heo Hong is casting spell on data...'}</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Prompt Quick Tags */}
            <div className="px-4 py-2 border-t border-white/40 bg-white/10 flex gap-2 overflow-x-auto no-scrollbar">
              {(language === 'vi' 
                ? [
                    "Chọn phe nào ngon nhất?",
                    "Có nên gieo quẻ cửa Tài không?",
                    "Giải mã đội gáy sớm",
                    "Xem phong độ & chấn thương"
                  ]
                : [
                    "Which side is best?",
                    "Should I predict Over?",
                    "Who will win?",
                    "Check form & injuries"
                  ]
              ).map((text, idx) => (
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
                placeholder={language === 'vi' ? "Hỏi Heo Hồng về chọn phe, gieo quẻ, tỉ số, phạt góc..." : "Ask Heo Hong about choosing teams, score prediction, corners..."}
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
              return detailedStats.map((stat) => {
                const valHome = stat.home;
                const valAway = stat.away;
                const total = valHome + valAway === 0 ? 1 : valHome + valAway;
                const pctHome = (valHome / total) * 100;
                
                let displayHome = stat.key === 'xg' ? Number(valHome).toFixed(2) : valHome;
                let displayAway = stat.key === 'xg' ? Number(valAway).toFixed(2) : valAway;
                
                return (
                  <div key={stat.key} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-on-surface">{displayHome}</span>
                      <span className="text-on-surface-variant/80 font-semibold">{stat.label}</span>
                      <span className="text-on-surface">{displayAway}</span>
                    </div>
                    
                    <div className="h-2 w-full bg-white/40 dark:bg-white/5 border border-white/25 dark:border-white/10 rounded-full overflow-hidden flex">
                      <div style={{ width: `${pctHome}%`, backgroundColor: home.color || 'var(--primary)' }} className="h-full rounded-l-full"></div>
                      <div style={{ width: `${100 - pctHome}%`, backgroundColor: away.color || 'var(--secondary)' }} className="h-full rounded-r-full"></div>
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
          <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:top-0 before:bottom-0 before:left-2 before:w-0.5 before:bg-white/60 dark:before:bg-white/10">
            {timeline && timeline.length > 0 ? (
              timeline.map((event, i) => (
                <div key={i} className={`flex items-start gap-3 relative ${event.type === 'GOAL' ? 'text-primary' : 'text-on-surface'}`}>
                  {/* Event indicator dot */}
                  <span 
                    style={{
                      backgroundColor: event.type === 'GOAL' 
                        ? 'var(--secondary)' 
                        : event.type === 'RED' 
                          ? 'var(--danger)' 
                          : event.type === 'YELLOW' 
                            ? 'var(--accent-gold)' 
                            : '#10b981',
                      borderColor: event.type === 'GOAL' 
                        ? 'var(--secondary)' 
                        : event.type === 'RED' 
                          ? 'var(--danger)' 
                          : event.type === 'YELLOW' 
                            ? 'var(--accent-gold)' 
                            : '#10b981'
                    }}
                    className="absolute -left-[22px] w-2.5 h-2.5 rounded-full border-2 shadow-sm"
                  ></span>
                  
                  <span className="text-xs font-black text-secondary/90 w-8">{event.minute}'</span>
                  <div className="flex-1 p-3 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-xl flex items-center justify-between text-xs shadow-sm">
                    <div>
                      <strong className="mr-2">
                        {event.type === 'GOAL' 
                          ? '⚽ Ghi bàn!' 
                          : event.type === 'RED' 
                            ? '🟥 Thẻ đỏ' 
                            : event.type === 'YELLOW' 
                              ? '🟨 Thẻ vàng' 
                              : '🔄 Thay người'}
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
                  <span>{language === 'vi' ? 'Heo Hồng đang lắc mai rùa xin quẻ bóng đá... 🔮' : 'Heo Hong is shaking turtle shell to predict... 🔮'}</span>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {aiPrediction || (language === 'vi' ? 'Heo Hồng đang nghiên cứu các nguồn tin tức bóng đá quốc tế. Click nút xoay tròn để xem quẻ dự đoán nóng hổi từ heo! 🐷' : 'Heo Hong is studying international football news. Click reload to see the latest predictions! 🐷')}
                </p>
              )}
            </div>

            {/* Social Media Reactions section */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-on-surface uppercase tracking-wider pl-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">forum</span>
                Bản tin mạng xã hội nóng (Social Reactions)
              </h4>
              
              {loadingSocial ? (
                <div className="flex items-center gap-2 py-4 px-3 bg-white/40 border border-white/50 rounded-2xl text-xs font-bold text-on-surface-variant justify-center">
                  <Loader2 size={14} className="animate-spin text-secondary" />
                  <span>Đang cập nhật các bài đăng MXH mới nhất...</span>
                </div>
              ) : socialReactions && socialReactions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {socialReactions.map((post, i) => (
                    <div 
                      key={`social-post-${i}`}
                      onClick={() => setSelectedSocial(post)}
                      className="p-3.5 bg-white/45 hover:bg-white border border-white/50 hover:border-primary/20 rounded-2xl transition-all cursor-pointer shadow-sm flex flex-col justify-between gap-3 group relative overflow-hidden"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-primary font-black truncate max-w-[150px]">{post.source}</span>
                          <span className="text-on-surface-variant/80 whitespace-nowrap">{post.time}</span>
                        </div>
                        <h5 className="text-[11px] font-black text-on-surface leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h5>
                        <p className="text-[10px] text-on-surface-variant/90 line-clamp-2 leading-relaxed font-semibold">
                          {post.summary}
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-black text-on-surface-variant/85 border-t border-white/30 pt-2.5">
                        <div className="flex gap-2">
                          <span>👍 {post.upvotes?.toLocaleString()}</span>
                          <span>💬 {post.comments?.toLocaleString()}</span>
                        </div>
                        {post.hasVideo && (
                          <span className="px-1.5 py-0.5 rounded bg-secondary/15 text-secondary flex items-center gap-0.5">
                            <Play size={8} fill="currentColor" /> Clip
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-white/40 border border-white/50 rounded-2xl text-xs text-on-surface-variant text-center">
                  Chưa ghi nhận bình luận MXH nào cho trận này.
                </div>
              )}
            </div>

            {/* Real News related to match teams */}
            <div className="flex flex-col gap-3">
              {matchNews.length > 0 ? (
                matchNews.map((article, i) => {
                  const title = article.titleVi || article.title || '';
                  const desc = article.descriptionVi || article.description || '';
                  const image = article.image || '';
                  const source = article.source || '';
                  const url = article.url || article.link || '#';
                  const pubDate = article.pubDate ? new Date(article.pubDate) : null;
                  const timeAgo = pubDate ? (() => {
                    const diff = currentTime - pubDate.getTime();
                    const mins = Math.floor(diff / 60000);
                    if (mins < 60) return `${mins} phút trước`;
                    const hours = Math.floor(mins / 60);
                    if (hours < 24) return `${hours} giờ trước`;
                    const days = Math.floor(hours / 24);
                    return `${days} ngày trước`;
                  })() : '';

                  return (
                    <a
                      key={`match-news-${i}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-3 p-3 bg-white/50 hover:bg-white border border-white/60 hover:border-primary/20 rounded-2xl transition-all cursor-pointer shadow-sm group"
                    >
                      {/* Thumbnail */}
                      {image && !image.includes('unsplash.com') && (
                        <div className="w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-surface-variant/30">
                          <img 
                            src={image} 
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                          />
                        </div>
                      )}
                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-black text-on-surface leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {title}
                          </h4>
                          {desc && (
                            <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed mt-1">
                              {desc}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{source}</span>
                          {timeAgo && <span className="text-[10px] text-on-surface-variant/70">{timeAgo}</span>}
                        </div>
                      </div>
                    </a>
                  );
                })
              ) : (
                <div className="text-center py-8 text-on-surface-variant/60">
                  <Newspaper size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold">Chưa có tin tức liên quan đến trận đấu này</p>
                  <p className="text-[10px] mt-1">Tin tức sẽ được cập nhật khi có bài viết mới về {match.home?.name} hoặc {match.away?.name}</p>
                </div>
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
                    <h4 className="text-xs font-black text-on-surface flex items-center gap-2 border-b border-white/60 dark:border-white/10 pb-2">
                      <img 
                        src={`https://flagcdn.com/w40/${home.flag}.png`} 
                        alt={home.name} 
                        className="w-5 h-3.5 object-cover rounded border border-black/10"
                        onError={(e) => { if (home.logo) { e.target.onerror = null; e.target.src = home.logo; e.target.className = 'w-5 h-5 object-contain rounded'; } else e.target.style.display = 'none'; }}
                      /> 
                      {home.name} ra quân
                    </h4>
                    
                    <div className="flex flex-col gap-2">
                      {lineups.home.map((player) => (
                        <div key={player.number} className="flex justify-between items-center p-2.5 bg-white/45 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-xl text-xs">
                          <div className="flex items-center gap-2.5">
                            <span 
                              style={{ backgroundColor: home.color || 'var(--primary)', color: home.textColor || 'white' }}
                              className="w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center border border-white shadow-sm"
                            >
                              {player.number}
                            </span>
                            <span className="font-bold text-on-surface">{player.name}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-white/70 dark:bg-white/10 border border-white/80 dark:border-white/20 rounded text-[9px] font-black text-on-surface-variant">
                            {player.role || 'MF'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Away Lineup Column */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-on-surface flex items-center gap-2 border-b border-white/60 dark:border-white/10 pb-2">
                      <img 
                        src={`https://flagcdn.com/w40/${away.flag}.png`} 
                        alt={away.name} 
                        className="w-5 h-3.5 object-cover rounded border border-black/10"
                        onError={(e) => { if (away.logo) { e.target.onerror = null; e.target.src = away.logo; e.target.className = 'w-5 h-5 object-contain rounded'; } else e.target.style.display = 'none'; }}
                      /> 
                      {away.name} ra quân
                    </h4>
                    
                    <div className="flex flex-col gap-2">
                      {lineups.away.map((player) => (
                        <div key={player.number} className="flex justify-between items-center p-2.5 bg-white/45 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-xl text-xs">
                          <div className="flex items-center gap-2.5">
                            <span 
                              style={{ backgroundColor: away.color || 'var(--secondary)', color: away.textColor || 'white' }}
                              className="w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center border border-white shadow-sm"
                            >
                              {player.number}
                            </span>
                            <span className="font-bold text-on-surface">{player.name}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-white/70 dark:bg-white/10 border border-white/80 dark:border-white/20 rounded text-[9px] font-black text-on-surface-variant">
                            {player.role || 'MF'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tactical Pitch Board */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-on-surface uppercase tracking-wider text-center">
                    Sa bàn chiến thuật (Vertical Field)
                  </h4>
                  
                  <div className="relative aspect-[2/3] w-full max-w-[400px] mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-[#1b5e20] via-[#2e7d32] to-[#1b5e20] dark:from-[#0b2b11] dark:via-[#113a18] dark:to-[#0b2b11] border-3 border-white/45 dark:border-white/20 shadow-[inset_0_4px_20px_rgba(0,0,0,0.45),0_10px_25px_rgba(0,0,0,0.15)] p-4">
                    {/* Pitch markings */}
                    {/* Outer border margin */}
                    <div className="absolute inset-2.5 border border-white/25 dark:border-white/15 pointer-events-none"></div>
                    
                    {/* Half-way line */}
                    <div className="absolute top-1/2 left-2.5 right-2.5 h-px bg-white/25 dark:bg-white/15 pointer-events-none -translate-y-1/2"></div>
                    
                    {/* Center circle */}
                    <div className="absolute top-1/2 left-1/2 w-20 h-20 border border-white/25 dark:border-white/15 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
                    {/* Center spot */}
                    <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white/50 dark:bg-white/30 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
                    
                    {/* Penalty Area Top (Away Team) */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[55%] h-[16%] border-b border-x border-white/25 dark:border-white/15 pointer-events-none"></div>
                    {/* Goal Area Top */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[25%] h-[6%] border-b border-x border-white/25 dark:border-white/15 pointer-events-none"></div>
                    {/* Penalty spot top */}
                    <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-1.2 h-1.2 bg-white/50 dark:bg-white/30 rounded-full pointer-events-none"></div>

                    {/* Penalty Area Bottom (Home Team) */}
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-[55%] h-[16%] border-t border-x border-white/25 dark:border-white/15 pointer-events-none"></div>
                    {/* Goal Area Bottom */}
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-[25%] h-[6%] border-t border-x border-white/25 dark:border-white/15 pointer-events-none"></div>
                    {/* Penalty spot bottom */}
                    <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-1.2 h-1.2 bg-white/50 dark:bg-white/30 rounded-full pointer-events-none"></div>

                    {/* Players dots mapping */}
                    <div className="absolute inset-0 z-10">
                      {/* Home Team (Bottom half of screen: y scaled to 52% - 92%) */}
                      {lineups.home.map((player) => (
                        <div 
                          key={`home-${player.number}`} 
                          style={{ left: `${player.x}%`, top: `${52 + (player.y / 2.3)}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 group"
                          title={`${player.name} (#${player.number})`}
                        >
                          <span 
                            style={{ backgroundColor: home.color || 'var(--primary)', color: home.textColor || 'white' }}
                            className="w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center border border-white shadow-md cursor-pointer group-hover:scale-110 transition-transform"
                          >
                            {player.number}
                          </span>
                          <span className="px-1 py-0.2 bg-black/60 text-white font-bold text-[7px] rounded-md whitespace-nowrap shadow scale-90">
                            {player.name.split(' ').pop()}
                          </span>
                        </div>
                      ))}

                      {/* Away Team (Top half of screen: y scaled to 8% - 48%) */}
                      {lineups.away.map((player) => (
                        <div 
                          key={`away-${player.number}`} 
                          style={{ left: `${player.x}%`, top: `${48 - (player.y / 2.3)}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 group"
                          title={`${player.name} (#${player.number})`}
                        >
                          <span 
                            style={{ backgroundColor: away.color || 'var(--secondary)', color: away.textColor || 'white' }}
                            className="w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center border border-white shadow-md cursor-pointer group-hover:scale-110 transition-transform"
                          >
                            {player.number}
                          </span>
                          <span className="px-1 py-0.2 bg-black/60 text-white font-bold text-[7px] rounded-md whitespace-nowrap shadow scale-90">
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

        {/* H2H TAB */}
        {activeTab === 'H2H' && (
          <div className="space-y-6">
            <h4 className="text-xs font-black text-on-surface flex items-center gap-2 border-b border-white/60 pb-2 uppercase tracking-wider">
              <History size={14} className="text-primary" />
              Lịch sử đối đầu trực tiếp
            </h4>
            {loadingH2h ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-on-surface-variant">
                <Loader2 size={24} className="animate-spin text-primary" />
                <span className="text-xs font-bold">Đang tải lịch sử đối đầu...</span>
              </div>
            ) : h2hData && h2hData.overall ? (
              <div className="space-y-5">
                {/* Overall & Last 5 Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Overall card */}
                  <div className="p-4 bg-white/40 border border-white/50 rounded-2xl flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] font-black text-on-surface-variant/80 uppercase tracking-wider mb-2">Thành tích lịch sử</span>
                    <div className="text-lg font-black text-primary">
                      {h2hData.overall.homeWins} <span className="text-xs font-bold text-on-surface-variant">Thắng</span>
                      <span className="mx-2 text-on-surface-variant/45">/</span>
                      {h2hData.overall.draws} <span className="text-xs font-bold text-on-surface-variant">Hòa</span>
                      <span className="mx-2 text-on-surface-variant/45">/</span>
                      {h2hData.overall.awayWins} <span className="text-xs font-bold text-on-surface-variant">Thua</span>
                    </div>
                    <span className="text-[9px] text-on-surface-variant/65 mt-1 font-semibold">Tính cho {home.name} vs {away.name}</span>
                  </div>

                  {/* Last 5 meetings card */}
                  <div className="p-4 bg-white/40 border border-white/50 rounded-2xl flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] font-black text-on-surface-variant/80 uppercase tracking-wider mb-2">5 trận đối đầu gần nhất</span>
                    <div className="text-lg font-black text-secondary">
                      {h2hData.last5.homeWins} <span className="text-xs font-bold text-on-surface-variant">Thắng</span>
                      <span className="mx-2 text-on-surface-variant/45">/</span>
                      {h2hData.last5.draws} <span className="text-xs font-bold text-on-surface-variant">Hòa</span>
                      <span className="mx-2 text-on-surface-variant/45">/</span>
                      {h2hData.last5.awayWins} <span className="text-xs font-bold text-on-surface-variant">Thua</span>
                    </div>
                    <span className="text-[9px] text-on-surface-variant/65 mt-1 font-semibold">Tỷ lệ thắng của {home.name}: {Math.round((h2hData.last5.homeWins / 5) * 100)}%</span>
                  </div>
                </div>

                {/* Match list */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] font-black text-on-surface-variant/80 uppercase tracking-wider pl-1">Danh sách các trận đối đầu</span>
                  {h2hData.matches.length > 0 ? (
                    h2hData.matches.map((fixture) => {
                      const dateStr = fixture.date 
                        ? new Date(fixture.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })
                        : '?';
                      return (
                        <div 
                          key={fixture.id} 
                          className="flex items-center justify-between p-3.5 bg-white/45 border border-white/50 rounded-2xl hover:bg-white/55 transition-all shadow-sm"
                        >
                          {/* Date / Competition info */}
                          <div className="w-[120px] flex flex-col text-[10px] text-on-surface-variant/80 font-bold leading-tight">
                            <span className="text-primary truncate max-w-[110px]">{fixture.competition}</span>
                            <span className="text-[9px] text-on-surface-variant/60">{dateStr} ({fixture.year})</span>
                          </div>

                          {/* Scoreline and Team names */}
                          <div className="flex-1 flex items-center justify-center px-4 gap-3 text-xs md:text-sm font-bold">
                            <span className="flex-1 text-right truncate text-on-surface max-w-[120px] md:max-w-[160px]">{fixture.homeName}</span>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/65 border border-white/80 rounded-xl font-black text-sm text-primary shadow-inner">
                              <span>{fixture.homeScore}</span>
                              <span className="opacity-45 font-normal">-</span>
                              <span>{fixture.awayScore}</span>
                            </div>
                            <span className="flex-1 text-left truncate text-on-surface max-w-[120px] md:max-w-[160px]">{fixture.awayName}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-on-surface-variant text-center py-6">Không có dữ liệu chi tiết</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-on-surface-variant text-center py-8">
                Không tìm thấy dữ liệu đối đầu lịch sử giữa hai đội tuyển.
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
