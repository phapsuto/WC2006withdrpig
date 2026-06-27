require('dotenv').config({ path: '/Users/khoait/Documents/SourceCompany/WC2006withdrpig/backend/.env' });
const fs = require('fs');

async function testPlayer() {
  const apiKey = process.env.SPORTMONKS_API_TOKEN;
  const playerId = 96611; // Ronaldo maybe?
  const inc = "position;country;statistics.details.type;teams.team;transfers.fromTeam;transfers.toTeam;transfers.type;trophies.trophy;trophies.league;trophies.season";
  
  try {
    const res = await fetch(`https://api.sportmonks.com/v3/football/players/${playerId}?include=${inc}&api_token=${apiKey}`);
    const data = await res.json();
    fs.writeFileSync('player_96611.json', JSON.stringify(data.data, null, 2));
    console.log("Written to player_96611.json");
  } catch (e) {
    console.error(e);
  }
}

testPlayer();
