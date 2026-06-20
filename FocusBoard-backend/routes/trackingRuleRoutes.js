import express from 'express';
const router = express.Router();
import * as trackingRuleController from '../controllers/trackingRuleController.js';
import authMiddleware from '../middleware/authMiddleware.js';

router.post('/', authMiddleware, trackingRuleController.createRule);
router.get('/', authMiddleware, trackingRuleController.getRules);
router.get('/:id', authMiddleware, trackingRuleController.getRule);
router.put('/:id', authMiddleware, trackingRuleController.updateRule);
router.delete('/:id', authMiddleware, trackingRuleController.deleteRule);
router.post('/from-override', authMiddleware, trackingRuleController.createRuleFromOverride);

export default router;
