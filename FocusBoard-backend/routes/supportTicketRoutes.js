const express = require('express');
const router = express.Router();
const {
    createTicket,
    getAllTickets,
    getTicketById,
    updateTicket,
    deleteTicket,
} = require('../controllers/supportTicketController');

router.post('/', createTicket);
router.get('/', getAllTickets);
router.get('/:id', getTicketById);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);

module.exports = router;
