import { useState } from 'react';
import { Wallet, Star, Trophy, History, RefreshCw, LogOut, Heart, ArrowRight } from 'lucide-react';
import { TEAM_NAME_VI, ISO2_TO_FLAG } from '../services/worldcup26api';
import { TEAMS } from '../services/simulator';

export default function Profile({ user, onLogout, onResetBalance, onSelectMatch, matches, onToggleFavoriteTeam }) {
  const [activeSubTab, setActiveSubTab] = useState('WALLET'); // WALLET, BOOKMARKS, FAVORITES, HISTORY

  if (!user) {
    return (
      <div className="bento-glass p-8 text-center flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
        <Trophy size={48} className="text-primary animate-bounce" />
        <h3 className="text-lg font-black text-on-background">Hồ sơ Cá nhân & Ví ảo</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Đăng nhập bằng tài khoản Google để kích hoạt tính năng lưu trận đấu yêu thích, chọn đội tuyển cưng, và chơi cược vui mô phỏng!
        </p>
      </div>
    );
  }

  // Calculate stats from bet history
  const totalBets = user.betHistory ? user.betHistory.length : 0;
  const wonBets = user.betHistory ? user.betHistory.filter(b => b.status === 'WON').length : 0;
  const lostBets = user.betHistory ? user.betHistory.filter(b => b.status === 'LOST').length : 0;
  const winRate = totalBets > 0 ? ((wonBets / (wonBets + lostBets || 1)) * 100).toFixed(1) : '0.0';

  const formatXu = (value) => {
    return `${Math.round(value || 0).toLocaleString('vi-VN')} xu Heo Vàng 🐷`;
  };

  // Filter bookmarked matches
  const bookmarkedMatches = matches.filter(m => user.bookmarks && user.bookmarks.includes(m.id));

  // Get list of all available teams for Favorite Team selection
  const allTeamsList = Object.values(TEAMS);

  return (
    <div className="bento-glass p-6 space-y-6">
      {/* Profile Header */}
      <div className="flex justify-between items-center pb-4 border-b border-white/40">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-lg font-black shadow border-2 border-white">
            {user.initials || user.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-base font-black text-on-surface leading-tight">{user.name}</h3>
            <span className="text-xs text-on-surface-variant/80">{user.email}</span>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary/10 border border-secondary/15 text-secondary text-xs font-bold hover:bg-secondary/20 active:scale-95 transition-all"
        >
          <LogOut size={12} /> Đăng xuất
        </button>
      </div>

      {/* Sub Tabs Segmented Control */}
      <div className="flex gap-1.5 p-1.5 bg-white/40 border border-white/50 rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { key: 'WALLET', icon: <Wallet size={12} />, label: 'Ví cược vui' },
          { key: 'BOOKMARKS', icon: <Star size={12} />, label: 'Theo dõi' },
          { key: 'FAVORITES', icon: <Heart size={12} />, label: 'Đội cưng' },
          { key: 'HISTORY', icon: <History size={12} />, label: 'Lịch sử cược' }
        ].map(tab => (
          <button 
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all border border-transparent whitespace-nowrap ${
              activeSubTab === tab.key 
                ? 'bg-white text-primary shadow-sm border-white/60' 
                : 'text-on-surface-variant hover:text-primary hover:bg-white/20'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="text-xs text-on-surface">
        {/* WALLET TAB */}
        {activeSubTab === 'WALLET' && (
          <div className="space-y-4">
            <div className="p-5 bg-gradient-to-br from-primary/10 to-secondary/5 border border-white/65 rounded-2xl text-center space-y-2">
              <span className="text-[10px] font-black text-on-surface-variant/85 uppercase tracking-widest">
                Số dư cược vui khả dụng
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-secondary leading-none">
                {formatXu(user.balance)}
              </h2>
              <button 
                onClick={onResetBalance}
                className="inline-flex items-center gap-1 px-4 py-2 bg-secondary text-white text-[11px] font-black rounded-xl hover:brightness-105 active:scale-95 transition-all shadow-md shadow-secondary/15"
              >
                <RefreshCw size={12} /> Nhận lại 10.000 xu Heo Vàng 🐷
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/45 border border-white/50 p-3 rounded-xl text-center">
                <div className="text-[10px] text-on-surface-variant/80 font-bold">Tổng vé cược</div>
                <div className="text-base font-black text-on-surface mt-1">{totalBets}</div>
              </div>
              <div className="bg-white/45 border border-white/50 p-3 rounded-xl text-center">
                <div className="text-[10px] text-on-surface-variant/80 font-bold">Tỉ lệ thắng</div>
                <div className="text-base font-black text-tertiary mt-1">{winRate}%</div>
              </div>
              <div className="bg-white/45 border border-white/50 p-3 rounded-xl text-center">
                <div className="text-[10px] text-on-surface-variant/80 font-bold">Vé Thắng/Thua</div>
                <div className="text-base font-black text-on-surface mt-1">{wonBets}/{lostBets}</div>
              </div>
            </div>
          </div>
        )}

        {/* BOOKMARKS TAB */}
        {activeSubTab === 'BOOKMARKS' && (
          <div className="space-y-3">
            <h4 className="text-xs font-black text-on-surface border-b border-white/40 pb-2">Trận đấu đang theo dõi ({bookmarkedMatches.length})</h4>
            {bookmarkedMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-on-surface-variant">
                <Star size={24} className="opacity-45" />
                <span className="text-center max-w-[280px]">Chưa theo dõi trận nào. Nhấn biểu tượng sao ở bảng danh sách để theo dõi.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {bookmarkedMatches.map(match => (
                  <div 
                    key={match.id}
                    onClick={() => onSelectMatch(match.id)}
                    className="flex items-center justify-between p-3 bg-white/45 border border-white/50 rounded-xl hover:border-primary/20 hover:bg-white transition-all cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <img src={`https://flagcdn.com/w20/${match.home.flag}.png`} alt={match.home.name} className="w-5 h-3.5 object-cover rounded border border-black/5" />
                      <span className="font-bold">{match.home.short}</span>
                      <span className="text-on-surface-variant/60">vs</span>
                      <img src={`https://flagcdn.com/w20/${match.away.flag}.png`} alt={match.away.name} className="w-5 h-3.5 object-cover rounded border border-black/5" />
                      <span className="font-bold">{match.away.short}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${match.status === 'LIVE' ? 'text-danger' : 'text-on-surface-variant/75'}`}>
                        {match.status === 'LIVE' ? `LIVE ${match.minute}'` : match.status === 'FINISHED' ? 'FT' : 'Chưa đá'}
                      </span>
                      <ArrowRight size={12} className="text-on-surface-variant/70" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FAVORITES TAB */}
        {activeSubTab === 'FAVORITES' && (
          <div className="space-y-3">
            <h4 className="text-xs font-black text-on-surface border-b border-white/40 pb-2">Đội tuyển yêu thích</h4>
            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto no-scrollbar p-2 bg-white/40 border border-white/50 rounded-2xl shadow-inner">
              {allTeamsList.map(team => {
                const isFav = user.favoriteTeams && user.favoriteTeams.includes(team.name);
                return (
                  <button
                    key={team.short}
                    onClick={() => onToggleFavoriteTeam(team.name)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border active:scale-95 transition-all text-[11px] font-bold ${
                      isFav 
                        ? 'bg-secondary/10 border-secondary/25 text-secondary font-black shadow-sm' 
                        : 'bg-white/40 border-white/60 hover:bg-white text-on-surface-variant'
                    }`}
                  >
                    <img src={`https://flagcdn.com/w20/${team.flag}.png`} alt={team.name} className="w-4.5 h-3 object-cover rounded border border-black/5" />
                    <span>{team.name}</span>
                    <Star size={10} fill={isFav ? "var(--secondary)" : "none"} color={isFav ? "var(--secondary)" : "currentColor"} className="flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeSubTab === 'HISTORY' && (
          <div className="space-y-3">
            <h4 className="text-xs font-black text-on-surface border-b border-white/40 pb-2">Lịch sử cược vui ({totalBets})</h4>
            {totalBets === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-on-surface-variant">
                <span>Chưa có vé cược nào được đặt.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto no-scrollbar">
                {[...user.betHistory].reverse().map(bet => {
                  const isPending = bet.status === 'PENDING';
                  const isWon = bet.status === 'WON';
                  const isLost = bet.status === 'LOST';

                  return (
                    <div 
                      key={bet.id}
                      className="p-3.5 bg-white/40 border border-white/50 rounded-2xl text-[11px] space-y-2 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-black text-on-surface">{bet.matchTeams}</span>
                        <span className={`px-2 py-0.5 rounded border font-black text-[9px] ${
                          isWon 
                            ? 'bg-tertiary/10 text-tertiary border-tertiary/10' 
                            : isLost 
                              ? 'bg-secondary/10 text-secondary border-secondary/10' 
                              : 'bg-primary/10 text-primary border-primary/10'
                        }`}>
                          {isWon ? 'THẮNG' : isLost ? 'THUA' : 'ĐANG CHỜ'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-on-surface-variant/80 font-bold">
                        <span>Lựa chọn: <strong className="text-primary">{bet.optionLabel}</strong> (@{bet.odds.toFixed(2)})</span>
                        <span>Cược: {formatXu(bet.stake)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-white/40 text-[9px] text-on-surface-variant/70">
                        <span>Mã vé: {bet.id}</span>
                        <span className={`font-black text-xs ${isWon ? 'text-tertiary' : 'text-on-surface'}`}>
                          {isWon ? `Nhận về: +${formatXu(bet.payout)}` : isLost ? 'Thanh toán: 0' : `Dự kiến nhận: ${formatXu(bet.payout)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
