import express from 'express';
const router = express.Router();
import {
    createFeedback,
    getAllFeedback,
    getFeedbackById,
    updateFeedback,
    deleteFeedback,
} from '../controllers/userFeedbackController.js';

router.post('/', createFeedback);
router.get('/', getAllFeedback);
router.get('/:id', getFeedbackById);
router.put('/:id', updateFeedback);
router.delete('/:id', deleteFeedback);

export default router;
