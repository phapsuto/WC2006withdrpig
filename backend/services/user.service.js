const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('./email.service');
const { OAuth2Client } = require('google-auth-library');

// It's safer to only initialize it, but verifyIdToken handles it better when audience is passed.
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy_id');

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_wc2026', { expiresIn: '15m' });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_wc2026', { expiresIn: '7d' });
};

exports.register = async (userData) => {
  const { email, password, name } = userData;
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email đã được sử dụng!');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  const user = new User({
    email,
    password: hashedPassword,
    name,
    authProvider: 'local',
    initials: name ? name.substring(0, 2).toUpperCase() : 'WC',
    balance: 500, // Welcome bonus
    isVerified: false,
    verificationToken: hashedVerificationToken,
    verificationTokenExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
  });

  await user.save();

  // Send verification email
  await emailService.sendVerificationEmail(email, name, verificationToken);

  return { success: true, message: 'Vui lòng kiểm tra email để kích hoạt tài khoản.' };
};

exports.login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || user.authProvider !== 'local') {
    throw new Error('Email hoặc mật khẩu không đúng!');
  }

  if (!user.isVerified) {
    throw new Error('Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email!');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Email hoặc mật khẩu không đúng!');
  }

  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  const accessToken = generateAccessToken(user._id);
  return { user, accessToken, refreshToken };
};

exports.googleLogin = async ({ token }) => {
  if (!token) throw new Error('Không có token Google được cung cấp');

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, 
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error('Google Auth Error:', error.message);
    throw new Error('Xác thực Google thất bại (Token không hợp lệ hoặc hết hạn). Hãy chắc chắn bạn đã thêm GOOGLE_CLIENT_ID vào .env backend.');
  }

  const { email, name, picture: avatar, sub: googleId } = payload;

  let user = await User.findOne({ email });
  
  if (!user) {
    user = new User({
      email,
      name,
      avatar,
      googleId,
      authProvider: 'google',
      initials: name ? name.substring(0, 2).toUpperCase() : 'WC',
      balance: 500,
      isVerified: true // Google accounts are auto-verified
    });
  } else {
    // Connect google id if not already connected
    if (!user.googleId) user.googleId = googleId;
    
    // Update avatar if user doesn't have one or it's a default one
    if (!user.avatar && avatar) {
      user.avatar = avatar;
    }
    
    // If user originally signed up with local but now uses Google, upgrade them
    if (user.authProvider === 'local') {
      user.isVerified = true;
    }
  }

  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  const accessToken = generateAccessToken(user._id);
  return { user, accessToken, refreshToken };
};

exports.refreshAccessToken = async (token) => {
  if (!token) throw new Error('Không tìm thấy Refresh Token');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_wc2026');
    const user = await User.findById(decoded.id);
    
    if (!user || user.refreshToken !== token) {
      throw new Error('Refresh Token không hợp lệ hoặc đã bị thu hồi');
    }

    const accessToken = generateAccessToken(user._id);
    return { accessToken };
  } catch (err) {
    throw new Error('Refresh Token hết hạn, vui lòng đăng nhập lại');
  }
};

exports.logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

exports.forgotPassword = async (email) => {
  const user = await User.findOne({ email, authProvider: 'local' });
  if (!user) {
    throw new Error('Không tìm thấy tài khoản với email này (hoặc bạn đang dùng Google Login).');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hash;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
  await user.save();

  // Send the reset password email
  await emailService.sendResetPasswordEmail(user.email, user.name, resetToken);

  return resetToken; 
};

exports.resetPassword = async (resetToken, newPassword) => {
  const hash = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  const user = await User.findOne({
    resetPasswordToken: hash,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new Error('Token không hợp lệ hoặc đã hết hạn!');
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  
  await user.save();
};

exports.getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshToken -resetPasswordToken -resetPasswordExpires');
  if (!user) throw new Error('User not found');
  return user;
};

exports.updateFavoriteTeams = async (userId, teams) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { favoriteTeams: teams } },
    { new: true }
  ).select('-password -refreshToken');
  return user;
};

exports.toggleSaveMatch = async (userId, matchId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Không tìm thấy user');
  
  const savedMatches = user.savedMatches || [];
  const index = savedMatches.indexOf(matchId);
  
  if (index === -1) {
    savedMatches.push(matchId);
  } else {
    savedMatches.splice(index, 1);
  }
  
  user.savedMatches = savedMatches;
  await user.save();
  return user;
};

exports.updateAvatar = async (userId, avatarUrl) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Không tìm thấy user');
  
  user.avatar = avatarUrl;
  await user.save();
  
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
  
  return userObj;
};

exports.verifyEmail = async (token) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({ 
    verificationToken: hashedToken,
    verificationTokenExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    throw new Error('Token kích hoạt không hợp lệ hoặc đã hết hạn (chỉ có hiệu lực 10 phút).');
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  return true;
};

exports.resendVerification = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Không tìm thấy tài khoản với email này.');
  if (user.isVerified) throw new Error('Tài khoản đã được kích hoạt.');

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  user.verificationToken = hashedVerificationToken;
  user.verificationTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  await emailService.sendVerificationEmail(email, user.name, verificationToken);
  return true;
};

exports.updateProfile = async (userId, data) => {
  const { name, oldPassword, newPassword } = data;
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (name) {
    user.name = name;
    user.initials = name.substring(0, 2).toUpperCase();
  }

  if (oldPassword && newPassword) {
    if (user.authProvider !== 'local') {
      throw new Error('Tài khoản Google không thể đổi mật khẩu tại đây.');
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new Error('Mật khẩu cũ không chính xác!');
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
  }

  await user.save();
  return { 
    id: user._id, 
    name: user.name, 
    email: user.email, 
    initials: user.initials, 
    balance: user.balance, 
    authProvider: user.authProvider 
  };
};

exports.getAllUsers = async () => {
  const users = await User.find().select('-password -refreshToken -resetPasswordToken -resetPasswordExpires');
  return users;
};

exports.addBalance = async (userId, amount) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  
  user.balance = (user.balance || 0) + Number(amount);
  await user.save();
  return user;
};
