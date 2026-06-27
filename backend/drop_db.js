const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/wc2026')
  .then(async () => {
    console.log('Connected to DB');
    try {
      await mongoose.connection.collection('matches').drop();
      console.log('Matches collection dropped to clear old indexes');
    } catch(e) {
      console.log('Error dropping matches:', e.message);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
