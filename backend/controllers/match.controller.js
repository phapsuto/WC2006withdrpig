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
