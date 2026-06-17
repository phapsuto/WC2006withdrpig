// worldcup26api.js — Live Data Integration from worldcup26.ir (Free Open-Source API)
// Source: https://github.com/rezarahiminia/worldcup2026
// No API key required for read access!

import { getTeamElo } from '../utils/aiPredictor';

export const STADIUMS_INFO = {
  "1": { name: "Estadio Azteca", city: "Mexico City", country: "Mexico", timezone: "America/Mexico_City", offset: -6 },
  "2": { name: "Estadio Akron", city: "Guadalajara", country: "Mexico", timezone: "America/Mexico_City", offset: -6 },
  "3": { name: "Estadio BBVA", city: "Monterrey", country: "Mexico", timezone: "America/Mexico_City", offset: -6 },
  "4": { name: "AT&T Stadium", city: "Dallas", country: "United States", timezone: "America/Chicago", offset: -5 },
  "5": { name: "NRG Stadium", city: "Houston", country: "United States", timezone: "America/Chicago", offset: -5 },
  "6": { name: "GEHA Field at Arrowhead Stadium", city: "Kansas City", country: "United States", timezone: "America/Chicago", offset: -5 },
  "7": { name: "Mercedes-Benz Stadium", city: "Atlanta", country: "United States", timezone: "America/New_York", offset: -4 },
  "8": { name: "Hard Rock Stadium", city: "Miami", country: "United States", timezone: "America/New_York", offset: -4 },
  "9": { name: "Gillette Stadium", city: "Boston", country: "United States", timezone: "America/New_York", offset: -4 },
  "10": { name: "Lincoln Financial Field", city: "Philadelphia", country: "United States", timezone: "America/New_York", offset: -4 },
  "11": { name: "MetLife Stadium", city: "New York/New Jersey", country: "United States", timezone: "America/New_York", offset: -4 },
  "12": { name: "BMO Field", city: "Toronto", country: "Canada", timezone: "America/Toronto", offset: -4 },
  "13": { name: "BC Place", city: "Vancouver", country: "Canada", timezone: "America/Vancouver", offset: -7 },
  "14": { name: "Lumen Field", city: "Seattle", country: "United States", timezone: "America/Los_Angeles", offset: -7 },
  "15": { name: "Levi's Stadium", city: "San Francisco", country: "United States", timezone: "America/Los_Angeles", offset: -7 },
  "16": { name: "SoFi Stadium", city: "Los Angeles", country: "United States", timezone: "America/Los_Angeles", offset: -7 }
};

export function convertToUserTimezone(localDateStr, stadiumId) {
  if (!localDateStr) return new Date();
  
  const parts = localDateStr.split(' ');
  if (parts.length < 2) {
    return new Date(localDateStr);
  }
  
  const [datePart, timePart] = parts;
  let year, month, day, hour, minute;
  
  if (datePart.includes('/')) {
    // Format: MM/DD/YYYY HH:mm (worldcup26.ir and simulator)
    const [m, d, y] = datePart.split('/');
    year = parseInt(y, 10);
    month = parseInt(m, 10) - 1;
    day = parseInt(d, 10);
  } else if (datePart.includes('-')) {
    // Format: YYYY-MM-DD HH:mm:ss or YYYY-MM-DD HH:mm (Sportmonks)
    const [y, m, d] = datePart.split('-');
    year = parseInt(y, 10);
    month = parseInt(m, 10) - 1;
    day = parseInt(d, 10);
  } else {
    return new Date(localDateStr);
  }
  
  const timeUnits = timePart.split(':');
  hour = parseInt(timeUnits[0], 10);
  minute = parseInt(timeUnits[1], 10);
  
  const stadium = STADIUMS_INFO[stadiumId] || { offset: -4 };
  const offset = stadium.offset;
  
  let utcTimestamp;
  if (datePart.includes('-')) {
    // Sportmonks starting_at is in UTC already
    utcTimestamp = Date.UTC(year, month, day, hour, minute);
  } else {
    // localDateStr is local stadium time, so we need to subtract the offset to get UTC
    utcTimestamp = Date.UTC(year, month, day, hour, minute) - offset * 60 * 60 * 1000;
  }
  
  return new Date(utcTimestamp);
}

const BASE_URL = 'https://worldcup26.ir';

// Cache to avoid hammering the API
let cache = {
  teams: null,
  teamsTimestamp: 0,
  games: null,
  gamesTimestamp: 0,
  groups: null,
  groupsTimestamp: 0,
  stadiums: null,
  stadiumsTimestamp: 0,
};

const CACHE_TTL = {
  teams: 3600000,     // 1 hour (teams rarely change)
  stadiums: 3600000,  // 1 hour
  groups: 300000,     // 5 minutes (standings update after matches)
  games: 30000,       // 30 seconds (for live scores!)
};

// Vietnamese team name mapping
export const TEAM_NAME_VI = {
  'Mexico': 'Mexico', 'South Africa': 'Nam Phi', 'South Korea': 'Hàn Quốc',
  'Czech Republic': 'CH Séc', 'Canada': 'Canada', 'Bosnia and Herzegovina': 'Bosnia & Hz.',
  'Qatar': 'Qatar', 'Switzerland': 'Thụy Sĩ', 'Brazil': 'Brazil',
  'Morocco': 'Morocco', 'Haiti': 'Haiti', 'Scotland': 'Scotland',
  'United States': 'Mỹ', 'Paraguay': 'Paraguay', 'Australia': 'Úc',
  'Turkey': 'Thổ Nhĩ Kỳ', 'Germany': 'Đức', 'Curaçao': 'Curaçao',
  'Ivory Coast': 'Bờ Biển Ngà', 'Ecuador': 'Ecuador',
  'Netherlands': 'Hà Lan', 'Japan': 'Nhật Bản', 'Sweden': 'Thụy Điển',
  'Tunisia': 'Tunisia', 'Belgium': 'Bỉ', 'Egypt': 'Ai Cập',
  'Saudi Arabia': 'Ả Rập Saudi', 'Uruguay': 'Uruguay',
  'Spain': 'Tây Ban Nha', 'Cape Verde': 'Cape Verde',
  'France': 'Pháp', 'Senegal': 'Senegal', 'Iraq': 'Iraq',
  'Norway': 'Na Uy', 'Argentina': 'Argentina', 'Algeria': 'Algeria',
  'Austria': 'Áo', 'Jordan': 'Jordan',
  'Portugal': 'Bồ Đào Nha', 'DR Congo': 'Congo DR',
  'England': 'Anh', 'Croatia': 'Croatia',
  'Ghana': 'Ghana', 'Panama': 'Panama',
  'Uzbekistan': 'Uzbekistan', 'Colombia': 'Colombia',
  'Iran': 'Iran', 'New Zealand': 'New Zealand',
  'Democratic Republic of the Congo': 'Congo DR',
};

// Team color mapping
export const TEAM_COLORS = {
  'Mexico': { color: '#006847', textColor: '#ffffff' },
  'South Africa': { color: '#007749', textColor: '#ffffff' },
  'South Korea': { color: '#c60c30', textColor: '#ffffff' },
  'Czech Republic': { color: '#11457e', textColor: '#ffffff' },
  'Canada': { color: '#ff0000', textColor: '#ffffff' },
  'Bosnia and Herzegovina': { color: '#002395', textColor: '#ffffff' },
  'Qatar': { color: '#8b1a4a', textColor: '#ffffff' },
  'Switzerland': { color: '#ff0000', textColor: '#ffffff' },
  'Brazil': { color: '#009c3b', textColor: '#ffdf00' },
  'Morocco': { color: '#c1272d', textColor: '#ffffff' },
  'Haiti': { color: '#00209f', textColor: '#ffffff' },
  'Scotland': { color: '#003399', textColor: '#ffffff' },
  'United States': { color: '#002868', textColor: '#ffffff' },
  'Paraguay': { color: '#d52b1e', textColor: '#ffffff' },
  'Australia': { color: '#00843d', textColor: '#ffcd00' },
  'Turkey': { color: '#e30a17', textColor: '#ffffff' },
  'Germany': { color: '#000000', textColor: '#ffffff' },
  'Curaçao': { color: '#002b7f', textColor: '#ffffff' },
  'Ivory Coast': { color: '#ff8200', textColor: '#009a44' },
  'Ecuador': { color: '#ffd100', textColor: '#034ea2' },
  'Netherlands': { color: '#ff6600', textColor: '#ffffff' },
  'Japan': { color: '#000080', textColor: '#ffffff' },
  'Sweden': { color: '#006aa7', textColor: '#fecc00' },
  'Tunisia': { color: '#e70013', textColor: '#ffffff' },
  'Belgium': { color: '#ed2939', textColor: '#000000' },
  'Egypt': { color: '#c8102e', textColor: '#ffffff' },
  'Saudi Arabia': { color: '#006233', textColor: '#ffffff' },
  'Uruguay': { color: '#5CBFEB', textColor: '#ffffff' },
  'Spain': { color: '#ad1519', textColor: '#fabd00' },
  'Cape Verde': { color: '#003893', textColor: '#ffffff' },
  'France': { color: '#002395', textColor: '#ffffff' },
  'Senegal': { color: '#00853f', textColor: '#ffffff' },
  'Iraq': { color: '#007a3d', textColor: '#ffffff' },
  'Norway': { color: '#ef2b2d', textColor: '#ffffff' },
  'Argentina': { color: '#75aadb', textColor: '#ffffff' },
  'Algeria': { color: '#006233', textColor: '#ffffff' },
  'Austria': { color: '#ed2939', textColor: '#ffffff' },
  'Jordan': { color: '#000000', textColor: '#ffffff' },
  'Portugal': { color: '#006600', textColor: '#ff0000' },
  'DR Congo': { color: '#007fff', textColor: '#ce1126' },
  'Democratic Republic of the Congo': { color: '#007fff', textColor: '#ce1126' },
  'England': { color: '#ffffff', textColor: '#cf081f' },
  'Croatia': { color: '#ff0000', textColor: '#ffffff' },
  'Ghana': { color: '#006b3f', textColor: '#fcd116' },
  'Panama': { color: '#d21034', textColor: '#ffffff' },
  'Uzbekistan': { color: '#0099b5', textColor: '#ffffff' },
  'Colombia': { color: '#fcd116', textColor: '#003893' },
  'Iran': { color: '#239f40', textColor: '#ffffff' },
  'New Zealand': { color: '#000000', textColor: '#ffffff' },
};

// ISO2 → flagcdn code
export const ISO2_TO_FLAG = {
  'MX': 'mx', 'ZA': 'za', 'KR': 'kr', 'CZ': 'cz', 'CA': 'ca', 'BA': 'ba',
  'QA': 'qa', 'CH': 'ch', 'BR': 'br', 'MA': 'ma', 'HT': 'ht', 'SCO': 'gb-sct',
  'US': 'us', 'PY': 'py', 'AU': 'au', 'TR': 'tr', 'DE': 'de', 'CW': 'cw',
  'CI': 'ci', 'EC': 'ec', 'NL': 'nl', 'JP': 'jp', 'SE': 'se', 'TN': 'tn',
  'BE': 'be', 'EG': 'eg', 'SA': 'sa', 'UY': 'uy', 'ES': 'es', 'CV': 'cv',
  'FR': 'fr', 'SN': 'sn', 'IQ': 'iq', 'NO': 'no', 'AR': 'ar', 'DZ': 'dz',
  'AT': 'at', 'JO': 'jo', 'PT': 'pt', 'CD': 'cd', 'GB': 'gb-eng', 'HR': 'hr',
  'GH': 'gh', 'PA': 'pa', 'UZ': 'uz', 'CO': 'co',
  'IR': 'ir', 'NZ': 'nz',
};

// ────────────────────────────────────────────────────────────
// Generic fetch with caching
// ────────────────────────────────────────────────────────────
async function fetchWithCache(endpoint, cacheKey) {
  const now = Date.now();
  if (cache[cacheKey] && (now - cache[`${cacheKey}Timestamp`]) < CACHE_TTL[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`API Error ${response.status}`);
    const data = await response.json();
    cache[cacheKey] = data;
    cache[`${cacheKey}Timestamp`] = now;
    return data;
  } catch (error) {
    console.error(`[worldcup26api] Fetch error for ${endpoint}:`, error);
    // Return cached data if available, even if stale
    if (cache[cacheKey]) return cache[cacheKey];
    throw error;
  }
}

// ────────────────────────────────────────────────────────────
// Fetch raw data
// ────────────────────────────────────────────────────────────
export async function fetchLiveTeams() {
  const data = await fetchWithCache('/get/teams', 'teams');
  return data.teams || [];
}

export async function fetchLiveGames() {
  const data = await fetchWithCache('/get/games', 'games');
  return data.games || [];
}

export async function fetchLiveGroups() {
  const data = await fetchWithCache('/get/groups', 'groups');
  return data.groups || [];
}

export async function fetchLiveStadiums() {
  const data = await fetchWithCache('/get/stadiums', 'stadiums');
  return data.stadiums || [];
}

// ────────────────────────────────────────────────────────────
// Parse scorers string from API → timeline events
// Format: {"J. Quiñones 9'","R. Jiménez 67'"}
// ────────────────────────────────────────────────────────────
function parseScorers(scorersStr, team) {
  if (!scorersStr || scorersStr === 'null' || scorersStr === '{}') return [];
  
  const events = [];
  // Remove curly braces and split
  const cleaned = scorersStr.replace(/^\{|\}$/g, '');
  // Match patterns like "Name min'" or "Name min'(p)" or "Name min'(OG)"
  const matches = cleaned.match(/"([^"]+)"|"([^"]+)"|"([^"]+)"/g) || 
                  cleaned.match(/["""]([^"""]+)["""]/g) ||
                  cleaned.split(',').map(s => s.trim());
  
  for (const raw of matches) {
    const entry = raw.replace(/^["'"""]+|["'"""]+$/g, '').trim();
    if (!entry) continue;
    
    // Parse: "Name min'" or "Name min'(p)" or "Name min'+extra'"
    const minuteMatch = entry.match(/(\d+)'(?:\+(\d+)')?/);
    const isPenalty = /\(p\)/i.test(entry);
    const isOG = /\(OG\)/i.test(entry);
    
    const minute = minuteMatch ? parseInt(minuteMatch[1]) : 0;
    const extraMin = minuteMatch && minuteMatch[2] ? `+${minuteMatch[2]}` : '';
    const playerName = entry.replace(/\d+'(?:\+\d+')?(?:\s*\((?:p|OG)\))?/g, '').trim();
    
    let type = 'GOAL';
    let detail = playerName;
    if (isPenalty) detail += ' (pen)';
    if (isOG) { detail += ' (o.g.)'; type = 'GOAL'; }
    
    events.push({
      minute: minute,
      minuteDisplay: `${minute}'${extraMin}`,
      type,
      team,
      detail,
      isPenalty,
      isOwnGoal: isOG
    });
  }
  
  return events;
}

// ────────────────────────────────────────────────────────────
// Transform API data → App-compatible match format
// ────────────────────────────────────────────────────────────
export async function getLiveMatchesForApp() {
  const [rawGames, rawTeams] = await Promise.all([
    fetchLiveGames(),
    fetchLiveTeams()
  ]);
  
  // Build team lookup by ID
  const teamMap = {};
  for (const t of rawTeams) {
    teamMap[t.id] = t;
  }
  
  return rawGames.map(game => {
    const homeTeam = teamMap[game.home_team_id] || {};
    const awayTeam = teamMap[game.away_team_id] || {};
    
    const homeNameEn = homeTeam.name_en || game.home_team_name_en || 'Unknown';
    const awayNameEn = awayTeam.name_en || game.away_team_name_en || 'Unknown';
    
    const homeFlag = ISO2_TO_FLAG[homeTeam.iso2] || homeTeam.iso2?.toLowerCase() || 'xx';
    const awayFlag = ISO2_TO_FLAG[awayTeam.iso2] || awayTeam.iso2?.toLowerCase() || 'xx';
    
    const homeColors = TEAM_COLORS[homeNameEn] || { color: '#333', textColor: '#fff' };
    const awayColors = TEAM_COLORS[awayNameEn] || { color: '#666', textColor: '#fff' };
    
    // Determine match status
    let status = 'UPCOMING';
    let minute = 0;
    if (game.finished === 'TRUE' || game.time_elapsed === 'finished') {
      status = 'FINISHED';
      minute = 90;
    } else if (game.time_elapsed && game.time_elapsed !== 'notstarted') {
      status = 'LIVE';
      const elapsedMatch = game.time_elapsed.match(/\d+/);
      minute = elapsedMatch ? parseInt(elapsedMatch[0]) : 45;
    }
    
    const homeScore = parseInt(game.home_score) || 0;
    const awayScore = parseInt(game.away_score) || 0;
    
    // Parse timeline from scorers
    const homeGoalEvents = parseScorers(game.home_scorers, 'home');
    const awayGoalEvents = parseScorers(game.away_scorers, 'away');
    const timeline = [...homeGoalEvents, ...awayGoalEvents]
      .sort((a, b) => a.minute - b.minute);
    
    // Generate realistic stats based on ELO strengths and current score
    const homeElo = getTeamElo(homeNameEn);
    const awayElo = getTeamElo(awayNameEn);
    
    const minutesPlayed = status === 'FINISHED' ? 90 : Math.max(1, minute);
    const timeFraction = minutesPlayed / 90;
    
    const homePossBase = 50 + (homeElo - awayElo) / 15;
    let homePoss = Math.max(32, Math.min(68, Math.round(homePossBase + (Math.random() * 6 - 3))));
    
    // Winning team might drop possession to counter-attack
    if (homeScore > awayScore) homePoss = Math.max(35, homePoss - 3);
    if (awayScore > homeScore) homePoss = Math.min(65, homePoss + 3);
    
    const homeShotsBase = 5 + (homeElo - 1500) / 80;
    const awayShotsBase = 5 + (awayElo - 1500) / 80;
    
    const homeShots = Math.max(homeScore, Math.round((homeShotsBase * timeFraction) + (homeScore * 1.5) + Math.random() * 3));
    const awayShots = Math.max(awayScore, Math.round((awayShotsBase * timeFraction) + (awayScore * 1.5) + Math.random() * 3));
    
    const homeSOT = Math.max(homeScore, Math.round(homeScore + (homeShots - homeScore) * 0.35 + Math.random() * 1.5));
    const awaySOT = Math.max(awayScore, Math.round(awayScore + (awayShots - awayScore) * 0.35 + Math.random() * 1.5));

    const stats = status !== 'UPCOMING' ? {
      possession: { 
        home: homePoss, 
        away: 100 - homePoss
      },
      shots: { 
        home: homeShots, 
        away: awayShots 
      },
      shotsOnTarget: { 
        home: homeSOT, 
        away: awaySOT 
      },
      fouls: { 
        home: Math.round((8 + Math.floor(Math.random() * 8)) * timeFraction), 
        away: Math.round((8 + Math.floor(Math.random() * 8)) * timeFraction) 
      },
      corners: { 
        home: Math.round((2 + Math.floor(Math.random() * 6)) * timeFraction + homeShots * 0.2), 
        away: Math.round((2 + Math.floor(Math.random() * 6)) * timeFraction + awayShots * 0.2) 
      },
      yellowCards: { 
        home: Math.floor(Math.random() * 3), 
        away: Math.floor(Math.random() * 3) 
      },
      redCards: { home: 0, away: 0 }
    } : null;
    
    // Generate odds based on team strengths (simple heuristic)
    const homeOdd = status === 'FINISHED' 
      ? (homeScore > awayScore ? 1.20 : homeScore === awayScore ? 2.80 : 4.50)
      : (1.50 + Math.random() * 2.5);
    const drawOdd = 3.00 + Math.random() * 0.8;
    const awayOdd = status === 'FINISHED'
      ? (awayScore > homeScore ? 1.20 : awayScore === homeScore ? 2.80 : 4.50)
      : (1.50 + Math.random() * 2.5);
    
    return {
      id: `wc26-${game.id}`,
      apiId: game.id,
      league: {
        name: `Bảng ${game.group} • World Cup 2026`,
        country: 'USA/MEX/CAN'
      },
      home: {
        name: TEAM_NAME_VI[homeNameEn] || homeNameEn,
        nameEn: homeNameEn,
        short: homeTeam.fifa_code || homeNameEn.substring(0, 3).toUpperCase(),
        flag: homeFlag,
        ...homeColors
      },
      away: {
        name: TEAM_NAME_VI[awayNameEn] || awayNameEn,
        nameEn: awayNameEn,
        short: awayTeam.fifa_code || awayNameEn.substring(0, 3).toUpperCase(),
        flag: awayFlag,
        ...awayColors
      },
      homeScore,
      awayScore,
      status,
      minute,
      date: game.local_date,
      group: game.group,
      matchday: parseInt(game.matchday) || 1,
      stadiumId: game.stadium_id,
      stats,
      timeline,
      lineups: null, // API doesn't provide lineups
      odds: {
        h2h: { 
          home: parseFloat(homeOdd.toFixed(2)), 
          draw: parseFloat(drawOdd.toFixed(2)), 
          away: parseFloat(awayOdd.toFixed(2)) 
        },
        handicap: { 
          line: homeScore >= awayScore ? '-0.5' : '+0.5', 
          home: 1.85 + Math.random() * 0.2, 
          away: 1.85 + Math.random() * 0.2 
        },
        overUnder: { 
          line: '2.5', 
          over: 1.80 + Math.random() * 0.3, 
          under: 1.80 + Math.random() * 0.3 
        }
      },
      source: 'worldcup26.ir' // Mark data source
    };
  });
}

// ────────────────────────────────────────────────────────────
// Get live group standings for app
// ────────────────────────────────────────────────────────────
export async function getLiveGroupStandings() {
  const [rawGroups, rawTeams] = await Promise.all([
    fetchLiveGroups(),
    fetchLiveTeams()
  ]);
  
  const teamMap = {};
  for (const t of rawTeams) {
    teamMap[t.id] = t;
  }
  
  return rawGroups.map(group => {
    const teams = group.teams.map(t => {
      const teamInfo = teamMap[t.team_id] || {};
      const nameEn = teamInfo.name_en || `Team ${t.team_id}`;
      const flag = ISO2_TO_FLAG[teamInfo.iso2] || teamInfo.iso2?.toLowerCase() || 'xx';
      
      return {
        name: TEAM_NAME_VI[nameEn] || nameEn,
        nameEn,
        flag,
        fifaCode: teamInfo.fifa_code || '',
        mp: parseInt(t.mp) || 0,
        w: parseInt(t.w) || 0,
        d: parseInt(t.d) || 0,
        l: parseInt(t.l) || 0,
        gf: parseInt(t.gf) || 0,
        ga: parseInt(t.ga) || 0,
        gd: parseInt(t.gd) || 0,
        pts: parseInt(t.pts) || 0,
      };
    });
    
    // Sort by points, then GD, then GF
    teams.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    
    return {
      name: group.name,
      teams
    };
  });
}

// ────────────────────────────────────────────────────────────
// Subscribe to live data (polling)
// ────────────────────────────────────────────────────────────
export function subscribeToLiveData(callback, intervalMs = 30000) {
  let stopped = false;
  
  const poll = async () => {
    if (stopped) return;
    try {
      const matches = await getLiveMatchesForApp();
      if (matches && matches.length > 0) {
        callback(matches);
      }
    } catch (error) {
      console.error('[worldcup26api] Polling error:', error);
    }
  };
  
  // Initial fetch
  poll();
  
  // Set up polling
  const intervalId = setInterval(poll, intervalMs);
  
  // Return unsubscribe function
  return () => {
    stopped = true;
    clearInterval(intervalId);
  };
}

// ────────────────────────────────────────────────────────────
// Health check
// ────────────────────────────────────────────────────────────
export async function checkApiHealth() {
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/get/teams`);
    const latency = Date.now() - start;
    return {
      online: response.ok,
      latency,
      status: response.status,
      message: response.ok ? `worldcup26.ir OK (${latency}ms)` : `Error: ${response.status}`
    };
  } catch (error) {
    return {
      online: false,
      latency: -1,
      status: 0,
      message: `Offline: ${error.message}`
    };
  }
}

export default {
  fetchLiveTeams,
  fetchLiveGames,
  fetchLiveGroups,
  fetchLiveStadiums,
  getLiveMatchesForApp,
  getLiveGroupStandings,
  subscribeToLiveData,
  checkApiHealth,
};
