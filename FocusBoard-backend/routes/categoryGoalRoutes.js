const express = require('express');
const router = express.Router();
const {
    createGoal,
    getAllGoals,
    getGoalById,
    updateGoal,
    deleteGoal,
} = require('../controllers/categoryGoalController');

router.post('/', createGoal);
router.get('/', getAllGoals);
router.get('/:id', getGoalById);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
