const express = require('express');
const router = express.Router();
const {
  createEvent,
  upsertEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');

router.post('/', createEvent);
router.post('/upsert', upsertEvent);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
