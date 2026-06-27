const Match = require('../models/Match');
const News = require('../models/News');

exports.globalSearch = async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query || query.length < 2) {
      return res.json({ success: true, matches: [], teams: [], news: [] });
    }

    const regex = new RegExp(query, 'i');

    // 1. Search Matches
    const matches = await Match.find({
      $or: [
        { 'home.name': regex },
        { 'away.name': regex },
        { 'league.name': regex }
      ]
    }).limit(10).lean();

    // 2. Search News
    const news = await News.find({
      $or: [
        { title: regex },
        { titleVi: regex }
      ]
    }).sort({ pubDate: -1 }).limit(5).lean();

    // 3. Extract unique teams from the matches
    // Since we don't have a dedicated Team collection, we build it from the matching matches
    const teamsMap = new Map();
    matches.forEach(m => {
      if (regex.test(m.home.name) && !teamsMap.has(m.home.id)) {
        teamsMap.set(m.home.id, {
          id: m.home.id,
          name: m.home.name,
          logo: m.home.logo
        });
      }
      if (regex.test(m.away.name) && !teamsMap.has(m.away.id)) {
        teamsMap.set(m.away.id, {
          id: m.away.id,
          name: m.away.name,
          logo: m.away.logo
        });
      }
    });

    const teams = Array.from(teamsMap.values()).slice(0, 5);

    // Format Matches to standard frontend format
    const formattedMatches = matches.map(m => ({
      ...m,
      id: m.fixtureId,
      time: m.time,
      status: m.status
    })).slice(0, 5);

    res.json({
      success: true,
      teams,
      matches: formattedMatches,
      news
    });
  } catch (error) {
    console.error('[Search Controller] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
