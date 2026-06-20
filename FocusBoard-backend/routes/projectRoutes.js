import express from 'express';
const router = express.Router();
import {
    createProject,
    getProjects,
    updateProject,
    deleteProject,
    calculateProgress
} from '../controllers/projectController.js';
import requireAuth from '../middleware/requireAuth.js';
import { validateSchema, createProjectSchema, updateProjectSchema } from '../middleware/validation.js';

router.use(requireAuth);

router.post('/', validateSchema(createProjectSchema), createProject);
router.get('/', getProjects);
router.get('/calculate-progress', calculateProgress);
router.put('/:id', validateSchema(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

export default router;
