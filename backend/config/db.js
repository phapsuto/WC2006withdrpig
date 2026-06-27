const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wc2026');
    console.log(`[MongoDB] Kết nối thành công: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Lỗi kết nối: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
