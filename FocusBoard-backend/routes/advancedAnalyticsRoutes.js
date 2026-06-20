import express from 'express';
const router = express.Router();
import { getOptimalFlow, getBurnoutRisk } from '../controllers/advancedAnalyticsController.js';
import protect from '../middleware/authMiddleware.js';

router.use(protect);
router.get('/optimal-flow', getOptimalFlow);
router.get('/burnout', getBurnoutRisk);

export default router;
