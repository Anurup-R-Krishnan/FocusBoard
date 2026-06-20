import express from 'express';
const router = express.Router();
import {
    createClient,
    getClients,
    getClientHours,
    updateClient,
    deleteClient,
    exportClients,
    bulkDeleteClients,
    bulkUpdateClients
} from '../controllers/clientController.js';
import requireAuth from '../middleware/requireAuth.js';
import { validateSchema, createClientSchema, updateClientSchema } from '../middleware/validation.js';

router.use(requireAuth);

router.post('/', validateSchema(createClientSchema), createClient);
router.get('/', getClients);
router.get('/export', exportClients);
router.get('/:id/hours', getClientHours);
router.put('/:id', validateSchema(updateClientSchema), updateClient);
router.delete('/:id', deleteClient);
router.post('/bulk-delete', bulkDeleteClients);
router.post('/bulk-update', bulkUpdateClients);

export default router;
