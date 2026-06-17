// Football API Integration Service (Multi-Mode Data Layer)
// Supports: LIVE_WC26 (worldcup26.ir), DEMO (simulator), LIVE (API-Football), AI_LIVE (Gemini), SPORTMONKS
import { subscribeToMatches } from './simulator';
import { getGoogleSportsData } from './gemini';
import { subscribeToLiveData, checkApiHealth, TEAM_NAME_VI, TEAM_COLORS, ISO2_TO_FLAG, STADIUMS_INFO, getLiveMatchesForApp, convertToUserTimezone } from './worldcup26api';
import { trackApiCall } from '../utils/apiTracker';

// State management for API settings
let config = {
  apiMode: 'SMART', // 'SMART' (default), 'SPORTMONKS', 'LIVE_WC26', 'DEMO', 'AI_LIVE'
  sportmonksToken: '',
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

// ────────────────────────────────────────────────────────────
// SPORTMONKS API INTEGRATION METHODS
// ────────────────────────────────────────────────────────────

const mapSportmonksLineup = (smLineup, teamId) => {
  if (!smLineup || !Array.isArray(smLineup)) return null;
  const starters = smLineup.filter(p => p.team_id === teamId && p.type_id === 11);
  if (starters.length === 0) return null;
  const gks = starters.filter(p => p.formation_field === 'goalkeeper');
  const dfs = starters.filter(p => p.formation_field === 'defense');
  const mfs = starters.filter(p => p.formation_field === 'midfield');
  const fws = starters.filter(p => p.formation_field === 'attack');
  const mapped = [];
  const mapGroup = (players, y, xStart, xRange) => {
    const N = players.length;
    players.forEach((p, i) => {
      let x = 50;
      if (N > 1) {
        x = xStart + (xRange / (N - 1)) * i;
      }
      mapped.push({
        number: p.jersey_number || 0,
        name: p.player_name || 'Cầu thủ',
        role: p.formation_field === 'goalkeeper' ? 'GK' : p.formation_field === 'defense' ? 'DF' : p.formation_field === 'midfield' ? 'MF' : 'FW',
        x: Math.round(x),
        y: y
      });
    });
  };
  mapGroup(gks, 88, 50, 0);
  mapGroup(dfs, 72, 15, 70);
  mapGroup(mfs, 50, 20, 60);
  mapGroup(fws, 22, 25, 50);
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
    const val = parseInt(stat.value) || 0;
    const isHome = stat.participant_id === homeId;
    const target = isHome ? 'home' : 'away';
    switch (stat.type_id) {
      case 45:
        statsObj.possession[target] = val;
        statsObj.possession[isHome ? 'away' : 'home'] = 100 - val;
        break;
      case 42:
        statsObj.shots[target] = val;
        break;
      case 86:
        statsObj.shotsOnTarget[target] = val;
        break;
      case 5304:
        statsObj.xg[target] = parseFloat(stat.value) || 0.0;
        break;
      case 56:
        statsObj.fouls[target] = val;
        break;
      case 34:
        statsObj.corners[target] = val;
        break;
      case 40:
        statsObj.dangerousAttacks[target] = val;
        break;
      case 41:
        statsObj.attacks[target] = val;
        break;
      case 38:
        statsObj.passes[target] = val;
        break;
      case 39:
        statsObj.accuratePasses[target] = val;
        break;
      case 44:
        statsObj.offsides[target] = val;
        break;
      case 48:
        statsObj.saves[target] = val;
        break;
      case 49:
        statsObj.tackles[target] = val;
        break;
      case 51:
        statsObj.clearances[target] = val;
        break;
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

// Module-level caches for Sportmonks optimization
let cachedAllSportmonksMatches = [];
let lastFullFetchTime = 0;

const mapSportmonksFixtureToApp = (fixture) => {
  const homeParticipant = fixture.participants?.find(p => p.meta && p.meta.location === 'home') || fixture.participants?.[0];
  const awayParticipant = fixture.participants?.find(p => p.meta && p.meta.location === 'away') || fixture.participants?.[1];
  const homeNameEn = homeParticipant?.name || 'Unknown';
  const awayNameEn = awayParticipant?.name || 'Unknown';
  const homeFlag = ISO2_TO_FLAG[homeParticipant?.iso2] || homeParticipant?.iso2?.toLowerCase() || 'xx';
  const awayFlag = ISO2_TO_FLAG[awayParticipant?.iso2] || awayParticipant?.iso2?.toLowerCase() || 'xx';
  const homeColors = TEAM_COLORS[homeNameEn] || { color: '#333', textColor: '#fff' };
  const awayColors = TEAM_COLORS[awayNameEn] || { color: '#666', textColor: '#fff' };
  const stateId = fixture.state_id;
  const finishedStates = [5, 7, 8, 14, 17];
  const liveStates = [2, 3, 4, 6, 9, 11, 15, 18, 21, 22, 25];
  let status = 'UPCOMING';
  if (finishedStates.includes(stateId)) {
    status = 'FINISHED';
  } else if (liveStates.includes(stateId)) {
    status = 'LIVE';
  }
  const currentScoreObj = fixture.scores?.find(s => s.description && s.description.toUpperCase() === 'CURRENT');
  const homeScore = currentScoreObj ? (currentScoreObj.score?.home ?? 0) : (fixture.scores?.[0]?.score?.home ?? 0);
  const awayScore = currentScoreObj ? (currentScoreObj.score?.away ?? 0) : (fixture.scores?.[0]?.score?.away ?? 0);
  
  let elapsedMinute = 0;
  let elapsedSecond = 0;
  if (fixture.periods && Array.isArray(fixture.periods)) {
    const activePeriod = fixture.periods.find(p => p.is_active);
    if (activePeriod) {
      elapsedMinute = activePeriod.counts_from + Math.floor((activePeriod.seconds_elapsed || 0) / 60);
      elapsedSecond = (activePeriod.seconds_elapsed || 0) % 60;
    } else {
      let maxMin = 0;
      for (const p of fixture.periods) {
        const min = p.counts_from + Math.floor((p.seconds_elapsed || 0) / 60);
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

  return {
    id: `sm-${fixture.id}`,
    apiId: fixture.id,
    league: {
      name: fixture.group?.name || fixture.group_name || `Bảng đấu • World Cup 2026`,
      country: 'USA/MEX/CAN'
    },
    home: {
      name: TEAM_NAME_VI[homeNameEn] || homeNameEn,
      nameEn: homeNameEn,
      short: homeParticipant?.short_code || homeNameEn.substring(0, 3).toUpperCase(),
      flag: homeFlag,
      ...homeColors
    },
    away: {
      name: TEAM_NAME_VI[awayNameEn] || awayNameEn,
      nameEn: awayNameEn,
      short: awayParticipant?.short_code || awayNameEn.substring(0, 3).toUpperCase(),
      flag: awayFlag,
      ...awayColors
    },
    homeScore,
    awayScore,
    status,
    minute: elapsedMinute,
    second: elapsedSecond,
    date: fixture.starting_at || '',
    group: fixture.group?.name?.replace('Group ', '') || fixture.group_name?.replace('Group ', '') || '',
    stadiumId: findStadiumIdByVenueName(fixture.venue?.name),
    stats,
    timeline,
    lineups: mappedLineups,
    odds: parsedOdds,
    sportmonksPredictions: parsedPred,
    source: 'sportmonks'
  };
};

const fetchSportmonksMatches = async (token) => {
  try {
    let allFixtures = [];
    let hasMore = true;
    let cursor = null;
    while (hasMore) {
      let url = `https://api.sportmonks.com/v3/football/seasons/26618/fixtures?include=participants;scores;events;periods;statistics.type;lineups;venue;group;predictions;odds&per_page=50`;
      if (cursor) {
        url += `&cursor=${cursor}`;
      }
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error(`Sportmonks API error: ${response.status}`);
      trackApiCall('sportmonks');
      const resJson = await response.json();
      if (resJson.data && Array.isArray(resJson.data)) {
        allFixtures = [...allFixtures, ...resJson.data];
      }
      if (resJson.meta && resJson.meta.pagination && resJson.meta.pagination.has_more) {
        cursor = resJson.meta.pagination.next_cursor;
      } else {
        hasMore = false;
      }
    }
    return allFixtures.map(mapSportmonksFixtureToApp);
  } catch (e) {
    console.error('Sportmonks Fetch Error:', e);
    return [];
  }
};

const fetchSportmonksInplayMatches = async (token) => {
  try {
    const url = `https://api.sportmonks.com/v3/football/livescores/inplay?include=participants;scores;events;periods;statistics.type;lineups;venue;group;predictions;odds`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error(`Sportmonks Live API error: ${response.status}`);
    trackApiCall('sportmonks');
    const resJson = await response.json();
    const list = resJson.data && Array.isArray(resJson.data) ? resJson.data : [];
    const wcList = list.filter(f => f.season_id === 26618);
    return wcList.map(mapSportmonksFixtureToApp);
  } catch (e) {
    console.error('Sportmonks Inplay Fetch Error:', e);
    return [];
  }
};

// Consolidated real-time subscription with Intelligent Polling Manager (IPM)
export const subscribeToFootballData = (callback) => {
  const activeMode = getActiveDataMode();
  let timerId = null;
  let stopped = false;
  
  let simulatorFallback = null;
  let isUsingFallback = false;
  
  const triggerFallback = (notes) => {
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
    
    let nextDelay = 30000; // Default next delay
    
    try {
      if (activeMode === 'SPORTMONKS') {
        if (!config.sportmonksToken) {
          triggerFallback('Vui lòng cấu hình Sportmonks API Token trong cài đặt 🐷');
          nextDelay = 30000;
        } else {
          const nowTime = Date.now();
          const needsFullFetch = cachedAllSportmonksMatches.length === 0 || (nowTime - lastFullFetchTime > 120000);
          
          if (needsFullFetch) {
            console.log('[Sportmonks] Đang cào toàn bộ danh sách trận đấu...');
            const smMatches = await fetchSportmonksMatches(config.sportmonksToken);
            if (smMatches && smMatches.length > 0) {
              cachedAllSportmonksMatches = smMatches;
              lastFullFetchTime = nowTime;
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
            } else {
              console.log('[Sportmonks] Không có trận live, bỏ qua cào livescores...');
            }
          }
          
          if (cachedAllSportmonksMatches && cachedAllSportmonksMatches.length > 0) {
            removeFallback();
            callback(cachedAllSportmonksMatches);
            nextDelay = getNextInterval(cachedAllSportmonksMatches);
          } else {
            triggerFallback('Sportmonks tạm thời ngoại tuyến, hiển thị mô phỏng 🐷');
            nextDelay = 30000;
          }
        }
      } else if (activeMode === 'LIVE_WC26') {
        const health = await checkApiHealth();
        if (health.online) {
          const wcMatches = await getLiveMatchesForApp();
          if (wcMatches && wcMatches.length > 0) {
            removeFallback();
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
