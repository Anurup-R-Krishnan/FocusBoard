import express from 'express';
const router = express.Router();
import { getRules, createRule, deleteRule } from '../controllers/projectRuleController.js';
import protect from '../middleware/authMiddleware.js';

router.use(protect);
router.route('/').get(getRules).post(createRule);
router.route('/:id').delete(deleteRule);

export default router;
