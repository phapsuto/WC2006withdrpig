import { DollarSign, Database, Activity } from 'lucide-react';
import { calculateGeminiCost } from '../../utils/apiTracker';

export default function AdminOverview({ stats, config, activeMode }) {
  const cost = calculateGeminiCost(stats.geminiInputTokens || 0, stats.geminiOutputTokens || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      {/* SPORTMONKS STATS */}
      <div className="bento-glass p-5 flex flex-col justify-between gap-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <h3 className="text-xs font-semibold text-on-surface flex items-center gap-1.5 uppercase">
              <Database size={16} className="text-secondary" /> Sportmonks v3 API Feed
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase border ${
              activeMode === 'SPORTMONKS' 
                ? 'bg-secondary/10 text-secondary border-secondary/15' 
                : 'bg-white/40 text-on-surface-variant border-white/60'
            }`}>
              {activeMode === 'SPORTMONKS' ? 'Hoạt động' : 'Dự phòng'}
            </span>
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">
              Tổng cuộc gọi API Sportmonks
            </span>
            <div className="text-4xl font-semibold text-on-surface tracking-tighter">
              {stats.sportmonksCalls || 0}
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white/45 border border-white/50 rounded-2xl text-xs space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant font-semibold">
            <span>Mã mùa giải (World Cup):</span>
            <span className="font-semibold text-on-surface">26618 (2026 Fixtures)</span>
          </div>
          <div className="flex justify-between items-center text-on-surface-variant font-semibold">
            <span>Trạng thái kết nối API:</span>
            <span className="font-semibold flex items-center gap-1" style={{ color: config.sportmonksToken ? 'var(--tertiary)' : 'var(--danger)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: config.sportmonksToken ? 'var(--tertiary)' : 'var(--danger)' }}></span>
              {config.sportmonksToken ? 'Đã cấu hình' : 'Chưa nhập Token'}
            </span>
          </div>
        </div>
      </div>

      {/* GEMINI COSTS */}
      <div className="bento-glass p-5 flex flex-col justify-between gap-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <h3 className="text-xs font-semibold text-on-surface flex items-center gap-1.5 uppercase">
              <DollarSign size={16} className="text-primary" /> Chi phí Gemini API
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15 text-[9px] font-semibold uppercase">
              2.5 Flash
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] text-on-surface-variant/80 font-semibold uppercase tracking-wider">Chi phí (USD)</span>
              <div className="text-xl font-semibold text-on-surface">${cost.usd.toFixed(4)}</div>
            </div>
            <div>
              <span className="text-[9px] text-on-surface-variant/80 font-semibold uppercase tracking-wider">Chi phí quy đổi (VND)</span>
              <div className="text-xl font-semibold text-primary">{Math.round(cost.vnd).toLocaleString('vi-VN')}đ</div>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-3.5 border-t border-white/40">
          <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant">
            <span>Input Tokens tiêu hao:</span>
            <span className="font-semibold text-on-surface">{stats.geminiInputTokens?.toLocaleString() || 0}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant">
            <span>Output Tokens tiêu hao:</span>
            <span className="font-semibold text-on-surface">{stats.geminiOutputTokens?.toLocaleString() || 0}</span>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-[10px] font-semibold text-on-surface-variant/85">
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

      {/* ACTIVITY LOG */}
      <div className="bento-glass p-5 md:col-span-2 space-y-3">
        <h3 className="text-xs font-semibold text-on-surface flex items-center gap-1.5 uppercase">
          <Activity size={16} className="text-secondary animate-pulse" /> Nhật ký cuộc gọi API thời gian thực
        </h3>
        
        <div className="p-3.5 bg-black/90 border border-white/20 rounded-xl font-mono text-[10px] space-y-1.5 max-h-[180px] overflow-y-auto no-scrollbar shadow-inner text-white/70">
          <div>
            <span className="text-primary font-semibold">[SYSTEM]</span> [{new Date().toLocaleTimeString()}] Admin Portal khởi tạo thành công. Mật khẩu xác thực: OK.
          </div>
          <div>
            <span className="text-secondary font-semibold">[CONFIG]</span> Dữ liệu phân giải thời gian thực: Chế độ `{activeMode}` đang chạy.
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
            <span className="text-primary font-semibold">[GEMINI]</span> Model: gemini-2.5-flash sẵn sàng cho các lượt nhận định bóng đá & kèo cược của Heo Hồng.
          </div>
          <div className="text-white/40">
            [API LOG] Đang lắng nghe cuộc gọi từ các tab Bảng tỷ số, Nhận định AI, và Tin Nóng...
          </div>
        </div>
      </div>
    </div>
  );
}
