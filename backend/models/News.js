const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  // --- Identification ---
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  sourceHash: { type: String, unique: true, sparse: true },

  // --- Content ---
  content: { type: String },
  summary: { type: String },
  drpigComment: { type: String },
  author: { type: String },

  // --- Source ---
  source: { type: String },
  sourceType: { type: String, enum: ['vn_rss', 'vn_scrape'], default: 'vn_rss' },
  url: { type: String },

  // --- Media ---
  image: { type: String },
  localImage: { type: String },

  // --- Metadata ---
  pubDate: { type: Date, required: true },
  pubDateStr: { type: String },
  isLive: { type: Boolean, default: false },
  tags: [String],
  fetchedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

newsSchema.index({ pubDate: -1 });
newsSchema.index({ source: 1 });

module.exports = mongoose.model('News', newsSchema);
