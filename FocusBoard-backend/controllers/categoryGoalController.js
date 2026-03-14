const { z } = require('zod');
const CategoryGoal = require('../models/CategoryGoal');
require('../models/User');
require('../models/Category');

const goalSchema = z.object({
    userId: z.string({ required_error: 'userId is required.' }).min(1),
    categoryId: z.string({ required_error: 'categoryId is required.' }).min(1),
    dailyLimitMinutes: z.number().min(0).optional(),
    weeklyLimitMinutes: z.number().min(0).optional(),
    alertEnabled: z.boolean().optional(),
    goalType: z.enum(['reduce', 'increase']).optional(),
});

// POST /api/category-goals
const createGoal = async (req, res) => {
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ success: false, message: 'Request body is missing or not valid JSON.' });
    }

    const result = goalSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ success: false, message: 'Validation failed.', errors: result.error.issues });
    }

    try {
        const goal = new CategoryGoal(result.data);
        const saved = await goal.save();
        const populated = await saved.populate([
            { path: 'userId', select: 'name email_id' },
            { path: 'categoryId', select: 'name color icon' },
        ]);
        return res.status(201).json({ success: true, data: populated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/category-goals
const getAllGoals = async (req, res) => {
    try {
        const { userId, categoryId, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (userId) filter.userId = userId;
        if (categoryId) filter.categoryId = categoryId;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await CategoryGoal.countDocuments(filter);
        const goals = await CategoryGoal.find(filter)
            .populate('userId', 'name email_id')
            .populate('categoryId', 'name color icon')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({ success: true, total, page: parseInt(page), limit: parseInt(limit), data: goals });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/category-goals/:id
const getGoalById = async (req, res) => {
    try {
        const goal = await CategoryGoal.findById(req.params.id)
            .populate('userId', 'name email_id')
            .populate('categoryId', 'name color icon');
        if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
        return res.status(200).json({ success: true, data: goal });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/category-goals/:id
const updateGoal = async (req, res) => {
    try {
        const allowedFields = ['userId', 'categoryId', 'dailyLimitMinutes', 'weeklyLimitMinutes', 'alertEnabled', 'goalType'];
        const updateFields = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updateFields[field] = req.body[field];
        }
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
        }
        const updated = await CategoryGoal.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { returnDocument: 'after', runValidators: true }
        ).populate('userId', 'name email_id')
            .populate('categoryId', 'name color icon');
        if (!updated) return res.status(404).json({ success: false, message: 'Goal not found.' });
        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/category-goals/:id
const deleteGoal = async (req, res) => {
    try {
        const deleted = await CategoryGoal.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Goal not found.' });
        return res.status(200).json({ success: true, message: 'Goal deleted successfully.', data: deleted });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createGoal,
    getAllGoals,
    getGoalById,
    updateGoal,
    deleteGoal,
};
