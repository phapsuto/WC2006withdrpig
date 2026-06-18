import { createContext, useContext, useState } from 'react';
import { TRANSLATIONS } from './languages';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // 1. Check user profile in localStorage first
    try {
      const savedUser = localStorage.getItem('wc2026_user_profile');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.language) {
          return parsed.language;
        }
      }
    } catch (e) {
      console.error('Failed to parse user profile for language', e);
    }
    // 2. Check standalone setting
    return localStorage.getItem('wc2026_language') || 'vi';
  });

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('wc2026_language', lang);
    
    // Also update logged-in user profile if exists
    try {
      const savedUser = localStorage.getItem('wc2026_user_profile');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.language = lang;
        localStorage.setItem('wc2026_user_profile', JSON.stringify(parsed));
      }
    } catch (e) {}
  };

  const t = (key, params = {}) => {
    let text = TRANSLATIONS[language]?.[key] || TRANSLATIONS['vi']?.[key] || key;
    Object.keys(params).forEach(p => {
      text = text.replace(`{${p}}`, params[p]);
    });
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
