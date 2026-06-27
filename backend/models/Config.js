const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  singletonKey: { type: String, default: 'GLOBAL_CONFIG', unique: true },
  apiMode: { type: String, enum: ['SMART', 'SPORTMONKS', 'LIVE_WC26', 'DEMO', 'AI_LIVE'], default: 'SMART' },
  sportmonksToken: { type: String, default: '' },
  geminiApiKey: { type: String, default: '' },
  apiFootballKey: { type: String, default: '' },
  theOddsApiKey: { type: String, default: '' },
  virtualTimeOffset: { type: Number, default: 0 },
  
  schedulerConfig: {
    autoEnabled: { type: Boolean, default: true },
    liveIntervalMin: { type: Number, default: 10 },
    normalIntervalMin: { type: Number, default: 180 },
    lastRunTime: { type: Date },
    nextRunTime: { type: Date },
    currentMode: { type: String, default: 'NORMAL' },
  },
  
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Config', configSchema);
