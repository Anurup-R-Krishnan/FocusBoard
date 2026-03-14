const express = require('express');
const router = express.Router();
const { getDashboardMetrics, getTimeline, getActivitySummary, getTrends, getCategoryBreakdown } = require('../controllers/metricsController');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

router.get('/dashboard', getDashboardMetrics);
router.get('/timeline', getTimeline);
router.get('/summary', getActivitySummary);
router.get('/trends', getTrends);
router.get('/categories', getCategoryBreakdown);

module.exports = router;
