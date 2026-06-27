const cron = require('node-cron');
const Match = require('../models/Match');
const User = require('../models/User');
const emailService = require('./email.service');

const initMatchScheduler = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
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
        return;
      }

      console.log(`[Match Scheduler] Found ${upcomingMatches.length} matches starting soon.`);

      for (const match of upcomingMatches) {
        // Find users who saved this match
        const users = await User.find({ savedMatches: match.id }).select('email name');
        
        if (users.length > 0) {
          const matchName = `${match.home.name} vs ${match.away.name}`;
          console.log(`[Match Scheduler] Sending reminders to ${users.length} users for match: ${matchName}`);

          // Send emails in parallel
          await Promise.all(users.map(user => 
            emailService.sendMatchReminderEmail(user.email, user.name, matchName, match.date)
          ));
        }

        // Mark reminder as sent so we don't send it again
        match.reminderSent = true;
        await match.save();
      }

    } catch (error) {
      console.error('[Match Scheduler Error]:', error);
    }
  });

  console.log('[Match Scheduler] Initialized (running every 5 minutes).');
};

module.exports = { initMatchScheduler };
