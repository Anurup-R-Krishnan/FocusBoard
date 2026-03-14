const express = require('express');
const router = express.Router();
const { createLead, getAllLeads, getLeadById, updateLead, deleteLead } = require('../controllers/leadController');

router.post('/', createLead);
router.get('/', getAllLeads);
router.get('/:id', getLeadById);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

module.exports = router;
