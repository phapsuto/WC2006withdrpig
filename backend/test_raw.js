require('dotenv').config();

async function test() {
  const token = process.env.SPORTMONKS_API_TOKEN;
  console.log("Token starts with:", token ? token.substring(0, 5) : "UNDEFINED");
  const url = `https://api.sportmonks.com/v3/football/fixtures/date/today?api_token=${token}`;
  console.log("Fetching:", url);
  
  const res = await fetch(url);
  const data = await res.json();
  console.log("Matches found:", data.data ? data.data.length : "Error");
  if(data.data && data.data.length > 0) {
    console.log("First match league ID:", data.data[0].league_id);
  } else {
    console.log(data);
  }
}
test();
