require('dotenv').config();
async function test() {
  const token = process.env.SPORTMONKS_API_TOKEN;
  const fixtureId = "19609184";
  const inc = "lineups.player;lineups.details";
  const url = `https://api.sportmonks.com/v3/football/fixtures/${fixtureId}?api_token=${token}&include=${inc}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.data && data.data.lineups) {
    console.log(JSON.stringify(data.data.lineups[0], null, 2));
  } else {
    console.log("Error or no lineups:", data);
  }
}
test();
