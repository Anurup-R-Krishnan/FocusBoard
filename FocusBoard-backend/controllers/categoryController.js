const { z } = require('zod');
const Category = require('../models/Category');

const categorySchema = z.object({
  name: z.string({ required_error: 'name is required.' }).min(1, 'name cannot be empty.'),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  productivityScore: z.number().min(-5).max(5).optional(),
  isDefault: z.boolean().optional(),
});

// POST /api/categories
const createCategory = async (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ success: false, message: 'Request body is missing or not valid JSON.' });
  }

  const result = categorySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Validation failed.', errors: result.error.issues });
  }

  try {
    const category = new Category(result.data);
    const saved = await category.save();
    return res.status(201).json({ success: true, data: saved });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/categories
const MAX_LIMIT = 100;

const getAllCategories = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), MAX_LIMIT);
    const skip = (safePage - 1) * safeLimit;
    const total = await Category.countDocuments();
    const categories = await Category.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit);
    return res.status(200).json({ success: true, total, page: safePage, limit: safeLimit, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/categories/:id
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const allowedFields = ['name', 'description', 'color', 'icon', 'productivityScore', 'isDefault'];
    const updateFields = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updateFields[field] = req.body[field];
    }
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
    }
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { returnDocument: 'after', runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Category not found.' });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const { deleteActivities } = req.query;
    const categoryId = req.params.id;
    
    const deleted = await Category.findByIdAndDelete(categoryId);
    if (!deleted) return res.status(404).json({ success: false, message: 'Category not found.' });

    const Activity = require('../models/Activity');
    const ActivityMapping = require('../models/ActivityMapping');

    await Activity.updateMany(
      { category_id: categoryId },
      { $set: { category_id: null } }
    );

    await ActivityMapping.deleteMany({ categoryId: categoryId });

    let activitiesAffected = 0;
    if (deleteActivities === 'true') {
      const result = await Activity.deleteMany({ category_id: categoryId });
      activitiesAffected = result.deletedCount;
      await ActivityMapping.deleteMany({ categoryId: categoryId });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Category deleted successfully.', 
      data: deleted,
      activitiesNullified: await Activity.countDocuments({ category_id: null }),
      activitiesDeleted: activitiesAffected
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
