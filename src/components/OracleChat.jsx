import { useState, useEffect, useRef } from 'react';
import { generalChatWithHeoHong } from '../services/gemini';
import { useLanguage } from '../utils/LanguageContext';
import { Send, RefreshCw, Sparkles, Loader2 } from 'lucide-react';

export default function OracleChat() {
  const { language, t } = useLanguage();

  const suggestions = language === 'vi' ? [
    'Nhận định bảng A xem heo 🐷',
    'Đội tuyển Việt Nam có cơ hội đi tiếp không?',
    'Xin quẻ trận đấu HOT nhất hôm nay ⚽',
    'Tỉ số trận đấu khai mạc ra sao?',
    'Heo nghĩ đội nào vô địch World Cup 2026? 🏆'
  ] : [
    'Analyze Group A for me 🐷',
    'Does Vietnam have a chance to advance?',
    "Predict today's hottest match ⚽",
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
    <div className="flex flex-col h-[calc(100vh-160px)] min-h-[650px] bg-white rounded-[32px] shadow-[var(--shadow-dribbble)] border border-gray-100 overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 shadow-sm">
            <img src="/drpig_mascot.png" alt="Oracle Mascot" className="w-full h-full object-cover bg-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-main)] m-0 flex items-center gap-2">
              {t('oracleChatTitle')}
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold animate-pulse uppercase tracking-wider">
                {language === 'vi' ? 'AI Tiên Tri' : 'AI Oracle'}
              </span>
            </h2>
            <p className="text-xs text-[var(--color-text-sub)] font-medium m-0">{t('oracleSubTitle')}</p>
          </div>
        </div>
        <button 
          onClick={handleResetChat} 
          title={t('oracleResetTitle')}
          className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-[var(--color-primary)] transition-colors"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.length === 1 && (
          <div className="mb-4">
            <span className="text-xs text-[var(--color-text-sub)] font-semibold flex items-center gap-1.5 mb-3">
              <Sparkles size={14} className="text-yellow-500" /> {t('oracleSuggestionHeader')}
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleSend(s)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-full text-[13px] font-semibold text-[var(--color-text-main)] shadow-sm transition-all active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isModel = msg.role === 'model';
          return (
            <div 
              key={index} 
              className={`flex gap-3 max-w-[85%] ${isModel ? 'self-start' : 'self-end flex-row-reverse'}`}
            >
              {isModel && (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                  <img src="/drpig_mascot.png" alt="Oracle" className="w-full h-full object-cover bg-white" />
                </div>
              )}
              <div 
                className={`px-4 py-3 text-[14px] leading-relaxed font-medium shadow-sm ${
                  isModel 
                    ? 'bg-gray-50 border border-gray-100 text-[var(--color-text-main)] rounded-2xl rounded-tl-sm' 
                    : 'bg-[var(--color-primary)] text-white rounded-2xl rounded-tr-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-[85%] self-start">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
              <img src="/drpig_mascot.png" alt="Oracle" className="w-full h-full object-cover bg-white" />
            </div>
            <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm flex items-center gap-2 shadow-sm">
              <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" />
              <span className="text-[13px] font-medium text-[var(--color-text-sub)]">{t('oracleLoadingText')}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
          className="flex gap-2 items-center bg-gray-50 border border-gray-200 rounded-full p-1.5 focus-within:border-[var(--color-primary)] focus-within:bg-white transition-all shadow-inner"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('oraclePlaceholder')}
            disabled={loading}
            className="flex-1 bg-transparent px-4 py-2 text-[14px] font-medium text-[var(--color-text-main)] focus:outline-none placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ${
              !input.trim() || loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-[var(--color-primary)] hover:brightness-110 active:scale-95 shadow-md shadow-pink-500/30'
            }`}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
