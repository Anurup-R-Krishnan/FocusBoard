import express from 'express';
const router = express.Router();
import {
    createIntegration,
    getIntegrations,
    updateIntegration,
    deleteIntegration
} from '../controllers/integrationController.js';
import requireAuth from '../middleware/requireAuth.js';

router.use(requireAuth);

router.post('/', createIntegration);
router.get('/', getIntegrations);
router.put('/:id', updateIntegration);
router.delete('/:id', deleteIntegration);

export default router;
