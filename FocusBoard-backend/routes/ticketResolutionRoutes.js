const express = require('express');
const router = express.Router();
const {
    createResolution,
    getAllResolutions,
    getResolutionById,
    updateResolution,
    deleteResolution,
} = require('../controllers/ticketResolutionController');

router.post('/', createResolution);
router.get('/', getAllResolutions);
router.get('/:id', getResolutionById);
router.put('/:id', updateResolution);
router.delete('/:id', deleteResolution);

module.exports = router;
