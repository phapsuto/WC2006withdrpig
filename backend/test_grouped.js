require('dotenv').config();
const mongoose = require('mongoose');
const matchService = require('./services/match.service');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wc2026');
    console.log('Testing getGroupedMatches...');
    const data = await matchService.getGroupedMatches('2024-05-15'); // test with an arbitrary date
    console.log(`Popular Leagues Count: ${data.popular.length}`);
    console.log(`Countries Count: ${data.countries.length}`);
    if (data.countries.length > 0) {
      console.log('First country:', JSON.stringify(data.countries[0].countryName));
      console.log('Matches in first country:', data.countries[0].matchCount);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
test();
