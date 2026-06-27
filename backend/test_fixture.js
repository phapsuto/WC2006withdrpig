require('dotenv').config();
async function test() {
  const token = process.env.SPORTMONKS_API_TOKEN;
  const url = `https://api.sportmonks.com/v3/football/fixtures/date/today?api_token=${token}&include=events;lineups.player;statistics;comments;trends;formations;coaches`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.data && data.data.length > 0) {
    const f = data.data[0];
    console.log("Keys available in fixture:");
    console.log(Object.keys(f));
    if(f.statistics) console.log("Stats count:", f.statistics.length);
    if(f.lineups) console.log("Lineups count:", f.lineups.length);
    if(f.events) console.log("Events count:", f.events.length);
  } else {
    console.log("No fixtures or error:", data);
  }
}
test();
