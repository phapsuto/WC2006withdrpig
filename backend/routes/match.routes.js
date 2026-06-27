const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match.controller');

router.get('/', matchController.getAllMatches);
router.get('/grouped', matchController.getGroupedMatches);
router.get('/:id/details', matchController.getMatchDetails);
router.get('/:id/odds', matchController.getMatchOdds);
router.get('/:id', matchController.getMatchById);
router.post('/sync', matchController.syncMatches);
router.post('/:id/simulate-finish', matchController.simulateFinishMatch);

module.exports = router;
