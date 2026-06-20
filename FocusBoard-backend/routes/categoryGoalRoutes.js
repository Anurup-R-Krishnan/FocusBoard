import express from 'express';
const router = express.Router();
import {
    createGoal,
    getAllGoals,
    getGoalById,
    updateGoal,
    deleteGoal,
} from '../controllers/categoryGoalController.js';

router.post('/', createGoal);
router.get('/', getAllGoals);
router.get('/:id', getGoalById);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
