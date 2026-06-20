import express from 'express';
const router = express.Router();
import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from '../controllers/workspaceController.js';
import authMiddleware from '../middleware/authMiddleware.js';

router.get('/', authMiddleware, getWorkspaces);
router.post('/', authMiddleware, createWorkspace);
router.put('/:id', authMiddleware, updateWorkspace);
router.delete('/:id', authMiddleware, deleteWorkspace);

export default router;
