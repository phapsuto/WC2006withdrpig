const express = require('express');
const router = express.Router();
const betController = require('../controllers/bet.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/place', protect, betController.placeBet);
router.get('/user', protect, betController.getUserBets);

module.exports = router;
