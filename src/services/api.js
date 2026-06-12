// Football API Integration Service (Dual-Mode Data Layer)
import { subscribeToMatches } from './simulator';
import { getGoogleSportsData } from './gemini';

// State management for API settings
let config = {
  apiMode: 'DEMO', // 'DEMO' or 'LIVE'
  apiFootballKey: '',
  theOddsApiKey: '',
  geminiApiKey: ''
};

// Load saved keys from localStorage if available
try {
  const savedConfig = localStorage.getItem('football_app_config');
  if (savedConfig) {
    config = { ...config, ...JSON.parse(savedConfig) };
  }
} catch (e) {
  console.warn('LocalStorage not accessible', e);
}

export const getApiConfig = () => ({ ...config });

export const saveApiConfig = (newConfig) => {
  config = { ...config, ...newConfig };
  try {
    localStorage.setItem('football_app_config', JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config', e);
  }
};

// Fetch real-time data from API-Football
const fetchApiFootballMatches = async (apiKey) => {
  try {
    const response = await fetch('https://v3.football.api-sports.io/fixtures?live=all', {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });
    if (!response.ok) throw new Error('API-Football network response error');
    const data = await response.json();
    
    // Map API-Football format to our unified schema
    return data.response.map((item) => ({
      id: item.fixture.id.toString(),
      league: {
        name: item.league.name,
        country: item.league.country
      },
      home: {
        name: item.teams.home.name,
        short: item.teams.home.name.substring(0, 3).toUpperCase()
      },
      away: {
        name: item.teams.away.name,
        short: item.teams.away.name.substring(0, 3).toUpperCase()
      },
      homeScore: item.goals.home ?? 0,
      awayScore: item.goals.away ?? 0,
      status: item.fixture.status.short === 'FT' ? 'FINISHED' : 'LIVE',
      minute: item.fixture.status.elapsed ?? 0,
      stats: null, // Additional endpoints required for statistics
      timeline: [], // Additional endpoints required for timeline
      lineups: null,
      odds: {
        h2h: { home: 1.85, draw: 3.40, away: 4.20 }, // Fallback odds
        handicap: { line: '-0.5', home: 1.90, away: 1.90 },
        overUnder: { line: '2.5', over: 1.85, under: 1.95 }
      }
    }));
  } catch (e) {
    console.error('API-Football Fetch Error:', e);
    return [];
  }
};

// Fetch real-time odds from The Odds API
const fetchTheOddsApiOdds = async (apiKey) => {
  try {
    const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${apiKey}&regions=uk,eu&markets=h2h,spreads,totals`);
    if (!response.ok) throw new Error('The Odds API network response error');
    const data = await response.json();
    
    // Map The Odds API format to our unified schema
    return data.map((item) => {
      // Find a bookmaker (e.g. Bet365 or Pinnacle)
      const bookmaker = item.bookmakers?.[0];
      const h2hMarket = bookmaker?.markets?.find(m => m.key === 'h2h');
      const spreadMarket = bookmaker?.markets?.find(m => m.key === 'spreads');
      const totalMarket = bookmaker?.markets?.find(m => m.key === 'totals');

      const homeOutcome = h2hMarket?.outcomes?.find(o => o.name === item.home_team);
      const awayOutcome = h2hMarket?.outcomes?.find(o => o.name === item.away_team);
      const drawOutcome = h2hMarket?.outcomes?.find(o => o.name === 'Draw');

      return {
        id: item.id,
        league: {
          name: item.sport_title,
          country: 'International'
        },
        home: {
          name: item.home_team,
          short: item.home_team.substring(0, 3).toUpperCase()
        },
        away: {
          name: item.away_team,
          short: item.away_team.substring(0, 3).toUpperCase()
        },
        homeScore: 0,
        awayScore: 0,
        status: 'UPCOMING',
        minute: 0,
        stats: null,
        timeline: [],
        lineups: null,
        odds: {
          h2h: {
            home: homeOutcome?.price ?? 1.85,
            draw: drawOutcome?.price ?? 3.40,
            away: awayOutcome?.price ?? 4.20
          },
          handicap: {
            line: spreadMarket?.outcomes?.[0]?.point?.toString() ?? '-0.5',
            home: spreadMarket?.outcomes?.[0]?.price ?? 1.90,
            away: spreadMarket?.outcomes?.[1]?.price ?? 1.90
          },
          overUnder: {
            line: totalMarket?.outcomes?.[0]?.point?.toString() ?? '2.5',
            over: totalMarket?.outcomes?.find(o => o.name === 'Over')?.price ?? 1.85,
            under: totalMarket?.outcomes?.find(o => o.name === 'Under')?.price ?? 1.95
          }
        }
      };
    });
  } catch (e) {
    console.error('The Odds API Fetch Error:', e);
    return [];
  }
};

// Consolidated real-time subscription
export const subscribeToFootballData = (callback) => {
  if (config.apiMode === 'DEMO') {
    // Falls back to simulator subscription
    return subscribeToMatches(callback);
  }

  let simulatorUnsubscribe = null;
  let isUsingFallback = false;

  const triggerFallback = (notes) => {
    if (!isUsingFallback) {
      isUsingFallback = true;
      simulatorUnsubscribe = subscribeToMatches((simData) => {
        callback(simData.map(m => ({
          ...m,
          notes
        })));
      });
    }
  };

  const removeFallback = () => {
    if (simulatorUnsubscribe) {
      simulatorUnsubscribe();
      simulatorUnsubscribe = null;
      isUsingFallback = false;
    }
  };

  if (config.apiMode === 'AI_LIVE') {
    const handler = async () => {
      try {
        const matches = await getGoogleSportsData('MATCHES');
        if (matches && matches.length > 0) {
          removeFallback();
          callback(matches);
        } else {
          triggerFallback('Google Sports AI tạm thời ngoại tuyến, hiển thị mô phỏng 🐷');
        }
      } catch (e) {
        console.error('Lỗi lấy dữ liệu AI Live:', e);
        triggerFallback('Google Sports AI lỗi, hiển thị mô phỏng 🐷');
      }
    };
    handler();
    const intervalId = setInterval(handler, 20000);
    return () => {
      clearInterval(intervalId);
      removeFallback();
    };
  }

  // If in LIVE mode, poll the active APIs every 10 seconds
  const handler = async () => {
    let matches = [];
    if (config.apiFootballKey) {
      matches = await fetchApiFootballMatches(config.apiFootballKey);
    } else if (config.theOddsApiKey) {
      matches = await fetchTheOddsApiOdds(config.theOddsApiKey);
    }
    
    // If API calls failed or empty, fallback to simulator to avoid blank screen
    if (matches.length === 0) {
      triggerFallback('Fallback: Real-time API key not responding or rate limited');
    } else {
      removeFallback();
      callback(matches);
    }
  };

  handler();
  const intervalId = setInterval(handler, 10000);
  return () => {
    clearInterval(intervalId);
    removeFallback();
  };
};
