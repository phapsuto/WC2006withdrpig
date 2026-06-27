require('dotenv').config({ path: '/Users/khoait/Documents/SourceCompany/WC2006withdrpig/backend/.env' });

async function testPlayer() {
  const apiKey = process.env.SPORTMONKS_API_TOKEN;
  const playerId = 96611;
  const inc = "trophies.league;trophies.season;trophies.competition;trophies.tournament;trophies.league.country";
  
  try {
    const res = await fetch(`https://api.sportmonks.com/v3/football/players/${playerId}?include=${inc}&api_token=${apiKey}`);
    const data = await res.json();
    console.log(JSON.stringify(data.data.trophies.slice(0, 2), null, 2));
  } catch (e) {
    console.error(e);
  }
}

testPlayer();
