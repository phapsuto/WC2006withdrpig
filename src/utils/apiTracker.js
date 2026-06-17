const STORAGE_KEY = 'football_app_api_stats';

export const getApiStats = () => {
  try {
    const stats = localStorage.getItem(STORAGE_KEY);
    if (stats) {
      return JSON.parse(stats);
    }
  } catch (e) {
    console.error('Failed to parse API stats', e);
  }
  return {
    sportmonksCalls: 0,
    geminiInputTokens: 0,
    geminiOutputTokens: 0,
  };
};

export const saveApiStats = (stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save API stats', e);
  }
};

export const trackApiCall = (type, metadata = {}) => {
  const stats = getApiStats();
  if (type === 'sportmonks') {
    stats.sportmonksCalls = (stats.sportmonksCalls || 0) + 1;
  } else if (type === 'gemini') {
    const input = metadata.promptTokenCount || 0;
    const output = metadata.candidatesTokenCount || 0;
    stats.geminiInputTokens = (stats.geminiInputTokens || 0) + input;
    stats.geminiOutputTokens = (stats.geminiOutputTokens || 0) + output;
  }
  saveApiStats(stats);
  // Dispatch custom event to notify components (like AdminDashboard) of the update
  window.dispatchEvent(new Event('api-stats-updated'));
};

export const calculateGeminiCost = (inputTokens, outputTokens) => {
  // Gemini 2.5 Flash prices:
  // Input: $0.075 / 1,000,000 tokens
  // Output: $0.30 / 1,000,000 tokens
  const inputCost = (inputTokens / 1000000) * 0.075;
  const outputCost = (outputTokens / 1000000) * 0.30;
  const totalUSD = inputCost + outputCost;
  const totalVND = totalUSD * 25400; // Fixed rate 1 USD = 25,400 VND

  return {
    usd: totalUSD,
    vnd: totalVND,
  };
};

export const resetApiStats = () => {
  const initial = {
    sportmonksCalls: 0,
    geminiInputTokens: 0,
    geminiOutputTokens: 0,
  };
  saveApiStats(initial);
  window.dispatchEvent(new Event('api-stats-updated'));
};
