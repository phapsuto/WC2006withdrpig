import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { generalChatWithHeoHong } from '../services/gemini';
import { useLanguage } from '../utils/LanguageContext';

export default function OracleChat() {
  const { language, t } = useLanguage();

  const suggestions = language === 'vi' ? [
    'Nhận định bảng A xem heo 🐷',
    'Đội tuyển Việt Nam có cơ hội đi tiếp không?',
    'Dự đoán trận đấu HOT nhất hôm nay ⚽',
    'Tỉ số trận đấu khai mạc ra sao?',
    'Heo nghĩ đội nào vô địch World Cup 2026? 🏆'
  ] : [
    'Analyze Group A for me 🐷',
    'Does Vietnam have a chance to advance?',
    'Predict today\'s hottest match ⚽',
    'What will the opening score be?',
    'Who does Piggy think will win the World Cup? 🏆'
  ];

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('wc2026_oracle_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [{ role: 'model', text: t('oracleGreeting') }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'model') {
      const greeting = t('oracleGreeting');
      if (messages[0].text !== greeting) {
        setMessages([{ role: 'model', text: greeting }]);
      }
    }
  }, [language, t, messages]);

  useEffect(() => {
    try {
      localStorage.setItem('wc2026_oracle_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history', e);
    }
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    if (!textToSend) setInput('');
    
    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Pass history (excluding first welcoming message) and current message
      const historyForApi = newMessages.slice(1, -1);
      const reply = await generalChatWithHeoHong(historyForApi, text);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (error) {
      console.error('Chat error', error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: t('oracleErrorText')
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm(t('oracleResetConfirm'))) {
      setMessages([{ role: 'model', text: t('oracleGreeting') }]);
      localStorage.removeItem('wc2026_oracle_chat_history');
    }
  };

  return (
    <div className="bento-glass p-4 md:p-6 flex flex-col h-[calc(100vh-160px)] md:h-[650px] relative overflow-hidden">
      {/* Decorative Accent Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-tertiary-container/5 to-primary-fixed/5 pointer-events-none z-0"></div>

      {/* Header section */}
      <div className="flex justify-between items-center pb-3 border-b border-white/40 mb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-accent-gold shadow-md flex-shrink-0 relative bg-white flex items-center justify-center">
            <img 
              src="/drpig_mascot.png" 
              alt="Heo Hồng" 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100'; }}
            />
          </div>
          <div>
            <h3 className="text-sm font-black text-on-surface flex items-center gap-1.5">
              <span>{t('oracleChatTitle')}</span>
              <span className="px-1.5 py-0.5 rounded bg-secondary-container/20 text-secondary text-[9px] font-bold uppercase animate-pulse">{language === 'vi' ? 'AI Tiên Tri' : 'AI Oracle'}</span>
            </h3>
            <p className="text-[10px] text-on-surface-variant">{t('oracleSubTitle')}</p>
          </div>
        </div>
        <button
          onClick={handleResetChat}
          className="p-2 text-on-surface-variant hover:text-secondary hover:bg-white/45 rounded-xl border border-transparent hover:border-white/50 transition-all flex items-center justify-center"
          title={t('oracleResetTitle')}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Suggestion Chips (only show when there's only 1 message) */}
      {messages.length === 1 && (
        <div className="mb-4 z-10 animate-fade-in">
          <span className="text-[10px] font-bold text-on-surface-variant/75 flex items-center gap-1 mb-2">
            <Sparkles size={11} className="text-tertiary" /> {t('oracleSuggestionHeader')}
          </span>
          <div className="flex flex-wrap gap-2 max-h-[90px] overflow-y-auto no-scrollbar">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-white/60 dark:border-white/10 hover:border-primary/20 text-[11px] font-semibold text-on-surface-variant hover:text-primary transition-all text-left shadow-sm active:scale-95 duration-200"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message List area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-4 z-10 no-scrollbar">
        {messages.map((msg, index) => {
          const isModel = msg.role === 'model';
          return (
            <div
              key={index}
              className={`flex items-start gap-2 max-w-[85%] ${
                isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'
              }`}
            >
              {isModel && (
                <div className="w-7 h-7 rounded-full overflow-hidden border border-accent-gold shadow-sm flex-shrink-0 bg-white flex items-center justify-center p-0.5">
                  <img 
                    src="/drpig_mascot.png" 
                    alt="Heo Hồng" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=80'; }}
                  />
                </div>
              )}
              <div
                className={`p-3.5 rounded-2xl text-[12px] leading-relaxed shadow-sm border ${
                  isModel
                    ? 'bg-white/65 dark:bg-white/5 border-white/80 dark:border-white/10 text-on-surface rounded-tl-sm'
                    : 'bg-primary text-white border-primary/25 rounded-tr-sm shadow-[inset_0px_2px_4px_rgba(255,255,255,0.2)]'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2 max-w-[85%] mr-auto">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-accent-gold shadow-sm flex-shrink-0 bg-white flex items-center justify-center p-0.5 animate-spin">
              <img src="/drpig_mascot.png" alt="Heo Hồng" className="w-full h-full object-cover" />
            </div>
            <div className="p-3.5 rounded-2xl text-[12px] leading-relaxed bg-white/65 dark:bg-white/5 border border-white/80 dark:border-white/10 text-on-surface-variant/75 rounded-tl-sm flex items-center gap-2">
              <Loader2 size={12} className="animate-spin text-primary" />
              <span>{t('oracleLoadingText')}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-auto flex items-center gap-2 pt-3 border-t border-white/30 z-10"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('oraclePlaceholder')}
          disabled={loading}
          className="flex-1 bg-white/50 dark:bg-white/5 focus:bg-white dark:focus:bg-white/10 text-[12px] border border-white/70 dark:border-white/10 focus:border-primary rounded-xl px-4 py-2.5 outline-none transition-all shadow-inner placeholder-on-surface-variant/55 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-10 h-10 bg-primary disabled:bg-primary-fixed/40 text-white disabled:text-on-primary-fixed/40 rounded-xl flex items-center justify-center hover:brightness-105 active:scale-95 transition-all shadow-md shadow-primary/10 disabled:shadow-none flex-shrink-0"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
