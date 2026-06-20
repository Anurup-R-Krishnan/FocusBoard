import express from 'express';
const router = express.Router();
import {
    createMapping,
    getAllMappings,
    getMappingById,
    updateMapping,
    deleteMapping,
} from '../controllers/activityMappingController.js';

router.post('/', createMapping);
router.get('/', getAllMappings);
router.get('/:id', getMappingById);
router.put('/:id', updateMapping);
router.delete('/:id', deleteMapping);

export default router;
