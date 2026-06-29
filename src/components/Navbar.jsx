import { useLanguage } from '../utils/LanguageContext';
import { Search, Menu, X, Settings, Sparkles, User, Calendar, Trophy, Newspaper } from 'lucide-react';
import { Avatar, Drawer, Modal, Input, Menu as AntMenu, Divider, Button } from 'antd';
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { backendClient } from '../services/backendClient';

export default function Navbar({ user, onGoogleLoginClick, toggleTheme }) {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ teams: [], matches: [], news: [] });
  const [isSearching, setIsSearching] = useState(false);
  
  // Normalize path for matching
  const activePage = location.pathname === '/' ? '/matches' : location.pathname;

  // Debounced search
  useEffect(() => {
    if (!isSearchModalOpen) {
      setSearchQuery('');
      setSearchResults({ teams: [], matches: [], news: [] });
      return;
    }

    if (searchQuery.length < 2) {
      setSearchResults({ teams: [], matches: [], news: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await backendClient.globalSearch(searchQuery);
        if (data.success) {
          setSearchResults({
            teams: data.teams || [],
            matches: data.matches || [],
            news: data.news || []
          });
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isSearchModalOpen]);

  const handleSearchResultClick = (type, item) => {
    setIsSearchModalOpen(false);
    if (type === 'team') navigate(`/team/${item.id}`);
    else if (type === 'match') navigate(`/match/${item.id}`);
    else if (type === 'news') navigate(`/news/${item.slug || item.id}`);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { key: '/matches', label: t('navMatches') || 'Trận đấu', icon: Calendar },
    { key: '/standings', label: t('navStandings') || 'Bảng xếp hạng', icon: Trophy },
    { key: '/news', label: t('navNews') || 'Tin tức', icon: Newspaper }
  ];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full px-4 pt-6 pointer-events-none">
        <nav className={`pointer-events-auto w-full max-w-6xl transition-all duration-500 rounded-full flex items-center justify-between px-6 
          ${scrolled
            ? 'h-[60px] bg-white backdrop-blur-xl shadow-[0_8px_32px_rgba(234,76,137,0.08)] border border-white/50 translate-y-0'
            : 'h-[72px] bg-white backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.01)] border border-gray-100 translate-y-2'}`}
        >
          {/* Left: Logo */}
          <div className="flex items-center h-full">
            <div
              className="flex items-center cursor-pointer mr-2 lg:mr-6 group relative"
              onClick={() => navigate('/matches')}
            >
              {/* Con heo bự tràn khung (Out of bounds) bằng margin âm */}
              <div className="relative flex items-center justify-center">

                <img
                  src="/drpig_logo.png"
                  alt="Heo Hồng Mascot"
                  className="h-[80px] w-auto max-w-none object-contain z-20 -mb-2 scale-110 -translate-y-2 drop-shadow-2xl"
                />
              </div>

              <div className="flex flex-col justify-center ml-2 leading-[1.1] truncate">
                <span className="text-[16px] sm:text-[22px] font-black text-[#ea4c89] pb-0.5 tracking-tight truncate">
                  Worldcup 2026
                </span>
                <span className="text-[11px] sm:text-[14px] font-bold text-[#ff8c42] mt-[-2px] truncate">
                  cùng Heo Hồng
                </span>
              </div>
            </div>

            {/* Desktop Nav Items */}
            <div className="hidden lg:flex items-center h-full gap-2 ml-4">
              {menuItems.map(item => (
                <div
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  className={`relative flex items-center h-[40px] px-4 rounded-full cursor-pointer font-medium text-[15px] transition-all duration-300 overflow-hidden group ${activePage === item.key
                    ? 'shadow-md'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
                    }`}
                  style={{ color: activePage === item.key ? 'white' : undefined }}
                >
                  {activePage === item.key && (
                    <div className="absolute inset-0 opacity-100" style={{ background: 'linear-gradient(to right, #ea4c89, #ff8c42)' }}></div>
                  )}
                  <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Search, Auth */}
          <div className="flex items-center gap-3 lg:gap-4">
            <div
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 cursor-pointer text-gray-600 transition-colors"
              onClick={() => setIsSearchModalOpen(true)}
            >
              <Search size={20} />
            </div>

            {!user ? (
              <div
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer text-gray-600 transition-colors"
                onClick={onGoogleLoginClick}
              >
                <User size={20} />
              </div>
            ) : (
              <div
                className="hidden md:flex items-center gap-2 cursor-pointer bg-white border border-gray-100 shadow-sm hover:shadow-md p-1 pr-4 rounded-full transition-all"
                onClick={() => navigate('/profile')}
              >
                <Avatar 
                  size={32} 
                  src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:5001').replace('/api/v1', '')}${user.avatar}`) : null}
                  className="shadow-inner font-medium border-2 border-white text-white" 
                  style={{ background: 'linear-gradient(to top right, #ea4c89, #ff8c42)' }}
                >
                  {!user.avatar && (user.initials || user.name.charAt(0))}
                </Avatar>
                <span className="font-medium text-[15px] text-gray-700 whitespace-nowrap">
                  {user.name.split(' ').pop()}
                </span>
              </div>
            )}

            <div
              className="w-10 h-10 min-w-[40px] rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center lg:hidden cursor-pointer hover:bg-gray-50 text-gray-600"
              onClick={() => setIsSearchModalOpen(true)}
            >
              <Search size={20} />
            </div>

            <div
              className="w-10 h-10 min-w-[40px] rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center lg:hidden cursor-pointer hover:bg-gray-50 text-gray-600"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </div>
          </div>
        </nav>
      </div>

      {/* Search Modal */}
      <Modal
        title={<span className="font-bold text-[18px]">Tìm Kiếm Nhanh</span>}
        open={isSearchModalOpen}
        onCancel={() => setIsSearchModalOpen(false)}
        footer={null}
        width={500}
        style={{ top: 80 }}
      >
        <div className="py-4">
          <Input
            size="large"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<Search size={18} className="text-gray-400 mr-2" />}
            placeholder="Tìm kiếm trận đấu, đội bóng, tin tức..."
            className="rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500/20 shadow-sm h-12 text-[15px]"
            autoFocus
            allowClear
          />
          
          <div className="mt-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {!searchQuery && (
              <div>
                <p className="text-sm text-gray-500 font-medium mb-3">Gợi ý tìm kiếm</p>
                <div className="flex flex-wrap gap-2">
                  {['Việt Nam', 'Bồ Đào Nha', 'Argentina', 'Cúp vàng'].map((tag, i) => (
                    <span 
                      key={i} 
                      onClick={() => setSearchQuery(tag)}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-pink-50 text-gray-600 hover:text-pink-600 rounded-full text-[13px] cursor-pointer transition-colors border border-gray-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {isSearching && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {!isSearching && searchQuery.length >= 2 && 
             searchResults.teams.length === 0 && 
             searchResults.matches.length === 0 && 
             searchResults.news.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy kết quả nào cho "{searchQuery}"
              </div>
            )}

            {!isSearching && (
              <div className="flex flex-col gap-4">
                {/* Teams */}
                {searchResults.teams.length > 0 && (
                  <div>
                    <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-pink-500"/> Đội bóng
                    </h3>
                    <div className="flex flex-col gap-1">
                      {searchResults.teams.map(team => (
                        <div 
                          key={team.id} 
                          onClick={() => handleSearchResultClick('team', team)}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <img src={team.logo} alt={team.name} className="w-8 h-8 object-contain" />
                          <span className="font-semibold text-gray-800">{team.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matches */}
                {searchResults.matches.length > 0 && (
                  <div>
                    <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5 mt-2">
                      <Calendar size={14} className="text-pink-500"/> Trận đấu
                    </h3>
                    <div className="flex flex-col gap-1">
                      {searchResults.matches.map(match => (
                        <div 
                          key={match.id} 
                          onClick={() => handleSearchResultClick('match', match)}
                          className="flex flex-col p-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-100"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] font-medium text-gray-400">{match.time}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${match.status === 'LIVE' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                              {match.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-[13px]">{match.home.name}</span>
                            <span className="text-[11px] text-gray-400 font-bold mx-2">VS</span>
                            <span className="font-semibold text-[13px]">{match.away.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* News */}
                {searchResults.news.length > 0 && (
                  <div>
                    <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5 mt-2">
                      <Newspaper size={14} className="text-pink-500"/> Tin tức
                    </h3>
                    <div className="flex flex-col gap-1">
                      {searchResults.news.map(news => (
                        <div 
                          key={news.id || news._id} 
                          onClick={() => handleSearchResultClick('news', news)}
                          className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        >
                          {news.image && (
                            <img src={news.image} alt="" className="w-16 h-12 object-cover rounded flex-shrink-0" />
                          )}
                          <div className="flex flex-col justify-center min-w-0">
                            <span className="font-medium text-[13px] text-gray-800 line-clamp-2 leading-snug">{news.titleVi || news.title}</span>
                            <span className="text-[10px] text-gray-400 mt-1">{news.source}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Mobile Drawer */}
      <Drawer
        placement="right"
        width="100%"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        title={
          <div className="flex items-center gap-2">
            <img src="/drpig_logo.png" alt="Heo Hồng Mascot" className="h-8 w-auto object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="text-[16px] font-black text-[#ea4c89]">Worldcup 2026</span>
              <span className="text-[11px] font-bold text-[#ff8c42]">cùng Heo Hồng</span>
            </div>
          </div>
        }
        styles={{ body: { padding: 0 } }}
      >
        <AntMenu
          mode="inline"
          selectedKeys={[activePage]}
          style={{ borderRight: 'none', padding: '16px 8px' }}
          items={menuItems.map(item => ({
            key: item.key,
            icon: <item.icon size={18} />,
            label: <span className="font-semibold">{item.label}</span>,
          }))}
          onClick={({ key }) => {
            navigate(key);
            setMobileMenuOpen(false);
          }}
        />

        <Divider style={{ margin: 0 }} />

        <div className="p-4">
          {!user ? (
            <Button 
              type="primary" 
              size="large" 
              block 
              icon={<User size={18} />}
              style={{ background: '#ea4c89', fontWeight: 'bold', borderRadius: '8px' }}
              onClick={() => {
                onGoogleLoginClick();
                setMobileMenuOpen(false);
              }}
            >
              Đăng nhập / Đăng ký
            </Button>
          ) : (
            <div
              className="py-3 px-4 rounded-xl cursor-pointer flex items-center gap-3 hover:bg-gray-50 transition-all border border-gray-100"
              onClick={() => {
                navigate('/profile');
                setMobileMenuOpen(false);
              }}
            >
              <Avatar 
                size={36} 
                src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:5001').replace('/api/v1', '')}${user.avatar}`) : null}
                className="text-white font-bold text-[14px]" 
                style={{ background: 'linear-gradient(to top right, #ea4c89, #ff8c42)' }}
              >
                {!user.avatar && (user.initials || user.name.charAt(0))}
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-semibold text-gray-800 leading-tight">Hồ sơ của tôi</span>
                <span className="text-[12px] text-gray-500 mt-0.5 truncate">{user.name}</span>
              </div>
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
}
