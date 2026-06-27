const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Hashed password for local auth
  name: { type: String, required: true },
  avatar: { type: String },
  initials: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  balance: { type: Number, default: 500 },
  favoriteTeams: [{ type: String }],
  savedMatches: [{ type: String }],
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
  refreshToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
