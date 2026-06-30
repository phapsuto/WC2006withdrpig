const userService = require('../services/user.service');

// Helper to set refresh token cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ thông tin' });
    }
    
    const response = await userService.register({ email, password, name });
    res.status(201).json(response); // { success: true, message: '...' }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ email và mật khẩu' });
    }
    
    const { user, accessToken, refreshToken } = await userService.login(email, password);
    
    setRefreshTokenCookie(res, refreshToken);
    
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.json({ success: true, user: userResponse, accessToken });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Thiếu token xác thực từ Google' });
    
    const { user, accessToken, refreshToken } = await userService.googleLogin({ token });
    
    setRefreshTokenCookie(res, refreshToken);
    
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.json({ success: true, user: userResponse, accessToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Không tìm thấy phiên đăng nhập' });
    }
    
    const { accessToken } = await userService.refreshAccessToken(token);
    res.json({ success: true, accessToken });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.user && req.user.id) {
      await userService.logout(req.user.id);
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Đăng xuất thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
    
    const resetToken = await userService.forgotPassword(email);
    
    // In a real app, send an email here. For now, print to console.
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    console.log('\n=============================================');
    console.log(`[AUTH] RESET PASSWORD LINK FOR ${email}:`);
    console.log(resetUrl);
    console.log('=============================================\n');

    res.json({ success: true, message: 'Hướng dẫn đặt lại mật khẩu đã được xử lý (Xem console backend)' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password) return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu mới' });
    
    await userService.resetPassword(token, password);
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công, bạn có thể đăng nhập.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await userService.getUserProfile(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

exports.updateFavorites = async (req, res) => {
  try {
    const { teams } = req.body;
    const user = await userService.updateFavoriteTeams(req.user.id, teams);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleSaveMatch = async (req, res) => {
  try {
    const { matchId } = req.body;
    if (!matchId) return res.status(400).json({ success: false, message: 'Thiếu ID trận đấu' });
    
    const user = await userService.toggleSaveMatch(req.user.id, matchId);
    res.json({ success: true, savedMatches: user.savedMatches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn một file ảnh' });
    }
    
    // The public URL to the uploaded file
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    const user = await userService.updateAvatar(req.user.id, avatarUrl);
    res.json({ success: true, message: 'Cập nhật avatar thành công', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    await userService.verifyEmail(token);
    res.json({ success: true, message: 'Kích hoạt tài khoản thành công.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.json({ success: true, user, message: 'Cập nhật hồ sơ thành công.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email.' });
    
    await userService.resendVerification(email);
    res.json({ success: true, message: 'Đã gửi lại email kích hoạt. Vui lòng kiểm tra hòm thư của bạn.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addBalance = async (req, res) => {
  try {
    const { amount } = req.body;
    const { id } = req.params;
    if (!amount) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số tiền cần cộng' });
    
    const user = await userService.addBalance(id, amount);
    res.json({ success: true, user, message: 'Cộng điểm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.claimShareReward = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.hasSharedForReward) {
      return res.status(400).json({ success: false, message: 'Bạn đã nhận thưởng chia sẻ rồi nha!' });
    }
    
    user.balance += 1000;
    user.hasSharedForReward = true;
    await user.save();
    
    res.json({ success: true, balance: user.balance, message: 'Nhận 1,000 Xu thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
