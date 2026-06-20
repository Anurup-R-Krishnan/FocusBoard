import express from 'express';
const router = express.Router();
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import {
  generateEmbeddings,
  regenerateEmbedding,
  recategorizeAllActivities,
} from '../controllers/categoryEmbeddingController.js';

router.post('/', createCategory);
router.get('/', getAllCategories);
router.get('/generate-embeddings', generateEmbeddings);
router.post('/regenerate-embedding/:id', regenerateEmbedding);
router.post('/recategorize-activities', recategorizeAllActivities);
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
