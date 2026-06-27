const sportmonksService = require('./sportmonks.service');
const mapper = require('./sportmonks.mapper');

exports.syncMatches = async (leagueId) => {
  try {
    // Clear entire cache, or just the specific leagueId entry
    if (leagueId) {
      delete matchesCache[leagueId];
    } else {
      matchesCache = {};
    }
    const matches = await exports.getAllMatches(leagueId || 732);
    return { success: true, count: matches.length };
  } catch (error) {
    console.error('Error syncing matches:', error);
    throw error;
  }
};

exports.syncLiveMatches = async (leagueId) => {
  try {
    // Clear entire cache to force fresh data
    matchesCache = {};
    const matches = await exports.getAllMatches(leagueId || 732);
    return { success: true, count: matches.length };
  } catch (error) {
    console.error('Error syncing live matches:', error);
    throw error;
  }
};

let matchesCache = {};
const CACHE_TTL = 30000; // 30 seconds cache

exports.getAllMatches = async (leagueId = 732) => {
  if (!matchesCache[leagueId]) {
    matchesCache[leagueId] = { data: null, lastFetch: 0 };
  }
  
  const cacheEntry = matchesCache[leagueId];
  if (cacheEntry.data && Date.now() - cacheEntry.lastFetch < CACHE_TTL) {
    return cacheEntry.data;
  }
  
  try {
    const rawFixtures = await sportmonksService.getFixtures(leagueId);
    const mappedMatches = rawFixtures.map(raw => mapper.mapSportmonksMatch(raw));
    
    cacheEntry.data = mappedMatches;
    cacheEntry.lastFetch = Date.now();
    
    return mappedMatches;
  } catch (error) {
    console.error('Error proxying to Sportmonks:', error);
    if (cacheEntry.data) return cacheEntry.data;
    throw error;
  }
};

exports.getMatchById = async (id, leagueId = 732) => {
  const matches = await exports.getAllMatches(leagueId);
  const match = matches.find(m => m.id === id);
  if (!match) throw new Error('Match not found');
  return match;
};

// --- Grouped Matches Logic for 365scores UI ---
exports.getGroupedMatches = async (dateStr) => {
  // Use cached ALL matches instead of querying sportmonks by date
  // This avoids hitting API limits and allows us to filter by Vietnam Timezone (GMT+7)
  const allMatches = await exports.getAllMatches(732);
  
  // dateStr is 'YYYY-MM-DD' requested by frontend
  const filteredMatches = allMatches.filter(m => {
    // Convert match UTC date to Vietnam time for accurate daily filtering
    const vnTime = new Date(m.date.getTime() + 7 * 60 * 60 * 1000);
    const mDateStr = vnTime.toISOString().split('T')[0];
    return mDateStr === dateStr;
  });

  const allLeaguesMap = new Map();
  const countryMap = new Map();

  // 1. Group all matches by league
  for (const match of filteredMatches) {
    const leagueId = match.league?.id || 732;
    const leagueName = match.league?.name || 'World Cup 2026';
    const countryName = match.league?.country || 'International';
    const countryId = 'intl';
    const leagueLogo = match.league?.image || null;
    const countryFlag = null;

    if (!allLeaguesMap.has(leagueId)) {
      allLeaguesMap.set(leagueId, {
        leagueId,
        leagueName,
        countryId,
        countryName,
        countryFlag,
        leagueLogo,
        matches: [],
        score: 0
      });
    }
    const l = allLeaguesMap.get(leagueId);
    l.matches.push(match);
    
    // Scoring logic
    l.score += 1; // +1 for each match
    if (match.status === 'LIVE') l.score += 5; // +5 for each LIVE match
  }

  // Prestige bonus to give popular leagues a slight edge over random leagues if they have same # of matches
  const PRESTIGE_LEAGUES = [8, 9, 564, 384, 82, 2, 5, 24, 71, 132, 206, 29, 142, 155]; 
  
  const leaguesArray = Array.from(allLeaguesMap.values());
  for (const l of leaguesArray) {
    if (l.leagueId === 732) {
      l.score += 1000; // World Cup gets massive boost to stay on top
    } else if (PRESTIGE_LEAGUES.includes(l.leagueId)) {
      l.score += 10; // Major prestige boost
    } else if (l.leagueName.toLowerCase().includes('premier') || l.leagueName.toLowerCase().includes('champions')) {
      l.score += 5; // Minor prestige boost based on name
    }
  }

  // 2. Sort by score descending, then by name alphabetically as tie-breaker
  leaguesArray.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.leagueName.localeCompare(b.leagueName);
  });

  // 3. Take top 6 as popular
  const finalPopular = [];
  leaguesArray.slice(0, 6).forEach(l => {
    if (l.leagueId === 732) {
      // Split World Cup matches into Groups so it "lists more out" (lists full wc nicely)
      const groupMap = new Map();
      l.matches.forEach(m => {
        const gName = m.group || 'Khác';
        if (!groupMap.has(gName)) {
          groupMap.set(gName, {
            leagueId: `732_${gName}`,
            leagueName: `World Cup 2026 - Bảng ${gName}`,
            countryName: 'International',
            leagueLogo: l.leagueLogo,
            matches: []
          });
        }
        groupMap.get(gName).matches.push(m);
      });
      // Sort groups alphabetically (A, B, C...)
      const sortedGroups = Array.from(groupMap.values()).sort((a, b) => a.leagueName.localeCompare(b.leagueName));
      finalPopular.push(...sortedGroups);
    } else {
      finalPopular.push({
        leagueId: l.leagueId,
        leagueName: l.leagueName,
        countryName: l.countryName,
        leagueLogo: l.leagueLogo,
        matches: l.matches
      });
    }
  });
  
  const popular = finalPopular;

  // 4. Group the rest by country
  const restLeagues = leaguesArray.slice(6);
  for (const l of restLeagues) {
    if (!countryMap.has(l.countryId)) {
      countryMap.set(l.countryId, {
        countryId: l.countryId,
        countryName: l.countryName,
        flagUrl: l.countryFlag,
        matchCount: 0,
        leagues: new Map()
      });
    }
    const c = countryMap.get(l.countryId);
    c.matchCount += l.matches.length;
    c.leagues.set(l.leagueId, {
      leagueId: l.leagueId,
      leagueName: l.leagueName,
      matches: l.matches
    });
  }

  const countries = Array.from(countryMap.values()).map(c => {
    return {
      ...c,
      leagues: Array.from(c.leagues.values())
    };
  });

  // Sort countries alphabetically
  countries.sort((a, b) => a.countryName.localeCompare(b.countryName));

  return { popular, countries };
};

// --- Rich Match Details Logic (Game Center) ---
exports.getRichMatchDetails = async (fixtureId) => {
  const raw = await sportmonksService.getFixtureDetails(fixtureId);
  if (!raw) throw new Error('Fixture not found');

  const baseMatch = mapper.mapSportmonksMatch(raw);

  // Correctly identify home team using meta.location
  const homeParticipant = raw.participants?.find(p => p.meta?.location === 'home') || raw.participants?.[0];
  const homeTeamId = homeParticipant?.id;

  // Map Lineups
  let lineups = { home: { starters: [], subs: [], coach: null, formation: null }, away: { starters: [], subs: [], coach: null, formation: null } };
  
  if (raw.lineups && Array.isArray(raw.lineups)) {
    raw.lineups.forEach(l => {
      const isHome = l.team_id === homeTeamId;
      const target = isHome ? lineups.home : lineups.away;
      const player = {
        id: l.player_id,
        name: l.player?.display_name || l.player_name,
        image: l.player?.image_path || null,
        number: l.jersey_number || '',
        position: l.position?.name || l.formation_position || 'Unknown',
        type: l.type_id === 11 ? 'starter' : 'sub', // 11 is typical starter type in V3
        grid: l.formation_field || null, // e.g. "1:1", "4:2"
      };
      if (player.type === 'starter' || l.formation_field) target.starters.push(player);
      else target.subs.push(player);
    });
  }

  // Coaches
  if (raw.coaches && Array.isArray(raw.coaches)) {
    raw.coaches.forEach(c => {
      const isHome = c.meta?.participant_id === homeTeamId;
      const target = isHome ? lineups.home : lineups.away;
      target.coach = { name: c.common_name || c.firstname + ' ' + c.lastname, image: c.image_path };
    });
  }

  // Formations
  if (raw.formations && Array.isArray(raw.formations)) {
    raw.formations.forEach(f => {
      const isHome = f.participant_id === homeTeamId;
      if (isHome) lineups.home.formation = f.formation;
      else lineups.away.formation = f.formation;
    });
  }

  // Map Events
  let events = [];
  if (raw.events && Array.isArray(raw.events)) {
    // Build a lookup of player images from lineups
    const playerImageMap = {};
    if (raw.lineups && Array.isArray(raw.lineups)) {
      raw.lineups.forEach(l => {
        if (l.player_id && l.player?.image_path) {
          playerImageMap[l.player_id] = l.player.image_path;
        }
      });
    }

    events = raw.events.map(e => ({
      id: e.id,
      minute: e.minute,
      extraMinute: e.extra_minute,
      type: e.type?.name || e.type?.developer_name || 'Unknown',
      playerId: e.player_id || null,
      playerName: e.player_name,
      playerImage: playerImageMap[e.player_id] || null,
      relatedPlayerId: e.related_player_id || null,
      relatedPlayerName: e.related_player_name,
      relatedPlayerImage: playerImageMap[e.related_player_id] || null,
      result: e.result || null, // e.g. "1 - 0" after a goal
      isHome: e.participant_id === homeTeamId
    })).sort((a, b) => a.minute - b.minute);
  }

  // Map Statistics from raw Sportmonks format
  let statistics = {};
  if (raw.statistics && Array.isArray(raw.statistics)) {
    // Correctly identify home participant
    const homeStatParticipant = raw.participants?.find(p => p.meta?.location === 'home') || raw.participants?.[0];
    
    raw.statistics.forEach(s => {
      const devName = s.type?.developer_name || s.type?.name || 'UNKNOWN';
      const isHomeStat = s.participant_id === homeStatParticipant?.id || s.location === 'home';
      const val = s.data?.value ?? 0;
      
      if (!statistics[devName]) statistics[devName] = { name: s.type?.name || devName, home: 0, away: 0 };
      if (isHomeStat) statistics[devName].home = val;
      else statistics[devName].away = val;
    });
  }

  // Parse Shots from comments for Shot Map
  let shots = [];
  if (raw.comments && Array.isArray(raw.comments)) {
    const homeName = baseMatch.home.name;
    const awayName = baseMatch.away.name;
    
    // Simple seeded random for consistent positions
    let shotSeed = 1;
    const seededRandom = () => {
      shotSeed = (shotSeed * 16807) % 2147483647;
      return (shotSeed - 1) / 2147483646;
    };

    raw.comments.forEach(c => {
      const text = c.comment || '';
      const textLower = text.toLowerCase();
      
      // Only process shot-related comments
      const isShotComment = textLower.includes('shot') || textLower.includes('attempt') || 
        (textLower.includes('goal!') && !textLower.includes('goal kick'));
      if (!isShotComment) return;

      // Determine result
      let result = 'missed';
      if (c.is_goal || textLower.includes('goal!') || textLower.includes('scores')) result = 'goal';
      else if (textLower.includes('saved') || textLower.includes('saves')) result = 'saved';
      else if (textLower.includes('blocked') || textLower.includes('block')) result = 'blocked';
      
      // Determine foot/body part
      let foot = 'right';
      if (textLower.includes('left-footed') || textLower.includes('left foot')) foot = 'left';
      if (textLower.includes('headed') || textLower.includes('header') || textLower.includes('head')) foot = 'head';
      
      // Determine team
      let isHome = false;
      if (text.includes(homeName) || text.includes(`(${baseMatch.home.short})`)) isHome = true;
      else if (text.includes(awayName) || text.includes(`(${baseMatch.away.short})`)) isHome = false;
      // Try matching player names from lineups
      else {
        const homePlayerNames = (raw.lineups || []).filter(l => l.team_id === homeTeamId).map(l => l.player_name);
        for (const pn of homePlayerNames) {
          if (pn && text.includes(pn)) { isHome = true; break; }
        }
      }
      
      // Extract player name from comment text
      let playerName = '';
      // Match names including hyphenated parts (e.g. "Kim Min-Jae", "Oh Hyeon-Gyu")
      // Pattern: Capitalized word(s), optionally with hyphens, until we hit a stop word
      const namePatterns = [
        // "Name from Country" or "Name's shot" or "Name takes"
        /^([A-ZÀ-Ü][a-zà-ü\-']+(?:[\s\-][A-ZÀ-Ü][a-zà-ü\-']+)*)(?:\s+(?:from|takes|has|misses|scores|'s|\())/,
        // "Attempt saved/missed/blocked. Name from"
        /Attempt\s+\w+\.\s*([A-ZÀ-Ü][a-zà-ü\-']+(?:[\s\-][A-ZÀ-Ü][a-zà-ü\-']+)*)(?:\s+(?:from|\())/,
        // "saved. Name (Country)" or "saved. Name from"
        /saved\.\s*([A-ZÀ-Ü][a-zà-ü\-']+(?:[\s\-][A-ZÀ-Ü][a-zà-ü\-']+)*)/,
        // "missed by Name"
        /missed\s+by\s+([A-ZÀ-Ü][a-zà-ü\-']+(?:[\s\-][A-ZÀ-Ü][a-zà-ü\-']+)*)/i,
        // Fallback: first capitalized name sequence
        /^([A-ZÀ-Ü][a-zà-ü\-']+(?:[\s\-][A-ZÀ-Ü][a-zà-ü\-']+)*)/,
      ];
      for (const p of namePatterns) {
        const m = text.match(p);
        if (m && m[1] && m[1].length > 3 && !['Attempt', 'Goal', 'The', 'South', 'Korea'].includes(m[1])) {
          playerName = m[1]; break;
        }
      }
      // For goal comments: "Thapelo Maseko scores for South Africa"
      if (!playerName && textLower.includes('scores')) {
        const goalMatch = text.match(/([A-ZÀ-Ü][a-zà-ü\-']+(?:[\s\-][A-ZÀ-Ü][a-zà-ü\-']+)*)\s+scores/);
        if (goalMatch) playerName = goalMatch[1];
      }
      // Clean up name: remove trailing "'s", "from", possessive artifacts
      playerName = playerName.replace(/'s$/, '').replace(/\s+from$/, '').replace(/-$/, '').trim();
      
      // Try to match incomplete name against lineup for a full match
      if (playerName && raw.lineups) {
        const nameLower = playerName.toLowerCase();
        const bestMatch = raw.lineups.find(l => {
          const dn = (l.player?.display_name || l.player_name || '').toLowerCase();
          return dn === nameLower || dn.startsWith(nameLower) || dn.includes(nameLower) || nameLower.includes(dn);
        });
        if (bestMatch) {
          playerName = bestMatch.player?.display_name || bestMatch.player_name || playerName;
        }
      }
      
      // Determine zone and approximate coordinates
      // Pitch is 100x65 (width x height), goal at x=0 (home) and x=100 (away)
      // For shot map we place all shots oriented the same way (attacking left to right)
      let x, y;
      const jitter = () => (seededRandom() - 0.5) * 6; // small random offset
      
      if (textLower.includes('center of the box') || textLower.includes('centre of the box')) {
        x = 88 + jitter(); y = 32.5 + (seededRandom() - 0.5) * 14;
      } else if (textLower.includes('right side of the box') || textLower.includes('right of the box')) {
        x = 85 + jitter(); y = 18 + seededRandom() * 10;
      } else if (textLower.includes('left side of the box') || textLower.includes('left of the box')) {
        x = 85 + jitter(); y = 45 + seededRandom() * 10;
      } else if (textLower.includes('very close range')) {
        x = 94 + jitter() * 0.3; y = 32.5 + (seededRandom() - 0.5) * 8;
      } else if (textLower.includes('over 35 yards') || textLower.includes('long range')) {
        x = 60 + jitter(); y = 32.5 + (seededRandom() - 0.5) * 30;
      } else if (textLower.includes('outside the box') || textLower.includes('outside the area')) {
        x = 72 + jitter(); y = 32.5 + (seededRandom() - 0.5) * 28;
      } else {
        // Default: somewhere around the box
        x = 78 + jitter(); y = 32.5 + (seededRandom() - 0.5) * 20;
      }

      // Find player image from lineups
      let playerImage = null;
      if (playerName && raw.lineups) {
        const matchedLineup = raw.lineups.find(l => 
          l.player_name && (
            l.player_name === playerName || 
            l.player?.display_name === playerName ||
            playerName.includes(l.player_name?.split(' ').pop() || '___')
          )
        );
        if (matchedLineup) playerImage = matchedLineup.player?.image_path || null;
      }
      
      shots.push({
        minute: c.minute,
        extraMinute: c.extra_minute,
        playerName,
        playerImage,
        isHome,
        result,
        foot,
        x: Math.max(55, Math.min(98, x)),
        y: Math.max(3, Math.min(62, y)),
        description: text.substring(0, 150)
      });
    });
  }

  return {
    ...baseMatch,
    lineups,
    events,
    statistics,
    shots,
    referees: raw.referees?.map(r => r.name) || [],
    venue: raw.venue ? { name: raw.venue.name, city: raw.venue.city?.name, capacity: raw.venue.capacity, image: raw.venue.image_path } : null,
    comments: raw.comments?.map(c => ({ minute: c.minute, text: c.comment })) || []
  };
};

// ========== ODDS ==========
const MARKET_MAP = {
  1: { name: 'Kèo Châu Âu (1x2)', key: 'fulltime_result', order: 1 },
  2: { name: 'Cơ hội kép', key: 'double_chance', order: 2 },
  12: { name: 'Tài/Xỉu (2.5)', key: 'over_under_25', order: 3 },
  7: { name: 'Tài/Xỉu (Line)', key: 'goal_line', order: 4 },
  6: { name: 'Kèo Châu Á', key: 'asian_handicap', order: 5 },
  10: { name: 'Hoà trả tiền', key: 'draw_no_bet', order: 6 },
  14: { name: 'Cả hai đội ghi bàn', key: 'btts', order: 7 },
  31: { name: 'Kết quả hiệp 1', key: 'ht_result', order: 8 },
  29: { name: 'Hiệp 1 / Cả trận', key: 'ht_ft', order: 9 },
  57: { name: 'Tỷ số chính xác', key: 'correct_score', order: 10 },
};

const BOOKMAKER_MAP = {
  1: '10Bet', 2: 'bet365', 5: '888Sport', 9: 'Betfair', 12: 'BetVictor',
  13: 'Coral', 14: 'Dafabet', 16: 'Marathonbet', 20: 'Pinnacle', 23: 'Unibet',
  26: 'Betsson', 28: 'bwin', 29: 'WilliamHill', 32: 'Ladbrokes', 34: 'Sbo',
  35: '1xbet', 38: 'CloudBet', 57: 'Betano', 64: 'Novibet', 66: 'Tipico',
};

exports.getMatchOdds = async (fixtureId) => {
  try {
    const rawOdds = await sportmonksService.getPreMatchOdds(fixtureId);
    
    // Group by market_id -> bookmaker_id -> entries
    const grouped = {};
    for (const odd of rawOdds) {
      const mid = odd.market_id;
      const marketInfo = MARKET_MAP[mid];
      if (!marketInfo) continue; // Skip markets we don't care about
      
      const bid = odd.bookmaker_id;
      const bookmakerName = BOOKMAKER_MAP[bid] || `Bookmaker ${bid}`;
      
      if (!grouped[mid]) {
        grouped[mid] = { ...marketInfo, bookmakers: {} };
      }
      if (!grouped[mid].bookmakers[bid]) {
        grouped[mid].bookmakers[bid] = { name: bookmakerName, id: bid, entries: [] };
      }
      grouped[mid].bookmakers[bid].entries.push({
        label: odd.label,
        value: parseFloat(odd.value) || 0,
        handicap: odd.handicap || null,
        total: odd.total || null,
      });
    }

    // Convert to sorted array
    const markets = Object.values(grouped)
      .sort((a, b) => a.order - b.order)
      .map(m => ({
        key: m.key,
        name: m.name,
        bookmakers: Object.values(m.bookmakers).map(bk => ({
          id: bk.id,
          name: bk.name,
          entries: bk.entries.sort((a, b) => {
            // Sort: Home/1/Over before Draw/X before Away/2/Under
            const order = { 'Home': 0, '1': 0, 'Over': 0, 'Draw': 1, 'X': 1, 'Away': 2, '2': 2, 'Under': 2 };
            return (order[a.label] ?? 99) - (order[b.label] ?? 99);
          }),
        })),
      }));
    
    return { markets, totalOdds: rawOdds.length };
  } catch (error) {
    console.error('Error fetching match odds:', error);
    return { markets: [], totalOdds: 0 };
  }
};
