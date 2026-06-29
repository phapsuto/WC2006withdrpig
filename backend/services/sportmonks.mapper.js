// Sportmonks Data Mapping Utilities

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

exports.resolveFlagCode = (participant) => {
  if (!participant) return 'xx';
  const byName = TEAM_NAME_TO_FLAG[participant.name];
  if (byName) return byName;
  if (participant.short_code) {
    const sc = participant.short_code.toLowerCase();
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
      'uzb': 'uz', 'col': 'co'
    };
    if (FIFA_TO_ISO[sc]) return FIFA_TO_ISO[sc];
  }
  return 'xx';
};

exports.parseSportmonksOdds = (smOdds, status, homeScore, awayScore) => {
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

exports.mapSportmonksMatch = (raw) => {
  // Use meta.location to correctly identify home/away — do NOT assume participants[0] is home
  const homePart = raw.participants?.find(p => p.meta?.location === 'home') || raw.participants?.[0] || {};
  const awayPart = raw.participants?.find(p => p.meta?.location === 'away') || raw.participants?.[1] || {};
  
  const homeScore = raw.scores?.find(s => s.participant_id === homePart.id && s.description === 'CURRENT')?.score?.goals || 0;
  const awayScore = raw.scores?.find(s => s.participant_id === awayPart.id && s.description === 'CURRENT')?.score?.goals || 0;
  
  const stateStr = raw.state?.state || 'NS';
  let status = 'UPCOMING';
  if (['IN_PLAY', 'HT', 'ET', 'PEN', 'BREAK', 'LIVE', '1ST', '2ND'].includes(stateStr)) status = 'LIVE';
  if (['FINISHED', 'FT_PEN', 'AET', 'FT'].includes(stateStr)) status = 'FINISHED';

  return {
    id: raw.id.toString(),
    league: {
      id: raw.league_id,
      name: raw.league?.name || 'World Cup 2026',
      country: raw.league?.country?.name || 'International',
      image: raw.league?.image_path || null
    },
    home: {
      name: homePart.name || 'TBA',
      short: homePart.short_code || homePart.name?.substring(0, 3).toUpperCase() || 'TBA',
      flag: exports.resolveFlagCode(homePart)
    },
    away: {
      name: awayPart.name || 'TBA',
      short: awayPart.short_code || awayPart.name?.substring(0, 3).toUpperCase() || 'TBA',
      flag: exports.resolveFlagCode(awayPart)
    },
    homeScore,
    awayScore,
    status,
    minute: raw.state?.minute || 0,
    date: new Date(raw.starting_at ? raw.starting_at.replace(' ', 'T') + 'Z' : new Date()),
    group: raw.group?.name?.replace('Group ', '') || 'A',
    round: raw.round?.name || null,
    stage: raw.stage?.name || null,
    stadiumId: raw.venue_id?.toString() || "11",
    odds: exports.parseSportmonksOdds(raw.odds, status, homeScore, awayScore)
  };
};
