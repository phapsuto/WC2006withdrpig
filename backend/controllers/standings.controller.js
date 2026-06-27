const standingsService = require('../services/standings.service');

exports.getStandings = async (req, res) => {
  try {
    const leagueId = req.query.leagueId ? parseInt(req.query.leagueId) : 732;
    const standings = await standingsService.getStandings(leagueId);
    res.json({ success: true, standings, leagueId });
  } catch (error) {
    console.error('[Standings Controller] Error:', error.message);
    // Return a graceful empty response so frontend can show empty state
    res.json({
      success: false,
      standings: null,
      leagueId: req.query.leagueId || 732,
      error: error.message
    });
  }
};
