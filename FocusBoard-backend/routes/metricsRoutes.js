import express from 'express';
const router = express.Router();
import { getDashboardMetrics, getTimeline, getActivitySummary, getTrends, getCategoryBreakdown } from '../controllers/metricsController.js';
import requireAuth from '../middleware/requireAuth.js';

router.use(requireAuth);

router.get('/dashboard', getDashboardMetrics);
router.get('/timeline', getTimeline);
router.get('/summary', getActivitySummary);
router.get('/trends', getTrends);
router.get('/categories', getCategoryBreakdown);

export default router;
