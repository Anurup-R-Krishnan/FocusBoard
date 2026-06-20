import express from 'express';
const router = express.Router();
import {
    createIssueType,
    getAllIssueTypes,
    getIssueTypeById,
    updateIssueType,
    deleteIssueType,
} from '../controllers/issueTypeController.js';

router.post('/', createIssueType);
router.get('/', getAllIssueTypes);
router.get('/:id', getIssueTypeById);
router.put('/:id', updateIssueType);
router.delete('/:id', deleteIssueType);

export default router;
