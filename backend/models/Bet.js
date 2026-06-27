const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  betKey: { type: String, required: true }, // e.g., '1x2-home', 'asian-away', 'ou-over'
  betName: { type: String }, // e.g., 'Việt Nam Thắng'
  odds: { type: Number, required: true },
  amount: { type: Number, required: true, min: 1 },
  payout: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'WON', 'LOST', 'REFUND'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bet', betSchema);
