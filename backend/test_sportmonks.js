const run = async () => {
  const token = '1fcudBrrac5U8DpQYl97jUeowGVDj74AGgniiz637ySI2v7ZFn0C8XpkJXoV';
  const url = `https://api.sportmonks.com/v3/football/news/pre-match?api_token=${token}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data.data[0], null, 2));
  } catch(e) {}
};
run();
