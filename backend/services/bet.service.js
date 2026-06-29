const Bet = require('../models/Bet');
const User = require('../models/User');
const Match = require('../models/Match');

exports.placeBet = async (userId, matchId, betData) => {
  // Validate match
  let match;
  if (matchId && matchId.toString().length === 24) {
    match = await Match.findById(matchId);
  } else {
    match = await Match.findOne({ id: matchId.toString() });
  }

  if (!match) {
    try {
      const matchService = require('./match.service');
      const fetchedMatch = await matchService.getMatchById(matchId.toString());
      if (fetchedMatch) {
        match = new Match(fetchedMatch);
        await match.save();
      }
    } catch (e) {
      console.warn('Auto-sync match for bet failed:', e.message);
    }
  }

  if (!match) throw new Error('Match not found');
  if (match.status !== 'UPCOMING' && match.status !== 'LIVE') {
    throw new Error('Trận đấu đã kết thúc hoặc không thể cược');
  }

  // Validate user & balance
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.balance < betData.amount) {
    throw new Error('Số dư không đủ để đặt cược');
  }

  // Deduct balance
  user.balance -= betData.amount;
  await user.save();

  // Create Bet
  const bet = new Bet({
    user: userId,
    match: match._id,
    betKey: betData.betKey,
    betName: betData.betName,
    odds: betData.odds,
    amount: betData.amount,
    payout: betData.amount * betData.odds
  });

  await bet.save();
  return bet;
};

exports.getUserBets = async (userId) => {
  return await Bet.find({ user: userId }).populate('match').sort({ createdAt: -1 });
};

// Settle bets for a finished match
exports.settleBetsForMatch = async (matchId, homeScore, awayScore) => {
  const bets = await Bet.find({ match: matchId, status: 'PENDING' });
  const match = await Match.findById(matchId);
  const matchName = match ? `${match.home.name} vs ${match.away.name}` : 'Trận đấu';

  for (const bet of bets) {
    let isWon = false;
    let isRefund = false;

    if (bet.betKey.includes('1x2-home')) {
      isWon = homeScore > awayScore;
    } else if (bet.betKey.includes('1x2-draw')) {
      isWon = homeScore === awayScore;
    } else if (bet.betKey.includes('1x2-away')) {
      isWon = awayScore > homeScore;
    } else if (bet.betKey.includes('ou-over')) {
      const lineParts = bet.betKey.split('_');
      let line = lineParts.length > 1 ? parseFloat(lineParts[1]) : parseFloat(bet.betKey.split('-').pop()) || 2.5;
      isWon = (homeScore + awayScore) > line;
    } else if (bet.betKey.includes('ou-under')) {
      const lineParts = bet.betKey.split('_');
      let line = lineParts.length > 1 ? parseFloat(lineParts[1]) : parseFloat(bet.betKey.split('-').pop()) || 2.5;
      isWon = (homeScore + awayScore) < line;
    } else if (bet.betKey.includes('handicap-home')) {
      const lineParts = bet.betKey.split('_');
      let line = lineParts.length > 1 ? parseFloat(lineParts[1]) : parseFloat(bet.betKey.split('-').pop()) || 0;
      isWon = (homeScore + line) > awayScore;
      if ((homeScore + line) === awayScore) isRefund = true;
    } else if (bet.betKey.includes('handicap-away')) {
      const lineParts = bet.betKey.split('_');
      let line = lineParts.length > 1 ? parseFloat(lineParts[1]) : parseFloat(bet.betKey.split('-').pop()) || 0;
      isWon = (awayScore + line) > homeScore;
      if ((awayScore + line) === homeScore) isRefund = true;
    }

    bet.status = isRefund ? 'REFUND' : isWon ? 'WON' : 'LOST';
    const user = await User.findById(bet.user);

    if (isWon) {
      user.balance += bet.payout;
      await user.save();
    } else if (isRefund) {
      user.balance += bet.amount; // return original stake
      await user.save();
    }
    
    await bet.save();

    // Send email
    if (user && user.email) {
      require('./email.service').sendBetResultEmail(
        user.email,
        user.name,
        matchName,
        bet.betName,
        bet.amount,
        bet.payout,
        isWon,
        isRefund
      ).catch(console.error);
    }
  }
};
