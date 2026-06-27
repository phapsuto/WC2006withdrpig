import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton, Tabs } from 'antd';
import { ArrowLeft, Calendar, CheckCircle, Clock, Minus } from 'lucide-react';
import { backendClient } from '../services/backendClient';
import { convertToUserTimezone } from '../services/worldcup26api';

// Status badge
function MatchStatusBadge({ status, minute }) {
  if (status === 'LIVE') {
    return (
      <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
        {minute ? `${minute}'` : 'Live'}
      </span>
    );
  }
  if (status === 'FINISHED') {
    return <span className="text-[11px] font-bold text-[#6b7173] uppercase">FT</span>;
  }
  return <span className="text-[11px] font-semibold text-[#6b7173]">Sắp đá</span>;
}

// Result badge from team's perspective
function ResultBadge({ result }) {
  if (result === 'W') return <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">T</span>;
  if (result === 'D') return <span className="w-5 h-5 rounded-full bg-gray-300 text-gray-700 text-[10px] font-black flex items-center justify-center">H</span>;
  if (result === 'L') return <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">B</span>;
  return null;
}

// Single fixture row
function FixtureRow({ fixture, teamId, onClick }) {
  const isHome = fixture.isHome;
  const opponent = isHome ? fixture.away : fixture.home;
  const teamScore = isHome ? fixture.homeScore : fixture.awayScore;
  const oppScore = isHome ? fixture.awayScore : fixture.homeScore;
  const isFinished = fixture.status === 'FINISHED';
  const isLive = fixture.status === 'LIVE';
  const isUpcoming = fixture.status === 'UPCOMING';
  
  const dateObj = fixture.date ? convertToUserTimezone(fixture.date, fixture.stadiumId) : new Date();
  const dateStr = dateObj.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  
  // Determine W/D/L from team's perspective
  let result = null;
  if (isFinished) {
    if (teamScore > oppScore) result = 'W';
    else if (teamScore === oppScore) result = 'D';
    else result = 'L';
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-[#f5f5f5] last:border-0 ${isLive ? 'bg-red-50/30' : ''}`}
      onClick={() => onClick && onClick(fixture)}
    >
      {/* Date column */}
      <div className="flex flex-col items-center w-10 flex-shrink-0">
        <span className="text-[11px] font-bold text-[#151e22]">{dateStr}</span>
        {isUpcoming && <span className="text-[10px] text-[#6b7173]">{timeStr}</span>}
        {isFinished && result && <ResultBadge result={result} />}
        {isLive && <MatchStatusBadge status="LIVE" minute={fixture.minute} />}
      </div>

      {/* Home/Away indicator */}
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${isHome ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
        {isHome ? 'Sân nhà' : 'Sân khách'}
      </span>

      {/* Opponent logo + name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {opponent.flag ? (
          <img
            src={`https://flagcdn.com/w40/${opponent.flag}.png`}
            alt={opponent.name}
            className="w-[20px] h-[14px] object-cover rounded-[2px] flex-shrink-0"
          />
        ) : null}
        <span className="text-[13px] font-semibold text-[#151e22] truncate">{opponent.name}</span>
      </div>

      {/* Score or time */}
      <div className="flex-shrink-0 text-right">
        {isFinished || isLive ? (
          <div className={`flex items-center gap-1 text-[14px] font-black ${isLive ? 'text-red-500' : 'text-[#151e22]'}`}>
            <span className={teamScore > oppScore ? 'text-[#10b981]' : teamScore < oppScore ? 'text-red-500' : 'text-[#151e22]'}>
              {teamScore}
            </span>
            <span className="text-[#6b7173] font-normal text-[12px]">-</span>
            <span className={oppScore > teamScore ? 'text-[#10b981]' : oppScore < teamScore ? 'text-red-500' : 'text-[#151e22]'}>
              {oppScore}
            </span>
          </div>
        ) : (
          <span className="text-[12px] font-bold text-[#2194ff]">{timeStr}</span>
        )}
      </div>
    </div>
  );
}

// Skeleton for loading
const PageSkeleton = () => (
  <div className="flex flex-col gap-4 w-full max-w-[800px] mx-auto pb-20">
    <div className="flex items-center gap-4 p-6 bg-white rounded-[8px] border border-[#f0f0f0]">
      <Skeleton.Avatar active size={80} />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton.Input active size="large" className="w-64" />
        <Skeleton.Input active size="small" className="w-32" />
      </div>
    </div>
    <div className="flex gap-2">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="flex-1 bg-white border border-[#f0f0f0] rounded-[6px] p-4 flex flex-col items-center gap-2">
          <Skeleton.Button active size="small" className="w-8 h-5" />
          <Skeleton.Button active size="small" className="w-12 h-4" />
        </div>
      ))}
    </div>
    <div className="bg-white rounded-[8px] border border-[#f0f0f0] p-4">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="flex items-center gap-3 py-3 border-b border-[#f5f5f5]">
          <Skeleton.Button active size="small" className="w-12" />
          <Skeleton.Avatar active size="small" />
          <Skeleton.Input active size="small" className="flex-1" />
          <Skeleton.Button active size="small" className="w-16" />
        </div>
      ))}
    </div>
  </div>
);

export default function TeamDetail({ onSelectMatch }) {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const handleSelectMatch = (fixture) => {
    if (onSelectMatch) {
      onSelectMatch(fixture.id || fixture.fixtureId);
    }
    navigate('/matches');
  };

  useEffect(() => {
    if (!teamId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await backendClient.getTeamFixtures(teamId, 732); // Hardcoded WC2026 for now
        if (data.success) {
          setTeamData(data.team);
          setFixtures(data.fixtures || []);
        } else {
          setError(data.error || 'Không thể tải dữ liệu đội');
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId]);

  if (loading) return <PageSkeleton />;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-[15px] text-red-500 font-bold mb-2">Đã xảy ra lỗi</p>
      <p className="text-[13px] text-[#6b7173] mb-4">{error}</p>
      <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-100 rounded-[6px] text-[13px] font-semibold hover:bg-gray-200">
        Quay lại
      </button>
    </div>
  );
  if (!teamData) return null;

  const team = teamData;
  const pastFixtures = fixtures.filter(f => f.status === 'FINISHED').reverse(); // Most recent first
  const upcomingFixtures = fixtures.filter(f => f.status === 'UPCOMING' || f.status === 'LIVE');
  const allFixtures = [...upcomingFixtures, ...pastFixtures.slice().reverse()].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const displayUpcoming = upcomingFixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
  const displayPast = pastFixtures;

  // Calculate stats
  const played = fixtures.filter(f => f.status === 'FINISHED').length;
  let won = 0, draw = 0, lost = 0, gf = 0, ga = 0;
  fixtures.filter(f => f.status === 'FINISHED').forEach(f => {
    const isHome = f.isHome;
    const ts = isHome ? f.homeScore : f.awayScore;
    const os = isHome ? f.awayScore : f.homeScore;
    gf += ts; ga += os;
    if (ts > os) won++;
    else if (ts === os) draw++;
    else lost++;
  });
  const pts = won * 3 + draw;

  const statItems = [
    { label: 'Trận', value: played, color: '#151e22' },
    { label: 'Thắng', value: won, color: '#10b981' },
    { label: 'Hòa', value: draw, color: '#6b7173' },
    { label: 'Thua', value: lost, color: '#ef4444' },
    { label: 'Bàn T-B', value: `${gf}-${ga}`, color: '#6b7173' },
    { label: 'Điểm', value: pts, color: '#2194ff' },
  ];

  const tabItems = [
    {
      key: 'upcoming',
      label: (
        <span className="flex items-center gap-1.5 font-semibold px-2">
          <Clock size={14} />
          Sắp tới
          {displayUpcoming.length > 0 && (
            <span className="bg-[#2194ff] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {displayUpcoming.length}
            </span>
          )}
        </span>
      ),
      children: displayUpcoming.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-gray-50 rounded-[8px] m-4">
          <Calendar size={36} className="text-gray-300" />
          <p className="text-[14px] text-[#6b7173] font-medium">Không có lịch thi đấu sắp tới</p>
        </div>
      ) : (
        <div className="flex flex-col bg-white">
          {displayUpcoming.map(f => (
            <FixtureRow key={f.id} fixture={f} teamId={team.id} onClick={handleSelectMatch} />
          ))}
        </div>
      ),
    },
    {
      key: 'recent',
      label: (
        <span className="flex items-center gap-1.5 font-semibold px-2">
          <CheckCircle size={14} />
          Đã đá
        </span>
      ),
      children: displayPast.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-gray-50 rounded-[8px] m-4">
          <CheckCircle size={36} className="text-gray-300" />
          <p className="text-[14px] text-[#6b7173] font-medium">Chưa có trận đấu nào kết thúc</p>
        </div>
      ) : (
        <div className="flex flex-col bg-white">
          {displayPast.map(f => (
            <FixtureRow key={f.id} fixture={f} teamId={team.id} onClick={handleSelectMatch} />
          ))}
        </div>
      ),
    },
    {
      key: 'all',
      label: <span className="flex items-center gap-1.5 font-semibold px-2"><Minus size={14} />Tất cả</span>,
      children: (
        <div className="flex flex-col bg-white">
          {fixtures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-gray-50 rounded-[8px] m-4">
              <Calendar size={36} className="text-gray-300" />
              <p className="text-[14px] text-[#6b7173] font-medium">Chưa có dữ liệu trận đấu</p>
            </div>
          ) : (
            [...displayUpcoming, ...displayPast].map(f => (
              <FixtureRow key={f.id} fixture={f} teamId={team.id} onClick={handleSelectMatch} />
            ))
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-[800px] mx-auto flex flex-col gap-4 pb-20 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center gap-3 bg-white rounded-[8px] p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#f0f0f0] sticky top-[70px] z-10">
        <button 
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-600"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="font-bold text-[14px] text-[#151e22]">Chi tiết đội bóng</span>
      </div>

      {/* Team hero card */}
      <div
        className="rounded-[12px] overflow-hidden shadow-sm"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}
      >
        <div className="flex items-center gap-5 px-6 py-8">
          {/* Logo */}
          <div className="flex-shrink-0 bg-white/5 p-3 rounded-[12px] backdrop-blur-sm border border-white/10">
            {team.logo ? (
              <img
                src={team.logo}
                alt={team.name}
                className="w-[80px] h-[80px] object-contain drop-shadow-xl"
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = `https://flagcdn.com/w80/${team.flag || 'xx'}.png`;
                }}
              />
            ) : (
              <img
                src={`https://flagcdn.com/w80/${team.flag || 'xx'}.png`}
                alt={team.name}
                className="w-[80px] h-[56px] object-cover rounded-[6px] shadow-xl"
              />
            )}
          </div>
          {/* Name */}
          <div className="flex flex-col gap-1">
            <h2 className="text-[28px] font-black text-white leading-tight">{team.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <img
                src={`https://flagcdn.com/w40/${team.flag || 'xx'}.png`}
                alt=""
                className="w-[20px] h-[14px] object-cover rounded-[2px]"
              />
              <span className="text-[14px] text-white/70 font-semibold tracking-wider">{team.short}</span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 md:grid-cols-6 border-t border-white/10 bg-black/20">
          {statItems.map((stat, i) => (
            <div key={i} className={`flex flex-col items-center py-3 md:py-4 border-white/10
              ${i === 2 ? 'md:border-r' : i === 5 ? '' : 'border-r'}
              ${i > 2 ? 'border-t md:border-t-0' : ''}
            `}>
              <span className="text-[18px] md:text-[20px] font-black" style={{ color: stat.color === '#151e22' ? 'white' : stat.color }}>
                {stat.value}
              </span>
              <span className="text-[9px] md:text-[10px] text-white/50 font-bold uppercase tracking-wide mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fixtures tabs */}
      <div className="bg-white rounded-[12px] overflow-hidden border border-[#f0f0f0] shadow-sm">
        <div className="px-5 py-4 border-b border-[#f0f0f0] bg-gray-50 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[#151e22] flex items-center gap-2">
            <Calendar size={18} className="text-[#2194ff]" /> Lịch thi đấu & Kết quả
          </h3>
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          className="custom-team-tabs"
          tabBarStyle={{
            paddingLeft: 20,
            paddingRight: 20,
            marginBottom: 0,
            borderBottom: '1px solid #f0f0f0',
          }}
        />
      </div>
    </div>
  );
}
