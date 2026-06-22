import { useState, useEffect } from 'react';
import { Ticket, X, CheckCircle2, Loader2, History, Trash2 } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';

export default function BetSlip({ activeBet, onClearBet, user, onPlaceBet, onClearBetHistory }) {
  const { t } = useLanguage();
  const [stake, setStake] = useState('10'); // Default stake: 10 xu
  const [isPlacing, setIsPlacing] = useState(false);
  const [betResult, setBetResult] = useState(null); // { success: true, betId: '...' }

  const history = user ? (user.betHistory || []) : [];

  // Reset result state when activeBet changes
  useEffect(() => {
    setTimeout(() => {
      setBetResult(null);
    }, 0);
  }, [activeBet]);

  const { match, label, value } = activeBet || {};

  const handleStakeChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setStake(val);
  };

  const handlePlaceBet = async () => {
    const stakeNum = parseInt(stake, 10);
    if (!stakeNum || stakeNum <= 0) return;
    if (stakeNum % 10 !== 0) {
      alert(t('alertMultipleTen'));
      return;
    }
    if (!user) {
      alert(t('alertLoginRequired'));
      return;
    }
    if (user.balance < stakeNum) {
      alert(t('alertInsufficientBalance'));
      return;
    }
    setIsPlacing(true);
    try {
      if (onPlaceBet) {
        const result = await onPlaceBet(activeBet, stakeNum);
        setBetResult(result);
      }
    } catch (e) {
      console.error(e);
      alert(t('alertErrorPlacingBet'));
    } finally {
      setIsPlacing(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm(t('confirmClearHistory'))) {
      if (onClearBetHistory) {
        onClearBetHistory();
      }
    }
  };

  const potentialPayout = (stake && value) ? (parseFloat(stake) * value).toFixed(2) : '0.00';

  return (
    <div className="bento-glass p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-white/40">
        <h3 className="font-bold text-sm flex items-center gap-1.5 text-primary">
          <Ticket size={16} className="text-primary" />
          {t('betSlipTitle')}
        </h3>
        {activeBet && !betResult && (
          <button 
            onClick={onClearBet}
            className="w-6 h-6 rounded-full bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10 flex items-center justify-center text-on-surface-variant hover:bg-white dark:hover:bg-white/10 hover:text-primary active:scale-95 transition-all"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {betResult ? (
        <div className="flex flex-col items-center justify-center text-center p-6 gap-3">
          <CheckCircle2 size={36} className="text-tertiary animate-bounce" />
          <h4 className="text-xs font-black text-on-background">{t('betPlacedSuccess')}</h4>
          <p className="text-[10px] text-on-surface-variant/80">
            {t('betTicketId')} <code className="bg-white/60 dark:bg-white/10 border border-white/80 dark:border-white/20 px-1.5 py-0.5 rounded font-black text-on-surface">{betResult.betId}</code>
          </p>
          <button 
            onClick={onClearBet}
            className="mt-2 px-5 py-2 bg-primary text-white text-[11px] font-black rounded-xl hover:brightness-105 active:scale-95 transition-all shadow"
          >
            {t('closeBetSlip')}
          </button>
        </div>
      ) : activeBet ? (
        <div className="flex flex-col gap-4">
          {/* Active Bet Item details */}
          <div className="p-3.5 bg-white/45 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between items-center text-[10px] text-on-surface-variant/70 font-bold uppercase tracking-wider">
              <span>{match.league.name}</span>
              <span>{t('liveBetLabel')}</span>
            </div>
            
            <div className="font-black text-on-surface leading-tight text-sm">
              {match.home.name} vs {match.away.name}
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-white/40 font-bold">
              <span className="text-primary">{label}</span>
              <span className="text-sm font-black text-on-surface">x{value.toFixed(2)}</span>
            </div>
          </div>

          {/* Stake input container */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-xl">
              <span className="text-xs font-bold text-on-surface-variant">{t('stakeLabel')}</span>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={stake}
                  onChange={handleStakeChange}
                  placeholder="0"
                  className="w-16 bg-transparent border-none text-right font-black text-sm text-on-surface outline-none p-0 focus:ring-0"
                />
                <span className="text-xs font-black text-on-surface-variant">{t('coinMascot')}</span>
              </div>
            </div>

            {/* Payout summary row */}
            <div className="p-1.5 space-y-1.5 text-[11px] font-bold text-on-surface-variant">
              <div className="flex justify-between items-center">
                <span>{t('oddsLabel')}</span>
                <span className="text-on-surface font-extrabold">x{value.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>{t('estReturnLabel')}</span>
                <span className="text-tertiary font-black">{potentialPayout} {t('coinMascot')}</span>
              </div>
            </div>

            {/* Submit betting button */}
            <button 
              onClick={handlePlaceBet}
              disabled={isPlacing || !stake || parseFloat(stake) <= 0}
              className={`w-full py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all ${
                isPlacing || !stake || parseFloat(stake) <= 0 
                  ? 'bg-on-surface-variant/20 cursor-not-allowed shadow-none' 
                  : 'bg-primary hover:brightness-105 shadow-primary/10'
              }`}
            >
              {isPlacing ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  {t('placingBetLoader')}
                </>
              ) : (
                t('placeBetNow')
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-12 gap-2 text-on-surface-variant/80">
          <Ticket size={36} strokeWidth={1.5} className="opacity-45" />
          <div className="text-xs font-black text-on-surface">{t('emptyBetSlipTitle')}</div>
          <span className="text-[10px] text-on-surface-variant leading-relaxed max-w-[190px]">
            {t('emptyBetSlipDesc')}
          </span>
        </div>
      )}

      {/* Bet History lists footer */}
      {history.length > 0 && (
        <div className="border-t border-white/40 pt-4 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant">
            <span className="flex items-center gap-1">
              <History size={12} />
              {t('betHistoryCount').replace('{count}', history.length)}
            </span>
            
            <button 
              onClick={clearHistory} 
              className="text-on-surface-variant hover:text-secondary active:scale-95 transition-all"
              title={t('clearBetHistory')}
            >
              <Trash2 size={12} />
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto no-scrollbar">
            {history.slice().reverse().map((bet) => {
              const isWon = bet.status === 'WON' || bet.status === 'WIN';
              const isPending = bet.status === 'PENDING' || bet.status === 'RUNNING';
              
              const statusClass = isPending 
                ? 'bg-primary/10 text-primary border-primary/10' 
                : isWon 
                  ? 'bg-tertiary/10 text-tertiary border-tertiary/10' 
                  : 'bg-secondary/10 text-secondary border-secondary/10';

              const statusLabel = isPending ? t('statusPending') : isWon ? t('statusWon') : t('statusLost');
              const displayStake = bet.stake;

              return (
                <div 
                  key={bet.id} 
                  className="flex items-center justify-between p-2.5 bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-xl text-[10px] font-bold"
                >
                  <div className="flex flex-col gap-0.5 leading-tight truncate mr-2">
                    <span className="text-on-surface truncate">{bet.matchTeams || bet.matchTitle}</span>
                    <span className="text-on-surface-variant/80 truncate">{t('betHistoryPicked')} {bet.optionLabel || bet.choice} (x{bet.odds.toFixed(2)})</span>
                    <span className="text-[9px] text-on-surface-variant/65">{t('betHistoryCardDesc').replace('{stake}', displayStake).replace('{time}', bet.time)}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded border font-black text-[9px] whitespace-nowrap flex-shrink-0 ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
