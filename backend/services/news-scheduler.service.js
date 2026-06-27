/**
 * News Scheduler Service
 * Cron jobs cho tự động cào tin + dọn dẹp bài cũ.
 * Không còn AI rewrite.
 */
const cron = require('node-cron');
const newsFetcher = require('./news-fetcher.service');

let isFetching = false;

/**
 * Initialize all cron jobs.
 */
function initNewsScheduler() {
  console.log('[Scheduler] ═══ Khởi tạo Cron Jobs ═══');

  // ─── Mỗi 30 phút: Cào RSS feeds ──────────────────────────────────
  cron.schedule('*/30 * * * *', async () => {
    if (isFetching) {
      console.log('[Scheduler] Fetch đang chạy, bỏ qua');
      return;
    }
    isFetching = true;
    try {
      console.log(`\n[Scheduler] ⏰ ${new Date().toLocaleString('vi-VN')} - Cào tin...`);
      const results = await newsFetcher.fetchAll();
      console.log(`[Scheduler] ✅ Xong: ${results.fetched} mới, ${results.skipped} bỏ qua`);
    } catch (error) {
      console.error('[Scheduler] Fetch error:', error.message);
    } finally {
      isFetching = false;
    }
  });

  // ─── Mỗi ngày 3 giờ sáng: Dọn bài cũ ────────────────────────────
  cron.schedule('0 3 * * *', async () => {
    try {
      console.log(`\n[Scheduler] 🧹 Dọn dẹp bài cũ...`);
      await newsFetcher.cleanupOldArticles();
    } catch (error) {
      console.error('[Scheduler] Cleanup error:', error.message);
    }
  });

  console.log('[Scheduler] ✅ Cron đã đăng ký:');
  console.log('  • Mỗi 30 phút → Cào RSS + Scrape');
  console.log('  • 3h sáng     → Dọn bài >30 ngày');

  // ─── Cào lần đầu sau 10 giây ─────────────────────────────────────
  setTimeout(async () => {
    console.log('\n[Scheduler] 🚀 Cào lần đầu...');
    isFetching = true;
    try {
      const results = await newsFetcher.fetchAll();
      console.log(`[Scheduler] ✅ Lần đầu: ${results.fetched} bài mới`);
    } catch (error) {
      console.error('[Scheduler] Initial fetch error:', error.message);
    } finally {
      isFetching = false;
    }
  }, 10000);
}

module.exports = { initNewsScheduler };
