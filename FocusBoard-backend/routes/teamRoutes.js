import express from 'express';
const router = express.Router();
import { getSquad, nudgeMember } from '../controllers/teamController.js';
import requireAuth from '../middleware/requireAuth.js';

router.use(requireAuth);

router.get('/squad', getSquad);
router.post('/squad/:id/nudge', nudgeMember);

export default router;
