const sportmonksService = require('../services/sportmonks.service');

exports.getPlayerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const rawData = await sportmonksService.getPlayerDetails(id);
    
    if (!rawData) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cầu thủ' });
    }

    // Mapping relevant data to keep the payload clean
    const player = {
      id: rawData.id,
      name: rawData.display_name || rawData.name,
      firstName: rawData.firstname,
      lastName: rawData.lastname,
      image: rawData.image_path,
      height: rawData.height,
      weight: rawData.weight,
      dateOfBirth: rawData.date_of_birth,
      position: rawData.position?.name || 'Unknown',
      
      // Basic Stats aggregate (from statistics array)
      stats: {
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        appearances: 0,
        minutesPlayed: 0
      },
      
      country: rawData.country ? {
        id: rawData.country.id,
        name: rawData.country.name,
        image: rawData.country.image_path
      } : null,
      
      teams: rawData.teams?.map(t => {
        const teamObj = t.team || t;
        return { id: teamObj.id, name: teamObj.name, image: teamObj.image_path };
      }).filter((value, index, self) => value.id && index === self.findIndex((t) => (t.id === value.id))) || [],
      
      trophies: rawData.trophies?.map(t => {
        const trophyObj = t.trophy || {};
        const leagueObj = t.league || {};
        return { 
          id: trophyObj.id || t.id, 
          name: leagueObj.name || trophyObj.name || t.name || 'Danh hiệu', 
          status: trophyObj.name || t.status || 'Winner',
          season: t.season_id 
        };
      }) || [],
      
      transfers: rawData.transfers?.map(t => {
        const fromTeam = t.fromTeam || {};
        const toTeam = t.toTeam || {};
        const typeObj = t.type || {};
        return {
          id: t.id,
          fromTeamId: fromTeam.id || t.from_team_id,
          fromTeamName: fromTeam.name || 'Unknown',
          fromTeamImage: fromTeam.image_path,
          toTeamId: toTeam.id || t.to_team_id,
          toTeamName: toTeam.name || 'Unknown',
          toTeamImage: toTeam.image_path,
          date: t.date,
          type: typeObj.name || 'Chuyển nhượng',
          amount: t.amount || 'Không tiết lộ'
        };
      }).sort((a, b) => new Date(b.date) - new Date(a.date)) || []
    };

    // Very naive aggregation of stats across all seasons returned in the API
    if (rawData.statistics && Array.isArray(rawData.statistics)) {
      rawData.statistics.forEach(s => {
        if (s.details && Array.isArray(s.details)) {
          s.details.forEach(d => {
            const type = d.type?.name?.toLowerCase() || '';
            const val = d.value?.total || d.value || 0;
            if (type.includes('goal')) player.stats.goals += val;
            if (type.includes('assist')) player.stats.assists += val;
            if (type.includes('yellowcard') || type === 'yellowcards') player.stats.yellowCards += val;
            if (type.includes('redcard') || type === 'redcards') player.stats.redCards += val;
            if (type.includes('appearance')) player.stats.appearances += val;
            if (type.includes('minute')) player.stats.minutesPlayed += val;
          });
        }
      });
    }

    res.json({ success: true, data: player });
  } catch (error) {
    console.error('Error fetching player profile:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin cầu thủ' });
  }
};
