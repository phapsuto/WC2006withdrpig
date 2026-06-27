const sportmonksService = require('../services/sportmonks.service');
const mapper = require('../services/sportmonks.mapper');

exports.getTeamFixtures = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const leagueId = req.query.leagueId ? parseInt(req.query.leagueId) : 732;

    // Fetch team info + fixtures in parallel
    const [teamInfo, rawFixtures] = await Promise.all([
      sportmonksService.getTeamInfo(teamId).catch(() => null),
      sportmonksService.getTeamFixturesByLeague(teamId, leagueId),
    ]);

    // Resolve team identity from first fixture participants or teamInfo fallback
    let teamMeta = null;
    if (rawFixtures.length > 0) {
      const firstFixture = rawFixtures[0];
      const part = (firstFixture.participants || []).find(p => p.id === teamId);
      if (part) {
        teamMeta = {
          id: teamId,
          name: part.name || teamInfo?.name || 'Unknown',
          logo: part.image_path || teamInfo?.image_path || '',
          flag: mapper.resolveFlagCode(part),
          short: part.short_code || teamInfo?.short_code || '???',
        };
      }
    }
    if (!teamMeta) {
      teamMeta = {
        id: teamId,
        name: teamInfo?.name || 'Unknown',
        logo: teamInfo?.image_path || '',
        flag: teamInfo ? mapper.resolveFlagCode(teamInfo) : 'xx',
        short: teamInfo?.short_code || '???',
      };
    }

    // Map fixtures + annotate which side is "our team"
    const fixtures = rawFixtures
      .map(raw => {
        const homePart = raw.participants?.[0] || {};
        const awayPart = raw.participants?.[1] || {};
        const mapped = mapper.mapSportmonksMatch(raw);
        return {
          ...mapped,
          homeTeamId: homePart.id,
          awayTeamId: awayPart.id,
          isHome: homePart.id === teamId,
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      team: teamMeta,
      fixtures,
      leagueId,
    });
  } catch (error) {
    console.error('[Team Controller] getTeamFixtures error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
