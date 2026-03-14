const express = require('express');
const router = express.Router();
const { getSquad, nudgeMember } = require('../controllers/teamController');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

router.get('/squad', getSquad);
router.post('/squad/:id/nudge', nudgeMember);

module.exports = router;
