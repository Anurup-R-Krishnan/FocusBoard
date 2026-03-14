const express = require('express');
const router = express.Router();
const {
    createMapping,
    getAllMappings,
    getMappingById,
    updateMapping,
    deleteMapping,
} = require('../controllers/activityMappingController');

router.post('/', createMapping);
router.get('/', getAllMappings);
router.get('/:id', getMappingById);
router.put('/:id', updateMapping);
router.delete('/:id', deleteMapping);

module.exports = router;
