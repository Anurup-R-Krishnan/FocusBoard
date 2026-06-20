import express from 'express';
const router = express.Router();
import { seedData } from '../controllers/seedController.js';

router.post('/seed', seedData);

export default router;
