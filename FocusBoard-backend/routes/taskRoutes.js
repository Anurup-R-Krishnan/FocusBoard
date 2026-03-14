const express = require('express');
const router = express.Router();
const {
    createTask,
    getTasks,
    updateTask,
    deleteTask,
    logTime
} = require('../controllers/taskController');
const requireAuth = require('../middleware/requireAuth');
const { validateSchema, createTaskSchema, updateTaskSchema } = require('../middleware/validation');

router.use(requireAuth);

router.post('/', validateSchema(createTaskSchema), createTask);
router.get('/', getTasks);
router.put('/:id/time', logTime);
router.put('/:id', validateSchema(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
