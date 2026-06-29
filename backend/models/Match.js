const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Mapped to api.js id format
  league: {
    name: String,
    country: String
  },
  home: {
    name: String,
    short: String,
    flag: String
  },
  away: {
    name: String,
    short: String,
    flag: String
  },
  homeScore: { type: Number, default: 0 },
  awayScore: { type: Number, default: 0 },
  status: { type: String, enum: ['UPCOMING', 'LIVE', 'FINISHED'], default: 'UPCOMING' },
  minute: { type: Number, default: 0 },
  date: { type: Date, required: true },
  group: String,
  stadiumId: String,
  
  odds: {
    h2h: { home: Number, draw: Number, away: Number },
    handicap: { line: String, home: Number, away: Number },
    overUnder: { line: String, over: Number, under: Number }
  },

  stats: { type: mongoose.Schema.Types.Mixed },
  events: { type: mongoose.Schema.Types.Mixed },
  lineups: { type: mongoose.Schema.Types.Mixed },
  prediction: { type: mongoose.Schema.Types.Mixed },
  
  // Real AI Odds Analysis cache
  aiAnalytics: { type: mongoose.Schema.Types.Mixed },
  aiAnalyticsUpdatedAt: { type: Date },
  
  reminderSent: { type: Boolean, default: false },

  updatedAt: { type: Date, default: Date.now }
});

// Create a virtual 'id' property that returns the custom id (already named id, so this is just to ensure it's exposed)
matchSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, converted) => {
    delete converted._id;
    delete converted.__v;
  }
});

module.exports = mongoose.model('Match', matchSchema);
