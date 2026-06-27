const newsService = require('../services/news.service');
const newsFetcher = require('../services/news-fetcher.service');

exports.getAllNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const result = await newsService.getAllNews(page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[News] getAllNews error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getNewsBySlug = async (req, res) => {
  try {
    const article = await newsService.getNewsBySlug(req.params.slug);
    res.json({ success: true, article });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/v1/news/fetch-now — Trigger cào tin thủ công.
 */
exports.fetchNow = async (req, res) => {
  try {
    console.log('[News] Manual fetch triggered');
    const results = await newsFetcher.fetchAll();
    res.json({ success: true, message: 'Cào tin hoàn tất', results });
  } catch (error) {
    console.error('[News] fetchNow error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
