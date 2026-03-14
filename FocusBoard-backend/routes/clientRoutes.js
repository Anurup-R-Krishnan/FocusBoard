const express = require('express');
const router = express.Router();
const {
    createClient,
    getClients,
    getClientHours,
    updateClient,
    deleteClient,
    exportClients,
    bulkDeleteClients,
    bulkUpdateClients
} = require('../controllers/clientController');
const requireAuth = require('../middleware/requireAuth');
const { validateSchema, createClientSchema, updateClientSchema } = require('../middleware/validation');

router.use(requireAuth);

router.post('/', validateSchema(createClientSchema), createClient);
router.get('/', getClients);
router.get('/export', exportClients);
router.get('/:id/hours', getClientHours);
router.put('/:id', validateSchema(updateClientSchema), updateClient);
router.delete('/:id', deleteClient);
router.post('/bulk-delete', bulkDeleteClients);
router.post('/bulk-update', bulkUpdateClients);

module.exports = router;
