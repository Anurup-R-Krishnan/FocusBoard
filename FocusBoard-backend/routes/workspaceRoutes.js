const express = require('express');
const router = express.Router();
const { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } = require('../controllers/workspaceController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getWorkspaces);
router.post('/', authMiddleware, createWorkspace);
router.put('/:id', authMiddleware, updateWorkspace);
router.delete('/:id', authMiddleware, deleteWorkspace);

module.exports = router;
