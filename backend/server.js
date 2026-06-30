require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Khởi tạo DB
connectDB();

const app = express();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // Allow serving images cross-origin
app.use(morgan('dev'));
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://banhbong.io',
  'https://www.banhbong.io'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Allow cookies to be sent
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Routes cơ bản
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to WC2026 Backend API' });
});

// Import Routes
const userRoutes = require('./routes/user.routes');
const matchRoutes = require('./routes/match.routes');
const betRoutes = require('./routes/bet.routes');
const newsRoutes = require('./routes/news.routes');
const standingsRoutes = require('./routes/standings.routes');
const teamRoutes = require('./routes/team.routes');
const playerRoutes = require('./routes/player.routes');
const searchRoutes = require('./routes/search.routes');

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/bets', betRoutes);
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/standings', standingsRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/players', playerRoutes);
app.use('/api/v1/search', searchRoutes);

// Xử lý Route 404 (Không tìm thấy)
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API endpoint không tồn tại!' });
});

// Global Error Handler (Bắt toàn bộ lỗi crash)
app.use((err, req, res, next) => {
  console.error(`[Lỗi Hệ Thống]: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi Server Nội Bộ!',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server] Khởi chạy thành công tại http://localhost:${PORT}`);

  // Initialize Schedulers (cron jobs)
  try {
    const { initNewsScheduler } = require('./services/news-scheduler.service');
    const { initMatchScheduler } = require('./services/match-scheduler.service');
    const newsletterScheduler = require('./services/newsletter-scheduler.service');

    initNewsScheduler();
    console.log('[Server] News Scheduler initialized ✅');

    initMatchScheduler();
    console.log('[Server] Match Scheduler initialized ✅');

    newsletterScheduler.start();
    console.log('[Server] Newsletter Scheduler initialized ✅');
  } catch (error) {
    console.error('[Server] Failed to init Schedulers:', error.message);
  }
});
