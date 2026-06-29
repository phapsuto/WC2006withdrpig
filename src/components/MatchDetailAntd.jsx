import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, BarChart2, ListTodo, Users, BadgePercent, ArrowUp, ArrowDown, MessageSquare, Newspaper, Loader2, RefreshCw, Cpu, Send, Star, History, Play, CalendarDays, TrendingUp, Swords, PieChart, Bell, Target, Grid } from 'lucide-react';
import { getHeoHongPrediction, chatWithHeoHong } from '../services/gemini';
import { predictMatch } from '../utils/aiPredictor';
import { fetchSportmonksFixtureDetail, fetchSportmonksH2H } from '../services/api';
import { STADIUMS_INFO, convertToUserTimezone } from '../services/worldcup26api';
import { Card, Typography, Row, Col, Statistic, Divider, Space, Tag, Avatar, Button, Tabs, Tooltip, Skeleton, Input, Progress } from 'antd';
import { useLiveMatchClock } from '../services/useLiveMatchClock';
import { useLanguage } from '../utils/LanguageContext';
import { backendClient } from '../services/backendClient';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// Helper function for random seeding
const seedRandom = (seed) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

export default function MatchDetail({ match, onAddBet, activeBetId, onClose, user, onToggleBookmark, matches = [] }) {
  const [activeTab, setActiveTab] = useState('ANALYTICS'); // STATS, ODDS, NEWS, ANALYTICS, CHAT
  const [ringing, setRinging] = useState(false);
  const isTBD = Boolean(
    match?.home?.name?.toLowerCase().includes('winner') ||
    match?.away?.name?.toLowerCase().includes('winner') ||
    match?.home?.name?.toLowerCase().includes('loser') ||
    match?.away?.name?.toLowerCase().includes('loser') ||
    match?.home?.name?.toLowerCase().includes('tbc') ||
    match?.away?.name?.toLowerCase().includes('tbc')
  );
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

  // Player Profile State
  const navigate = useNavigate();
  const [pitchTeamToggle, setPitchTeamToggle] = useState('home'); // 'home' | 'away'
  const [selectedShotIdx, setSelectedShotIdx] = useState(null);
  const [shotPeriod, setShotPeriod] = useState('all'); // 'all' | 'h1' | 'h2'
  const [oddsData, setOddsData] = useState(null);
  const [loadingOdds, setLoadingOdds] = useState(false);
  const [expandedMarkets, setExpandedMarkets] = useState({});

  const isBookmarked = user?.bookmarks?.includes(match?.id);

  const fetchAiInsights = useCallback(async () => {
    if (!match) return;
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
    if (!match) return;
    setLoadingAnalytics(true);
    try {
      const activeHomeName = enrichedMatch?.home?.name || match.home?.name;
      const activeAwayName = enrichedMatch?.away?.name || match.away?.name;
      const data = await backendClient.getMatchAnalytics(match.id, activeHomeName, activeAwayName);
      setAnalyticsData(data);
    } catch (e) {
      console.error('Lỗi khi tải AI Phân tích xG:', e);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [match, matches]);

  // Reset states when match changes
  useEffect(() => {
    if (!match) return;
    setTimeout(() => {
      setActiveTab(isTBD ? 'ODDS' : 'ANALYTICS');
      setAiPrediction('');
      setMatchNews([]);
      setAnalyticsData(null);
      setSelectedSocial(null);
      setChatMessages([
        { role: 'model', text: language === 'vi' ? 'Chào các fen! Heo Hồng 🐷 đã sẵn sàng cùng anh em đàm đạo gieo quẻ bóng đá trận đấu rực lửa này rồi đây. Anh em muốn hỏi gì về chiến thuật, tỉ số hay chọn cửa nào? 🐷⚽' : 'Hello fens! Heo Hong 🐷 is ready to discuss match predictions for this fiery clash. Ask me about tactics, score predictions, or which side to choose! 🐷⚽' }
      ]);
      setChatInput('');
    }, 0);
  }, [match?.id, language]);

  // Fetch match-specific media (news & clips) with on-demand crawl fallback
  useEffect(() => {
    if (!match?.id) return;

    let isSubscribed = true;
    setLoadingSocial(true);
    setMatchNews([]);
    setSocialReactions([]);

    const TEAM_KEYWORDS = {
      'Mỹ': ['united states', 'usa', 'mỹ', 'hoa kỳ', 'america', 'usmnt'],
      'Anh': ['england', 'anh quốc', 'premier league'],
      'Pháp': ['france', 'pháp'],
      'Tây Ban Nha': ['spain', 'tây ban nha', 'la liga'],
      'Bồ Đào Nha': ['portugal', 'bồ đào nha'],
      'Đức': ['germany', 'đức', 'bundesliga'],
      'Ý': ['italy', 'ý', 'serie a'],
    };

    const getKeywords = (teamName) => {
      for (const [key, aliases] of Object.entries(TEAM_KEYWORDS)) {
        if (aliases.includes(teamName.toLowerCase()) || teamName.toLowerCase().includes(key.toLowerCase())) {
          return aliases;
        }
      }
      return [teamName.toLowerCase()];
    };

    const homeKw = getKeywords(match.home?.name || '');
    const awayKw = getKeywords(match.away?.name || '');

    // Fetch rich details from backend
    backendClient.getMatchDetails(match.id).then(res => {
      if (res.success && res.data) {
        setEnrichedMatch(res.data);
      }
    }).catch(console.error);

    // Fetch odds
    setLoadingOdds(true);
    backendClient.getMatchOdds(match.id).then(res => {
      if (res.success && res.data) {
        setOddsData(res.data);
      }
    }).catch(console.error).finally(() => setLoadingOdds(false));

    setTimeout(() => {
      if (!isSubscribed) return;

      const mockNews = [
        {
          id: `news-${match.id}-1`,
          title: `Nhận định trước trận ${match.home?.name} vs ${match.away?.name}: Đội hình và Chiến thuật`,
          summary: `Cả hai đội đã có những buổi tập kín trước trận đấu quan trọng. Dự kiến ${match.home?.name} sẽ tung ra đội hình mạnh nhất với lối chơi kiểm soát bóng.`,
          source: 'Bóng Đá 24h',
          time: '2 giờ trước',
          imageUrl: `https://loremflickr.com/400/200/football,stadium?lock=${match.id}1`
        },
        {
          id: `news-${match.id}-2`,
          title: `Phỏng vấn HLV ${match.away?.name}: "Chúng tôi đến đây để giành chiến thắng"`,
          summary: `Huấn luyện viên trưởng khẳng định toàn đội đã chuẩn bị rất kỹ lưỡng và không e ngại sức ép từ khán giả đối phương.`,
          source: 'Thể Thao Express',
          time: '5 giờ trước',
          imageUrl: `https://loremflickr.com/400/200/soccer,coach?lock=${match.id}2`
        },
        {
          id: `news-${match.id}-3`,
          title: `Thống kê đối đầu lịch sử: Ai đang nắm lợi thế?`,
          summary: `Nhìn lại 5 lần chạm trán gần nhất, những con số thống kê đang cho thấy một sự giằng co quyết liệt giữa hai bờ chiến tuyến.`,
          source: 'Dữ liệu 365',
          time: '12 giờ trước',
          imageUrl: `https://loremflickr.com/400/200/soccer,stadium?lock=${match.id}3`
        }
      ];

      setMatchNews(mockNews);
      setLoadingSocial(false);
    }, 1200);

    return () => { isSubscribed = false; };
  }, [match?.id]);

  // Handle Tab changes
  useEffect(() => {
    if (activeTab === 'NEWS' && !aiPrediction) {
      fetchAiInsights();
    }
    if (activeTab === 'ANALYTICS' && !analyticsData) {
      fetchAnalytics();
    }
    if (activeTab === 'CHAT' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, aiPrediction, analyticsData, fetchAiInsights, fetchAnalytics]);

  const handleSendChat = async () => {
    if (!chatInput.trim() || sendingChat) return;

    const userMsg = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setSendingChat(true);

    try {
      const response = await chatWithHeoHong(chatInput, match, matches, chatMessages);
      setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'model', text: language === 'vi' ? 'Heo Hồng đang quá tải vì xem bóng đá mất rồi, fen thử lại sau nhé! 🐷💤' : 'Heo Hong is overloaded right now, please try again later! 🐷💤' }]);
    } finally {
      setSendingChat(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'CHAT' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  if (!match) {
    return (
      <div className="w-full bg-[var(--365-surface)] h-full p-4 flex flex-col gap-4">
        <Skeleton active paragraph={{ rows: 8 }} />
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  const { home, away, homeScore, awayScore, status, minute, league, odds, date, stadiumId, stats } = match;

  const isLive = status === 'LIVE';
  const isFinished = status === 'FINISHED';

  const prediction = predictMatch(
    home?.nameEn || home?.name || 'Unknown',
    away?.nameEn || away?.name || 'Unknown',
    homeScore,
    awayScore,
    status,
    minute,
    matches,
    odds
  );
  
  const { homeWin: aiHomeWin, draw: aiDraw, awayWin: aiAwayWin } = prediction.probabilities;

  let homeWin = 33, draw = 33, awayWin = 34;

  // Safe odds fallback so we never crash when accessing odds.h2h.home etc.
  const safeOdds = odds || {
    h2h: { home: 1.85, draw: 3.40, away: 4.20 },
    handicap: { home: -0.5, homeOdds: 1.9, away: 0.5, awayOdds: 1.9, line: '-0.5' },
    overUnder: { total: 2.5, over: 1.85, under: 1.95 }
  };

  if (safeOdds.h2h) {
    const total = (1 / safeOdds.h2h.home) + (1 / safeOdds.h2h.draw) + (1 / safeOdds.h2h.away);
    homeWin = Math.round(((1 / safeOdds.h2h.home) / total) * 100);
    draw = Math.round(((1 / safeOdds.h2h.draw) / total) * 100);
    awayWin = Math.round(((1 / safeOdds.h2h.away) / total) * 100);
  }

  const generateDetailedStats = () => {
    const detailedList = [];
    detailedList.push({
      key: 'expectedGoals',
      label: 'Bàn thắng kỳ vọng (xG)',
      home: (stats?.shots?.home || 8) * 0.12,
      away: (stats?.shots?.away || 8) * 0.12,
      isDecimal: true
    });
    detailedList.push({
      key: 'possession',
      label: 'Kiểm soát bóng (%)',
      home: stats?.possession?.home ?? 50,
      away: stats?.possession?.away ?? 50,
    });
    detailedList.push({
      key: 'shots',
      label: 'Tổng số cú sút',
      home: stats?.shots?.home ?? 10,
      away: stats?.shots?.away ?? 10,
    });
    detailedList.push({
      key: 'shotsOnTarget',
      label: 'Sút trúng đích',
      home: stats?.shotsOnTarget?.home ?? 4,
      away: stats?.shotsOnTarget?.away ?? 4,
    });
    detailedList.push({
      key: 'corners',
      label: 'Phạt góc',
      home: stats?.corners?.home ?? 4,
      away: stats?.corners?.away ?? 4,
    });
    detailedList.push({
      key: 'yellowCards',
      label: 'Thẻ vàng',
      home: stats?.yellowCards?.home ?? 1,
      away: stats?.yellowCards?.away ?? 1,
    });
    detailedList.push({
      key: 'redCards',
      label: 'Thẻ đỏ',
      home: stats?.redCards?.home ?? 0,
      away: stats?.redCards?.away ?? 0,
    });
    detailedList.push({
      key: 'fouls',
      label: 'Phạm lỗi',
      home: stats?.fouls?.home ?? 12,
      away: stats?.fouls?.away ?? 12,
    });
    detailedList.push({
      key: 'offsides',
      label: 'Việt vị',
      home: stats?.offsides?.home ?? 2,
      away: stats?.offsides?.away ?? 2,
    });

    return detailedList;
  };

  const matchDateLocal = convertToUserTimezone(date, stadiumId);
  const stadium = STADIUMS_INFO[stadiumId] || { name: 'Sân vận động Quốc gia', city: 'Thành phố' };

  const formattedKickoffDate = matchDateLocal.toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric'
  });
  const formattedKickoffTime = matchDateLocal.toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', hour12: false
  });

  return (
    <div className="w-full bg-[var(--365-surface)] h-full overflow-y-auto custom-scrollbar relative rounded-[12px]">
      {/* 365Scores Header Layout */}
      <div className="bg-white border-b border-[#e2e2e2] shadow-sm pb-0 relative">
        <div className="flex justify-between items-center px-4 py-3">
          <Button
            type="text"
            icon={<ArrowLeft size={18} className="text-[#151e22]" />}
            onClick={onClose}
            className="flex items-center text-[#151e22] font-semibold text-[14px]"
          >
            Trở lại
          </Button>
          <Bell
            size={20}
            className={`cursor-pointer transition-colors ${isBookmarked ? 'text-[#ea4c89] fill-[#ea4c89]' : 'text-[#6b7173]'} ${ringing ? 'animate-ring' : ''}`}
            onClick={() => {
              if (!isBookmarked) {
                setRinging(true);
                setTimeout(() => setRinging(false), 1000);
              }
              if (onToggleBookmark) onToggleBookmark(match.id);
            }}
          />
        </div>

        {/* Dynamic League Info */}
        <div className="text-center pb-2 text-[12px] text-[#6b7173] font-medium uppercase tracking-wide">
          {league?.name || 'World Cup 2026'}
        </div>

        {/* Scoreboard */}
        <div className="flex justify-center items-center px-4 pb-2 gap-8 mt-2">
          <div className="flex flex-col items-center flex-1">
            <img src={`https://flagcdn.com/w80/${home.flag}.png`} alt={home.name} className="w-12 h-12 object-cover border border-gray-100 rounded-full mb-2 shadow-sm" />
            <span className="text-[14px] font-semibold text-[#151e22] text-center leading-tight">{home.name}</span>
          </div>

          <div className="flex flex-col items-center flex-none w-[120px]">
            <span className="text-[11px] font-semibold text-[#6b7173] mb-1">
              {isLive ? <span className="text-[#ff495c] animate-pulse">Trực tiếp • {minute}'</span> : isFinished ? 'KẾT THÚC' : formattedKickoffDate}
            </span>
            <div className={`text-[32px] font-semibold leading-none ${isLive ? 'text-[#ff495c]' : 'text-[#151e22]'}`}>
              {isLive || isFinished ? `${homeScore} - ${awayScore}` : formattedKickoffTime}
            </div>
            {isLive || isFinished ? null : <span className="text-[11px] text-[#6b7173] mt-1">Sắp diễn ra</span>}
          </div>

          <div className="flex flex-col items-center flex-1">
            <img src={`https://flagcdn.com/w80/${away.flag}.png`} alt={away.name} className="w-12 h-12 object-cover border border-gray-100 rounded-full mb-2 shadow-sm" />
            <span className="text-[14px] font-semibold text-[#151e22] text-center leading-tight">{away.name}</span>
          </div>
        </div>

        {/* Goalscorers List */}
        {(isLive || isFinished) && (
          <div className="w-full max-w-md mx-auto mb-4 px-4">
            {(() => {
              let homeGoals = [];
              let awayGoals = [];
              
              if (enrichedMatch?.events && enrichedMatch.events.some(e => e.type?.toLowerCase().includes('goal'))) {
                homeGoals = enrichedMatch.events.filter(e => e.type?.toLowerCase().includes('goal') && e.isHome).map(e => ({ name: e.playerName, min: e.minute, image: e.playerImage }));
                awayGoals = enrichedMatch.events.filter(e => e.type?.toLowerCase().includes('goal') && !e.isHome).map(e => ({ name: e.playerName, min: e.minute, image: e.playerImage }));
              } else if (match.timeline && match.timeline.some(e => e.type === 'GOAL')) {
                homeGoals = match.timeline.filter(e => e.type === 'GOAL' && e.team === 'home').map(e => ({ name: e.player || e.detail, min: e.minute, image: e.playerImage }));
                awayGoals = match.timeline.filter(e => e.type === 'GOAL' && e.team === 'away').map(e => ({ name: e.player || e.detail, min: e.minute, image: e.playerImage }));
              }
              
              if (homeGoals.length === 0 && awayGoals.length === 0) return null;
              
              return (
                <div className="grid grid-cols-2 gap-4 text-[13px] pt-1">
                  <div className="text-right space-y-2 pr-4 border-r border-gray-100">
                    {homeGoals.map((g, idx) => (
                      <div key={`hg-${idx}`} className="flex justify-end items-center gap-2 text-[#151e22]">
                        <span className="font-semibold truncate max-w-[130px]" title={g.name}>{g.name}</span>
                        {g.image && <img src={g.image} alt={g.name} className="w-6 h-6 rounded-full object-cover border-[1.5px] border-white shadow-sm bg-gray-50" />}
                        <span className="font-semibold text-gray-400 w-6">{g.min}'</span>
                        <span className="text-[12px]">⚽</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-left space-y-2 pl-4">
                    {awayGoals.map((g, idx) => (
                      <div key={`ag-${idx}`} className="flex justify-start items-center gap-2 text-[#151e22]">
                        <span className="text-[12px]">⚽</span>
                        <span className="font-semibold text-gray-400 w-6 text-right">{g.min}'</span>
                        {g.image && <img src={g.image} alt={g.name} className="w-6 h-6 rounded-full object-cover border-[1.5px] border-white shadow-sm bg-gray-50" />}
                        <span className="font-semibold truncate max-w-[130px]" title={g.name}>{g.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Match Info Details (Referees, Attendance, Stadium) */}
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 pb-5 px-4 text-[12px] font-medium text-[#6b7173]">
          <span className="flex items-center gap-1.5 bg-gray-50/80 px-3 py-1.5 rounded-full border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="material-symbols-outlined text-[15px] text-gray-400">stadium</span>
            <span className="text-[#151e22]">{enrichedMatch?.venue?.name || stadium.name}</span>
          </span>
          <span className="flex items-center gap-1.5 bg-gray-50/80 px-3 py-1.5 rounded-full border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="material-symbols-outlined text-[15px] text-gray-400">sports</span>
            Trọng tài: <span className="text-[#151e22]">{enrichedMatch?.referees && Array.isArray(enrichedMatch.referees) ? (enrichedMatch.referees.map(r => typeof r === 'object' ? (r?.name || '') : r).filter(r => r && String(r).trim() !== '').join(', ') || 'Đang cập nhật') : (enrichedMatch?.referees || 'Đang cập nhật')}</span>
          </span>
          {(enrichedMatch?.attendance || stats?.attendance) && (
            <span className="flex items-center gap-1.5 bg-gray-50/80 px-3 py-1.5 rounded-full border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="material-symbols-outlined text-[15px] text-gray-400">groups</span>
              Khán giả: <span className="text-[#151e22]">{(enrichedMatch?.attendance || stats?.attendance).toLocaleString('vi-VN')}</span>
            </span>
          )}
        </div>


        {/* Horizontal Navigation Tabs */}
        <div className="flex px-4 overflow-x-auto no-scrollbar gap-6 border-t border-gray-100 mt-0">
          {['ANALYTICS', 'EVENTS', 'LINEUPS', 'STATS', 'ODDS', 'NEWS', 'CHAT'].filter(tabKey => !(isTBD && tabKey === 'ANALYTICS')).map(tabKey => {
            const labels = {
              'EVENTS': 'Sự kiện',
              'LINEUPS': 'Đội hình',
              'STATS': 'Thống kê',
              'ODDS': 'Tỷ lệ cược',
              'NEWS': 'Tin tức',
              'ANALYTICS': 'Dự đoán AI'
            };
            return (
              <div
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`py-3 text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-colors border-b-[3px] ${activeTab === tabKey ? 'text-[#ea4c89] border-[#ea4c89]' : 'text-[#6b7173] border-transparent hover:text-[#151e22]'
                  }`}
              >
                {labels[tabKey]}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex flex-col gap-4">

        {/* EVENTS TAB */}
        {activeTab === 'EVENTS' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {(!enrichedMatch && !isFinished) ? (
              <div className="bg-white p-4 shadow-sm rounded-[6px]">
                <Skeleton active paragraph={{ rows: 6 }} />
              </div>
            ) : (
              <div className="bg-white shadow-sm rounded-[6px] overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-[13px] font-semibold text-[#151e22] flex items-center justify-between">
                  <span>Diễn biến trận đấu</span>
                  {isFinished && <Tag color="default" className="text-[11px] font-bold">KẾT THÚC</Tag>}
                  {isLive && <Tag color="red" className="text-[11px] font-bold animate-pulse">TRỰC TIẾP</Tag>}
                </div>

                {/* Score Header */}
                <div className="flex items-center justify-center gap-6 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <img src={`https://flagcdn.com/w20/${home.flag}.png`} alt="" className="w-5" />
                    <span className="font-semibold text-[13px] text-[#151e22]">{home.name}</span>
                  </div>
                  <div className="text-[20px] font-bold text-[#151e22]">
                    {(isLive || isFinished) ? `${homeScore} - ${awayScore}` : 'vs'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[13px] text-[#151e22]">{away.name}</span>
                    <img src={`https://flagcdn.com/w20/${away.flag}.png`} alt="" className="w-5" />
                  </div>
                </div>

                <div className="relative px-4 py-3">
                  {/* Central vertical timeline line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gray-100 -translate-x-1/2"></div>

                  {enrichedMatch?.events?.length > 0 ? (
                    <div className="flex flex-col">
                      {enrichedMatch.events.map((ev, idx) => {
                        const typeLower = ev.type?.toLowerCase() || '';
                        const isGoal = typeLower.includes('goal');
                        const isYellow = typeLower.includes('yellow');
                        const isRed = typeLower.includes('red');
                        const isSub = typeLower.includes('substitution');
                        const isOwnGoal = typeLower.includes('own goal');

                        // Minute label
                        const minuteLabel = ev.extraMinute ? `${ev.minute}+${ev.extraMinute}'` : `${ev.minute}'`;

                        // Render player info block
                        const renderPlayerInfo = (alignRight) => (
                          <div className={`flex flex-col gap-2 ${alignRight ? 'items-end text-right' : 'items-start text-left'}`}>
                            <div className={`flex items-center gap-2 ${alignRight ? 'flex-row-reverse' : 'flex-row'}`}>
                              {ev.playerImage ? (
                                <img src={ev.playerImage} alt="" className="w-9 h-9 rounded-full object-cover border-[2px] border-white shadow-sm flex-shrink-0" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gray-100 border-[2px] border-white shadow-sm flex-shrink-0 flex items-center justify-center text-gray-400 text-[11px]">?</div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="text-[13px] font-bold text-[#151e22] leading-tight truncate">{ev.playerName || 'N/A'}</span>
                                {isSub && ev.relatedPlayerName && (
                                  <span className="text-[11px] text-[#ff495c] leading-tight flex items-center gap-0.5 truncate" style={{ flexDirection: alignRight ? 'row-reverse' : 'row' }}>
                                    <svg className="w-2.5 h-2.5 text-red-400 flex-shrink-0" viewBox="0 0 10 10" fill="currentColor"><polygon points="0,0 10,0 5,8" /></svg> <span className="truncate">{ev.relatedPlayerName}</span>
                                  </span>
                                )}
                                {isGoal && ev.result && <span className="text-[10px] text-[#6b7173] font-semibold">{ev.result}</span>}
                                {isGoal && !ev.result && <span className="text-[10px] text-[#1bc165] font-semibold">Bàn thắng</span>}
                                {isOwnGoal && <span className="text-[10px] text-[#ff495c] font-semibold">Phản lưới</span>}
                              </div>
                            </div>
                            
                            {/* Option A: Scraped Event Media (Goals/Fouls) */}
                            {ev.eventImage && (
                              <div className="mt-1 overflow-hidden rounded-md border border-gray-100 shadow-sm max-w-[160px] relative">
                                <img src={ev.eventImage} alt="Event" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300" />
                                <div className="bg-gray-800/80 absolute bottom-1 right-1 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm shadow-md">
                                  <span className="material-symbols-outlined text-[10px]">photo_camera</span> Live
                                </div>
                              </div>
                            )}
                          </div>
                        );

                        // Center icon
                        const renderCenterIcon = () => {
                          if (isGoal) return <div className="w-8 h-8 rounded-full bg-[#1bc165] flex items-center justify-center shadow-sm border-[2px] border-white"><svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" fill="currentColor" /><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2.5l2.5 3.5H9.5L12 4.5zm-6 5h3.5L7 14l-1-4.5zm12 0l-1 4.5-2.5-4.5H18zm-8.5 7L12 13l2.5 3.5h-5z" fill="white" opacity="0.4" /></svg></div>;
                          if (isYellow) return <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border-[2px] border-gray-200"><div className="w-3.5 h-[18px] bg-[#ffb800] rounded-[2px]"></div></div>;
                          if (isRed) return <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border-[2px] border-gray-200"><div className="w-3.5 h-[18px] bg-red-600 rounded-[2px]"></div></div>;
                          if (isSub) return <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shadow-sm border-[2px] border-white"><svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M4 12V4" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" /><path d="M2 6l2-2 2 2" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 4v8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" /><path d="M10 10l2 2 2-2" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>;
                          return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shadow-sm border-[2px] border-white"><svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="1" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="1" fill="none" /><line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1" /><line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1" /><line x1="5" y1="11" x2="9" y2="11" stroke="currentColor" strokeWidth="1" /></svg></div>;
                        };

                        return (
                          <div key={ev.id || idx} className="flex items-center w-full py-2 relative">
                            {/* LEFT: Home team events */}
                            <div className="w-[42%] flex justify-end pr-3">
                              {ev.isHome && renderPlayerInfo(true)}
                            </div>

                            {/* CENTER: Icon + Minute */}
                            <div className="w-[16%] flex flex-col items-center z-10 flex-shrink-0">
                              {renderCenterIcon()}
                              <span className="text-[10px] font-bold text-[#6b7173] mt-0.5 whitespace-nowrap">{minuteLabel}</span>
                            </div>

                            {/* RIGHT: Away team events */}
                            <div className="w-[42%] flex justify-start pl-3">
                              {!ev.isHome && renderPlayerInfo(false)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-[#6b7173] text-[13px] py-8 relative z-10">Chưa có sự kiện nào nổi bật.</div>
                  )}
                </div>
              </div>
            )}

            {/* Match Info Box */}
            <div className="bg-white p-4 shadow-sm rounded-[6px] flex flex-col gap-3">
              <div className="text-[13px] font-semibold text-[#151e22] border-b border-gray-100 pb-2">Thông tin trận đấu</div>
              <div className="flex items-center gap-3 text-[13px] text-[#6b7173]">
                <CalendarDays size={16} /> <span>{formattedKickoffDate} - {formattedKickoffTime}</span>
              </div>
              <div className="flex items-center gap-3 text-[13px] text-[#6b7173]">
                <Play size={16} /> <span>Sân vận động: {enrichedMatch?.venue?.name || stadium.name}, {enrichedMatch?.venue?.city || stadium.city}</span>
              </div>
              {enrichedMatch?.venue?.image && (
                <div className="rounded-[6px] overflow-hidden mt-1 border border-gray-100">
                  <img src={enrichedMatch.venue.image} alt="Sân vận động" className="w-full h-[120px] object-cover" />
                </div>
              )}
              <div className="flex items-center gap-3 text-[13px] text-[#6b7173]">
                <Users size={16} /> <span>Trọng tài: {enrichedMatch?.referees && Array.isArray(enrichedMatch.referees) ? (enrichedMatch.referees.map(r => typeof r === 'object' ? (r?.name || '') : r).filter(r => r && String(r).trim() !== '').join(', ') || 'Đang cập nhật') : (enrichedMatch?.referees || 'Đang cập nhật')}</span>
              </div>
            </div>
          </div>
        )}

        {/* LINEUPS TAB */}
        {activeTab === 'LINEUPS' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {(!enrichedMatch && !isFinished) ? (
              <div className="bg-white p-4 shadow-sm rounded-[6px]">
                <Skeleton active paragraph={{ rows: 8 }} />
              </div>
            ) : (
              <>
                <div className="bg-white p-4 shadow-sm rounded-[6px] flex justify-between text-[13px] font-semibold text-[#151e22]">
                  <div className="flex flex-col items-start gap-1">
                    <span className="flex items-center gap-2"><img src={`https://flagcdn.com/w20/${home.flag}.png`} alt="" className="w-5 shadow-sm" /> {home.name}</span>
                    <span className="text-[12px] text-gray-500 font-medium">{enrichedMatch?.lineups?.home?.formation || 'Đội hình: N/A'}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="flex items-center gap-2">{away.name} <img src={`https://flagcdn.com/w20/${away.flag}.png`} alt="" className="w-5 shadow-sm" /></span>
                    <span className="text-[12px] text-gray-500 font-medium">{enrichedMatch?.lineups?.away?.formation || 'Đội hình: N/A'}</span>
                  </div>
                </div>

                {/* 365Scores Pitch Toggle */}
                <div className="flex justify-center mb-2">
                  <div className="flex border border-blue-400 rounded-sm overflow-hidden w-[240px] text-[13px] font-semibold">
                    <button
                      onClick={() => setPitchTeamToggle('home')}
                      className={`flex-1 py-1.5 transition-colors ${pitchTeamToggle === 'home' ? 'bg-[#2194ff] text-white' : 'bg-gray-50 text-[#2194ff] hover:bg-gray-100'}`}
                    >
                      {home.name}
                    </button>
                    <button
                      onClick={() => setPitchTeamToggle('away')}
                      className={`flex-1 py-1.5 transition-colors ${pitchTeamToggle === 'away' ? 'bg-[#2194ff] text-white' : 'bg-gray-50 text-[#2194ff] hover:bg-gray-100'}`}
                    >
                      {away.name}
                    </button>
                  </div>
                </div>

                {/* Virtual Pitch UI — SVG 3D Perspective */}
                <div className="rounded-[8px] overflow-hidden">
                  {/* Pitch Container */}
                  <div className="relative w-full" style={{ aspectRatio: '10/9' }}>
                    {/* SVG Pitch Background — 3D trapezoid perspective */}
                    <svg viewBox="0 0 1000 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        {/* Grass gradient */}
                        <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2d8a3e" />
                          <stop offset="100%" stopColor="#1a6b2c" />
                        </linearGradient>
                      </defs>

                      {/* Dark background behind pitch */}
                      <rect x="0" y="0" width="1000" height="900" fill="#1a5c28" />

                      {/* Main pitch trapezoid */}
                      <polygon points="150,30 850,30 980,870 20,870" fill="url(#grassGrad)" />

                      {/* Grass stripes (horizontal bands across the trapezoid) */}
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => {
                        const t1 = i / 10;
                        const t2 = (i + 1) / 10;
                        const y1 = 30 + t1 * 840;
                        const y2 = 30 + t2 * 840;
                        const lx1 = 150 + t1 * (20 - 150);
                        const rx1 = 850 + t1 * (980 - 850);
                        const lx2 = 150 + t2 * (20 - 150);
                        const rx2 = 850 + t2 * (980 - 850);
                        return i % 2 === 0 ? (
                          <polygon key={i} points={`${lx1},${y1} ${rx1},${y1} ${rx2},${y2} ${lx2},${y2}`} fill="rgba(255,255,255,0.04)" />
                        ) : null;
                      })}

                      {/* Pitch outline */}
                      <polygon points="150,30 850,30 980,870 20,870" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" />

                      {/* Center line (top horizontal) */}
                      <line x1="150" y1="30" x2="850" y2="30" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" />

                      {/* Center circle (ellipse at top, half visible) */}
                      <ellipse cx="500" cy="30" rx="120" ry="80" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
                      <circle cx="500" cy="30" r="4" fill="rgba(255,255,255,0.6)" />

                      {/* Bottom penalty area (trapezoid) */}
                      {(() => {
                        const penT = 0.75;
                        const penY = 30 + penT * 840;
                        const penLx = 150 + penT * (20 - 150);
                        const penRx = 850 + penT * (980 - 850);
                        const penW = penRx - penLx;
                        const penLeft = penLx + penW * 0.22;
                        const penRight = penLx + penW * 0.78;
                        return (
                          <polygon points={`${penLeft},${penY} ${penRight},${penY} ${20 + (980 - 20) * 0.78},870 ${20 + (980 - 20) * 0.22},870`} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
                        );
                      })()}

                      {/* Bottom goal area (smaller trapezoid) */}
                      {(() => {
                        const gaT = 0.9;
                        const gaY = 30 + gaT * 840;
                        const gaLx = 150 + gaT * (20 - 150);
                        const gaRx = 850 + gaT * (980 - 850);
                        const gaW = gaRx - gaLx;
                        const gaLeft = gaLx + gaW * 0.35;
                        const gaRight = gaLx + gaW * 0.65;
                        return (
                          <polygon points={`${gaLeft},${gaY} ${gaRight},${gaY} ${20 + (980 - 20) * 0.65},870 ${20 + (980 - 20) * 0.35},870`} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
                        );
                      })()}

                      {/* Bottom penalty arc */}
                      <ellipse cx="500" cy={30 + 0.75 * 840} rx="80" ry="45" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" clipPath="url(#penArcClip)" />
                      <defs>
                        <clipPath id="penArcClip">
                          <rect x="0" y="0" width="1000" height={30 + 0.75 * 840} />
                        </clipPath>
                      </defs>

                      {/* Formation label (bottom left) */}
                      <rect x="30" y="830" rx="6" ry="6" width="120" height="35" fill="rgba(0,0,0,0.5)" />
                      <text x="90" y="853" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="system-ui">
                        {(pitchTeamToggle === 'home' ? enrichedMatch?.lineups?.home?.formation : enrichedMatch?.lineups?.away?.formation) || '4-3-3'}
                      </text>
                    </svg>

                    {/* Player Avatars — HTML overlay (NOT transformed, no distortion) */}
                    <div className="absolute inset-0">
                      {(() => {
                        const activeStarters = pitchTeamToggle === 'home' ? enrichedMatch?.lineups?.home?.starters : enrichedMatch?.lineups?.away?.starters;
                        if (!activeStarters || activeStarters.length === 0) {
                          return (
                            <div className="text-white text-center text-[13px] font-semibold opacity-90 h-full flex items-center justify-center">
                              Đội hình ra sân chưa được công bố.
                            </div>
                          );
                        }

                        // Count players per row for horizontal distribution
                        const rowCounts = {};
                        activeStarters.forEach(p => {
                          if (!p.grid) return;
                          const r = p.grid.split(':')[0];
                          rowCounts[r] = (rowCounts[r] || 0) + 1;
                        });

                        return activeStarters.map(p => {
                          if (!p.grid) return null;
                          const parts = p.grid.split(':');
                          const row = parseInt(parts[0]);
                          const col = parseInt(parts[1]);

                          const totalInRow = rowCounts[row] || 1;

                          // Vertical position: row 1 (GK) near bottom, higher rows toward top
                          // Map to t: 0 = top of pitch, 1 = bottom of pitch
                          let t = 0.5;
                          if (row === 1) t = 0.92;
                          else if (row === 2) t = 0.72;
                          else if (row === 3) t = 0.48;
                          else if (row === 4) t = 0.28;
                          else if (row >= 5) t = 0.12;

                          // Calculate the Y position (percentage from top)
                          const topPct = 3.3 + t * 93.3; // maps to SVG viewBox

                          // Calculate the X position — must account for the trapezoid narrowing
                          // At t=0 (top): pitch goes from 15% to 85% of width
                          // At t=1 (bottom): pitch goes from 2% to 98% of width
                          const leftEdge = 15 + t * (2 - 15);
                          const rightEdge = 85 + t * (98 - 85);
                          const pitchWidth = rightEdge - leftEdge;
                          const xPct = leftEdge + (col / (totalInRow + 1)) * pitchWidth;

                          // Player scale: slightly smaller for further rows (top)
                          const scale = 0.85 + t * 0.15;

                          // Extract events
                          let hasGoal = false, hasYellow = false, hasRed = false, hasSub = false;
                          if (enrichedMatch?.events) {
                            enrichedMatch.events.forEach(e => {
                              if (e.playerId === p.id) {
                                if (e.type?.toLowerCase().includes('goal')) hasGoal = true;
                                if (e.type?.toLowerCase().includes('yellow')) hasYellow = true;
                                if (e.type?.toLowerCase().includes('red')) hasRed = true;
                                if (e.type?.toLowerCase().includes('substitution')) hasSub = true;
                              }
                              if (e.relatedPlayerId === p.id && e.type?.toLowerCase().includes('substitution')) hasSub = true;
                            });
                          }

                          const ratingNum = p.rating || (6.5 + seedRandom(p.id) * 2).toFixed(1);
                          const ratingBg = ratingNum >= 8 ? '#1bc165' : (ratingNum >= 6.5 ? '#ffb800' : '#ff495c');

                          return (
                            <div
                              key={p.id}
                              onClick={() => navigate('/player/' + p.id)}
                              className="absolute flex flex-col items-center cursor-pointer group hover:!z-30"
                              style={{
                                top: `${topPct}%`,
                                left: `${xPct}%`,
                                transform: `translate(-50%, -50%) scale(${scale})`,
                                zIndex: Math.round(t * 20) + 5
                              }}
                            >
                              <div className="relative group-hover:scale-110 transition-transform duration-150">
                                {/* Avatar Circle */}
                                {p.image ? (
                                  <div className="w-[56px] h-[56px] rounded-full border-[3px] border-white overflow-hidden bg-gray-200" style={{ boxShadow: '0 3px 12px rgba(0,0,0,0.35)' }}>
                                    <img src={p.image} className="w-full h-full object-cover" alt="" />
                                  </div>
                                ) : (
                                  <div className="w-[56px] h-[56px] rounded-full flex items-center justify-center text-[20px] font-bold border-[3px] border-white bg-gray-100 text-gray-500" style={{ boxShadow: '0 3px 12px rgba(0,0,0,0.35)' }}>
                                    ?
                                  </div>
                                )}

                                {/* Shirt Number Badge (top-left) */}
                                <div className="absolute -top-0.5 -left-1.5 min-w-[20px] h-[20px] bg-[#2a2a2a] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-[1.5px] border-white/80" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                  {p.number || '-'}
                                </div>

                                {/* Rating Pill (bottom-left) */}
                                {isFinished && (
                                  <div
                                    className="absolute -bottom-0.5 -left-2.5 text-white text-[10px] font-extrabold px-[5px] py-[1px] rounded-[5px] border-[2px] border-white"
                                    style={{ backgroundColor: ratingBg, boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                                  >
                                    {ratingNum}
                                  </div>
                                )}

                                {/* Event Badges (top-right, stacked) */}
                                <div className="absolute -top-1 -right-2 flex flex-col gap-0.5">
                                  {hasGoal && <div className="w-[17px] h-[17px] bg-white rounded-full flex items-center justify-center border border-gray-200" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}><svg className="w-2.5 h-2.5 text-[#1bc165]" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg></div>}
                                  {hasRed && <div className="w-[12px] h-[16px] bg-red-600 rounded-[2px] border-[1.5px] border-white mx-auto" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>}
                                  {hasYellow && !hasRed && <div className="w-[12px] h-[16px] bg-[#ffb800] rounded-[2px] border-[1.5px] border-white mx-auto" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>}
                                  {hasSub && <div className="w-[17px] h-[17px] bg-white rounded-full flex items-center justify-center border border-gray-200" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}><svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="none"><path d="M4 11V5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" /><path d="M12 5v6" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" /></svg></div>}
                                </div>
                              </div>

                              {/* Player Name */}
                              <div className="text-white text-[11px] mt-1 truncate max-w-[80px] text-center font-semibold" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.5)' }}>
                                {p.name.split(' ').pop()}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* 365Scores Style Lineups Lists */}
                {(() => {
                  const getPlayerEvents = (playerId, isHome) => {
                    if (!enrichedMatch?.events) return null;
                    const pEvents = enrichedMatch.events.filter(e => e.playerId === playerId || e.relatedPlayerId === playerId);
                    if (pEvents.length === 0) return null;
                    return (
                      <div className="flex items-center gap-1">
                        {pEvents.map((e, idx) => {
                          if (e.type?.toLowerCase().includes('goal')) return <svg key={idx} className="w-3 h-3 text-[#1bc165] inline" viewBox="0 0 24 24" fill="currentColor" title="Bàn thắng"><circle cx="12" cy="12" r="10" /></svg>;
                          if (e.type?.toLowerCase().includes('yellow')) return <div key={idx} className="w-2.5 h-3 bg-[#ffb800] rounded-[1px] inline-block" title="Thẻ vàng"></div>;
                          if (e.type?.toLowerCase().includes('red')) return <div key={idx} className="w-2.5 h-3 bg-red-600 rounded-[1px] inline-block" title="Thẻ đỏ"></div>;
                          if (e.type?.toLowerCase().includes('substitution') && e.playerId === playerId) return <svg key={idx} className="w-3 h-3 inline" viewBox="0 0 12 12" title="Vào sân"><polygon points="6,2 10,8 2,8" fill="#22c55e" /></svg>;
                          if (e.type?.toLowerCase().includes('substitution') && e.relatedPlayerId === playerId) return <svg key={idx} className="w-3 h-3 inline" viewBox="0 0 12 12" title="Ra sân"><polygon points="2,4 10,4 6,10" fill="#ef4444" /></svg>;
                          return null;
                        })}
                      </div>
                    );
                  };

                  const renderPlayerRow = (p, isHome) => {
                    const ratingNum = p.rating || (6.5 + seedRandom(p.id) * 2).toFixed(1);
                    const ratingColor = ratingNum >= 8 ? 'bg-green-500' : (ratingNum >= 6.5 ? 'bg-green-400' : 'bg-orange-400');

                    const avatarEl = p.image ? (
                      <div className="relative flex-shrink-0">
                        <img src={p.image} alt="" className="w-8 h-8 rounded-full object-cover border-[2px] border-white shadow-sm" />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-[16px] h-[16px] rounded-full flex items-center justify-center text-[8px] font-bold text-white ${isHome ? 'bg-[#2194ff]' : 'bg-[#ff495c]'} border border-white`}>
                          {p.number || '-'}
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white ${isHome ? 'bg-[#2194ff]' : 'bg-[#ff495c]'} border-[2px] border-white shadow-sm`}>
                          {p.number || '-'}
                        </div>
                      </div>
                    );

                    if (isHome) {
                      return (
                        <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 hover:bg-gray-50 px-2 cursor-pointer transition-colors" onClick={() => navigate('/player/' + p.id)}>
                          <div className="flex items-center gap-2.5">
                            {avatarEl}
                            <div className="flex flex-col">
                              <span className="font-semibold text-[#151e22] text-[13px]">{p.name}</span>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                {p.position} {getPlayerEvents(p.id, true)}
                              </div>
                            </div>
                          </div>
                          {isFinished && (
                            <div className={`w-8 h-5 rounded-[4px] flex items-center justify-center text-[11px] font-bold text-white ${ratingColor}`}>
                              {ratingNum}
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 hover:bg-gray-50 px-2 cursor-pointer transition-colors" onClick={() => navigate('/player/' + p.id)}>
                          {isFinished && (
                            <div className={`w-8 h-5 rounded-[4px] flex items-center justify-center text-[11px] font-bold text-white ${ratingColor}`}>
                              {ratingNum}
                            </div>
                          )}
                          <div className="flex items-center gap-2.5 ml-auto text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-semibold text-[#151e22] text-[13px]">{p.name}</span>
                              <div className="flex items-center justify-end gap-2 text-[10px] text-gray-500">
                                {getPlayerEvents(p.id, false)} {p.position}
                              </div>
                            </div>
                            {avatarEl}
                          </div>
                        </div>
                      );
                    }
                  };

                  const renderCoachAvatar = (coach, color) => {
                    if (coach?.image) {
                      return <img src={coach.image} alt="" className={`w-9 h-9 rounded-full object-cover border-2 ${color} flex-shrink-0 shadow-sm`} />;
                    }
                    return <div className={`w-9 h-9 rounded-full bg-gray-200 border-2 ${color} flex-shrink-0 flex items-center justify-center`}><svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div>;
                  };

                  return (
                    <div className="flex flex-col gap-3">
                      {/* Coaches Header */}
                      <div className="bg-white shadow-sm rounded-[6px] overflow-hidden">
                        <div className="bg-gray-100/50 px-4 py-2 border-b border-gray-100 text-[12px] font-bold text-[#6b7173] text-center uppercase tracking-wider">
                          Huấn luyện viên
                        </div>
                        <div className="flex divide-x divide-gray-100">
                          <div className="flex-1 p-3 flex items-center gap-3">
                            {renderCoachAvatar(enrichedMatch?.lineups?.home?.coach, 'border-[#2194ff]')}
                            <span className="font-semibold text-[#151e22] text-[13px]">{enrichedMatch?.lineups?.home?.coach?.name || 'N/A'}</span>
                          </div>
                          <div className="flex-1 p-3 flex items-center justify-end gap-3">
                            <span className="font-semibold text-[#151e22] text-[13px]">{enrichedMatch?.lineups?.away?.coach?.name || 'N/A'}</span>
                            {renderCoachAvatar(enrichedMatch?.lineups?.away?.coach, 'border-[#ff495c]')}
                          </div>
                        </div>
                      </div>

                      {/* Starters List */}
                      <div className="bg-white shadow-sm rounded-[6px] overflow-hidden">
                        <div className="bg-gray-100/50 px-4 py-2 border-b border-gray-100 text-[12px] font-bold text-[#6b7173] text-center uppercase tracking-wider">
                          Đội hình xuất phát
                        </div>
                        <div className="flex divide-x divide-gray-100">
                          <div className="flex-1 p-2 flex flex-col">
                            {enrichedMatch?.lineups?.home?.starters?.map(p => renderPlayerRow(p, true))}
                          </div>
                          <div className="flex-1 p-2 flex flex-col">
                            {enrichedMatch?.lineups?.away?.starters?.map(p => renderPlayerRow(p, false))}
                          </div>
                        </div>
                      </div>

                      {/* Substitutes List */}
                      {enrichedMatch?.lineups?.home?.subs?.length > 0 && (
                        <div className="bg-white shadow-sm rounded-[6px] overflow-hidden">
                          <div className="bg-gray-100/50 px-4 py-2 border-b border-gray-100 text-[12px] font-bold text-[#6b7173] text-center uppercase tracking-wider">
                            Dự bị
                          </div>
                          <div className="flex divide-x divide-gray-100">
                            <div className="flex-1 p-2 flex flex-col">
                              {enrichedMatch?.lineups?.home?.subs?.map(p => renderPlayerRow(p, true))}
                            </div>
                            <div className="flex-1 p-2 flex flex-col">
                              {enrichedMatch?.lineups?.away?.subs?.map(p => renderPlayerRow(p, false))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ODDS TAB */}
        {activeTab === 'ODDS' && (
          <div className="flex flex-col gap-3 animate-fadeIn">
            {loadingOdds ? (
              <div className="bg-white p-8 shadow-sm rounded-[6px] flex items-center justify-center gap-2 text-[#6b7173]">
                <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-[13px]">Đang tải tỷ lệ cược...</span>
              </div>
            ) : (
              <>
                {/* Probability Bar */}
                <div className="bg-white p-4 shadow-sm rounded-[6px]">
                  <div className="flex justify-between text-[11px] font-semibold text-[#151e22] mb-2">
                    <span>{home.name} ({homeWin}%)</span>
                    <span>Hòa ({draw}%)</span>
                    <span>{away.name} ({awayWin}%)</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${homeWin}%` }} className="bg-[#2194ff]"></div>
                    <div style={{ width: `${draw}%` }} className="bg-gray-300"></div>
                    <div style={{ width: `${awayWin}%` }} className="bg-[#ff495c]"></div>
                  </div>
                </div>

                {/* Markets from API */}
                {oddsData?.markets?.map((market) => {
                  const bestBk = market.bookmakers[0];
                  if (!bestBk) return null;
                  const isExpanded = expandedMarkets[market.key];
                  const entries = bestBk.entries;

                  // Different layouts per market type
                  const is3way = ['fulltime_result', 'double_chance', 'ht_result'].includes(market.key);
                  const is2way = ['draw_no_bet', 'btts'].includes(market.key);
                  const isHandicap = ['asian_handicap', 'goal_line'].includes(market.key);
                  const isCorrectScore = market.key === 'correct_score';
                  const isHtFt = market.key === 'ht_ft';

                  const renderEntries = (bkEntries, bkName) => {
                    if (isCorrectScore) {
                      const sorted = [...bkEntries].sort((a, b) => a.value - b.value);
                      const top12 = sorted.slice(0, 12);
                      return (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3 bg-gray-50/50">
                          {top12.map((e, i) => (
                            <div key={i} onClick={() => onAddBet && onAddBet(match, `Tỷ số ${e.label}`, e.value, `cs-${e.label}`)} className={`flex flex-col items-center py-2 px-1 rounded-md cursor-pointer transition-all border ${activeBetId === `cs-${e.label}` ? 'border-[#ea4c89] bg-[#ea4c89]/10' : 'border-gray-200 bg-white hover:border-[#ea4c89]/50 shadow-sm'}`}>
                              <span className="text-[12px] font-bold text-gray-700">{e.label}</span>
                              <span className="text-[14px] font-black text-[#2194ff] mt-0.5">{e.value.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    if (isHtFt) {
                      const top8 = [...bkEntries].sort((a, b) => a.value - b.value).slice(0, 8);
                      return (
                        <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50/50">
                          {top8.map((e, i) => (
                            <div key={i} onClick={() => onAddBet && onAddBet(match, `HT/FT: ${e.label}`, e.value, `htft-${e.label}`)} className={`flex justify-between items-center py-2 px-3 rounded-md cursor-pointer transition-all border ${activeBetId === `htft-${e.label}` ? 'border-[#ea4c89] bg-[#ea4c89]/10' : 'border-gray-200 bg-white hover:border-[#ea4c89]/50 shadow-sm'}`}>
                              <span className="text-[11px] font-semibold text-gray-700 truncate flex-1">{e.label}</span>
                              <span className="text-[14px] font-black text-[#2194ff] ml-2">{e.value.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    if (isHandicap) {
                      const lines = {};
                      bkEntries.forEach(e => {
                        const key = e.handicap || e.total || '0';
                        if (!lines[key]) lines[key] = [];
                        lines[key].push(e);
                      });
                      const lineKeys = Object.keys(lines).sort((a, b) => parseFloat(a) - parseFloat(b)).slice(0, 5);
                      return (
                        <div className="flex flex-col bg-gray-50/50">
                          <div className="grid grid-cols-3 items-center px-4 py-2 bg-gray-100/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase">
                            <span>Tỉ lệ</span>
                            <span className="text-center">{home.short || 'Chủ'} {market.key === 'goal_line' ? '(Tài)' : ''}</span>
                            <span className="text-center">{away.short || 'Khách'} {market.key === 'goal_line' ? '(Xỉu)' : ''}</span>
                          </div>
                          <div className="divide-y divide-gray-200">
                            {lineKeys.map(lk => (
                              <div key={lk} className="grid grid-cols-3 items-center px-4 py-2">
                                <span className="text-[13px] font-bold text-gray-800">{lk}</span>
                                {lines[lk].slice(0, 2).map((e, i) => {
                                  const betId = `${market.key}-${lk}-${e.label}`;
                                  return (
                                    <div key={i} className="px-1">
                                      <div onClick={() => onAddBet && onAddBet(match, `${market.name} ${e.label} ${lk}`, e.value, betId)} className={`flex justify-between items-center px-3 py-1.5 rounded-md cursor-pointer transition-all border ${activeBetId === betId ? 'border-[#ea4c89] bg-[#ea4c89]/10' : 'border-gray-200 bg-white hover:border-[#ea4c89]/50 shadow-sm'}`}>
                                        <span className="text-[11px] font-medium text-gray-500">{e.label}</span>
                                        <span className="text-[14px] font-black text-[#2194ff]">{e.value.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    // 3-way or 2-way grids
                    const cols = is3way ? 3 : (is2way ? 2 : Math.min(entries.length, 3));
                    const gridClass = cols === 2 ? 'grid-cols-2' : 'grid-cols-3';
                    
                    return (
                      <div className="flex flex-col bg-gray-50/50">
                        <div className={`grid ${gridClass} gap-2 p-3`}>
                          {bkEntries.slice(0, cols).map((e, i) => {
                            const betId = `${market.key}-${e.label}`;
                            const labelMap = { 'Home': home.name, 'Away': away.name, 'Draw': 'Hòa', '1': home.name, 'X': 'Hòa', '2': away.name, 'Over': 'Tài', 'Under': 'Xỉu', 'Yes': 'Có', 'No': 'Không', 'Home/Draw': `${home.short}/H`, 'Draw/Away': `H/${away.short}`, 'Home/Away': `${home.short}/${away.short}` };
                            const displayLabel = labelMap[e.label] || e.label;
                            
                            return (
                              <div key={i} onClick={() => onAddBet && onAddBet(match, displayLabel, e.value, betId)} className={`flex flex-col items-center justify-center py-2 px-1 rounded-md cursor-pointer transition-all border ${activeBetId === betId ? 'border-[#ea4c89] bg-[#ea4c89]/10' : 'border-gray-200 bg-white hover:border-[#ea4c89]/50 shadow-sm'}`}>
                                <span className="text-[11px] font-semibold text-gray-500 truncate w-full text-center px-1">{displayLabel}</span>
                                <span className="text-[15px] font-black text-[#2194ff] mt-0.5">{e.value.toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div key={market.key} className="bg-white shadow-sm rounded-[6px] overflow-hidden">
                      <div
                        className="bg-gray-50 px-4 py-2.5 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setExpandedMarkets(prev => ({ ...prev, [market.key]: !prev[market.key] }))}
                      >
                        <span className="text-[13px] font-semibold text-[#151e22]">{market.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#9ca3af] font-medium">{bestBk.name}</span>
                          {market.bookmakers.length > 1 && (
                            <span className="text-[9px] bg-[#2194ff]/10 text-[#2194ff] px-1.5 py-0.5 rounded-full font-semibold">+{market.bookmakers.length - 1}</span>
                          )}
                          <svg className={`w-3.5 h-3.5 text-[#9ca3af] transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                        </div>
                      </div>
                      {renderEntries(bestBk.entries, bestBk.name)}
                      {/* Expanded bookmakers */}
                      {isExpanded && market.bookmakers.slice(1).map(bk => (
                        <div key={bk.id} className="border-t border-gray-100">
                          <div className="px-4 py-1.5 bg-gray-50/50 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wide">{bk.name}</div>
                          {renderEntries(bk.entries, bk.name)}
                        </div>
                      ))}
                    </div>
                  );
                })}

                {(!oddsData || oddsData.markets?.length === 0) && (
                  <div className="bg-white p-6 shadow-sm rounded-[6px] text-center text-[#6b7173] text-[13px]">
                    Dữ liệu tỷ lệ cược chưa có cho trận đấu này.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'STATS' && (
          <div className="flex flex-col gap-3 animate-fadeIn">
            {(!enrichedMatch?.statistics || Object.keys(enrichedMatch?.statistics || {}).length === 0) && !isFinished ? (
              <div className="bg-white p-4 shadow-sm rounded-[6px]">
                <Skeleton active paragraph={{ rows: 8 }} />
              </div>
            ) : (() => {
              const apiStats = enrichedMatch?.statistics || {};

              // Helper to get stat value safely
              const getStat = (key) => apiStats[key] || { home: 0, away: 0 };

              // Organized stat categories
              const statGroups = [
                {
                  title: 'Tổng quan',
                  items: [
                    { label: 'Kiểm soát bóng (%)', ...getStat('BALL_POSSESSION'), suffix: '%' },
                    { label: 'Tổng đường chuyền', ...getStat('PASSES') },
                    { label: 'Chuyền chính xác (%)', ...getStat('SUCCESSFUL_PASSES_PERCENTAGE'), suffix: '%' },
                    { label: 'Tấn công', ...getStat('ATTACKS') },
                    { label: 'Tấn công nguy hiểm', ...getStat('DANGEROUS_ATTACKS') },
                  ]
                },
                {
                  title: 'Tấn công',
                  items: [
                    { label: 'Tổng cú sút', ...getStat('SHOTS_TOTAL') },
                    { label: 'Sút trúng đích', ...getStat('SHOTS_ON_TARGET') },
                    { label: 'Sút không trúng đích', ...getStat('SHOTS_OFF_TARGET') },
                    { label: 'Sút bị chặn', ...getStat('SHOTS_BLOCKED') },
                    { label: 'Sút trong vòng cấm', ...getStat('SHOTS_INSIDEBOX') },
                    { label: 'Sút ngoài vòng cấm', ...getStat('SHOTS_OUTSIDEBOX') },
                    { label: 'Cơ hội lớn tạo ra', ...getStat('BIG_CHANCES_CREATED') },
                    { label: 'Cơ hội lớn bỏ lỡ', ...getStat('BIG_CHANCES_MISSED') },
                    { label: 'Đường chuyền then chốt', ...getStat('KEY_PASSES') },
                    { label: 'Kiến tạo', ...getStat('ASSISTS') },
                  ]
                },
                {
                  title: 'Phòng ngự',
                  items: [
                    { label: 'Cứu thua', ...getStat('SAVES') },
                    { label: 'Tắc bóng', ...getStat('TACKLES') },
                    { label: 'Cướp bóng', ...getStat('INTERCEPTIONS') },
                    { label: 'Tranh chấp thắng', ...getStat('DUELS_WON') },
                    { label: 'Đánh đầu thành công', ...getStat('SUCCESSFUL_HEADERS') },
                  ]
                },
                {
                  title: 'Chuyền bóng & Rê dắt',
                  items: [
                    { label: 'Chuyền dài', ...getStat('LONG_PASSES') },
                    { label: 'Chuyền dài thành công (%)', ...getStat('SUCCESSFUL_LONG_PASSES_PERCENTAGE'), suffix: '%' },
                    { label: 'Tạt bóng', ...getStat('TOTAL_CROSSES') },
                    { label: 'Tạt bóng chính xác', ...getStat('ACCURATE_CROSSES') },
                    { label: 'Rê bóng', ...getStat('DRIBBLED_ATTEMPTS') },
                    { label: 'Rê bóng thành công', ...getStat('SUCCESSFUL_DRIBBLES') },
                  ]
                },
                {
                  title: 'Kỷ luật & Khác',
                  items: [
                    { label: 'Phạm lỗi', ...getStat('FOULS') },
                    { label: 'Thẻ vàng', ...getStat('YELLOWCARDS') },
                    { label: 'Thẻ đỏ', ...getStat('REDCARDS') },
                    { label: 'Phạt góc', ...getStat('CORNERS') },
                    { label: 'Việt vị', ...getStat('OFFSIDES') },
                    { label: 'Ném biên', ...getStat('THROWINS') },
                    { label: 'Phát bóng', ...getStat('GOAL_KICKS') },
                    { label: 'Đá phạt', ...getStat('FREE_KICKS') },
                  ]
                }
              ];

              // Filter out items where both home and away are 0
              const filteredGroups = statGroups.map(g => ({
                ...g,
                items: g.items.filter(item => item.home > 0 || item.away > 0)
              })).filter(g => g.items.length > 0);

              return (
                <>
                  {/* Score Header */}
                  <div className="bg-white shadow-sm rounded-[6px] overflow-hidden">
                    <div className="flex items-center justify-center gap-6 py-3">
                      <div className="flex items-center gap-2">
                        <img src={`https://flagcdn.com/w20/${home.flag}.png`} alt="" className="w-5" />
                        <span className="font-semibold text-[13px] text-[#151e22]">{home.name}</span>
                      </div>
                      <div className="text-[20px] font-bold text-[#151e22]">
                        {(isLive || isFinished) ? `${homeScore} - ${awayScore}` : 'vs'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[13px] text-[#151e22]">{away.name}</span>
                        <img src={`https://flagcdn.com/w20/${away.flag}.png`} alt="" className="w-5" />
                      </div>
                    </div>
                  </div>

                  {/* Shot Map */}
                  {enrichedMatch?.shots?.length > 0 && (() => {
                    const rawShots = enrichedMatch.shots;
                    const filteredShots = shotPeriod === 'h1' ? rawShots.filter(s => s.minute <= 45)
                      : shotPeriod === 'h2' ? rawShots.filter(s => s.minute > 45)
                        : rawShots;
                    const selectedShot = selectedShotIdx !== null && selectedShotIdx < filteredShots.length ? filteredShots[selectedShotIdx] : null;

                    const footLabel = (f) => f === 'left' ? 'Chân trái' : f === 'right' ? 'Chân phải' : 'Đánh đầu';
                    const resultLabel = (r) => r === 'goal' ? 'Bàn thắng' : r === 'saved' ? 'Cứu thua' : r === 'blocked' ? 'Bị chặn' : 'Sút hụt';
                    const resultColor = (r) => r === 'goal' ? '#1bc165' : r === 'saved' ? '#2194ff' : r === 'blocked' ? '#ff8c00' : '#6b7173';
                    const situationLabel = (r) => r === 'goal' ? 'Bàn thắng' : r === 'saved' ? 'Được cứu' : r === 'blocked' ? 'Bị chặn' : 'Trượt';

                    const handlePeriodChange = (p) => { setShotPeriod(p); setSelectedShotIdx(null); };

                    return (
                      <div className="bg-white shadow-sm rounded-[6px] overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                          <span className="text-[12px] font-bold text-[#6b7173] uppercase tracking-wider">Bản đồ sút bóng</span>
                          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
                            {[['all', 'Trận đấu'], ['h1', 'Hiệp 1'], ['h2', 'Hiệp 2']].map(([key, label]) => (
                              <button
                                key={key}
                                onClick={() => handlePeriodChange(key)}
                                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 ${shotPeriod === key
                                    ? 'bg-[#2194ff] text-white shadow-sm'
                                    : 'text-[#6b7173] hover:text-[#151e22]'
                                  }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col lg:flex-row">
                          {/* Pitch SVG */}
                          <div className="flex-[1.6] p-3 min-w-0">
                            <svg viewBox="-3 -2 111 72" className="w-full" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))' }}>
                              <rect x="-3" y="-2" width="111" height="72" rx="3" fill="#2d7a3a" />
                              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                <rect key={i} x={i * 10.5} y="0" width="10.5" height="68" fill={i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'} />
                              ))}
                              <rect x="0" y="0" width="105" height="68" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.4" />
                              <line x1="52.5" y1="0" x2="52.5" y2="68" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
                              <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.3" />
                              <circle cx="52.5" cy="34" r="0.6" fill="rgba(255,255,255,0.45)" />
                              <rect x="0" y="13.84" width="16.5" height="40.32" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
                              <rect x="0" y="24.84" width="5.5" height="18.32" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
                              <circle cx="11" cy="34" r="0.5" fill="rgba(255,255,255,0.35)" />
                              <path d="M 16.5 28 A 8 8 0 0 1 16.5 40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" />
                              <rect x="88.5" y="13.84" width="16.5" height="40.32" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
                              <rect x="99.5" y="24.84" width="5.5" height="18.32" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
                              <circle cx="94" cy="34" r="0.5" fill="rgba(255,255,255,0.35)" />
                              <path d="M 88.5 28 A 8 8 0 0 0 88.5 40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" />
                              <rect x="-2.5" y="29.84" width="2.5" height="8.32" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />
                              <rect x="105" y="29.84" width="2.5" height="8.32" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />
                              <path d="M 0 2 A 2 2 0 0 0 2 0" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.25" />
                              <path d="M 103 0 A 2 2 0 0 0 105 2" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.25" />
                              <path d="M 0 66 A 2 2 0 0 1 2 68" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.25" />
                              <path d="M 103 68 A 2 2 0 0 1 105 66" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.25" />

                              {filteredShots.map((shot, idx) => {
                                const sx = shot.isHome ? shot.x : (105 - shot.x);
                                const sy = shot.y;
                                const isGoal = shot.result === 'goal';
                                const isSaved = shot.result === 'saved';
                                const isSelected = selectedShotIdx === idx;
                                const teamColor = shot.isHome ? '#4a9eff' : '#ff6b7a';
                                const darkColor = shot.isHome ? '#1a6fd4' : '#d43a4a';

                                if (isGoal) {
                                  return (
                                    <g key={idx} onClick={() => setSelectedShotIdx(isSelected ? null : idx)} style={{ cursor: 'pointer' }}>
                                      {isSelected && <circle cx={sx} cy={sy} r="4.5" fill="none" stroke={teamColor} strokeWidth="0.4" strokeDasharray="2,1" opacity="0.8" />}
                                      <circle cx={sx} cy={sy} r="2.8" fill={darkColor} stroke="white" strokeWidth="0.6" />
                                      <circle cx={sx} cy={sy} r="1.2" fill="none" stroke="white" strokeWidth="0.4" />
                                      <circle cx={sx} cy={sy} r="0.4" fill="white" />
                                    </g>
                                  );
                                }
                                return (
                                  <g key={idx} onClick={() => setSelectedShotIdx(isSelected ? null : idx)} style={{ cursor: 'pointer' }}>
                                    {isSelected && <circle cx={sx} cy={sy} r="3.5" fill="none" stroke={teamColor} strokeWidth="0.4" strokeDasharray="2,1" opacity="0.8" />}
                                    <circle cx={sx} cy={sy} r="1.6" fill={isSaved ? 'white' : 'rgba(255,255,255,0.35)'} stroke={teamColor} strokeWidth="0.5" />
                                    {isSaved && <circle cx={sx} cy={sy} r="0.5" fill={teamColor} />}
                                  </g>
                                );
                              })}
                            </svg>
                          </div>

                          {/* Detail Panel */}
                          <div className="flex-1 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col">
                            {selectedShot ? (
                              <div className="p-4 flex flex-col gap-3 h-full">
                                {/* Player + Nav Row */}
                                <div className="flex items-center gap-3">
                                  {selectedShot.playerImage ? (
                                    <img src={selectedShot.playerImage} alt="" className="w-12 h-12 rounded-full object-cover border-[2.5px] border-white shadow-md flex-shrink-0" />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-100 border-[2.5px] border-white shadow-md flex items-center justify-center text-gray-400 text-sm flex-shrink-0">?</div>
                                  )}
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-[14px] font-bold text-[#151e22] truncate">{selectedShot.playerName || 'N/A'}</span>
                                    <span className="text-[12px] font-semibold" style={{ color: resultColor(selectedShot.result) }}>{resultLabel(selectedShot.result)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors disabled:opacity-20"
                                      disabled={selectedShotIdx <= 0}
                                      onClick={(e) => { e.stopPropagation(); setSelectedShotIdx(Math.max(0, selectedShotIdx - 1)); }}
                                    >
                                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6" /></svg>
                                    </button>
                                    <span className="text-[18px] font-bold text-[#151e22] min-w-[36px] text-center">
                                      {selectedShot.extraMinute ? `${selectedShot.minute}+${selectedShot.extraMinute}'` : `${selectedShot.minute}'`}
                                    </span>
                                    <button
                                      className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors disabled:opacity-20"
                                      disabled={selectedShotIdx >= filteredShots.length - 1}
                                      onClick={(e) => { e.stopPropagation(); setSelectedShotIdx(Math.min(filteredShots.length - 1, selectedShotIdx + 1)); }}
                                    >
                                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6" /></svg>
                                    </button>
                                  </div>
                                </div>

                                {/* Mini Goal Frame */}
                                <div className="flex justify-center py-1">
                                  <svg viewBox="0 0 120 75" className="w-[170px]">
                                    <rect x="10" y="5" width="100" height="50" fill="none" stroke="#d1d5db" strokeWidth="1.8" rx="1" />
                                    {[30, 50, 70, 90].map(x => <line key={`v${x}`} x1={x} y1="5" x2={x} y2="55" stroke="#e5e7eb" strokeWidth="0.5" />)}
                                    {[18, 31, 44].map(y => <line key={`h${y}`} x1="10" y1={y} x2="110" y2={y} stroke="#e5e7eb" strokeWidth="0.5" />)}
                                    <line x1="0" y1="55" x2="120" y2="55" stroke="#d1d5db" strokeWidth="1.5" />
                                    {(() => {
                                      const goalX = Math.max(15, Math.min(105, 60 + (selectedShot.y - 32.5) * 2));
                                      const goalY = selectedShot.result === 'goal' ? 32 : selectedShot.result === 'saved' ? 22 : 65;
                                      const dotColor = selectedShot.isHome ? '#2194ff' : '#ff495c';
                                      return selectedShot.result === 'goal' ? (
                                        <g><circle cx={goalX} cy={goalY} r="5.5" fill={dotColor} stroke="white" strokeWidth="1.3" /><circle cx={goalX} cy={goalY} r="2.2" fill="none" stroke="white" strokeWidth="0.7" /><circle cx={goalX} cy={goalY} r="0.7" fill="white" /></g>
                                      ) : selectedShot.result === 'missed' ? (
                                        <circle cx={goalX} cy={goalY} r="4.5" fill="rgba(0,0,0,0.1)" stroke="#9ca3af" strokeWidth="1" strokeDasharray="2,1.5" />
                                      ) : (
                                        <g><circle cx={goalX} cy={goalY} r="4.5" fill="white" stroke={dotColor} strokeWidth="1" /><circle cx={goalX} cy={goalY} r="1.5" fill={dotColor} /></g>
                                      );
                                    })()}
                                  </svg>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-px bg-gray-100 rounded-lg overflow-hidden border border-gray-100 mt-auto">
                                  <div className="bg-white py-2 px-1 flex flex-col items-center">
                                    <span className="text-[11px] font-bold text-[#151e22]">{situationLabel(selectedShot.result)}</span>
                                    <span className="text-[8px] text-[#9ca3af] uppercase tracking-wide mt-0.5">Tình huống</span>
                                  </div>
                                  <div className="bg-white py-2 px-1 flex flex-col items-center">
                                    <span className="text-[11px] font-bold text-[#151e22]">{footLabel(selectedShot.foot)}</span>
                                    <span className="text-[8px] text-[#9ca3af] uppercase tracking-wide mt-0.5">Bộ phận cơ thể</span>
                                  </div>
                                  <div className="bg-white py-2 px-1 flex flex-col items-center">
                                    <span className="text-[11px] font-bold" style={{ color: resultColor(selectedShot.result) }}>{resultLabel(selectedShot.result)}</span>
                                    <span className="text-[8px] text-[#9ca3af] uppercase tracking-wide mt-0.5">Kết quả</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 flex items-center justify-center p-6 text-center min-h-[200px]">
                                <div className="text-[#9ca3af]">
                                  <svg className="w-10 h-10 mx-auto mb-2 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
                                  <p className="text-[12px] font-medium">Chọn một cú sút trên sân<br />để xem chi tiết</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {filteredGroups.map((group, gIdx) => (
                    <div key={gIdx} className="bg-white shadow-sm rounded-[6px] overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-[12px] font-bold text-[#6b7173] uppercase tracking-wider">
                        {group.title}
                      </div>
                      <div className="px-4 py-3 flex flex-col gap-4">
                        {group.items.map((stat, sIdx) => {
                          const total = (stat.home + stat.away) || 1;
                          const hPct = (stat.home / total) * 100;
                          const aPct = (stat.away / total) * 100;
                          const homeLeads = stat.home > stat.away;
                          const awayLeads = stat.away > stat.home;
                          const isPossession = stat.suffix === '%';

                          return (
                            <div key={sIdx} className="flex flex-col gap-1">
                              <div className="flex justify-between items-center text-[12px]">
                                <span className={`font-bold ${homeLeads ? 'text-[#2194ff]' : 'text-[#6b7173]'}`}>
                                  {stat.home}{stat.suffix || ''}
                                </span>
                                <span className="text-[#151e22] text-[11px] font-medium">{stat.label}</span>
                                <span className={`font-bold ${awayLeads ? 'text-[#ff495c]' : 'text-[#6b7173]'}`}>
                                  {stat.away}{stat.suffix || ''}
                                </span>
                              </div>
                              <div className="flex h-[6px] rounded-full overflow-hidden gap-[2px]">
                                <div
                                  style={{ width: `${isPossession ? stat.home : hPct}%` }}
                                  className={`rounded-l-full transition-all duration-500 ${homeLeads ? 'bg-[#2194ff]' : 'bg-[#b3d4f5]'}`}
                                ></div>
                                <div
                                  style={{ width: `${isPossession ? stat.away : aPct}%` }}
                                  className={`rounded-r-full transition-all duration-500 ${awayLeads ? 'bg-[#ff495c]' : 'bg-[#f5b3bc]'}`}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {Object.keys(apiStats).length === 0 && (
                    <div className="bg-white p-6 shadow-sm rounded-[6px] text-center text-[#6b7173] text-[13px]">
                      Dữ liệu thống kê chưa có cho trận đấu này.
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* NEWS TAB */}
        {activeTab === 'NEWS' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {loadingSocial ? (
              <div className="bg-white p-4 shadow-sm rounded-[6px] flex flex-col gap-6">
                <Skeleton avatar paragraph={{ rows: 2 }} active />
                <Skeleton avatar paragraph={{ rows: 2 }} active />
                <Skeleton avatar paragraph={{ rows: 2 }} active />
              </div>
            ) : matchNews.length > 0 ? (
              <div className="flex flex-col gap-3">
                {matchNews.map(news => (
                  <div key={news.id} className="bg-white p-3 shadow-sm rounded-[6px] flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="w-[80px] h-[80px] rounded-[4px] overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="text-[13px] font-semibold text-[#151e22] line-clamp-2 leading-snug">{news.title}</div>
                      <div className="text-[11px] text-[#6b7173] line-clamp-1 mt-1">{news.summary}</div>
                      <div className="mt-auto pt-2 flex items-center justify-between text-[10px] text-[#6b7173] font-medium">
                        <span className="text-[var(--365-primary)]">{news.source}</span>
                        <span>{news.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 shadow-sm rounded-[6px] text-center text-[#6b7173] text-[13px]">
                Chưa có tin tức nào về trận đấu này.
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'ANALYTICS' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {loadingAnalytics ? (
              <div className="bg-white p-4 shadow-sm rounded-[6px]">
                <Skeleton active title={false} paragraph={{ rows: 1 }} className="mb-4" />
                <Skeleton active paragraph={{ rows: 6 }} />
              </div>
            ) : analyticsData && typeof analyticsData === 'object' ? (
              <div className="flex flex-col gap-4">
                {/* Premium Value Bet Widget - Standard Ant Design */}
                <div className="bg-white p-4 shadow-sm rounded-[6px] border border-[#f0f0f0]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <img src="/drpig_logo.png" alt="Heo Hồng" className="w-8 h-8" />
                      <span className="text-[14px] font-bold text-[#151e22]">Heo Hồng Phán: Kèo sáng nhất hôm nay</span>
                    </div>
                    {analyticsData.kellyCriterion?.confidenceScore && (
                      <Tag color="magenta" className="m-0 border-0 bg-[#ea4c89]/10 text-[#ea4c89] font-bold px-2 text-[12px]">
                        Tự tin: {analyticsData.kellyCriterion.confidenceScore}%
                      </Tag>
                    )}
                  </div>
                  
                  <div className="bg-[#fafafa] rounded-md p-3 mb-3 border border-[#f0f0f0] text-center">
                    <div className="text-[16px] font-bold text-[#ea4c89] mb-1">
                      {analyticsData.kellyCriterion?.recommendedBet}
                    </div>
                    <div className="text-[12px] font-medium text-[#6b7173]">
                      Vốn khuyên dùng: {analyticsData.kellyCriterion?.stakePercent}% Vốn
                    </div>
                  </div>
                  
                  <div className="text-[13px] text-[#6b7173] leading-relaxed mb-4">
                    <span className="font-semibold text-[#151e22] mr-1">Lý do chọn:</span>
                    {analyticsData.kellyCriterion?.rationale}
                  </div>

                  <Button 
                    type="primary" 
                    block 
                    className="bg-[#ea4c89] border-none font-bold"
                    onClick={() => setActiveTab('ODDS')}
                  >
                    Theo Kèo Này Ngay!
                  </Button>
                </div>

                {/* Value Bets Highlight Card */}
                {analyticsData.valueBets && analyticsData.valueBets.length > 0 && (
                  <div className="bg-[#ea4c89]/5 p-4 shadow-sm rounded-[6px] border border-[#ea4c89]/20">
                    <div className="flex items-center gap-2 mb-3">
                      <BadgePercent size={16} className="text-[#ea4c89]" />
                      <span className="text-[14px] font-bold text-[#ea4c89] uppercase">Gợi ý Cửa Sáng (+EV Value Bets)</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {analyticsData.valueBets.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-[#ea4c89]/20 rounded-[6px]">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-[#151e22]">{item.label}</span>
                            <span className="text-[11px] text-[#6b7173]">Tỉ lệ cược: {item.odds}</span>
                          </div>
                          <Tag color="magenta" className="m-0 border-0 bg-[#ea4c89] text-white font-bold shadow-sm">
                            🔥 +{(item.ev * 100).toFixed(1)}% EV
                          </Tag>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tactical Review & Expected Goals */}
                <div className="bg-white p-4 shadow-sm rounded-[6px] border border-[#f0f0f0]">
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu size={16} className="text-[#151e22]" />
                    <span className="text-[14px] font-bold text-[#151e22]">Phân tích Chiến thuật (xG)</span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-[12px] font-semibold mb-1">
                      <span className="text-[#151e22]">{home.name}: {analyticsData.homeXG?.toFixed(2)} xG</span>
                      <span className="text-[#151e22]">{away.name}: {analyticsData.awayXG?.toFixed(2)} xG</span>
                    </div>
                    <Progress 
                      percent={(analyticsData.homeXG / ((analyticsData.homeXG + analyticsData.awayXG) || 1)) * 100} 
                      showInfo={false} 
                      strokeColor="#ea4c89" 
                      trailColor="#3b82f6" 
                      size="small"
                      className="m-0"
                    />
                    <p className="text-[11px] text-[#6b7173] mt-2 italic">
                      {analyticsData.xgTimeline}
                    </p>
                  </div>

                  <div className="text-[13px] text-[#6b7173] leading-relaxed border-t border-[#f0f0f0] pt-3">
                    {analyticsData.tacticalReview}
                  </div>
                </div>

                {/* BTTS & Clean Sheet Percentages Grid */}
                {(analyticsData.btts !== undefined) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 shadow-sm rounded-[6px] border border-[#f0f0f0] text-center">
                      <div className="text-[11px] font-bold text-[#6b7173] uppercase mb-1">Cả hai đội ghi bàn</div>
                      <div className="text-[18px] font-black text-[#ea4c89] mb-1">{analyticsData.btts}%</div>
                      <Progress percent={analyticsData.btts} showInfo={false} strokeColor="#ea4c89" size="small" className="m-0" />
                    </div>
                    <div className="bg-white p-3 shadow-sm rounded-[6px] border border-[#f0f0f0] text-center">
                      <div className="text-[11px] font-bold text-[#6b7173] uppercase mb-1">Sạch lưới ({home.short || 'Nhà'})</div>
                      <div className="text-[18px] font-black text-[#3b82f6] mb-1">{analyticsData.homeCleanSheet}%</div>
                      <Progress percent={analyticsData.homeCleanSheet} showInfo={false} strokeColor="#3b82f6" size="small" className="m-0" />
                    </div>
                    <div className="bg-white p-3 shadow-sm rounded-[6px] border border-[#f0f0f0] text-center">
                      <div className="text-[11px] font-bold text-[#6b7173] uppercase mb-1">Sạch lưới ({away.short || 'Khách'})</div>
                      <div className="text-[18px] font-black text-[#8b5cf6] mb-1">{analyticsData.awayCleanSheet}%</div>
                      <Progress percent={analyticsData.awayCleanSheet} showInfo={false} strokeColor="#8b5cf6" size="small" className="m-0" />
                    </div>
                  </div>
                )}

                {/* Expected Scorelines */}
                {analyticsData.topScorelines && (
                  <div className="bg-white p-4 shadow-sm rounded-[6px] border border-[#f0f0f0]">
                    <div className="flex items-center gap-2 mb-3">
                      <Target size={16} className="text-[#151e22]" />
                      <span className="text-[14px] font-bold text-[#151e22]">Top 3 tỷ số khả dĩ nhất</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {analyticsData.topScorelines.map((item, idx) => (
                        <div key={idx} className={`p-2 rounded-md border text-center ${idx === 0 ? 'bg-[#ea4c89]/5 border-[#ea4c89]/30 text-[#ea4c89]' : 'bg-[#fafafa] border-[#f0f0f0] text-[#6b7173]'}`}>
                          <div className="text-[16px] font-black">{item.score}</div>
                          <div className="text-[11px] font-semibold">{item.percent}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score Probability Heatmap Grid */}
                {analyticsData.heatmapGrid && (
                  <div className="bg-white p-4 shadow-sm rounded-[6px] border border-[#f0f0f0]">
                    <div className="flex items-center gap-2 mb-3">
                      <Grid size={16} className="text-[#151e22]" />
                      <span className="text-[14px] font-bold text-[#151e22]">Bản đồ nhiệt xác suất tỷ số (Poisson)</span>
                    </div>
                    <div className="overflow-x-auto min-w-[280px]">
                      <div className="grid grid-cols-6 gap-1 text-center font-bold text-[10px]">
                        <div className="p-1 flex items-center justify-center border border-[#f0f0f0] bg-[#fafafa] text-[#6b7173] rounded-sm">Nhà \ Khách</div>
                        {[0,1,2,3,4].map(n => <div key={`col-${n}`} className="p-1 bg-[#fafafa] text-[#6b7173] rounded-sm flex items-center justify-center border border-[#f0f0f0]">{n}</div>)}
                        
                        {analyticsData.heatmapGrid.map((row, h) => (
                          <div key={`h-row-${h}`} className="contents">
                            <div className="p-1 bg-[#fafafa] text-[#6b7173] rounded-sm flex items-center justify-center border border-[#f0f0f0]">{h}</div>
                            {row.map((cell, a) => {
                              const prob = cell.probability;
                              const opacity = Math.min(0.85, prob / 10);
                              return (
                                <div 
                                  key={`c-${h}-${a}`} 
                                  style={{ 
                                    backgroundColor: prob > 0.5 ? `rgba(234, 76, 137, ${opacity})` : '#fafafa',
                                    color: prob > 3 ? '#ffffff' : '#6b7173'
                                  }}
                                  className={`p-1.5 rounded-sm border border-[#f0f0f0] flex flex-col justify-center items-center ${prob > 3 ? 'font-bold shadow-sm' : 'font-medium'}`}
                                >
                                  <span className="text-[11px] leading-none mb-1">{cell.scoreText}</span>
                                  <span className="text-[9px] opacity-80 leading-none">{prob}%</span>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Matchups & H2H */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 shadow-sm rounded-[6px] border border-[#f0f0f0]">
                    <div className="flex items-center gap-2 mb-3">
                      <Swords size={16} className="text-[#151e22]" />
                      <span className="text-[14px] font-bold text-[#151e22]">Đối đầu then chốt</span>
                    </div>
                    <div className="text-[13px] text-[#6b7173] leading-relaxed">
                      {analyticsData.keyPlayerMatchups}
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 shadow-sm rounded-[6px] border border-[#f0f0f0]">
                    <div className="flex items-center gap-2 mb-3">
                      <History size={16} className="text-[#151e22]" />
                      <span className="text-[14px] font-bold text-[#151e22]">Lịch sử chạm trán</span>
                    </div>
                    <div className="text-[13px] text-[#6b7173] leading-relaxed">
                      {analyticsData.headToHead}
                    </div>
                  </div>
                </div>
                
                {/* Explainability (SHAP) */}
                <div className="bg-white p-4 shadow-sm rounded-[6px] border border-[#f0f0f0]">
                  <div className="flex items-center gap-2 mb-4">
                    <PieChart size={16} className="text-[#151e22]" />
                    <span className="text-[14px] font-bold text-[#151e22]">Mức độ ảnh hưởng (AI SHAP)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    {analyticsData.shapExplainability?.map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between text-[12px] font-semibold text-[#151e22]">
                          <span>{item.factor}</span>
                          <span>{item.weight}%</span>
                        </div>
                        <Progress 
                          percent={item.weight} 
                          showInfo={false} 
                          strokeColor="#ea4c89"
                          size="small"
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white p-4 shadow-sm rounded-[6px] text-center text-[12px] text-[#6b7173] py-8 border border-gray-100">
                Hệ thống AI đang tổng hợp dữ liệu, vui lòng thử lại sau.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
