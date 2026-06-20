import express from 'express';
const router = express.Router();
import {
  createInvite,
  getWorkspaceInvites,
  getPendingInvites,
  acceptInvite,
  declineInvite,
  deleteInvite,
} from '../controllers/inviteController.js';
import requireAuth from '../middleware/requireAuth.js';

router.use(requireAuth);

router.post('/', createInvite);
router.get('/pending', getPendingInvites);
router.get('/workspace/:workspaceId', getWorkspaceInvites);
router.put('/:id/accept', acceptInvite);
router.put('/:id/decline', declineInvite);
router.delete('/:id', deleteInvite);

export default router;
