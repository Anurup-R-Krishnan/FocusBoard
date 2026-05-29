const express = require('express');
const router = express.Router();
const {
  createInvite,
  getWorkspaceInvites,
  getPendingInvites,
  acceptInvite,
  declineInvite,
  deleteInvite,
} = require('../controllers/inviteController');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

router.post('/', createInvite);
router.get('/pending', getPendingInvites);
router.get('/workspace/:workspaceId', getWorkspaceInvites);
router.put('/:id/accept', acceptInvite);
router.put('/:id/decline', declineInvite);
router.delete('/:id', deleteInvite);

module.exports = router;
