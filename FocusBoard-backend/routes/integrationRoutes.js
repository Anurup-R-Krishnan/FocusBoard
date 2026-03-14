const express = require('express');
const router = express.Router();
const {
    createIntegration,
    getIntegrations,
    updateIntegration,
    deleteIntegration
} = require('../controllers/integrationController');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

router.post('/', createIntegration);
router.get('/', getIntegrations);
router.put('/:id', updateIntegration);
router.delete('/:id', deleteIntegration);

module.exports = router;
