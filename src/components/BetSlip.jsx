import { useState, useEffect } from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { Ticket, History, Trash2, CheckCircle2, ChevronDown, Coins, Zap } from 'lucide-react';
import { Button, InputNumber, List, Tag, Result, Typography, Radio, Card, Divider, Space, Input, message } from 'antd';

const { Title, Text } = Typography;

export default function BetSlip({ activeBet, onClearBet, user, onPlaceBet, onClearBetHistory }) {
  const { t } = useLanguage();
  const [stake, setStake] = useState(10);
  const [isPlacing, setIsPlacing] = useState(false);
  const [betResult, setBetResult] = useState(null);

  const history = user ? (user.betHistory || []) : [];

  useEffect(() => {
    setTimeout(() => {
      setBetResult(null);
    }, 0);
  }, [activeBet]);

  const { match, label, value } = activeBet || {};

  const handleStakeChange = (value) => {
    setStake(value || 0);
  };

  const handleQuickStake = (e) => {
    const val = e.target.value;
    if (val === 'MAX') {
      if (user && user.balance) setStake(user.balance);
    } else {
      setStake(stake + val);
    }
  };

  const handlePlaceBet = async () => {
    if (!stake || stake <= 0) return;
    if (stake % 10 !== 0) {
      message.error(t('alertMultipleTen'));
      return;
    }
    if (!user) {
      message.warning(t('alertLoginRequired'));
      return;
    }
    if (user.balance < stake) {
      message.error(t('alertInsufficientBalance'));
      return;
    }
    setIsPlacing(true);
    try {
      if (onPlaceBet) {
        const result = await onPlaceBet(activeBet, stake);
        setBetResult(result);
      }
    } catch (e) {
      console.error(e);
      // Let App.jsx handle the error message if onPlaceBet rejects
      if (typeof e !== 'string') {
        message.error(t('alertErrorPlacingBet'));
      }
    } finally {
      setIsPlacing(false);
    }
  };

  const potentialPayout = (stake && value) ? (parseFloat(stake) * value).toFixed(2) : '0.00';

  if (betResult) {
    return (
      <Result
        status="success"
        title={t('betPlacedSuccess')}
        subTitle={
          <Text type="secondary">
            {t('betTicketId')} <Text keyboard>{betResult.betId}</Text>
          </Text>
        }
        extra={[
          <Button type="primary" key="console" onClick={onClearBet} block size="large">
            {t('closeBetSlip')}
          </Button>,
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Active Bet Section */}
      <div className="flex-none bg-white border-b border-gray-100">
        <div className="p-4">
          {activeBet ? (
            <div className="flex flex-col gap-3">
              {/* Clean Light Ticket Card */}
              <div className="relative overflow-hidden rounded-xl bg-white p-3 shadow-sm border border-[#ea4c89]/20">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold tracking-wider uppercase">
                    <Ticket size={12} className="text-[#ea4c89]" />
                    {match.league.name}
                  </div>
                  <div className="flex items-center gap-1 bg-[#ef4444]/10 text-[#ef4444] px-1.5 py-0.5 rounded text-[9px] font-bold border border-[#ef4444]/20">
                    <div className="w-1.5 h-1.5 bg-[#ef4444] rounded-full animate-pulse"></div>LIVE
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[13px] font-bold text-gray-800 truncate flex-1 text-right">{match.home.name}</div>
                  <div className="text-[11px] font-semibold text-gray-400 mx-2 flex-none">vs</div>
                  <div className="text-[13px] font-bold text-gray-800 truncate flex-1">{match.away.name}</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-2.5 flex justify-between items-center border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-medium mb-0.5">Lựa chọn của bạn</span>
                    <span className="text-[14px] font-bold text-[#ea4c89] leading-none">{label}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-500 font-medium mb-0.5">Tỷ lệ (Odds)</span>
                    <span className="text-[18px] font-black text-[#2194ff] leading-none">x{value.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Stake Input Area */}
              <div className="bg-white">
                <div className="flex justify-between items-end mb-1.5 px-1">
                  <span className="text-[12px] font-bold text-gray-700">Số tiền cược</span>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-gray-400">Số dư:</span>
                    <span className="font-bold text-[#1bc165] flex items-center gap-0.5">
                      {user?.balance?.toLocaleString() || 0} <Coins size={10} />
                    </span>
                  </div>
                </div>
                
                <div className="relative mb-2">
                  <InputNumber
                    size="large"
                    value={stake}
                    onChange={handleStakeChange}
                    className="w-full text-[15px] font-bold !rounded-lg border-gray-200 focus:border-[#ea4c89]"
                    placeholder="0"
                    min={10}
                    step={10}
                    controls={false}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[12px] pointer-events-none">
                    XU
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-1.5">
                  {[50, 100, 500].map(val => (
                    <button
                      key={val}
                      onClick={() => setStake(stake + val)}
                      className="bg-white border border-gray-200 hover:border-[#ea4c89] hover:text-[#ea4c89] text-gray-600 font-semibold text-[12px] py-1.5 rounded transition-colors"
                    >
                      +{val}
                    </button>
                  ))}
                  <button
                    onClick={() => { if (user?.balance) setStake(user.balance); }}
                    className="bg-[#ea4c89]/5 border border-[#ea4c89]/30 text-[#ea4c89] hover:bg-[#ea4c89] hover:text-white font-bold text-[12px] py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                  >
                    <Zap size={10} /> MAX
                  </button>
                </div>
              </div>

              {/* Payout Area */}
              <div className="bg-[#1bc165]/5 border border-[#1bc165]/20 rounded-lg p-2.5 flex justify-between items-center">
                <span className="text-[11px] font-bold text-[#1bc165] uppercase tracking-wide">Tiền thắng dự kiến</span>
                <div className="text-[18px] font-black text-[#1bc165] flex items-baseline gap-1 leading-none">
                  {parseFloat(potentialPayout).toLocaleString()} <span className="text-[10px] font-bold">XU</span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="primary"
                size="large"
                block
                onClick={handlePlaceBet}
                disabled={!stake || stake <= 0}
                loading={isPlacing}
                className="h-11 bg-[#ea4c89] hover:bg-[#d83a77] border-0 rounded-lg font-bold text-[14px] shadow-sm shadow-[#ea4c89]/20"
              >
                XÁC NHẬN ĐẶT CƯỢC
              </Button>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <Ticket size={24} className="text-gray-300" />
              </div>
              <div className="text-[14px] font-bold text-gray-500 mb-1">Phiếu cược trống</div>
              <div className="text-[12px] text-gray-400 px-4">Vui lòng chọn một kèo từ danh sách trận đấu.</div>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="flex-1 bg-white flex flex-col min-h-0">
          <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <History size={16} className="text-[#151e22]" />
              <span className="text-[13px] font-bold text-[#151e22] uppercase tracking-wide">
                Lịch sử ({history.length})
              </span>
            </div>
            <button
              className="text-[12px] font-semibold text-[#ef4444] hover:text-[#dc2626] flex items-center gap-1 transition-colors"
              onClick={() => {
                if (window.confirm(t('confirmClearHistory'))) onClearBetHistory();
              }}
            >
              <Trash2 size={14} /> Xoá
            </button>
          </div>

          <div className="p-4 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-3">
              {history.slice().reverse().map((bet, idx) => {
                const isWon = bet.status === 'WON' || bet.status === 'WIN';
                const isLost = bet.status === 'LOST';
                const isRefund = bet.status === 'REFUND';
                const isPending = bet.status === 'PENDING' || bet.status === 'RUNNING';

                let statusBadge;
                let bgStyle = "bg-white border-gray-200";
                
                if (isWon) {
                  statusBadge = <div className="text-[10px] font-bold text-white bg-[#1bc165] px-2 py-0.5 rounded uppercase flex items-center gap-1"><CheckCircle2 size={10} /> THẮNG</div>;
                  bgStyle = "bg-[#1bc165]/5 border-[#1bc165]/30";
                } else if (isLost) {
                  statusBadge = <div className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">THUA</div>;
                } else if (isRefund) {
                  statusBadge = <div className="text-[10px] font-bold text-[#2194ff] bg-[#2194ff]/10 px-2 py-0.5 rounded uppercase border border-[#2194ff]/20">HOÀ</div>;
                } else {
                  statusBadge = <div className="text-[10px] font-bold text-[#ffb800] bg-[#ffb800]/10 px-2 py-0.5 rounded uppercase border border-[#ffb800]/20">CHỜ KẾT QUẢ</div>;
                }

                return (
                  <div key={idx} className={`border rounded-xl p-3 shadow-sm ${bgStyle} transition-all hover:shadow-md`}>
                    <div className="flex justify-between items-start mb-2 border-b border-gray-100/50 pb-2">
                      <span className="font-semibold text-[12px] text-[#151e22] truncate pr-2 w-[70%]">
                        {bet.matchTeams || bet.matchTitle}
                      </span>
                      <div className="flex-shrink-0">{statusBadge}</div>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="font-bold text-[14px] text-[#151e22]">{bet.optionLabel || bet.choice}</span>
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-500">
                          <span>Tiền cược:</span>
                          <span className="font-semibold text-[#151e22]">{parseFloat(bet.stake).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-black text-[16px] text-[#ea4c89]">x{parseFloat(bet.odds).toFixed(2)}</span>
                        {isWon && (
                          <span className="text-[11px] font-bold text-[#1bc165] mt-0.5 bg-[#1bc165]/10 px-1.5 py-0.5 rounded">
                            +{parseFloat(bet.stake * bet.odds).toLocaleString()} xu
                          </span>
                        )}
                        {isRefund && (
                          <span className="text-[11px] font-bold text-[#2194ff] mt-0.5 bg-[#2194ff]/10 px-1.5 py-0.5 rounded">
                            Hoàn {parseFloat(bet.stake).toLocaleString()} xu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
