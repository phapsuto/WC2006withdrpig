const betService = require('../services/bet.service');

exports.placeBet = async (req, res) => {
  try {
    const { matchId, betKey, betName, odds, amount } = req.body;
    const userId = req.user.id;
    const bet = await betService.placeBet(userId, matchId, { betKey, betName, odds, amount });
    res.json({ success: true, bet });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getUserBets = async (req, res) => {
  try {
    const bets = await betService.getUserBets(req.user.id);
    res.json({ success: true, bets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
