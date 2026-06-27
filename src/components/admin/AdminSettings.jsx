import { useState } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';
import { saveApiConfig, getActiveDataMode } from '../../services/api';

export default function AdminSettings({ config, setConfig, setActiveMode, setSuccessMessage }) {
  const [showTokens, setShowTokens] = useState({ sportmonks: false, gemini: false });

  const toggleTokenVisibility = (key) => {
    setShowTokens(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    saveApiConfig(config);
    setActiveMode(getActiveDataMode());
    
    // Notify the app of config change
    window.dispatchEvent(new Event('api-config-saved'));

    setSuccessMessage('Đã lưu cấu hình hệ thống thành công! 🚀');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="bento-glass p-6 space-y-4 animate-fade-in">
      <h3 className="text-xs font-semibold text-on-surface flex items-center gap-1.5 uppercase border-b border-white/40 pb-2">
        <Key size={16} className="text-primary" /> Cấu hình API Keys & Nguồn Dữ liệu
      </h3>

      <form onSubmit={handleSaveConfig} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-on-surface-variant">
              Chế độ lấy dữ liệu (API Mode)
            </label>
            <select 
              value={config.apiMode} 
              onChange={(e) => setConfig({ ...config, apiMode: e.target.value })}
              className="w-full bg-white/50 border border-white/60 rounded-xl px-3 py-2 text-xs font-semibold text-on-surface outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="SMART">SMART (Live nếu có token, Simulator dự phòng)</option>
              <option value="SPORTMONKS">SPORTMONKS Live (Yêu cầu API Token)</option>
              <option value="LIVE_WC26">LIVE_WC26 (worldcup26.ir - Miễn phí thực tế)</option>
              <option value="DEMO">DEMO (Mô phỏng ngoại tuyến)</option>
              <option value="AI_LIVE">AI_LIVE (Dự báo Google Sports + ELO)</option>
            </select>
            <span className="text-[9px] text-on-surface-variant/80 block leading-snug">
              Thay đổi nguồn cấp dữ liệu cho hệ thống.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-on-surface-variant">
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
            <label className="text-[11px] font-semibold text-on-surface-variant">
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
            <label className="text-[11px] font-semibold text-on-surface-variant">
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
            <label className="text-[11px] font-semibold text-on-surface-variant">
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
            <label className="text-[11px] font-semibold text-on-surface-variant">
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
            className="px-6 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:brightness-105 active:scale-95 transition-all shadow-md shadow-primary/10"
          >
            Lưu cấu hình hệ thống
          </button>
        </div>
      </form>
    </div>
  );
}
