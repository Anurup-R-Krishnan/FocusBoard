import express from 'express';
const router = express.Router();
import {
    createTicket,
    getAllTickets,
    getTicketById,
    updateTicket,
    deleteTicket,
} from '../controllers/supportTicketController.js';

router.post('/', createTicket);
router.get('/', getAllTickets);
router.get('/:id', getTicketById);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);

export default router;
