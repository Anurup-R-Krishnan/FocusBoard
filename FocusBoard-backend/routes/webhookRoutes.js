const express = require('express');
const router = express.Router();
const {
    createEndpoint,
    getEndpoints,
    updateEndpoint,
    deleteEndpoint,
    regenerateSecret,
} = require('../controllers/webhookController');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

router.post('/', createEndpoint);
router.get('/', getEndpoints);
router.put('/:id', updateEndpoint);
router.delete('/:id', deleteEndpoint);
router.put('/:id/rotate-secret', regenerateSecret);

module.exports = router;
