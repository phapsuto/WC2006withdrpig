const cron = require('node-cron');
const News = require('../models/News');
const User = require('../models/User');
const emailService = require('./email.service');

const sendNewsletter = async () => {
  console.log('[Newsletter] Bắt đầu quét và gửi email Điểm Tin (Newsletter)...');
  try {
    // 1. Get top 10 latest news
    const top10News = await News.find().sort({ pubDate: -1 }).limit(10);
    
    if (!top10News || top10News.length === 0) {
      console.log('[Newsletter] Không có bài viết nào trong database. Bỏ qua.');
      return;
    }

    // 2. Get all verified users
    const users = await User.find({ isVerified: true });
    
    if (!users || users.length === 0) {
      console.log('[Newsletter] Không có user hợp lệ nào để gửi.');
      return;
    }

    console.log(`[Newsletter] Tìm thấy ${top10News.length} bài viết mới nhất. Chuẩn bị gửi cho ${users.length} users.`);

    // 3. Send email to each user
    // We send sequentially with a small delay to avoid SMTP rate limits
    for (const user of users) {
      if (user.email) {
        const userName = user.name || 'bạn';
        await emailService.sendNewsletterEmail(user.email, userName, top10News);
        
        // Small delay (e.g., 200ms) between emails to prevent spam flags
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log('[Newsletter] Hoàn thành gửi Điểm Tin thành công!');
  } catch (error) {
    console.error('[Newsletter] Lỗi khi chạy scheduler gửi tin tức:', error);
  }
};

// Hàm khởi chạy scheduler
const start = () => {
  console.log('[Scheduler] Khởi động Newsletter Scheduler (Chạy mỗi 6 tiếng)');
  // Chạy mỗi 6 tiếng một lần: 0 */6 * * *
  cron.schedule('0 */6 * * *', async () => {
    await sendNewsletter();
  });
};

module.exports = {
  start,
  sendNewsletter // Export for manual testing if needed
};
