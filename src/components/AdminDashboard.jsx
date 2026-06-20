import { useState, useEffect } from 'react';
import { getApiStats, calculateGeminiCost, resetApiStats } from '../utils/apiTracker';
import { getApiConfig, saveApiConfig, getActiveDataMode } from '../services/api';
import { 
  Database, 
  Key, 
  DollarSign, 
  Activity, 
  RefreshCw, 
  Lock, 
  Eye, 
  EyeOff, 
  Check,
  Newspaper
} from 'lucide-react';

export default function AdminDashboard({ setActivePage }) {
  const [stats, setStats] = useState(getApiStats());
  const [config, setConfig] = useState(getApiConfig());
  const [activeMode, setActiveMode] = useState(getActiveDataMode());
  const [successMessage, setSuccessMessage] = useState('');
  const [showTokens, setShowTokens] = useState({ sportmonks: false, gemini: false });

  // News Scraper States
  const [scraping, setScraping] = useState(false);
  const [scraperLog, setScraperLog] = useState('');

  const [schedulerConfig, setSchedulerConfig] = useState({
    autoEnabled: true,
    liveIntervalMin: 10,
    normalIntervalMin: 180,
    lastRunTime: 0,
    nextRunTime: 0,
    currentMode: 'NORMAL',
    logs: []
  });
  const [isSavingScheduler, setIsSavingScheduler] = useState(false);

  const fetchSchedulerStatus = async () => {
    try {
      const res = await fetch('/api/scheduler-status');
      if (res.ok) {
        const data = await res.json();
        setSchedulerConfig(data);
      }
    } catch (e) {
      console.error("Lỗi lấy trạng thái scheduler:", e);
    }
  };

  const handleSaveSchedulerConfig = async (e) => {
    if (e) e.preventDefault();
    setIsSavingScheduler(true);
    try {
      const params = new URLSearchParams({
        autoEnabled: schedulerConfig.autoEnabled,
        liveIntervalMin: schedulerConfig.liveIntervalMin,
        normalIntervalMin: schedulerConfig.normalIntervalMin
      });
      const res = await fetch(`/api/scheduler-config?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSchedulerConfig(data.config);
          setSuccessMessage('Đã lưu cấu hình tự động cào tin tức! ⏱️');
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      }
    } catch (e) {
      console.error("Lỗi lưu cấu hình scheduler:", e);
    } finally {
      setIsSavingScheduler(false);
    }
  };

  useEffect(() => {
    fetchSchedulerStatus();
    const interval = setInterval(fetchSchedulerStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update stats on custom event
  useEffect(() => {
    const handleStatsUpdate = () => {
      setStats(getApiStats());
    };
    window.addEventListener('api-stats-updated', handleStatsUpdate);
    return () => window.removeEventListener('api-stats-updated', handleStatsUpdate);
  }, []);

  // Recalculate cost
  const cost = calculateGeminiCost(stats.geminiInputTokens || 0, stats.geminiOutputTokens || 0);

  // Handle saving config
  const handleSaveConfig = (e) => {
    e.preventDefault();
    saveApiConfig(config);
    setActiveMode(getActiveDataMode());
    
    // Notify the app of config change
    window.dispatchEvent(new Event('api-config-saved'));

    setSuccessMessage('Đã lưu cấu hình hệ thống thành công! 🚀');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại tất cả thống kê về 0?')) {
      resetApiStats();
      setSuccessMessage('Đã đặt lại thống kê cuộc gọi API! 🐷');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const toggleTokenVisibility = (key) => {
    setShowTokens(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/40">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 tracking-tight">
            <Lock size={26} className="text-primary" /> 
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Cổng Quản trị AI Football
            </span>
          </h1>
          <p className="text-xs text-on-surface-variant/85 mt-1 font-semibold">
            Cấu hình API Keys, quản lý token tiêu thụ và chi phí vận hành thời gian thực.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleReset} 
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-danger/10 border border-danger/15 text-danger text-xs font-bold hover:bg-danger/20 active:scale-95 transition-all"
          >
            <RefreshCw size={12} />
            Đặt lại thống kê
          </button>
          
          <button 
            onClick={() => setActivePage('DASHBOARD')}
            className="px-4 py-1.5 bg-primary text-white text-xs font-black rounded-xl hover:brightness-105 active:scale-95 transition-all shadow-md shadow-primary/10"
          >
            Về Trang Chủ
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-4 bg-tertiary/15 border border-tertiary/25 text-tertiary rounded-2xl text-xs font-bold animate-fade-in">
          <Check size={14} />
          {successMessage}
        </div>
      )}

      {/* Bento Grid layouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: SPORTMONKS STATS */}
        <div className="bento-glass p-5 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <h3 className="text-xs font-black text-on-surface flex items-center gap-1.5 uppercase">
                <Database size={16} className="text-secondary" /> Sportmonks v3 API Feed
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                activeMode === 'SPORTMONKS' 
                  ? 'bg-secondary/10 text-secondary border-secondary/15' 
                  : 'bg-white/40 text-on-surface-variant border-white/60'
              }`}>
                {activeMode === 'SPORTMONKS' ? 'Hoạt động' : 'Dự phòng'}
              </span>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                Tổng cuộc gọi API Sportmonks
              </span>
              <div className="text-4xl font-black text-on-surface tracking-tighter">
                {stats.sportmonksCalls || 0}
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-white/45 border border-white/50 rounded-2xl text-xs space-y-2">
            <div className="flex justify-between items-center text-on-surface-variant font-semibold">
              <span>Mã mùa giải (World Cup):</span>
              <span className="font-extrabold text-on-surface">26618 (2026 Fixtures)</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant font-semibold">
              <span>Trạng thái kết nối API:</span>
              <span className="font-black flex items-center gap-1" style={{ color: config.sportmonksToken ? 'var(--tertiary)' : 'var(--danger)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: config.sportmonksToken ? 'var(--tertiary)' : 'var(--danger)' }}></span>
                {config.sportmonksToken ? 'Đã cấu hình' : 'Chưa nhập Token'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: GEMINI COSTS */}
        <div className="bento-glass p-5 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <h3 className="text-xs font-black text-on-surface flex items-center gap-1.5 uppercase">
                <DollarSign size={16} className="text-primary" /> Chi phí Gemini API
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15 text-[9px] font-black uppercase">
                2.5 Flash
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] text-on-surface-variant/80 font-bold uppercase tracking-wider">Chi phí (USD)</span>
                <div className="text-xl font-black text-on-surface">${cost.usd.toFixed(4)}</div>
              </div>
              <div>
                <span className="text-[9px] text-on-surface-variant/80 font-bold uppercase tracking-wider">Chi phí quy đổi (VND)</span>
                <div className="text-xl font-black text-primary">{Math.round(cost.vnd).toLocaleString('vi-VN')}đ</div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3.5 border-t border-white/40">
            <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant">
              <span>Input Tokens tiêu hao:</span>
              <span className="font-extrabold text-on-surface">{stats.geminiInputTokens?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant">
              <span>Output Tokens tiêu hao:</span>
              <span className="font-extrabold text-on-surface">{stats.geminiOutputTokens?.toLocaleString() || 0}</span>
            </div>

            {/* Budget Bar Progress */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant/85">
                <span>Ngân sách dùng thử tối đa ($5.00)</span>
                <span>{((cost.usd / 5) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/60 border border-white/20 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${Math.min(100, (cost.usd / 5) * 100)}%` }} 
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: CONFIGURATION FORM */}
        <div className="bento-glass p-6 md:col-span-2 space-y-4">
          <h3 className="text-xs font-black text-on-surface flex items-center gap-1.5 uppercase border-b border-white/40 pb-2">
            <Key size={16} className="text-primary" /> Cấu hình API Keys & Nguồn Dữ liệu
          </h3>

          <form onSubmit={handleSaveConfig} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant">
                  Chế độ lấy dữ liệu (API Mode)
                </label>
                <select 
                  value={config.apiMode} 
                  onChange={(e) => setConfig({ ...config, apiMode: e.target.value })}
                  className="w-full bg-white/50 border border-white/60 rounded-xl px-3 py-2 text-xs font-bold text-on-surface outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="SMART">SMART (Live nếu có token, Simulator dự phòng)</option>
                  <option value="SPORTMONKS">SPORTMONKS Live (Yêu cầu API Token)</option>
                  <option value="LIVE_WC26">LIVE_WC26 (worldcup26.ir - Miễn phí thực tế)</option>
                  <option value="DEMO">DEMO (Mô phỏng ngoại tuyến)</option>
                  <option value="AI_LIVE">AI_LIVE (Dự báo Google Sports + ELO)</option>
                </select>
                <span className="text-[9px] text-on-surface-variant/80 block leading-snug">
                  Đang phân giải thực tế thành: <strong className="text-primary">{activeMode}</strong>.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant">
                  Sportmonks API Token v3
                </label>
                <div className="relative">
                  <input 
                    type={showTokens.sportmonks ? 'text' : 'password'} 
                    value={config.sportmonksToken || ''} 
                    onChange={(e) => setConfig({ ...config, sportmonksToken: e.target.value })}
                    placeholder="Nhập token Sportmonks..."
                    className="w-full bg-white/50 border border-white/60 rounded-xl pl-3 pr-9 py-2 text-xs text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:border-primary transition-all"
                  />
                  <button 
                    type="button" 
                    onClick={() => toggleTokenVisibility('sportmonks')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {showTokens.sportmonks ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant">
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <input 
                    type={showTokens.gemini ? 'text' : 'password'} 
                    value={config.geminiApiKey || ''} 
                    onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                    placeholder="Mặc định đã có sẵn API Key"
                    className="w-full bg-white/50 border border-white/60 rounded-xl pl-3 pr-9 py-2 text-xs text-on-surface placeholder-on-surface-variant/60 focus:outline-none focus:border-primary transition-all"
                  />
                  <button 
                    type="button" 
                    onClick={() => toggleTokenVisibility('gemini')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {showTokens.gemini ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant">
                  API-Football Key (RapidAPI)
                </label>
                <input 
                  type="text" 
                  value={config.apiFootballKey || ''} 
                  onChange={(e) => setConfig({ ...config, apiFootballKey: e.target.value })}
                  placeholder="RapidAPI key..."
                  className="w-full bg-white/50 border border-white/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant">
                  The Odds API Key (oddsapi)
                </label>
                <input 
                  type="text" 
                  value={config.theOddsApiKey || ''} 
                  onChange={(e) => setConfig({ ...config, theOddsApiKey: e.target.value })}
                  placeholder="The Odds key..."
                  className="w-full bg-white/50 border border-white/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant">
                  Tua giờ hệ thống ảo (Giờ)
                </label>
                <input 
                  type="number" 
                  step="0.5"
                  value={config.virtualTimeOffset || 0} 
                  onChange={(e) => setConfig({ ...config, virtualTimeOffset: parseFloat(e.target.value) || 0 })}
                  placeholder="Ví dụ: +2, +12, -24..."
                  className="w-full bg-white/50 border border-white/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
                />
                <span className="text-[9px] text-on-surface-variant/80 block leading-snug">
                  Tua thời gian ảo để test live và scheduler cào tin theo các múi giờ trận đấu.
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit" 
                className="px-6 py-2 bg-primary text-white text-xs font-black rounded-xl hover:brightness-105 active:scale-95 transition-all shadow-md shadow-primary/10"
              >
                Lưu cấu hình hệ thống
              </button>
            </div>
          </form>
        </div>

        {/* CARD 4: NEWS SCRAPER CONTROL & TIMETABLE */}
        <div className="bento-glass p-6 md:col-span-2 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/40 flex-wrap gap-2">
            <h3 className="text-xs font-black text-on-surface flex items-center gap-1.5 uppercase">
              <Newspaper size={16} className="text-primary" /> Quản Lý Tự Động Cào Tin Tức (Auto-Scraper)
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
              schedulerConfig.autoEnabled 
                ? 'bg-tertiary/10 text-tertiary border-tertiary/20' 
                : 'bg-danger/10 text-danger border-danger/20'
            }`}>
              {schedulerConfig.autoEnabled ? `Tự động: BẬT (${schedulerConfig.currentMode})` : 'Tự động: TẮT'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Configuration form */}
            <div className="p-4 bg-white/45 border border-white/55 rounded-2xl space-y-4 text-xs">
              <span className="text-[10px] font-black text-on-surface uppercase tracking-wide">
                ⏱️ Chu kỳ & Thiết lập Cron Job
              </span>
              
              <div className="flex items-center justify-between font-bold">
                <span className="text-on-surface-variant">Tự động kích hoạt cào:</span>
                <button
                  type="button"
                  onClick={() => setSchedulerConfig(prev => ({ ...prev, autoEnabled: !prev.autoEnabled }))}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                    schedulerConfig.autoEnabled 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-white/60 border border-white/60 text-on-surface-variant'
                  }`}
                >
                  {schedulerConfig.autoEnabled ? 'BẬT' : 'TẮT'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant">Chu kỳ lúc Trận LIVE (phút):</label>
                  <input
                    type="number"
                    min="5"
                    value={schedulerConfig.liveIntervalMin}
                    onChange={(e) => setSchedulerConfig(prev => ({ ...prev, liveIntervalMin: parseInt(e.target.value) || 10 }))}
                    className="w-full bg-white/50 border border-white/60 rounded-xl px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant">Chu kỳ lúc không trận (phút):</label>
                  <input
                    type="number"
                    min="10"
                    value={schedulerConfig.normalIntervalMin}
                    onChange={(e) => setSchedulerConfig(prev => ({ ...prev, normalIntervalMin: parseInt(e.target.value) || 180 }))}
                    className="w-full bg-white/50 border border-white/60 rounded-xl px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => handleSaveSchedulerConfig()}
                  disabled={isSavingScheduler}
                  className="px-4 py-2 bg-secondary text-white text-[11px] font-black rounded-xl hover:brightness-105 active:scale-95 transition-all shadow-md shadow-secondary/10"
                >
                  {isSavingScheduler ? 'Đang cập nhật...' : 'Cập nhật lịch trình'}
                </button>
              </div>
            </div>

            {/* Right: Manual Trigger & Scheduler Status details */}
            <div className="p-4 bg-white/45 border border-white/55 rounded-2xl flex flex-col justify-between gap-4 text-xs">
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-on-surface uppercase tracking-wide">
                  📊 Trạng thái vận hành thực tế
                </span>
                
                <div className="space-y-1.5 font-semibold text-on-surface-variant">
                  <div className="flex justify-between items-center">
                    <span>Trận LIVE đang trực tiếp:</span>
                    <span className={`font-black ${schedulerConfig.currentMode === 'LIVE' ? 'text-danger' : 'text-on-surface'}`}>
                      {schedulerConfig.currentMode === 'LIVE' ? 'ĐANG CÓ' : 'KHÔNG CÓ'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Lần chạy cào cuối:</span>
                    <span className="font-extrabold text-on-surface">
                      {schedulerConfig.lastRunTime > 0 ? new Date(schedulerConfig.lastRunTime).toLocaleTimeString('vi-VN') : 'Chưa chạy'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Lần chạy dự kiến tiếp:</span>
                    <span className="font-extrabold text-secondary">
                      {schedulerConfig.nextRunTime > 0 ? new Date(schedulerConfig.nextRunTime).toLocaleTimeString('vi-VN') : 'Đang chờ'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/40">
                <span className="text-[10px] font-bold text-on-surface-variant/80 block mb-2">
                  ⚡ Kích hoạt cào dữ liệu thủ công ngay:
                </span>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setScraping(true);
                      setScraperLog('Bắt đầu cào tin tức bình thường từ các trang thể thao...');
                      fetch('/api/run-scraper?mode=normal')
                        .then(r => r.json())
                        .then(data => {
                          setScraperLog(data.success ? `✅ CÀO TIN THƯỜNG THÀNH CÔNG!\n\n${data.stdout}` : `❌ CÀO TIN THẤT BẠI!\n${data.error}`);
                          fetchSchedulerStatus();
                        })
                        .catch(e => setScraperLog(`❌ LỖI: ${e.message}`))
                        .finally(() => setScraping(false));
                    }} 
                    disabled={scraping}
                    className="flex-1 py-2 rounded-xl bg-white/50 border border-white/60 text-on-surface-variant text-[11px] font-bold hover:bg-white hover:text-primary active:scale-95 transition-all shadow-sm"
                  >
                    Tin Thường
                  </button>
                  
                  <button 
                    onClick={() => {
                      setScraping(true);
                      setScraperLog('Bắt đầu cào tin nóng hổi trận đấu trực tiếp...');
                      fetch('/api/run-scraper?mode=live')
                        .then(r => r.json())
                        .then(data => {
                          setScraperLog(data.success ? `✅ CÀO TIN NÓNG LIVE THÀNH CÔNG!\n\n${data.stdout}` : `❌ CÀO TIN THẤT BẠI!\n${data.error}`);
                          fetchSchedulerStatus();
                        })
                        .catch(e => setScraperLog(`❌ LỖI: ${e.message}`))
                        .finally(() => setScraping(false));
                    }} 
                    disabled={scraping}
                    className="flex-1 py-2 rounded-xl bg-primary text-white text-[11px] font-black hover:brightness-105 active:scale-95 transition-all shadow-md shadow-primary/10"
                  >
                    Tin Nóng LIVE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Console logs output */}
          {scraperLog && (
            <div className="p-3 bg-black/85 border border-white/20 rounded-xl font-mono text-[10px] space-y-1.5 shadow-inner">
              <div className="text-white/55 border-b border-white/10 pb-1 flex justify-between items-center">
                <span>CONSOL LOG CÀO TIN TỨC:</span>
                <button onClick={() => setScraperLog('')} className="text-white/40 hover:text-white">✕ Clear</button>
              </div>
              <div className="max-h-[120px] overflow-y-auto no-scrollbar whitespace-pre-wrap" style={{ color: scraperLog.includes('SUCCESS') || scraperLog.includes('THÀNH CÔNG') ? 'var(--tertiary)' : '#ff9500' }}>
                {scraperLog}
              </div>
            </div>
          )}

          {/* Scheduler Daemon Logs Ticker */}
          <div className="p-3 bg-black/80 border border-white/25 rounded-xl font-mono text-[10px] space-y-2 shadow-inner">
            <div className="text-white/60 border-b border-white/10 pb-1.5 flex justify-between items-center">
              <span>📋 NHẬT KÝ CRON JOB DAEMON LOGS:</span>
              <button 
                onClick={fetchSchedulerStatus}
                className="text-primary hover:text-secondary active:scale-95 transition-all flex items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <RefreshCw size={10} /> Làm mới log
              </button>
            </div>
            
            <div className="max-h-[140px] overflow-y-auto no-scrollbar flex flex-col gap-1.5">
              {schedulerConfig.logs && schedulerConfig.logs.length > 0 ? (
                schedulerConfig.logs.map((log, i) => {
                  let logColor = 'text-white/60';
                  if (log.includes('Thất bại')) logColor = 'text-danger font-bold';
                  else if (log.includes('Thành công')) logColor = 'text-tertiary';
                  else if (log.includes('Cấu hình')) logColor = 'text-primary';
                  
                  return (
                    <div key={i} className={`pb-1 border-b border-white/5 ${logColor}`}>
                      {log}
                    </div>
                  );
                })
              ) : (
                <div className="text-white/40 italic">Chưa có nhật ký hoạt động nào ghi nhận.</div>
              )}
            </div>
          </div>
        </div>

        {/* CARD 5: ACTIVITY LOG */}
        <div className="bento-glass p-5 md:col-span-2 space-y-3">
          <h3 className="text-xs font-black text-on-surface flex items-center gap-1.5 uppercase">
            <Activity size={16} className="text-secondary animate-pulse" /> Nhật ký cuộc gọi API thời gian thực
          </h3>
          
          <div className="p-3.5 bg-black/90 border border-white/20 rounded-xl font-mono text-[10px] space-y-1.5 max-h-[180px] overflow-y-auto no-scrollbar shadow-inner text-white/70">
            <div>
              <span className="text-primary font-bold">[SYSTEM]</span> [{new Date().toLocaleTimeString()}] Admin Portal khởi tạo thành công. Mật khẩu xác thực: OK.
            </div>
            <div>
              <span className="text-secondary font-bold">[CONFIG]</span> Dữ liệu phân giải thời gian thực: Chế độ `{activeMode}` đang chạy.
            </div>
            {config.sportmonksToken ? (
              <div className="text-tertiary">
                [SPORTMONKS] API Token được tải từ bộ nhớ đệm: OK.
              </div>
            ) : (
              <div className="text-[#ff9500]">
                [WARNING] Chưa cấu hình Sportmonks API Token. Hệ thống sẽ tự động dùng Simulator.
              </div>
            )}
            <div>
              <span className="text-primary font-bold">[GEMINI]</span> Model: gemini-2.5-flash sẵn sàng cho các lượt nhận định bóng đá & kèo cược của Heo Hồng.
            </div>
            <div className="text-white/40">
              [API LOG] Đang lắng nghe cuộc gọi từ các tab Bảng tỷ số, Nhận định AI, và Tin Nóng...
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
