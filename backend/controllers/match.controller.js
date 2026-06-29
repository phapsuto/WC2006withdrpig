const matchService = require('../services/match.service');
const sportmonksService = require('../services/sportmonks.service');

// Known league name map for display purposes (fallback)
const LEAGUE_NAMES = {
  732: 'World Cup 2026',
  8: 'Ngoại hạng Anh (Premier League)',
  564: 'La Liga',
  384: 'Serie A',
  82: 'Bundesliga',
  24: 'Ligue 1',
  2: 'Champions League',
  5: 'Europa League',
  132: 'Nhà Nghề Mỹ (MLS)',
  71: 'Brasileirão (Brazil)',
  206: 'J1 League (Nhật Bản)',
  29: 'K League 1 (Hàn Quốc)',
  142: 'V.League 1 (Việt Nam)',
  155: 'Primera División (Argentina)',
};

exports.getAllMatches = async (req, res) => {
  try {
    const leagueId = req.query.leagueId ? parseInt(req.query.leagueId) : 732;
    const matches = await matchService.getAllMatches(leagueId);

    let leagueStatus = 'ACTIVE';
    let seasonInfo = null;

    // If no matches found, try to get season metadata to explain why
    if (matches.length === 0) {
      try {
        const leagueInfo = await sportmonksService.getLeagueInfo(leagueId);
        
        if (leagueInfo) {
          // currentSeason may be nested under leagueInfo.currentSeason or leagueInfo.current_season
          const currentSeason = leagueInfo.currentSeason || leagueInfo.current_season || null;

          if (currentSeason) {
            const now = new Date();
            const startDate = currentSeason.starting_at ? new Date(currentSeason.starting_at) : null;
            const endDate = currentSeason.ending_at ? new Date(currentSeason.ending_at) : null;

            if (startDate && now < startDate) {
              leagueStatus = 'UPCOMING_SEASON'; // Mùa giải chưa bắt đầu
            } else if (endDate && now > endDate) {
              leagueStatus = 'OFF_SEASON'; // Mùa giải đã kết thúc, đang nghỉ hè
            } else {
              leagueStatus = 'NO_MATCHES_IN_RANGE'; // Đang trong mùa giải nhưng không có trận trong khoảng thời gian
            }

            seasonInfo = {
              name: currentSeason.name || null,
              startingAt: currentSeason.starting_at || null,
              endingAt: currentSeason.ending_at || null,
              status: currentSeason.status || null,
            };
          } else {
            leagueStatus = 'OFF_SEASON';
          }

          // Attach league name if available
          seasonInfo = {
            ...(seasonInfo || {}),
            leagueName: leagueInfo.name || LEAGUE_NAMES[leagueId] || 'Giải đấu',
          };
        } else {
          leagueStatus = 'OFF_SEASON';
        }
      } catch (infoError) {
        console.warn('Could not fetch league info:', infoError.message);
        leagueStatus = 'OFF_SEASON';
      }
    }

    res.json({ success: true, matches, leagueStatus, seasonInfo });
  } catch (error) {
    console.error('[Match Controller] getAllMatches error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMatchById = async (req, res) => {
  try {
    const match = await matchService.getMatchById(req.params.id);
    res.json({ success: true, match });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

exports.syncMatches = async (req, res) => {
  try {
    const leagueId = req.query.leagueId ? parseInt(req.query.leagueId) : undefined;
    const result = await matchService.syncMatches(leagueId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getGroupedMatches = async (req, res) => {
  try {
    const { date } = req.query;
    let dateStr = date;
    if (!dateStr || dateStr === 'today') {
      dateStr = new Date().toISOString().slice(0, 10);
    }
    const groupedData = await matchService.getGroupedMatches(dateStr);
    res.json({ success: true, data: groupedData });
  } catch (error) {
    console.error('Error in getGroupedMatches:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu trận đấu grouped' });
  }
};

exports.getMatchDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const matchDetails = await matchService.getRichMatchDetails(id);
    res.json({ success: true, data: matchDetails });
  } catch (error) {
    console.error('Error in getMatchDetails:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết trận đấu' });
  }
};

exports.getMatchOdds = async (req, res) => {
  try {
    const { id } = req.params;
    const odds = await matchService.getMatchOdds(id);
    res.json({ success: true, data: odds });
  } catch (error) {
    console.error('Error in getMatchOdds:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy tỷ lệ cược' });
  }
};

exports.simulateFinishMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { homeScore, awayScore } = req.body;
    
    const Match = require('../models/Match');
    const betService = require('../services/bet.service');
    
    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    
    // Simulate setting status to FINISHED and updating score
    match.status = 'FINISHED';
    match.score = {
      home: homeScore,
      away: awayScore
    };
    await match.save();
    
    // Call bet settlement
    await betService.settleBetsForMatch(id, homeScore, awayScore);
    
    res.json({ success: true, message: 'Đã giả lập kết thúc trận đấu và chốt cược thành công!', match });
  } catch (error) {
    console.error('Error in simulateFinishMatch:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const aiService = require('../services/aiService');

exports.getMatchAnalytics = async (req, res) => {
  const Match = require('../models/Match');
  try {
    const match = await Match.findOne({ id: req.params.id });
    if (!match) return res.status(404).json({ message: 'Match not found' });

    let ttlMs = 120000; // 2 min default for LIVE
    if (match.status === 'FINISHED') ttlMs = 24 * 60 * 60 * 1000 * 365; // 1 year
    if (match.status === 'UPCOMING') ttlMs = 180 * 60 * 1000; // 3 hours

    const queryHomeName = req.query.homeName;
    const queryAwayName = req.query.awayName;

    // Check if the actual names from frontend differ from the DB names (e.g. placeholder resolution)
    const nameChanged = (queryHomeName && queryHomeName !== match.home.name) || 
                        (queryAwayName && queryAwayName !== match.away.name);

    if (queryHomeName) {
      if (!match.home) match.home = {};
      match.home.name = queryHomeName;
    }
    if (queryAwayName) {
      if (!match.away) match.away = {};
      match.away.name = queryAwayName;
    }

    const now = new Date();
    // If the team names changed, we MUST bypass the cache and regenerate with the real names
    const isFresh = !nameChanged && match.aiAnalytics && match.aiAnalyticsUpdatedAt && (now - new Date(match.aiAnalyticsUpdatedAt) < ttlMs);

    if (isFresh) {
      return res.json(match.aiAnalytics);
    }

    // Need to regenerate. Fetch finished matches for team form context
    const allMatches = await Match.find({ status: 'FINISHED' }).lean();
    
    console.log(`[AI] Generating new analytics for match ${match.id} (${match.status})...`);
    const analytics = await aiService.generateMatchAnalytics(match, allMatches);
    
    match.aiAnalytics = analytics;
    match.aiAnalyticsUpdatedAt = now;
    await match.save();

    res.json(analytics);
  } catch (err) {
    console.error('Error generating AI analytics:', err);
    res.status(500).json({ message: err.message });
  }
};
