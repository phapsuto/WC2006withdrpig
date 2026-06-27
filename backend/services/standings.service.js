const sportmonksService = require('./sportmonks.service');
const mapper = require('./sportmonks.mapper');

// Sportmonks detail type_ids
const TYPE = {
  PLAYED: 129,
  WON: 130,
  DRAW: 131,
  LOST: 132,
  GOALS_FOR: 133,
  GOALS_AGAINST: 134,
};

// WC2026 hardcoded season fallback (league 732)
const WC2026_SEASON_ID = 26618;

let standingsCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getDetail = (details, typeId) => {
  const d = (details || []).find(x => x.type_id === typeId);
  return d ? (parseInt(d.value) || 0) : 0;
};

exports.getStandings = async (leagueId = 732) => {
  const cacheKey = parseInt(leagueId);

  if (standingsCache[cacheKey] && (Date.now() - standingsCache[cacheKey].lastFetch < CACHE_TTL)) {
    return standingsCache[cacheKey].data;
  }

  // Step 1: Get league info + current season ID
  const leagueInfo = await sportmonksService.getLeagueInfo(leagueId);
  const currentSeason = leagueInfo?.currentSeason || leagueInfo?.current_season || null;

  // Fallback for WC2026 hardcoded season
  const seasonId = currentSeason?.id || (cacheKey === 732 ? WC2026_SEASON_ID : null);
  if (!seasonId) {
    throw new Error(`No active season found for league ${leagueId}`);
  }

  // Step 2: Fetch standings raw data from Sportmonks
  const rawData = await sportmonksService.getStandingsForSeason(seasonId);

  if (!rawData || rawData.length === 0) {
    throw new Error(`No standings data returned for season ${seasonId}`);
  }

  // Step 3: Map and group data
  const groups = {};
  rawData.forEach(entry => {
    const grpName = entry.group?.name || 'Bảng xếp hạng';
    if (!groups[grpName]) groups[grpName] = [];

    const team = entry.participant || {};
    const gf = getDetail(entry.details, TYPE.GOALS_FOR);
    const ga = getDetail(entry.details, TYPE.GOALS_AGAINST);

    groups[grpName].push({
      position: entry.position || 0,
      teamId: team.id,
      name: team.name || '?',
      short: team.short_code || (team.name || '???').substring(0, 3).toUpperCase(),
      logo: team.image_path || '',
      flag: mapper.resolveFlagCode(team),
      played: getDetail(entry.details, TYPE.PLAYED),
      won: getDetail(entry.details, TYPE.WON),
      draw: getDetail(entry.details, TYPE.DRAW),
      lost: getDetail(entry.details, TYPE.LOST),
      gf,
      ga,
      gd: gf - ga,
      points: entry.points || 0,
      result: entry.result || null, // 'champion', 'promoted', 'playoff', 'relegated', 'equal'
    });
  });

  // Sort each group by position
  Object.keys(groups).forEach(grp => {
    groups[grp].sort((a, b) => (a.position || 99) - (b.position || 99));
  });

  // Detect if this is group-stage league (WC) or single-table (domestic)
  const groupNames = Object.keys(groups);
  const isGroupStage = groupNames.length > 2 || groupNames.some(n => n.toLowerCase().includes('group'));

  const result = {
    groups,
    isGroupStage,
    seasonId,
    seasonName: currentSeason?.name || String(seasonId),
    leagueName: leagueInfo?.name || '',
    leagueLogo: leagueInfo?.image_path || '',
    leagueId: cacheKey,
  };

  standingsCache[cacheKey] = { data: result, lastFetch: Date.now() };
  console.log(`[Standings] Loaded ${rawData.length} entries for league ${leagueId}, season ${seasonId}`);

  return result;
};
