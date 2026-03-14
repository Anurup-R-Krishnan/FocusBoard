const express = require('express');
const router = express.Router();
const {
    createIssueType,
    getAllIssueTypes,
    getIssueTypeById,
    updateIssueType,
    deleteIssueType,
} = require('../controllers/issueTypeController');

router.post('/', createIssueType);
router.get('/', getAllIssueTypes);
router.get('/:id', getIssueTypeById);
router.put('/:id', updateIssueType);
router.delete('/:id', deleteIssueType);

module.exports = router;
