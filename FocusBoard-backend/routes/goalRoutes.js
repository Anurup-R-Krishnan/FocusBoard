import express from 'express';
const router = express.Router();
import {
    createGoal,
    getAllGoals,
    getGoalById,
    updateGoal,
    deleteGoal,
    checkGoalProgress,
} from '../controllers/goalController.js';

router.post('/', createGoal);
router.get('/check-progress', checkGoalProgress);
router.get('/', getAllGoals);
router.get('/:id', getGoalById);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
