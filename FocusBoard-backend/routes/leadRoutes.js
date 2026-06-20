import express from 'express';
const router = express.Router();
import { createLead, getAllLeads, getLeadById, updateLead, deleteLead } from '../controllers/leadController.js';

router.post('/', createLead);
router.get('/', getAllLeads);
router.get('/:id', getLeadById);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

export default router;
