import express from 'express';
const router = express.Router();
import { getZenModeStatus, toggleZenMode } from '../controllers/zenModeController.js';
import protect from '../middleware/authMiddleware.js';

router.use(protect);
router.route('/status').get(getZenModeStatus);
router.route('/toggle').post(toggleZenMode);

export default router;
