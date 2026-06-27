const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');

router.get('/:teamId/fixtures', teamController.getTeamFixtures);

module.exports = router;
