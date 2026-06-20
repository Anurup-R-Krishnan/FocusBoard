import express from 'express';
const router = express.Router();
import {
    createResolution,
    getAllResolutions,
    getResolutionById,
    updateResolution,
    deleteResolution,
} from '../controllers/ticketResolutionController.js';

router.post('/', createResolution);
router.get('/', getAllResolutions);
router.get('/:id', getResolutionById);
router.put('/:id', updateResolution);
router.delete('/:id', deleteResolution);

export default router;
