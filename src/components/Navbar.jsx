import { Lock } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';

export default function Navbar({ activePage, setActivePage, user, onGoogleLoginClick, theme, toggleTheme }) {
  const { t } = useLanguage();

  return (
    <header className="hidden md:block fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-3xl border-b border-white/40 shadow-[0px_10px_30px_rgba(0,0,0,0.04)]">
      <div className="flex justify-between items-center h-20 px-4 md:px-8 w-full max-w-7xl mx-auto">
        {/* Brand Logo & Mascot */}
        <a 
          href="/" 
          className="flex items-center gap-3 font-display-lg text-2xl font-black text-primary tracking-tighter" 
          onClick={(e) => { e.preventDefault(); setActivePage('DASHBOARD'); }}
        >
          <img 
            src="/drpig_mascot.png" 
            alt="Heo Hồng Mascot" 
            className="w-10 h-10 object-cover rounded-full border-2 border-accent-gold shadow-[0_0_8px_rgba(200,168,75,0.4)]" 
          />
          <div className="flex flex-col text-left">
            <span className="text-lg md:text-xl font-black text-primary leading-none">World Cup 2026</span>
            <span className="text-[10px] md:text-[11px] font-semibold text-on-surface-variant opacity-70 leading-none mt-1">{t('withHeoHong')}</span>
          </div>
        </a>

        {/* Page Switcher Links */}
        <nav className="hidden md:flex items-center gap-3 xl:gap-6">
          <button 
            onClick={() => setActivePage('DASHBOARD')}
            className={`font-semibold transition-all duration-200 px-3 py-1.5 rounded-lg text-sm ${
              activePage === 'DASHBOARD' 
                ? 'text-primary font-bold bg-primary-fixed/20 border-b-2 border-primary' 
                : 'text-on-surface-variant hover:text-primary hover:bg-white/20'
            }`}
          >
            {t('navMatches')}
          </button>
          
          <button 
            onClick={() => setActivePage('STANDINGS')}
            className={`font-semibold transition-all duration-200 px-3 py-1.5 rounded-lg text-sm ${
              activePage === 'STANDINGS' 
                ? 'text-primary font-bold bg-primary-fixed/20 border-b-2 border-primary' 
                : 'text-on-surface-variant hover:text-primary hover:bg-white/20'
            }`}
          >
            {t('navStandings')}
          </button>
          
          <button 
            onClick={() => setActivePage('NEWS_HUB')}
            className={`font-semibold transition-all duration-200 px-3 py-1.5 rounded-lg text-sm ${
              activePage === 'NEWS_HUB' 
                ? 'text-primary font-bold bg-primary-fixed/20 border-b-2 border-primary' 
                : 'text-on-surface-variant hover:text-primary hover:bg-white/20'
            }`}
          >
            {t('navNews')}
          </button>
 
          <button 
            onClick={() => setActivePage('ORACLE')}
            className={`font-semibold transition-all duration-200 px-3 py-1.5 rounded-lg text-sm ${
              activePage === 'ORACLE' 
                ? 'text-primary font-bold bg-primary-fixed/20 border-b-2 border-primary' 
                : 'text-on-surface-variant hover:text-primary hover:bg-white/20'
            }`}
          >
            {t('navOracle')}
          </button>
 
          <button 
            onClick={() => setActivePage('PROFILE')}
            className={`font-semibold transition-all duration-200 px-3 py-1.5 rounded-lg text-sm ${
              activePage === 'PROFILE' 
                ? 'text-primary font-bold bg-primary-fixed/20 border-b-2 border-primary' 
                : 'text-on-surface-variant hover:text-primary hover:bg-white/20'
            }`}
          >
            {t('navProfile')}
          </button>
        </nav>

        {/* Trailing Actions */}
        <div className="flex items-center gap-3">
          {/* Google Authentication Slot */}
          {!user ? (
            <button 
              onClick={onGoogleLoginClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/60 bg-white/40 hover:bg-white/80 transition-all font-semibold text-xs text-on-surface shadow-sm active:scale-95 duration-200"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>{t('navLogin')}</span>
            </button>
          ) : (
            <button 
              onClick={() => setActivePage('PROFILE')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/60 bg-white/40 hover:bg-white/80 transition-all font-semibold text-xs active:scale-95 duration-200 ${
                activePage === 'PROFILE' ? 'text-primary border-primary bg-primary-fixed/20' : 'text-on-surface-variant'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black">
                {user.initials || user.name.charAt(0)}
              </div>
              <span className="hidden sm:inline">{user.name.split(' ').pop()}</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl border bg-white/40 border-white/60 text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all active:scale-95 duration-200"
            title="Đổi giao diện"
          >
            <span className="material-symbols-outlined text-[18px]">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          {/* Admin Portal Gateway */}
          <button 
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all active:scale-95 duration-200 ${
              activePage === 'ADMIN_PORTAL' 
                ? 'bg-secondary/10 border-secondary text-secondary' 
                : 'bg-white/40 border-white/60 text-on-surface-variant hover:text-primary hover:border-primary/40'
            }`} 
            onClick={() => {
              if (activePage === 'ADMIN_PORTAL') {
                setActivePage('DASHBOARD');
              } else {
                const pass = prompt('Nhập mật khẩu Admin để vào Portal:');
                if (pass === 'admin123') {
                  setActivePage('ADMIN_PORTAL');
                } else if (pass !== null) {
                  alert('Mật khẩu không chính xác!');
                }
              }
            }}
            title={t('navAdminPortal')}
          >
            <Lock size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}

