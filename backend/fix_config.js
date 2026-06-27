const mongoose = require('mongoose');
const Config = require('./models/Config');

mongoose.connect('mongodb://localhost:27017/wc2026')
  .then(async () => {
    console.log('Connected to DB');
    const config = await Config.findOne({ singletonKey: 'GLOBAL_CONFIG' });
    if (config) {
      console.log('Current token:', config.sportmonksToken);
      config.sportmonksToken = '1fcudBrrac5U8DpQYl97jUeowGVDj74AGgniiz637ySI2v7ZFn0C8XpkJXoV';
      await config.save();
      console.log('Token updated!');
    } else {
      console.log('No config found.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
