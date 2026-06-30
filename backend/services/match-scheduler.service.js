const cron = require('node-cron');
const Match = require('../models/Match');
const User = require('../models/User');
const Bet = require('../models/Bet');
const emailService = require('./email.service');
const matchService = require('./match.service');
const betService = require('./bet.service');

const runSchedulerNow = async () => {
  try {
    console.log('[Match Scheduler] Checking for upcoming matches...');
    
    const now = new Date();
      const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);

      // Find UPCOMING matches that are starting in the next 30 minutes and haven't sent reminders yet
      const upcomingMatches = await Match.find({
        status: 'UPCOMING',
        date: { $lte: in30Minutes, $gt: now },
        reminderSent: false
      });

      if (upcomingMatches.length === 0) {
        console.log('[Match Scheduler] No upcoming matches found.');
      } else {

      console.log(`[Match Scheduler] Found ${upcomingMatches.length} matches starting soon.`);

      for (const match of upcomingMatches) {
        // Find users who saved this match
        const users = await User.find({ savedMatches: match.id }).select('email name');
        
        if (users.length > 0) {
          console.log(`[Match Scheduler] Sending reminders to ${users.length} users for match: ${match.home.name} vs ${match.away.name}`);

          // Send emails in parallel
          await Promise.all(users.map(user => 
            emailService.sendMatchReminderEmail(user.email, user.name, match)
          ));
        }

        // Mark reminder as sent so we don't send it again
        match.reminderSent = true;
        await match.save();
      }
      }
      
      console.log('[Match Scheduler] Checking for matches to settle bets...');
      
      // Auto-settle bets for finished matches
      const pendingBets = await Bet.find({ status: 'PENDING' });
      if (pendingBets.length > 0) {
        // Group by match to avoid spamming the same match
        const pendingMatchIds = [...new Set(pendingBets.map(b => b.match.toString()))];
        console.log(`[Match Scheduler] Found ${pendingMatchIds.length} matches with pending bets.`);
        
        for (const matchId of pendingMatchIds) {
          const dbMatch = await Match.findById(matchId);
          if (!dbMatch) continue;
          
          try {
            // Fetch live status
            const liveMatch = await matchService.getMatchById(dbMatch.id);
            if (liveMatch && liveMatch.status === 'FINISHED') {
              // Update DB Match
              dbMatch.status = 'FINISHED';
              dbMatch.homeScore = liveMatch.homeScore;
              dbMatch.awayScore = liveMatch.awayScore;
              await dbMatch.save();
              
              // Settle Bets
              await betService.settleBetsForMatch(dbMatch._id, dbMatch.homeScore, dbMatch.awayScore);
              console.log(`[Match Scheduler] Settled bets for match ${dbMatch.home.name} vs ${dbMatch.away.name}`);
            }
          } catch (err) {
            console.error(`[Match Scheduler] Error settling bets for match ${dbMatch.id}:`, err.message);
          }
        }
      }
  } catch (error) {
    console.error('[Match Scheduler Error]:', error);
  }
};

const initMatchScheduler = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', runSchedulerNow);

  console.log('[Match Scheduler] Initialized (running every 5 minutes).');
};

module.exports = { initMatchScheduler, runSchedulerNow };
