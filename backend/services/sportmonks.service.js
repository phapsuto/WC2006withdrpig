const Config = require('../models/Config');

// Helper function to call Sportmonks v3
const fetchFromSportmonks = async (endpoint) => {
  const config = await Config.findOne({ singletonKey: 'GLOBAL_CONFIG' });
  const token = config?.sportmonksToken || process.env.SPORTMONKS_API_TOKEN;
  
  if (!token) throw new Error('Sportmonks token is missing');

  const baseUrl = 'https://api.sportmonks.com/v3/football';
  const url = `${baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_token=${token}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sportmonks API error: ${res.status}`);
  
  return await res.json();
};

exports.getFixtures = async (leagueId = 732) => {
  let allData = [];
  let page = 1;
  let hasMore = true;
  
  let startDate = '2026-06-11';
  let endDate = '2026-07-20';

  if (parseInt(leagueId) !== 732) {
    // For domestic leagues, fetch from 7 days ago to 14 days ahead
    const today = new Date();
    const past = new Date(today);
    past.setDate(today.getDate() - 7);
    const future = new Date(today);
    future.setDate(today.getDate() + 14);
    
    startDate = past.toISOString().split('T')[0];
    endDate = future.toISOString().split('T')[0];
  }

  while (hasMore) {
    const res = await fetchFromSportmonks(`/fixtures/between/${startDate}/${endDate}?page=${page}&include=participants;scores;events;state;group&filters=fixtureLeagues:${leagueId}`);
    allData = allData.concat(res.data || []);
    hasMore = res.pagination?.has_more || false;
    page++;
    if (page > 10) break; // Safeguard
  }
  return allData;
};

exports.getLiveFixtures = async (leagueId = 732) => {
  const data = await fetchFromSportmonks(`/livescores/inplay?include=participants;scores;events;state;group&filters=fixtureLeagues:${leagueId}`);
  return data.data || [];
};

// Fetch league + current season metadata (to show off-season status)
exports.getLeagueInfo = async (leagueId) => {
  try {
    const res = await fetchFromSportmonks(`/leagues/${leagueId}?include=currentSeason`);
    return res.data || null;
  } catch (e) {
    console.warn(`Could not fetch league info for leagueId=${leagueId}:`, e.message);
    return null;
  }
};

// Fetch standings for a specific season ID (paginated)
exports.getStandingsForSeason = async (seasonId) => {
  let allData = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetchFromSportmonks(
      `/standings/seasons/${seasonId}?include=participant;group;details&per_page=100&page=${page}`
    );
    allData = allData.concat(res.data || []);
    hasMore = res.pagination?.has_more || false;
    page++;
    if (page > 5) break; // safeguard
  }
  return allData;
};

// Fetch basic team info
exports.getTeamInfo = async (teamId) => {
  try {
    const res = await fetchFromSportmonks(`/teams/${teamId}?include=country`);
    return res.data || null;
  } catch (e) {
    console.warn(`Could not fetch team info for teamId=${teamId}:`, e.message);
    return null;
  }
};

// Fetch all fixtures for a team in a league (wide date range covers full season)
exports.getTeamFixturesByLeague = async (teamId, leagueId) => {
  const startDate = '2026-05-01'; // max 100 days for between endpoint
  const endDate   = '2026-07-31';

  let allData = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetchFromSportmonks(
      `/fixtures/between/${startDate}/${endDate}?filters=teamIds:${teamId};fixtureLeagues:${leagueId}&include=participants;scores;state;group&per_page=50&page=${page}`
    );
    allData = allData.concat(res.data || []);
    hasMore = res.pagination?.has_more || false;
    page++;
    if (page > 5) break;
  }
  return allData;
};

exports.getFixturesByDate = async (dateStr) => {
  let allData = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetchFromSportmonks(
      `/fixtures/date/${dateStr}?include=league.country;participants;scores;state&per_page=50&page=${page}`
    );
    allData = allData.concat(res.data || []);
    hasMore = res.pagination?.has_more || false;
    page++;
    if (page > 10) break; // safeguard
  }
  
  return allData;
};

// Fetch Full details for a single match (Game Center)
exports.getFixtureDetails = async (fixtureId) => {
  const inc = "league.country;participants;scores;state;events.type;lineups.player;statistics.type;comments;formations;coaches;referees;venue";
  const res = await fetchFromSportmonks(`/fixtures/${fixtureId}?include=${inc}`);
  return res.data;
};

// Fetch Player Profile
exports.getPlayerDetails = async (playerId) => {
  const inc = "statistics.details.type;teams.team;transfers.fromTeam;transfers.toTeam;transfers.type;trophies.trophy;trophies.league;position;country";
  const res = await fetchFromSportmonks(`/players/${playerId}?include=${inc}`);
  return res.data;
};

// Fetch Pre-Match Odds
exports.getPreMatchOdds = async (fixtureId) => {
  const res = await fetchFromSportmonks(`/odds/pre-match/fixtures/${fixtureId}`);
  return res.data || [];
};
