import React, { useState } from 'react';
import { Trophy, Star, Search, ChevronDown, Flag, Map } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar365() {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  const searchParams = new URLSearchParams(location.search);
  const currentLeague = searchParams.get('league') || '732';

  const pinnedLeagues = [
    { id: '732', name: 'World Cup 2026', icon: <img src="https://media.api-sports.io/football/leagues/15.png" alt="World Cup" className="w-[18px] h-[18px] object-contain drop-shadow-sm" /> },
    { id: '8', name: 'Ngoại hạng Anh', icon: <img src="https://media.api-sports.io/football/leagues/39.png" alt="Premier League" className="w-[18px] h-[18px] object-contain drop-shadow-sm" /> },
    { id: '564', name: 'LaLiga', icon: <img src="https://media.api-sports.io/football/leagues/140.png" alt="LaLiga" className="w-[18px] h-[18px] object-contain drop-shadow-sm" /> },
    { id: '384', name: 'Serie A', icon: <img src="https://media.api-sports.io/football/leagues/135.png" alt="Serie A" className="w-[18px] h-[18px] object-contain drop-shadow-sm" /> }
  ];

  const myTeams = [
    { id: 't1', name: 'Việt Nam', flag: 'vn' },
    { id: 't2', name: 'Argentina', flag: 'ar' },
    { id: 't3', name: 'Pháp', flag: 'fr' }
  ];

  return (
    <div className="w-[240px] flex-none hidden xl:flex flex-col gap-4 sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto no-scrollbar pb-6">
      
      {/* Pinned Leagues */}
      <div className="bg-white rounded-[8px]  overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="px-4 py-3 border-b border-[#f0f0f0]">
          <h3 className="font-semibold text-[14px] text-[var(--365-text-main)] uppercase">Giải đấu của tôi</h3>
        </div>
        <div className="py-2">
          {pinnedLeagues.map(league => {
            const isActive = currentLeague === league.id;
            
            return (
              <div 
                key={league.id} 
                className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-[#f5f5f5] transition-colors ${isActive ? 'bg-[#fff0f5]' : ''}`}
                style={isActive ? { borderRight: '3px solid', borderImage: 'linear-gradient(to bottom, rgb(234, 76, 137), rgb(255, 140, 66)) 1 100%' } : {}}
                onClick={() => navigate(`/matches?league=${league.id}`)}
              >
                <div 
                  className={`w-[24px] h-[24px] rounded-full flex items-center justify-center ${isActive ? 'text-white' : 'bg-gray-100 text-gray-500'}`}
                  style={isActive ? { backgroundImage: 'linear-gradient(to right, rgb(234, 76, 137), rgb(255, 140, 66))' } : {}}
                >
                  {league.icon}
                </div>
                <span className={`text-[13px] ${isActive ? 'font-bold' : 'font-medium text-[var(--365-text-sub)] hover:text-[var(--365-text-main)]'}`}
                      style={isActive ? { 
                        backgroundImage: 'linear-gradient(to right, rgb(234, 76, 137), rgb(255, 140, 66))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      } : {}}
                >
                  {league.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Teams */}
      <div className="bg-white rounded-[8px]  overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div 
          className="px-4 py-3 border-b border-[#f0f0f0] flex justify-between items-center cursor-pointer hover:bg-gray-50"
          onClick={() => setExpanded(!expanded)}
        >
          <h3 className="font-semibold text-[14px] text-[var(--365-text-main)] uppercase">Đội bóng của tôi</h3>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
        
        {expanded && (
          <div className="py-2">
            {myTeams.map(team => (
              <div 
                key={team.id} 
                className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-[#f5f5f5] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <img src={`https://flagcdn.com/w40/${team.flag}.png`} alt={team.name} className="w-[24px] h-[24px] object-cover rounded-full " />
                  <span className="text-[13px] font-medium text-[var(--365-text-main)]">{team.name}</span>
                </div>
                <Star size={14} className="text-gray-300 group-hover:text-[#ffb800] fill-transparent group-hover:fill-[#ffb800] transition-colors" />
              </div>
            ))}
            <div className="px-4 py-3 text-center">
              <button className="text-[13px] font-semibold text-[var(--365-primary)] hover:underline flex items-center justify-center gap-1 w-full">
                <Search size={14} /> Thêm đội bóng
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
