require('dotenv').config();
async function test() {
  const token = process.env.SPORTMONKS_API_TOKEN;
  const fixtureId = "19609184";
  const inc = "events.type;lineups.player;statistics.type;comments;formations;coaches;referees;venue";
  const url = `https://api.sportmonks.com/v3/football/fixtures/${fixtureId}?api_token=${token}&include=${inc}`;
  const res = await fetch(url);
  const data = await res.json();
  if(data.error || data.message) {
    console.log("Error:", data);
  } else {
    console.log("SUCCESS!");
    const f = data.data;
    console.log("Has Lineups:", !!f.lineups);
    console.log("Has Events:", !!f.events);
    console.log("Has Stats:", !!f.statistics);
    console.log("Has Comments:", !!f.comments);
    console.log("Has Formations:", !!f.formations);
  }
}
test();
