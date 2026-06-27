const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news.controller');

router.get('/', newsController.getAllNews);
router.get('/:slug', newsController.getNewsBySlug);
router.post('/fetch-now', newsController.fetchNow);

module.exports = router;
