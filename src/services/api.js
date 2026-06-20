// Football API Integration Service — Sportmonks-first Data Layer
// Primary: SPORTMONKS API v3 | Fallback: cached data only (no worldcup26.ir)
import { subscribeToMatches } from './simulator';
import { TEAM_COLORS, STADIUMS_INFO, convertToUserTimezone, getLiveMatchesForApp, checkApiHealth } from './worldcup26api';
import { trackApiCall } from '../utils/apiTracker';
import { getGoogleSportsData } from './gemini';

// State management for API settings
let config = {
  apiMode: 'SMART', // 'SMART' (default), 'SPORTMONKS', 'LIVE_WC26', 'DEMO', 'AI_LIVE'
  sportmonksToken: '1fcudBrrac5U8DpQYl97jUeowGVDj74AGgniiz637ySI2v7ZFn0C8XpkJXoV',
  apiFootballKey: '',
  theOddsApiKey: '',
  geminiApiKey: ''
};

export const getActiveDataMode = () => {
  if (config.apiMode && config.apiMode !== 'SMART') {
    return config.apiMode;
  }
  // SMART mode dynamic resolution:
  if (config.sportmonksToken && config.sportmonksToken.trim()) {
    return 'SPORTMONKS';
  }
  return 'LIVE_WC26'; // Fallback to free live api when token is empty
};

// Load saved keys from localStorage if available
try {
  const savedConfig = localStorage.getItem('football_app_config');
  if (savedConfig) {
    const parsed = JSON.parse(savedConfig);
    config = { ...config, ...parsed };
    // CRITICAL: If a Sportmonks token is available (hardcoded or saved),
    // force SMART mode instead of stale DEMO mode from previous sessions
    if (config.sportmonksToken && config.sportmonksToken.trim() && config.apiMode === 'DEMO') {
      console.log('[Config] Sportmonks token detected but mode was DEMO. Forcing SMART mode.');
      config.apiMode = 'SMART';
      localStorage.setItem('football_app_config', JSON.stringify(config));
    }
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

// ────────────────────────────────────────────────────────────
// SPORTMONKS API INTEGRATION METHODS
// ────────────────────────────────────────────────────────────

const mapSportmonksLineup = (smLineup, teamId) => {
  if (!smLineup || !Array.isArray(smLineup)) return null;
  const starters = smLineup.filter(p => p.team_id === teamId && p.type_id === 11);
  if (starters.length === 0) return null;
  
  // Sportmonks v3: formation_field = "row:col" (e.g., "1:1"=GK, "2:1"-"2:4"=DF, "3:1"-"3:3"=MF, "4:1"-"4:3"=FW)
  // position_id: 24=GK, 25=DF, 26=MF, 27=FW/AM
  const getRole = (p) => {
    if (p.position_id === 24) return 'GK';
    if (p.position_id === 25) return 'DF';
    if (p.position_id === 26) return 'MF';
    if (p.position_id === 27 || p.position_id === 28) return 'FW';
    // Fallback: use formation_field row
    const field = p.formation_field || '';
    const row = parseInt(field.split(':')[0]) || 0;
    if (row === 1) return 'GK';
    if (row === 2) return 'DF';
    if (row === 3) return 'MF';
    if (row >= 4) return 'FW';
    return 'MF';
  };
  
  // Group by formation rows
  const rows = {};
  starters.forEach(p => {
    const field = p.formation_field || '1:1';
    const row = parseInt(field.split(':')[0]) || 1;
    const col = parseInt(field.split(':')[1]) || 1;
    if (!rows[row]) rows[row] = [];
    rows[row].push({ ...p, col, role: getRole(p) });
  });
  
  // Sort rows and map to pitch positions
  const sortedRowKeys = Object.keys(rows).map(Number).sort((a, b) => a - b);
  const mapped = [];
  
  sortedRowKeys.forEach((rowKey, rowIdx) => {
    const players = rows[rowKey].sort((a, b) => a.col - b.col);
    // Y position: GK at bottom (88%), defense ~72%, midfield ~50%, attack ~25%
    const yPositions = { 1: 88, 2: 72, 3: 50, 4: 28, 5: 18 };
    const y = yPositions[rowKey] || (88 - (rowIdx * 20));
    
    players.forEach((p, i) => {
      let x = 50;
      if (players.length > 1) {
        const xStart = 12;
        const xEnd = 88;
        x = xStart + ((xEnd - xStart) / (players.length - 1)) * i;
      }
      mapped.push({
        number: p.jersey_number || 0,
        name: p.player_name || 'Cầu thủ',
        role: p.role,
        x: Math.round(x),
        y: y
      });
    });
  });
  
  return mapped;
};

const parseSportmonksStats = (smStats, homeId) => {
  if (!smStats || !Array.isArray(smStats)) return null;
  const statsObj = {
    possession: { home: 50, away: 50 },
    xg: { home: 0.0, away: 0.0 },
    shots: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    attacks: { home: 0, away: 0 },
    dangerousAttacks: { home: 0, away: 0 },
    passes: { home: 0, away: 0 },
    accuratePasses: { home: 0, away: 0 },
    fouls: { home: 0, away: 0 },
    corners: { home: 0, away: 0 },
    offsides: { home: 0, away: 0 },
    saves: { home: 0, away: 0 },
    tackles: { home: 0, away: 0 },
    clearances: { home: 0, away: 0 },
    yellowCards: { home: 0, away: 0 },
    redCards: { home: 0, away: 0 }
  };
  smStats.forEach(stat => {
    // Sportmonks v3: value is in stat.data.value, type name in stat.type.developer_name
    const rawVal = stat.data?.value ?? stat.value ?? 0;
    const val = parseInt(rawVal) || 0;
    const isHome = stat.participant_id === homeId;
    const target = isHome ? 'home' : 'away';
    const devName = stat.type?.developer_name || '';
    
    switch (devName) {
      case 'BALL_POSSESSION':
        statsObj.possession[target] = val;
        statsObj.possession[isHome ? 'away' : 'home'] = 100 - val;
        break;
      case 'SHOTS_TOTAL':
        statsObj.shots[target] = val;
        break;
      case 'SHOTS_ON_TARGET':
        statsObj.shotsOnTarget[target] = val;
        break;
      case 'FOULS':
        statsObj.fouls[target] = val;
        break;
      case 'CORNERS':
        statsObj.corners[target] = val;
        break;
      case 'DANGEROUS_ATTACKS':
        statsObj.dangerousAttacks[target] = val;
        break;
      case 'ATTACKS':
        statsObj.attacks[target] = val;
        break;
      case 'PASSES':
        statsObj.passes[target] = val;
        break;
      case 'SUCCESSFUL_PASSES':
        statsObj.accuratePasses[target] = val;
        break;
      case 'OFFSIDES':
        statsObj.offsides[target] = val;
        break;
      case 'SAVES':
        statsObj.saves[target] = val;
        break;
      case 'TACKLES':
        statsObj.tackles[target] = val;
        break;
      case 'YELLOWCARDS':
        statsObj.yellowCards[target] = val;
        break;
      case 'REDCARDS':
        statsObj.redCards[target] = val;
        break;
      default:
        // Fallback: try numeric type_id for backwards compatibility
        switch (stat.type_id) {
          case 45: statsObj.possession[target] = val; break;
          case 42: statsObj.shots[target] = val; break;
          case 86: statsObj.shotsOnTarget[target] = val; break;
          case 56: statsObj.fouls[target] = val; break;
          case 34: statsObj.corners[target] = val; break;
          case 40: statsObj.dangerousAttacks[target] = val; break;
          case 41: statsObj.attacks[target] = val; break;
          case 38: statsObj.passes[target] = val; break;
          case 44: statsObj.offsides[target] = val; break;
          case 48: statsObj.saves[target] = val; break;
          case 49: statsObj.tackles[target] = val; break;
        }
    }
  });
  return statsObj;
};

const parseSportmonksEvents = (smEvents, homeId) => {
  if (!smEvents || !Array.isArray(smEvents)) return [];
  const mapped = [];
  const sortedEvents = [...smEvents].sort((a, b) => a.minute - b.minute);
  sortedEvents.forEach(evt => {
    const typeId = evt.type_id;
    let type = null;
    let detail = evt.player_name || 'Cầu thủ';
    if (typeId === 14) {
      type = 'GOAL';
    } else if (typeId === 15) {
      type = 'GOAL';
      detail += ' (o.g.)';
    } else if (typeId === 16) {
      type = 'GOAL';
      detail += ' (pen)';
    } else if (typeId === 19) {
      type = 'YELLOW';
    } else if (typeId === 20) {
      type = 'RED';
    } else if (typeId === 21) {
      type = 'RED';
    }
    if (type) {
      const isHome = evt.participant_id === homeId;
      mapped.push({
        minute: evt.minute || 0,
        type,
        team: isHome ? 'home' : 'away',
        detail
      });
    }
  });
  return mapped;
};

function findStadiumIdByVenueName(venueName) {
  if (!venueName) return "11"; // Default MetLife
  const nameLower = venueName.toLowerCase();
  for (const [id, info] of Object.entries(STADIUMS_INFO)) {
    if (nameLower.includes(info.name.toLowerCase()) || nameLower.includes(info.city.toLowerCase())) {
      return id;
    }
  }
  // Fallback to searching name parts
  for (const [id, info] of Object.entries(STADIUMS_INFO)) {
    const venueParts = info.name.toLowerCase().split(' ');
    for (const part of venueParts) {
      if (part.length > 3 && nameLower.includes(part)) {
        return id;
      }
    }
  }
  return "11";
}

const parseSportmonksOdds = (smOdds, status, homeScore, awayScore) => {
  const defaultHomeOdd = status === 'FINISHED' 
    ? (homeScore > awayScore ? 1.20 : homeScore === awayScore ? 2.80 : 4.50)
    : 1.85;
  const defaultDrawOdd = status === 'FINISHED'
    ? (homeScore === awayScore ? 1.20 : 2.80)
    : 3.40;
  const defaultAwayOdd = status === 'FINISHED'
    ? (awayScore > homeScore ? 1.20 : awayScore === homeScore ? 2.80 : 4.50)
    : 4.20;

  const odds = {
    h2h: { home: defaultHomeOdd, draw: defaultDrawOdd, away: defaultAwayOdd },
    handicap: { line: homeScore >= awayScore ? '-0.5' : '+0.5', home: 1.90, away: 1.90 },
    overUnder: { line: '2.5', over: 1.85, under: 1.95 }
  };

  const list = smOdds ? (Array.isArray(smOdds) ? smOdds : (smOdds.data && Array.isArray(smOdds.data) ? smOdds.data : [])) : [];
  if (list.length === 0) return odds;

  const oddsByMarket = {};
  list.forEach(odd => {
    const marketId = odd.market_id;
    if (marketId) {
      if (!oddsByMarket[marketId]) oddsByMarket[marketId] = [];
      oddsByMarket[marketId].push(odd);
    }
  });

  const h2hOdds = oddsByMarket[1] || [];
  if (h2hOdds.length > 0) {
    const preferred = h2hOdds.filter(o => o.bookmaker_id === 2);
    const targetList = preferred.length > 0 ? preferred : h2hOdds;
    
    const homeOdd = targetList.find(o => o.label === '1' || o.label?.toLowerCase() === 'home' || o.name?.toLowerCase() === 'home');
    const drawOdd = targetList.find(o => o.label === 'X' || o.label?.toLowerCase() === 'draw' || o.name?.toLowerCase() === 'draw');
    const awayOdd = targetList.find(o => o.label === '2' || o.label?.toLowerCase() === 'away' || o.name?.toLowerCase() === 'away');

    if (homeOdd && homeOdd.value) odds.h2h.home = parseFloat(parseFloat(homeOdd.value).toFixed(2));
    if (drawOdd && drawOdd.value) odds.h2h.draw = parseFloat(parseFloat(drawOdd.value).toFixed(2));
    if (awayOdd && awayOdd.value) odds.h2h.away = parseFloat(parseFloat(awayOdd.value).toFixed(2));
  }

  const ouOdds = oddsByMarket[12] || [];
  if (ouOdds.length > 0) {
    const preferred = ouOdds.filter(o => o.bookmaker_id === 2);
    const targetList = preferred.length > 0 ? preferred : ouOdds;

    const line25 = targetList.filter(o => o.total === '2.5' || o.total === 2.5 || o.value_2 === '2.5' || o.label?.includes('2.5') || o.name?.includes('2.5'));
    const overOdd = line25.find(o => o.label?.toLowerCase().includes('over') || o.name?.toLowerCase().includes('over'));
    const underOdd = line25.find(o => o.label?.toLowerCase().includes('under') || o.name?.toLowerCase().includes('under'));

    if (overOdd && overOdd.value) odds.overUnder.over = parseFloat(parseFloat(overOdd.value).toFixed(2));
    if (underOdd && underOdd.value) odds.overUnder.under = parseFloat(parseFloat(underOdd.value).toFixed(2));
  }

  const ahOdds = oddsByMarket[15] || [];
  if (ahOdds.length > 0) {
    const preferred = ahOdds.filter(o => o.bookmaker_id === 2);
    const targetList = preferred.length > 0 ? preferred : ahOdds;

    if (targetList.length >= 2) {
      const homeHandicap = targetList.find(o => o.label === '1' || o.label?.toLowerCase().includes('home') || o.name?.toLowerCase().includes('home'));
      const awayHandicap = targetList.find(o => o.label === '2' || o.label?.toLowerCase().includes('away') || o.name?.toLowerCase().includes('away'));
      if (homeHandicap && awayHandicap && homeHandicap.value && awayHandicap.value) {
        odds.handicap.line = homeHandicap.total || homeHandicap.handicap || '-0.5';
        odds.handicap.home = parseFloat(parseFloat(homeHandicap.value).toFixed(2));
        odds.handicap.away = parseFloat(parseFloat(awayHandicap.value).toFixed(2));
      }
    }
  }

  return odds;
};

const parseSportmonksPredictions = (smPredictions) => {
  const list = smPredictions ? (Array.isArray(smPredictions) ? smPredictions : (smPredictions.data && Array.isArray(smPredictions.data) ? smPredictions.data : [])) : [];
  if (list.length === 0) return null;

  let homeProb = null;
  let drawProb = null;
  let awayProb = null;
  let overProb = null;
  let underProb = null;

  for (const pred of list) {
    const pData = pred.predictions || pred.prediction || pred;
    if (pData && typeof pData === 'object') {
      if ('home' in pData && 'draw' in pData && 'away' in pData) {
        homeProb = parseFloat(pData.home);
        drawProb = parseFloat(pData.draw);
        awayProb = parseFloat(pData.away);
      } else if ('home_win' in pData && 'draw' in pData && 'away_win' in pData) {
        homeProb = parseFloat(pData.home_win);
        drawProb = parseFloat(pData.draw);
        awayProb = parseFloat(pData.away_win);
      } else if ('homeWin' in pData && 'draw' in pData && 'awayWin' in pData) {
        homeProb = parseFloat(pData.homeWin);
        drawProb = parseFloat(pData.draw);
        awayProb = parseFloat(pData.awayWin);
      }

      if ('over_2_5' in pData) {
        overProb = parseFloat(pData.over_2_5);
      } else if ('over25' in pData) {
        overProb = parseFloat(pData.over25);
      }
      if ('under_2_5' in pData) {
        underProb = parseFloat(pData.under_2_5);
      } else if ('under25' in pData) {
        underProb = parseFloat(pData.under25);
      }
    }
  }

  if (homeProb !== null && drawProb !== null && awayProb !== null) {
    if (homeProb <= 1.0 && drawProb <= 1.0 && awayProb <= 1.0) {
      homeProb = Math.round(homeProb * 100);
      drawProb = Math.round(drawProb * 100);
      awayProb = Math.round(awayProb * 100);
    } else {
      homeProb = Math.round(homeProb);
      drawProb = Math.round(drawProb);
      awayProb = Math.round(awayProb);
    }

    if (overProb !== null && underProb !== null) {
      if (overProb <= 1.0) {
        overProb = Math.round(overProb * 100);
        underProb = Math.round(underProb * 100);
      } else {
        overProb = Math.round(overProb);
        underProb = Math.round(underProb);
      }
    } else {
      overProb = 50;
      underProb = 50;
    }

    const scores = [];
    const expectedHomeGoals = homeProb / 100 * 2;
    const expectedAwayGoals = awayProb / 100 * 2;
    for (let h = 0; h <= 4; h++) {
      for (let a = 0; a <= 4; a++) {
        const pHome = (Math.pow(expectedHomeGoals, h) * Math.exp(-expectedHomeGoals)) / (factorial(h) || 1);
        const pAway = (Math.pow(expectedAwayGoals, a) * Math.exp(-expectedAwayGoals)) / (factorial(a) || 1);
        scores.push({
          score: `${h}-${a}`,
          prob: pHome * pAway
        });
      }
    }
    scores.sort((x, y) => y.prob - x.prob);
    const topScorelines = scores.slice(0, 3).map(s => ({
      score: s.score,
      percent: Math.round(s.prob * 100)
    }));

    return {
      probabilities: {
        homeWin: homeProb,
        draw: drawProb,
        awayWin: awayProb,
        over25: overProb,
        under25: underProb
      },
      analytics: {
        homeElo: 1500,
        awayElo: 1500,
        expectedHomeGoals: expectedHomeGoals.toFixed(1),
        expectedAwayGoals: expectedAwayGoals.toFixed(1),
        mostLikelyScore: topScorelines[0].score,
        topScorelines
      }
    };
  }

  return null;
};

// Help helper for factorial since not imported in this scope
const factorial = (n) => {
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
};

// ────────────────────────────────────────────────────────────
// PERSISTENT STORAGE — Match data saved permanently in localStorage
// On page load: show cached data instantly, then refresh from API in background
// ────────────────────────────────────────────────────────────
const CACHE_VERSION = 'v2_flags_fix'; // Bump this to force clear all stale caches
const STORAGE_KEY_MATCHES = 'wc2026_matches_data';
const STORAGE_KEY_MATCHES_TS = 'wc2026_matches_timestamp';
const STORAGE_KEY_STANDINGS = 'wc2026_standings_data';
const STORAGE_KEY_TOPSCORERS = 'wc2026_topscorers_data';

// Force clear ALL caches if version changed (one-time migration)
(() => {
  const storedVersion = localStorage.getItem('wc2026_cache_version');
  if (storedVersion !== CACHE_VERSION) {
    console.warn(`[Cache] Version mismatch: ${storedVersion} → ${CACHE_VERSION}. Clearing ALL caches.`);
    localStorage.removeItem(STORAGE_KEY_MATCHES);
    localStorage.removeItem(STORAGE_KEY_MATCHES_TS);
    localStorage.removeItem(STORAGE_KEY_STANDINGS);
    localStorage.removeItem(STORAGE_KEY_TOPSCORERS);
    localStorage.removeItem('wc2026_news_data');
    localStorage.removeItem('wc2026_news_timestamp');
    localStorage.setItem('wc2026_cache_version', CACHE_VERSION);
  }
})();

// Save match data to persistent storage (permanent, never auto-deleted)
const persistMatches = (matches) => {
  try {
    localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(matches));
    localStorage.setItem(STORAGE_KEY_MATCHES_TS, Date.now().toString());
  } catch (e) {
    console.warn('[Storage] Failed to persist matches:', e.message);
    // If quota exceeded, try to clear old data first
    try {
      localStorage.removeItem('wc2026_news_data'); // News can be re-fetched
      localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(matches));
      localStorage.setItem(STORAGE_KEY_MATCHES_TS, Date.now().toString());
    } catch (e2) {
      console.error('[Storage] Still failed after cleanup:', e2.message);
    }
  }
};

// Load match data from persistent storage
const loadPersistedMatches = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MATCHES);
    if (raw) {
      const matches = JSON.parse(raw);
      const ts = parseInt(localStorage.getItem(STORAGE_KEY_MATCHES_TS) || '0');
      // CACHE INVALIDATION: If most matches have flag='xx', the data was saved
      // with the old broken iso2 lookup. Clear it so fresh data is fetched.
      const brokenFlags = matches.filter(m => m.home?.flag === 'xx' || m.away?.flag === 'xx');
      if (brokenFlags.length > matches.length * 0.5 && matches.length > 0) {
        console.warn(`[Storage] Clearing stale cache: ${brokenFlags.length}/${matches.length} matches have broken flags`);
        localStorage.removeItem(STORAGE_KEY_MATCHES);
        localStorage.removeItem(STORAGE_KEY_MATCHES_TS);
        return [];
      }
      console.log(`[Storage] Loaded ${matches.length} cached matches (saved ${Math.round((Date.now() - ts) / 60000)} min ago)`);
      return matches;
    }
  } catch (e) {
    console.warn('[Storage] Failed to load persisted matches:', e.message);
  }
  return [];
};

// Persist standings data
const persistStandings = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY_STANDINGS, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore */ }
};

const loadPersistedStandings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STANDINGS);
    if (raw) {
      const { data } = JSON.parse(raw);
      // Invalidate if any team is missing 'flag' field (stale cache from before fix)
      if (data) {
        const firstGroup = Object.values(data)[0];
        if (firstGroup && firstGroup[0] && !firstGroup[0].flag) {
          console.warn('[Storage] Clearing stale standings cache (missing flag field)');
          localStorage.removeItem(STORAGE_KEY_STANDINGS);
          return null;
        }
      }
      return data;
    }
  } catch { /* ignore */ }
  return null;
};

// Persist topscorers data
const persistTopscorers = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY_TOPSCORERS, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore */ }
};

const loadPersistedTopscorers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TOPSCORERS);
    if (raw) {
      const { data } = JSON.parse(raw);
      return data;
    }
  } catch { /* ignore */ }
  return null;
};

// Module-level caches for Sportmonks optimization
// Initialize from persistent storage so data is available immediately
let cachedAllSportmonksMatches = loadPersistedMatches();
let lastFullFetchTime = cachedAllSportmonksMatches.length > 0 ? 1 : 0; // Mark as needing refresh but not empty
let lastSportmonksFailureTime = 0;
const SPORTMONKS_RETRY_DELAY = 5 * 60 * 1000; // 5 minutes

// Map Sportmonks team name → flagcdn code (Sportmonks has NO iso2 field on participants!)
const TEAM_NAME_TO_FLAG = {
  // Group A
  'Mexico': 'mx', 'South Africa': 'za', 'Korea Republic': 'kr', 'Czech Republic': 'cz',
  // Group B
  'Canada': 'ca', 'Bosnia and Herzegovina': 'ba', 'Bosnia Herzegovina': 'ba', 'Qatar': 'qa', 'Switzerland': 'ch',
  // Group C
  'Brazil': 'br', 'Morocco': 'ma', 'Haiti': 'ht', 'Scotland': 'gb-sct',
  // Group D
  'United States': 'us', 'USA': 'us', 'Paraguay': 'py', 'Australia': 'au', 'Turkey': 'tr', 'Türkiye': 'tr',
  // Group E
  'Germany': 'de', 'Curacao': 'cw', 'Curaçao': 'cw', "Côte d'Ivoire": 'ci', 'Ivory Coast': 'ci',
  // Group F
  'Ecuador': 'ec', 'Netherlands': 'nl', 'Japan': 'jp', 'Sweden': 'se',
  // Group G
  'Tunisia': 'tn', 'Belgium': 'be', 'Egypt': 'eg', 'New Zealand': 'nz',
  // Group H
  'Saudi Arabia': 'sa', 'Uruguay': 'uy', 'Spain': 'es', 'Cape Verde': 'cv', 'Cape Verde Islands': 'cv',
  // Group I
  'France': 'fr', 'Senegal': 'sn', 'Iraq': 'iq', 'Norway': 'no',
  // Group J
  'Argentina': 'ar', 'Algeria': 'dz', 'Austria': 'at', 'Jordan': 'jo',
  // Group K
  'Portugal': 'pt', 'DR Congo': 'cd', 'Democratic Republic of the Congo': 'cd', 'Croatia': 'hr', 'England': 'gb-eng',
  // Group L
  'Ghana': 'gh', 'Panama': 'pa', 'Uzbekistan': 'uz', 'Colombia': 'co',
  // Others
  'Iran': 'ir', 'Wales': 'gb-wls', 'Northern Ireland': 'gb-nir', 'Italy': 'it',
  'Poland': 'pl', 'Denmark': 'dk', 'Serbia': 'rs', 'Romania': 'ro', 'Hungary': 'hu',
  'Slovakia': 'sk', 'Finland': 'fi', 'Ireland': 'ie', 'Iceland': 'is', 'Albania': 'al',
  'Georgia': 'ge', 'Ukraine': 'ua', 'Russia': 'ru', 'China PR': 'cn', 'India': 'in',
  'Thailand': 'th', 'Vietnam': 'vn', 'Philippines': 'ph', 'Malaysia': 'my',
  'Singapore': 'sg', 'Indonesia': 'id', 'UAE': 'ae', 'Kuwait': 'kw',
  'Bahrain': 'bh', 'Oman': 'om', 'Lebanon': 'lb', 'Peru': 'pe', 'Chile': 'cl',
  'Nigeria': 'ng', 'Cameroon': 'cm', 'South Korea': 'kr',
};

const resolveFlagCode = (participant) => {
  if (!participant) return 'xx';
  // 1. Try team name mapping (most reliable)
  const byName = TEAM_NAME_TO_FLAG[participant.name];
  if (byName) return byName;
  // 2. Try short_code (e.g. 'FRA' → 'fr')
  if (participant.short_code) {
    const sc = participant.short_code.toLowerCase();
    // Map 3-letter FIFA codes to 2-letter ISO codes
    const FIFA_TO_ISO = {
      'kor': 'kr', 'mex': 'mx', 'rsa': 'za', 'cze': 'cz', 'can': 'ca',
      'bih': 'ba', 'qat': 'qa', 'sui': 'ch', 'bra': 'br', 'mar': 'ma',
      'hai': 'ht', 'sco': 'gb-sct', 'usa': 'us', 'par': 'py', 'aus': 'au',
      'tur': 'tr', 'ger': 'de', 'cur': 'cw', 'civ': 'ci', 'ecu': 'ec',
      'ned': 'nl', 'jpn': 'jp', 'swe': 'se', 'tun': 'tn', 'bel': 'be',
      'egy': 'eg', 'nzl': 'nz', 'ksa': 'sa', 'uru': 'uy', 'esp': 'es',
      'cpv': 'cv', 'fra': 'fr', 'sen': 'sn', 'irq': 'iq', 'nor': 'no',
      'arg': 'ar', 'alg': 'dz', 'aut': 'at', 'jor': 'jo', 'por': 'pt',
      'cod': 'cd', 'cro': 'hr', 'eng': 'gb-eng', 'gha': 'gh', 'pan': 'pa',
      'uzb': 'uz', 'col': 'co', 'irn': 'ir', 'wal': 'gb-wls',
    };
    if (FIFA_TO_ISO[sc]) return FIFA_TO_ISO[sc];
    // If short_code is 2 chars, use directly
    if (sc.length === 2) return sc;
  }
  // 3. Fallback: 'xx' (will hide flag gracefully via onError)
  return 'xx';
};

const mapSportmonksFixtureToApp = (fixture) => {
  const homeParticipant = fixture.participants?.find(p => p.meta && p.meta.location === 'home') || fixture.participants?.[0];
  const awayParticipant = fixture.participants?.find(p => p.meta && p.meta.location === 'away') || fixture.participants?.[1];
  const homeNameEn = homeParticipant?.name || 'Unknown';
  const awayNameEn = awayParticipant?.name || 'Unknown';
  // FIX: Sportmonks participants have NO iso2 field. Use team name/short_code mapping instead.
  const homeFlag = resolveFlagCode(homeParticipant);
  const awayFlag = resolveFlagCode(awayParticipant);
  // Also store Sportmonks team logo as fallback
  const homeLogo = homeParticipant?.image_path || '';
  const awayLogo = awayParticipant?.image_path || '';
  const homeColors = TEAM_COLORS[homeNameEn] || { color: '#333', textColor: '#fff' };
  const awayColors = TEAM_COLORS[awayNameEn] || { color: '#666', textColor: '#fff' };

  // Use state object if available (from include=state), else fall back to state_id
  const stateId = fixture.state_id;
  const stateDev = fixture.state?.developer_name;
  // Sportmonks actual state IDs: FT=5, AET=7, FT_PEN=8, AWARDED=17, WO=14
  const finishedStates = [5, 7, 8, 14, 17];
  const finishedDevNames = ['FT', 'AET', 'FT_PEN', 'AWARDED', 'WO', 'CANCELLED', 'ABANDONED'];
  // Sportmonks actual developer_names (from /v3/football/states):
  // INPLAY_1ST_HALF=2, HT=3, BREAK=4, INPLAY_ET=6, INPLAY_PENALTIES=9
  // SUSPENDED=11, INPLAY_2ND_HALF=22, INPLAY_ET_SECOND_HALF=23, EXTRA_TIME_BREAK=21, PEN_BREAK=25
  const liveStates = [2, 3, 4, 6, 9, 11, 15, 18, 21, 22, 23, 25];
  const liveDevNames = [
    'INPLAY_1ST_HALF', 'INPLAY_2ND_HALF', 'HT', 'BREAK',
    'INPLAY_ET', 'INPLAY_ET_2ND_HALF', 'EXTRA_TIME_BREAK',
    'INPLAY_PENALTIES', 'PEN_BREAK',
    'SUSPENDED', 'INTERRUPTED', 'DELAYED'
  ];
  let status = 'UPCOMING';
  if (stateDev) {
    if (finishedDevNames.includes(stateDev)) status = 'FINISHED';
    else if (liveDevNames.includes(stateDev)) status = 'LIVE';
  } else {
    if (finishedStates.includes(stateId)) status = 'FINISHED';
    else if (liveStates.includes(stateId)) status = 'LIVE';
  }

  // NEW: Parse scores correctly — Sportmonks v3 uses per-participant scores with score.goals
  let homeScore = 0;
  let awayScore = 0;
  if (fixture.scores && Array.isArray(fixture.scores)) {
    const currentScores = fixture.scores.filter(s => 
      s.description && s.description.toUpperCase() === 'CURRENT'
    );
    if (currentScores.length > 0) {
      for (const sc of currentScores) {
        if (sc.participant_id === homeParticipant?.id || sc.score?.participant === 'home') {
          homeScore = sc.score?.goals ?? 0;
        } else if (sc.participant_id === awayParticipant?.id || sc.score?.participant === 'away') {
          awayScore = sc.score?.goals ?? 0;
        }
      }
    } else if (fixture.scores.length > 0) {
      // Fallback: try old format (score.home/score.away)
      const firstScore = fixture.scores[0];
      if (firstScore?.score?.home !== undefined) {
        homeScore = firstScore.score.home ?? 0;
        awayScore = firstScore.score.away ?? 0;
      }
    }
  }
  
  let elapsedMinute = 0;
  let elapsedSecond = 0;
  if (fixture.periods && Array.isArray(fixture.periods) && fixture.periods.length > 0) {
    // Sportmonks uses 'ticking' field for active period, and 'minutes'/'seconds' for elapsed time
    const activePeriod = fixture.periods.find(p => p.ticking === true) || fixture.periods.find(p => p.is_active);
    if (activePeriod) {
      elapsedMinute = activePeriod.minutes || (activePeriod.counts_from + Math.floor((activePeriod.seconds_elapsed || 0) / 60));
      elapsedSecond = activePeriod.seconds || ((activePeriod.seconds_elapsed || 0) % 60);
    } else {
      // No active period (e.g., HT) — use the last completed period's minutes
      let maxMin = 0;
      for (const p of fixture.periods) {
        const min = p.minutes || (p.counts_from + Math.floor((p.seconds_elapsed || 0) / 60));
        if (min > maxMin) maxMin = min;
      }
      elapsedMinute = maxMin;
      elapsedSecond = 0;
    }
  }
  if (elapsedMinute === 0 && fixture.length) {
    if (status === 'FINISHED') elapsedMinute = fixture.length;
  }
  
  const timeline = parseSportmonksEvents(fixture.events, homeParticipant?.id);
  const stats = parseSportmonksStats(fixture.statistics, homeParticipant?.id);
  if (stats) {
    stats.yellowCards.home = timeline.filter(e => e.team === 'home' && e.type === 'YELLOW').length;
    stats.yellowCards.away = timeline.filter(e => e.team === 'away' && e.type === 'YELLOW').length;
    stats.redCards.home = timeline.filter(e => e.team === 'home' && e.type === 'RED').length;
    stats.redCards.away = timeline.filter(e => e.team === 'away' && e.type === 'RED').length;
  }
  let mappedLineups = null;
  if (fixture.lineups && Array.isArray(fixture.lineups)) {
    const homeLineup = mapSportmonksLineup(fixture.lineups, homeParticipant?.id);
    const awayLineup = mapSportmonksLineup(fixture.lineups, awayParticipant?.id);
    if (homeLineup || awayLineup) {
      mappedLineups = {
        home: homeLineup || [],
        away: awayLineup || []
      };
    }
  }
  
  const parsedOdds = parseSportmonksOdds(fixture.odds, status, homeScore, awayScore);
  const parsedPred = parseSportmonksPredictions(fixture.predictions);

  // Resolve group name from group include or cached groups
  const groupName = fixture.group?.name || fixture.group_name || '';

  return {
    id: `sm-${fixture.id}`,
    apiId: fixture.id,
    homeTeamId: homeParticipant?.id || null,
    awayTeamId: awayParticipant?.id || null,
    league: {
      name: groupName || `World Cup 2026`,
      country: 'USA/MEX/CAN'
    },
    home: {
      name: homeNameEn,
      nameEn: homeNameEn,
      short: homeParticipant?.short_code || homeNameEn.substring(0, 3).toUpperCase(),
      flag: homeFlag,
      logo: homeLogo,
      ...homeColors
    },
    away: {
      name: awayNameEn,
      nameEn: awayNameEn,
      short: awayParticipant?.short_code || awayNameEn.substring(0, 3).toUpperCase(),
      flag: awayFlag,
      logo: awayLogo,
      ...awayColors
    },
    homeScore,
    awayScore,
    status,
    minute: elapsedMinute,
    second: elapsedSecond,
    date: fixture.starting_at || '',
    group: groupName.replace('Group ', '') || '',
    stadiumId: findStadiumIdByVenueName(fixture.venue?.name),
    stats,
    timeline,
    lineups: mappedLineups,
    odds: parsedOdds,
    sportmonksPredictions: parsedPred,
    source: 'sportmonks'
  };
};

const getSportmonksUrl = (pathAndQuery, token) => {
  const base = import.meta.env.DEV ? '/api-proxy/sportmonks' : 'https://api.sportmonks.com';
  // CRITICAL: Use api_token query param instead of Authorization header
  // The Bearer header fails through Vite proxy and on CORS-restricted browsers
  const separator = pathAndQuery.includes('?') ? '&' : '?';
  return `${base}${pathAndQuery}${separator}api_token=${token}`;
};

// Helper to generate date strings for a range around today
const getDateRange = (daysBefore, daysAfter) => {
  const dates = [];
  const now = new Date();
  // Use UTC dates since Sportmonks returns UTC times
  for (let i = -daysBefore; i <= daysAfter; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(d.toISOString().split('T')[0]); // YYYY-MM-DD
  }
  return dates;
};

// Fetch all WC2026 fixtures using the optimized per-date endpoint
// Following Sportmonks best practices: use fixtures/date/{date} with fixtureLeagues filter
const fetchSportmonksMatches = async (token) => {
  try {
    // Strategy: fetch a window of dates around today to get all relevant matches
    // WC2026 runs 2026-06-11 to 2026-07-19
    const WC_START = new Date('2026-06-11');
    const WC_END = new Date('2026-07-19');
    const now = new Date();
    
    // Calculate days before/after to cover entire tournament
    const daysBefore = Math.max(0, Math.ceil((now - WC_START) / 86400000));
    const daysAfter = Math.max(0, Math.ceil((WC_END - now) / 86400000));
    
    // Cap at reasonable window to avoid too many API calls
    const actualBefore = Math.min(daysBefore, 10); // Last 10 days of played matches
    const actualAfter = Math.min(daysAfter, 10);    // Next 10 days of upcoming matches
    
    const dates = getDateRange(actualBefore, actualAfter);
    const allFixtures = [];
    
    // Include all data needed for match detail views
    const lightIncludes = 'participants;scores;state;venue;group;events;odds;lineups;statistics;periods';
    
    // Fetch all dates in parallel (within rate limit - max 3 concurrent)
    const BATCH_SIZE = 3;
    for (let i = 0; i < dates.length; i += BATCH_SIZE) {
      const batch = dates.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async (date) => {
        const url = getSportmonksUrl(
          `/v3/football/fixtures/date/${date}?filters=fixtureLeagues:732&include=${lightIncludes}&per_page=25`,
          token
        );
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeout);
          if (!response.ok) {
            console.warn(`[Sportmonks] Date ${date} returned ${response.status}`);
            return [];
          }
          trackApiCall('sportmonks');
          const resJson = await response.json();
          return resJson.data && Array.isArray(resJson.data) ? resJson.data : [];
        } catch (err) {
          clearTimeout(timeout);
          console.warn(`[Sportmonks] Date ${date} fetch failed:`, err.message);
          return [];
        }
      });
      const results = await Promise.all(promises);
      results.forEach(fixtures => allFixtures.push(...fixtures));
    }
    
    // Filter out placeholder fixtures (e.g. "Winner Match 85 vs Winner Match 87")
    const realFixtures = allFixtures.filter(f => !f.placeholder);
    
    console.log(`[Sportmonks] Fetched ${realFixtures.length} real WC2026 fixtures across ${dates.length} dates`);
    return realFixtures.map(mapSportmonksFixtureToApp);
  } catch (e) {
    console.error('Sportmonks Fetch Error:', e);
    return [];
  }
};

const fetchSportmonksInplayMatches = async (token) => {
  try {
    const url = getSportmonksUrl(
      `/v3/football/livescores/inplay?filters=fixtureLeagues:732&include=participants;scores;events;periods;statistics;state;venue;group`,
      token
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Sportmonks Live API error: ${response.status}`);
    trackApiCall('sportmonks');
    const resJson = await response.json();
    const list = resJson.data && Array.isArray(resJson.data) ? resJson.data : [];
    return list.map(mapSportmonksFixtureToApp);
  } catch (e) {
    console.error('Sportmonks Inplay Fetch Error:', e);
    return [];
  }
};

// ────────────────────────────────────────────────────────────
// SPORTMONKS DEDICATED ENDPOINTS (Standings, Topscorers, Detail, H2H)
// ────────────────────────────────────────────────────────────

// Cache for standings & topscorers — initialize from persistent storage
let standingsCache = { data: loadPersistedStandings(), timestamp: loadPersistedStandings() ? 1 : 0 };
let topscorersCache = { data: loadPersistedTopscorers(), timestamp: loadPersistedTopscorers() ? 1 : 0 };
let fixtureDetailCache = {}; // keyed by fixture ID
let h2hCache = {}; // keyed by 'teamA-teamB'

export const fetchSportmonksStandings = async () => {
  const token = config.sportmonksToken;
  if (!token) return null;
  
  // Cache 3 minutes
  if (standingsCache.data && (Date.now() - standingsCache.timestamp < 180000)) {
    return standingsCache.data;
  }
  
  try {
    const url = getSportmonksUrl(
      `/v3/football/standings/seasons/26618?include=participant;group;details&per_page=100`,
      token
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Standings API error: ${response.status}`);
    trackApiCall('sportmonks');
    const resJson = await response.json();
    const raw = resJson.data || [];
    
    // Transform to app-friendly format grouped by group
    const groups = {};
    raw.forEach(entry => {
      const grpName = entry.group?.name || 'Unknown';
      if (!groups[grpName]) groups[grpName] = [];
      
      // Extract stats from details array (type_id mapping)
      const details = entry.details || [];
      const getDetail = (typeId) => {
        const d = details.find(x => x.type_id === typeId);
        return d ? d.value : 0;
      };
      
      const team = entry.participant || {};
      groups[grpName].push({
        position: entry.position,
        teamId: team.id,
        name: team.name || '?',
        nameEn: team.name || '?',
        short: team.short_code || '???',
        flag: resolveFlagCode(team),
        logo: team.image_path || '',
        points: entry.points || 0,
        played: getDetail(129),
        won: getDetail(130),
        draw: getDetail(131),
        lost: getDetail(132),
        gf: getDetail(133),
        ga: getDetail(134),
        gd: getDetail(133) - getDetail(134),
        // form: last 5 results
        result: entry.result // 'equal', 'promoted', etc.
      });
    });
    
    // Sort each group by position
    Object.keys(groups).forEach(grp => {
      groups[grp].sort((a, b) => a.position - b.position);
    });
    
    standingsCache = { data: groups, timestamp: Date.now() };
    persistStandings(groups);
    console.log(`[Sportmonks] Standings loaded: ${Object.keys(groups).length} groups, ${raw.length} teams`);
    return groups;
  } catch (e) {
    console.error('[Sportmonks] Standings fetch error:', e);
    return standingsCache.data || loadPersistedStandings(); // Return stale cache if available
  }
};

export const fetchSportmonksTopscorers = async () => {
  const token = config.sportmonksToken;
  if (!token) return null;
  
  // Cache 10 minutes
  if (topscorersCache.data && (Date.now() - topscorersCache.timestamp < 600000)) {
    return topscorersCache.data;
  }
  
  try {
    const url = getSportmonksUrl(
      `/v3/football/topscorers/seasons/26618?include=player;participant&per_page=50`,
      token
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Topscorers API error: ${response.status}`);
    trackApiCall('sportmonks');
    const resJson = await response.json();
    const raw = resJson.data || [];
    
    // type_id 83 = goals, 84 = assists, 208 = yellow cards
    const goalScorers = raw.filter(s => s.type_id === 83);
    const assisters = raw.filter(s => s.type_id === 84);
    
    const mapScorer = (s) => {
      const player = s.player || {};
      const team = s.participant || {};
      return {
        playerId: player.id,
        name: player.display_name || player.common_name || player.name || '?',
        team: team.name || '?',
        teamEn: team.name || '?',
        teamLogo: team.image_path || '',
        playerImage: player.image_path || '',
        total: s.total || 0,
        position: player.position_id,
        nationality: player.nationality || ''
      };
    };
    
    const result = {
      goals: goalScorers.map(mapScorer).sort((a, b) => b.total - a.total),
      assists: assisters.map(mapScorer).sort((a, b) => b.total - a.total)
    };
    
    topscorersCache = { data: result, timestamp: Date.now() };
    persistTopscorers(result);
    console.log(`[Sportmonks] Topscorers loaded: ${result.goals.length} scorers, ${result.assists.length} assisters`);
    return result;
  } catch (e) {
    console.error('[Sportmonks] Topscorers fetch error:', e);
    return topscorersCache.data || loadPersistedTopscorers();
  }
};

export const fetchSportmonksFixtureDetail = async (fixtureApiId) => {
  const token = config.sportmonksToken;
  if (!token || !fixtureApiId) return null;
  
  // Cache 30 seconds for live, 5 minutes for finished
  const cached = fixtureDetailCache[fixtureApiId];
  if (cached && (Date.now() - cached.timestamp < 30000)) {
    return cached.data;
  }
  
  try {
    const url = getSportmonksUrl(
      `/v3/football/fixtures/${fixtureApiId}?include=participants;scores;events;periods;statistics.type;lineups;venue;group;predictions;odds;state`,
      token
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Fixture Detail API error: ${response.status}`);
    trackApiCall('sportmonks');
    const resJson = await response.json();
    const fixture = resJson.data;
    if (!fixture) return null;
    
    const mapped = mapSportmonksFixtureToApp(fixture);
    fixtureDetailCache[fixtureApiId] = { data: mapped, timestamp: Date.now() };
    console.log(`[Sportmonks] Fixture detail loaded for ${fixtureApiId}: ${mapped.home.name} vs ${mapped.away.name}`);
    return mapped;
  } catch (e) {
    console.error('[Sportmonks] Fixture detail error:', e);
    return cached?.data || null;
  }
};

export const fetchSportmonksH2H = async (team1Id, team2Id) => {
  const token = config.sportmonksToken;
  if (!token || !team1Id || !team2Id) return null;
  
  const cacheKey = `${Math.min(team1Id, team2Id)}-${Math.max(team1Id, team2Id)}`;
  const cached = h2hCache[cacheKey];
  if (cached && (Date.now() - cached.timestamp < 3600000)) { // Cache 1 hour
    return cached.data;
  }
  
  try {
    const url = getSportmonksUrl(
      `/v3/football/fixtures/head-to-head/${team1Id}/${team2Id}?include=participants;scores;state&per_page=10`,
      token
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`H2H API error: ${response.status}`);
    trackApiCall('sportmonks');
    const resJson = await response.json();
    const fixtures = resJson.data || [];
    
    const mapped = fixtures.map(f => {
      const home = f.participants?.find(p => p.meta?.location === 'home') || f.participants?.[0];
      const away = f.participants?.find(p => p.meta?.location === 'away') || f.participants?.[1];
      const currentScores = (f.scores || []).filter(s => s.description?.toUpperCase() === 'CURRENT');
      let hScore = 0, aScore = 0;
      for (const sc of currentScores) {
        if (sc.score?.participant === 'home') hScore = sc.score?.goals ?? 0;
        else if (sc.score?.participant === 'away') aScore = sc.score?.goals ?? 0;
      }
      return {
        id: f.id,
        date: f.starting_at,
        homeName: home?.name || '?',
        awayName: away?.name || '?',
        homeScore: hScore,
        awayScore: aScore,
        state: f.state?.developer_name || 'FT'
      };
    });
    
    h2hCache[cacheKey] = { data: mapped, timestamp: Date.now() };
    console.log(`[Sportmonks] H2H loaded: ${mapped.length} matches`);
    return mapped;
  } catch (e) {
    console.error('[Sportmonks] H2H fetch error:', e);
    return cached?.data || null;
  }
};

export const syncMatchesToServer = async (matches) => {
  if (!matches || matches.length === 0) return;
  try {
    const res = await fetch('/api/sync-matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(matches)
    });
    if (res.ok) {
      const data = await res.json();
      console.log('[Sync] Matches synced to server:', data);
    }
  } catch {
    // Fail silently, expected on mobile/production without local dev server
  }
};

// Consolidated real-time subscription with Intelligent Polling Manager (IPM)
export const subscribeToFootballData = (userCallback) => {
  const callback = (data) => {
    userCallback(data);
    syncMatchesToServer(data).catch(() => {});
  };
  const activeMode = getActiveDataMode();
  let timerId = null;
  let stopped = false;
  
  let simulatorFallback = null;
  let isUsingFallback = false;
  let lastValidMatches = loadPersistedMatches();
  
  // INSTANT LOAD: If we have cached data, deliver it immediately before first API call
  if (cachedAllSportmonksMatches.length > 0) {
    console.log(`[IPM] ⚡ Instant load: Delivering ${cachedAllSportmonksMatches.length} cached matches from storage`);
    callback(cachedAllSportmonksMatches);
    // Notify UI that we're online (using cached data)
    window.dispatchEvent(new CustomEvent('football-api-status', {
      detail: { online: true, message: 'Loaded from cache' }
    }));
  }
  
  const triggerFallback = (notes) => {
    // Notify the UI that there is an API connection issue
    window.dispatchEvent(new CustomEvent('football-api-status', {
      detail: { online: false, message: notes }
    }));

    // KHAI TỬ GIẢ LẬP: Nếu không phải chế độ DEMO, tuyệt đối KHÔNG chuyển sang hiển thị trận giả lập
    if (activeMode !== 'DEMO') {
      console.warn(`[API Fallback Suppressed] Mode: ${activeMode}. Lỗi: ${notes}`);
      // Trả về dữ liệu thực tế cuối cùng nếu có
      if (lastValidMatches.length > 0) {
        callback(lastValidMatches);
      }
      return;
    }

    if (!isUsingFallback) {
      isUsingFallback = true;
      simulatorFallback = subscribeToMatches((simData) => {
        callback(simData.map(m => ({
          ...m,
          source: 'simulator (fallback)',
          notes
        })));
      });
    }
  };

  const removeFallback = () => {
    // Notify the UI that connection is healthy
    window.dispatchEvent(new CustomEvent('football-api-status', {
      detail: { online: true, message: 'Connected' }
    }));
    if (simulatorFallback) {
      simulatorFallback();
      simulatorFallback = null;
      isUsingFallback = false;
    }
  };

  // Helper to determine next polling interval based on matches list
  const getNextInterval = (matchList) => {
    if (!matchList || matchList.length === 0) return 60000; // 1 minute default
    
    const hasLive = matchList.some(m => m.status === 'LIVE');
    if (hasLive) {
      const activeMode = getActiveDataMode();
      const delay = activeMode === 'SPORTMONKS' ? 5000 : 10000; // 5 seconds for optimized Sportmonks
      console.log(`[IPM] Phát hiện trận đấu TRỰC TIẾP! Tốc độ cào tăng cao: ${delay / 1000} giây/lần.`);
      return delay;
    }
    
    // Check if any match is starting in the next 15 minutes
    const now = Date.now();
    const hasSoon = matchList.some(m => {
      if (m.status !== 'UPCOMING') return false;
      const kickoffTime = convertToUserTimezone(m.date, m.stadiumId).getTime();
      const diffMin = (kickoffTime - now) / 60000;
      return diffMin > 0 && diffMin <= 15;
    });
    
    if (hasSoon) {
      console.log('[IPM] Phát hiện trận sắp đá (<= 15 phút)! Tốc độ cào trung bình: 30 giây/lần.');
      return 30000; // 30 seconds medium frequency
    }
    
    console.log('[IPM] Không có trận trực tiếp hoặc chuẩn bị đá. Tốc độ cào thấp: 2 phút/lần.');
    return 120000; // 2 minutes low frequency
  };

  const poll = async () => {
    if (stopped) return;
    
    let nextDelay;
    
    try {
      if (activeMode === 'SPORTMONKS') {
        if (!config.sportmonksToken) {
          triggerFallback('Vui lòng cấu hình Sportmonks API Token trong cài đặt 🐷');
          nextDelay = 30000;
        } else {
          const nowTime = Date.now();
          const isSportmonksDown = (nowTime - lastSportmonksFailureTime) < SPORTMONKS_RETRY_DELAY;
          
          let smMatches = [];
          let smCallSuccess = false;
          
          if (isSportmonksDown) {
            console.warn('[Sportmonks Circuit Breaker] Bỏ qua cào Sportmonks do các lỗi gần đây. Sử dụng thẳng worldcup26.ir...');
          } else {
            const needsFullFetch = cachedAllSportmonksMatches.length === 0 || (nowTime - lastFullFetchTime > 120000);
            
            try {
              if (needsFullFetch) {
                console.log('[Sportmonks] Đang cào toàn bộ danh sách trận đấu...');
                smMatches = await fetchSportmonksMatches(config.sportmonksToken);
                if (smMatches && smMatches.length > 0) {
                  cachedAllSportmonksMatches = smMatches;
                  lastFullFetchTime = nowTime;
                  smCallSuccess = true;
                  // PERSIST: Save to localStorage permanently
                  persistMatches(smMatches);
                  console.log(`[Storage] Persisted ${smMatches.length} matches to localStorage`);
                } else {
                  // If fetch returns empty, treat as failure (invalid token/CORS/network error)
                  lastSportmonksFailureTime = nowTime;
                }
              } else {
                // Check if there is any live match in the cache
                const hasLiveMatch = cachedAllSportmonksMatches.some(m => m.status === 'LIVE');
                if (hasLiveMatch) {
                  console.log('[Sportmonks] Phát hiện trận live. Tiến hành cào livescores in-play cực nhanh...');
                  const liveMatches = await fetchSportmonksInplayMatches(config.sportmonksToken);
                  
                  // Merge live matches into our cached full list
                  if (liveMatches && liveMatches.length > 0) {
                    cachedAllSportmonksMatches = cachedAllSportmonksMatches.map(cachedMatch => {
                      const updated = liveMatches.find(l => l.apiId === cachedMatch.apiId);
                      return updated || cachedMatch;
                    });
                  }
                }
                smMatches = cachedAllSportmonksMatches;
                smCallSuccess = true;
              }
            } catch (err) {
              console.error('[Sportmonks Poll Error]', err);
              lastSportmonksFailureTime = nowTime;
            }
          }
          
          if (smCallSuccess && cachedAllSportmonksMatches && cachedAllSportmonksMatches.length > 0) {
            removeFallback();
            lastValidMatches = cachedAllSportmonksMatches;
            callback(cachedAllSportmonksMatches);
            nextDelay = getNextInterval(cachedAllSportmonksMatches);
          } else {
            // Sportmonks failed — fallback to worldcup26.ir live API
            console.warn('[Sportmonks] API trả rỗng/lỗi, chuyển sang worldcup26.ir làm fallback...');
            try {
              const wcMatches = await getLiveMatchesForApp();
              if (wcMatches && wcMatches.length > 0) {
                removeFallback();
                lastValidMatches = wcMatches;
                persistMatches(wcMatches);
                callback(wcMatches);
                nextDelay = getNextInterval(wcMatches);
                console.log(`[Fallback] worldcup26.ir trả về ${wcMatches.length} trận thành công!`);
              } else if (lastValidMatches.length > 0) {
                callback(lastValidMatches);
                nextDelay = 30000;
              } else {
                triggerFallback('Sportmonks & worldcup26.ir đều tạm offline 🐷');
                nextDelay = 30000;
              }
            } catch (wcErr) {
              console.error('[worldcup26.ir fallback] Error:', wcErr);
              if (lastValidMatches.length > 0) {
                callback(lastValidMatches);
              } else {
                triggerFallback('Tất cả API đều tạm ngoại tuyến 🐷');
              }
              nextDelay = 30000;
            }
          }
        }
      } else if (activeMode === 'LIVE_WC26') {
        const health = await checkApiHealth();
        if (health.online) {
          const wcMatches = await getLiveMatchesForApp();
          if (wcMatches && wcMatches.length > 0) {
            removeFallback();
            lastValidMatches = wcMatches;
            callback(wcMatches);
            nextDelay = getNextInterval(wcMatches);
          } else {
            triggerFallback('Không có dữ liệu từ worldcup26.ir, hiển thị mô phỏng 🐷');
            nextDelay = 30000;
          }
        } else {
          triggerFallback('⚠️ worldcup26.ir tạm offline — hiển thị data mô phỏng');
          nextDelay = 30000;
        }
      } else if (activeMode === 'DEMO') {
        removeFallback();
        simulatorFallback = subscribeToMatches(callback);
        return; // Exit polling loop as simulator has its own timer
      } else if (activeMode === 'AI_LIVE') {
        const aiMatches = await getGoogleSportsData('MATCHES');
        if (aiMatches && aiMatches.length > 0) {
          removeFallback();
          lastValidMatches = aiMatches;
          callback(aiMatches);
          nextDelay = getNextInterval(aiMatches);
        } else {
          triggerFallback('Google Sports AI tạm thời ngoại tuyến, hiển thị mô phỏng 🐷');
          nextDelay = 30000;
        }
      } else {
        let fallbackMatches = [];
        if (config.apiFootballKey) {
          fallbackMatches = await fetchApiFootballMatches(config.apiFootballKey);
        } else if (config.theOddsApiKey) {
          fallbackMatches = await fetchTheOddsApiOdds(config.theOddsApiKey);
        }
        
        if (fallbackMatches.length === 0) {
          triggerFallback('Fallback: Real-time API key not responding or rate limited');
          nextDelay = 30000;
        } else {
          removeFallback();
          lastValidMatches = fallbackMatches;
          callback(fallbackMatches);
          nextDelay = getNextInterval(fallbackMatches);
        }
      }
    } catch (e) {
      console.error('[IPM] Lỗi trong quá trình cào dữ liệu, thử lại sau 30 giây:', e);
      triggerFallback('Lỗi kết nối dữ liệu bóng đá, hiển thị mô phỏng 🐷');
      nextDelay = 30000;
    }
    
    if (!stopped) {
      timerId = setTimeout(poll, nextDelay);
    }
  };

  poll();
  
  return () => {
    stopped = true;
    if (timerId) clearTimeout(timerId);
    removeFallback();
  };
};
