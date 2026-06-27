const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_wc2026');

      // Fetch user from DB and attach to request
      const User = require('../models/User');
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      
      next();
    } catch (error) {
      console.error('[Auth] Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập, token không hợp lệ (401)',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không có quyền truy cập, vui lòng đăng nhập (401)',
    });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập, yêu cầu quyền Quản trị viên (403)',
    });
  }
};

module.exports = { protect, authorizeAdmin };
