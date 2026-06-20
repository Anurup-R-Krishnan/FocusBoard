import express from 'express';
const router = express.Router();
import {
    createEndpoint,
    getEndpoints,
    updateEndpoint,
    deleteEndpoint,
    regenerateSecret,
} from '../controllers/webhookController.js';
import requireAuth from '../middleware/requireAuth.js';

router.use(requireAuth);

router.post('/', createEndpoint);
router.get('/', getEndpoints);
router.put('/:id', updateEndpoint);
router.delete('/:id', deleteEndpoint);
router.put('/:id/rotate-secret', regenerateSecret);

export default router;
