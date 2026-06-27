const express = require('express');
const router = express.Router();
const standingsController = require('../controllers/standings.controller');

router.get('/', standingsController.getStandings);

module.exports = router;
