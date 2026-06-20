import express from 'express';
const router = express.Router();
import {
  createEvent,
  upsertEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';

router.post('/', createEvent);
router.post('/upsert', upsertEvent);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
