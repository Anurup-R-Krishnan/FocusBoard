const express = require('express');
const router = express.Router();
const {
    createProject,
    getProjects,
    updateProject,
    deleteProject,
    calculateProgress
} = require('../controllers/projectController');
const requireAuth = require('../middleware/requireAuth');
const { validateSchema, createProjectSchema, updateProjectSchema } = require('../middleware/validation');

router.use(requireAuth);

router.post('/', validateSchema(createProjectSchema), createProject);
router.get('/', getProjects);
router.get('/calculate-progress', calculateProgress);
router.put('/:id', validateSchema(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
