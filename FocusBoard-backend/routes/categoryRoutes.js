const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const {
  generateEmbeddings,
  regenerateEmbedding,
  recategorizeAllActivities,
} = require('../controllers/categoryEmbeddingController');

router.post('/', createCategory);
router.get('/', getAllCategories);
router.get('/generate-embeddings', generateEmbeddings);
router.post('/regenerate-embedding/:id', regenerateEmbedding);
router.post('/recategorize-activities', recategorizeAllActivities);
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
