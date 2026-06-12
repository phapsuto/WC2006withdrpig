import React from 'react';
import { Settings, Play, Radio, Trophy, Newspaper } from 'lucide-react';

export default function Navbar({ apiMode, setApiMode, onOpenSettings, activePage, setActivePage }) {
  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <a href="/" className="logo-section" onClick={(e) => { e.preventDefault(); setActivePage('DASHBOARD'); }}>
          <img src="/drpig_mascot.png" alt="Drpig Mascot" className="logo-mascot-img" />
          <div>
            <span style={{ fontSize: '1.25rem', display: 'block', lineHeight: 1.1 }}>World Cup 2026</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Cùng Drpig 🐷</span>
          </div>
        </a>

        {/* Page Switcher Tabs */}
        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setActivePage('DASHBOARD')}
            className={`mode-btn ${activePage === 'DASHBOARD' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem' }}
          >
            <Trophy size={14} />
            <span>Bảng tỷ số</span>
          </button>
          <button 
            onClick={() => setActivePage('NEWS_HUB')}
            className={`mode-btn ${activePage === 'NEWS_HUB' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem' }}
          >
            <Newspaper size={14} />
            <span>Tin Nóng WC</span>
          </button>
        </nav>
      </div>
      
      <div className="nav-actions">
        <div className="api-mode-selector">
          <button 
            className={`mode-btn ${apiMode === 'DEMO' ? 'active' : ''}`}
            onClick={() => setApiMode('DEMO')}
            title="Mô phỏng trận đấu đang diễn ra"
          >
            <Play size={12} />
            Mô phỏng
          </button>
          <button 
            className={`mode-btn live ${apiMode === 'LIVE' ? 'active' : ''}`}
            onClick={() => setApiMode('LIVE')}
            title="Lấy dữ liệu trực tiếp từ API thật"
          >
            <Radio size={12} />
            Trực tiếp API
          </button>
        </div>
        
        <button 
          className="settings-trigger" 
          onClick={onOpenSettings}
          title="Cấu hình API Thể thao & Gemini"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
