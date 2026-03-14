const express = require('express');
const router = express.Router();
const trackingRuleController = require('../controllers/trackingRuleController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, trackingRuleController.createRule);
router.get('/', authMiddleware, trackingRuleController.getRules);
router.get('/:id', authMiddleware, trackingRuleController.getRule);
router.put('/:id', authMiddleware, trackingRuleController.updateRule);
router.delete('/:id', authMiddleware, trackingRuleController.deleteRule);
router.post('/from-override', authMiddleware, trackingRuleController.createRuleFromOverride);

module.exports = router;
