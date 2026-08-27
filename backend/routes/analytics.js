const express = require('express');
const { protect } = require('../middleware/auth');
const { getSuggestions, getHeatmap, getUsage } = require('../controllers/analyticsController');

const router = express.Router();

// all analytics endpoints require authentication
router.use(protect);

router.get('/suggestions', getSuggestions);
router.get('/heatmap', getHeatmap);
router.get('/usage', getUsage);

module.exports = router;
