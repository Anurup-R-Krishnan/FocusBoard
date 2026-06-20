import express from 'express';
const router = express.Router();
import {
    createTask,
    getTasks,
    updateTask,
    deleteTask,
    logTime
} from '../controllers/taskController.js';
import requireAuth from '../middleware/requireAuth.js';
import { validateSchema, createTaskSchema, updateTaskSchema } from '../middleware/validation.js';

router.use(requireAuth);

router.post('/', validateSchema(createTaskSchema), createTask);
router.get('/', getTasks);
router.put('/:id/time', logTime);
router.put('/:id', validateSchema(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

export default router;
