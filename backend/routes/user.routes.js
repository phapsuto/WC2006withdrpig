const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, authorizeAdmin } = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../middleware/upload.middleware');

// Public Auth Routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/google-login', userController.googleLogin);
router.post('/logout', protect, userController.logout);
router.post('/refresh-token', userController.refreshToken);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password/:token', userController.resetPassword);
router.get('/verify-email/:token', userController.verifyEmail);
router.post('/resend-verification', userController.resendVerification);

// Protected User Routes
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/upload-avatar', protect, uploadAvatar.single('avatar'), userController.uploadAvatar);
router.put('/favorites', protect, userController.updateFavorites);
router.post('/saved-matches', protect, userController.toggleSaveMatch);
router.post('/share-reward', protect, userController.claimShareReward);

// Admin Routes
router.get('/', protect, authorizeAdmin, userController.getAllUsers);
router.put('/:id/add-balance', protect, authorizeAdmin, userController.addBalance);

module.exports = router;
