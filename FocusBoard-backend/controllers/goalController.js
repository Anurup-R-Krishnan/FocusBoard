const { z } = require('zod');
const Goal = require('../models/Goal');
const jwt = require('jsonwebtoken');
const config = require('../config');

const getUserIdFromRequest = (req) => {
    if (req.user && req.user.id) {
        return req.user.id;
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        return decoded?.id || null;
    } catch (error) {
        return null;
    }
};

const goalSchema = z.object({
    title: z.string({ required_error: 'title is required.' }).min(1, 'title cannot be empty.').max(200),
    target_deep_work: z.number({ required_error: 'target_deep_work is required.' }).int().positive('Must be a positive number.'),
    distraction_limit: z.number({ required_error: 'distraction_limit is required.' }).int().nonnegative('Must be zero or positive.'),
    priority_tasks: z.array(z.string()).max(20).default([]),
    notes: z.string().max(2000).optional(),
    date: z.string({ required_error: 'date is required.' }),
    achieved: z.boolean().default(false),
});

const MAX_LIMIT = 100;

const createGoal = async (req, res) => {
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
            success: false,
            message: 'Request body is missing or not valid JSON.',
        });
    }

    const userId = getUserIdFromRequest(req);
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const result = goalSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({ success: false, message: 'Validation failed.', errors: result.error.issues });
    }

    try {
        const goal = new Goal({ ...result.data, user_id: userId });
        const saved = await goal.save();
        return res.status(201).json({ success: true, data: saved });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getAllGoals = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const { startDate, endDate, page = 1, limit = 50 } = req.query;
        const filter = { user_id: userId };

        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), MAX_LIMIT);
        const skip = (safePage - 1) * safeLimit;
        const total = await Goal.countDocuments(filter);
        const goals = await Goal.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(safeLimit);

        return res.status(200).json({ success: true, total, page: safePage, limit: safeLimit, data: goals });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getGoalById = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const goal = await Goal.findOne({ _id: req.params.id, user_id: userId });
        if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
        return res.status(200).json({ success: true, data: goal });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateGoal = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const { title, target_deep_work, distraction_limit, priority_tasks, notes, date, achieved } = req.body;

        const updateFields = {};
        if (title !== undefined) updateFields.title = title;
        if (target_deep_work !== undefined) updateFields.target_deep_work = target_deep_work;
        if (distraction_limit !== undefined) updateFields.distraction_limit = distraction_limit;
        if (priority_tasks !== undefined) updateFields.priority_tasks = priority_tasks;
        if (notes !== undefined) updateFields.notes = notes;
        if (date !== undefined) updateFields.date = date;
        if (achieved !== undefined) updateFields.achieved = achieved;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
        }

        const updated = await Goal.findOneAndUpdate(
            { _id: req.params.id, user_id: userId },
            { $set: updateFields },
            { returnDocument: 'after', runValidators: true }
        );

        if (!updated) return res.status(404).json({ success: false, message: 'Goal not found.' });
        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteGoal = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const deleted = await Goal.findOneAndDelete({ _id: req.params.id, user_id: userId });
        if (!deleted) return res.status(404).json({ success: false, message: 'Goal not found.' });
        return res.status(200).json({ success: true, message: 'Goal deleted successfully.', data: deleted });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const checkGoalProgress = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const Activity = require('../models/Activity');
        const Category = require('../models/Category');
        
        const goals = await Goal.find({ user_id: userId, achieved: false });
        
        const results = [];
        
        for (const goal of goals) {
            const goalDate = new Date(goal.date);
            const startOfDay = new Date(goalDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(goalDate);
            endOfDay.setHours(23, 59, 59, 999);

            const dayActivities = await Activity.find({
                user_id: userId,
                start_time: { $gte: startOfDay, $lte: endOfDay },
                idle: { $ne: 1, $ne: true }
            }).populate('category_id', 'productivityScore');

            let focusMinutes = 0;
            let distractionCount = 0;

            dayActivities.forEach(act => {
                const start = new Date(act.start_time).getTime();
                const end = act.end_time ? new Date(act.end_time).getTime() : start + 60 * 1000;
                const minutes = Math.round((end - start) / 60000);
                const score = act.category_id?.productivityScore ?? 0;

                if (score >= 0) {
                    focusMinutes += minutes;
                } else {
                    distractionCount++;
                }
            });

            const progress = Math.min(100, Math.round((focusMinutes / goal.target_deep_work) * 100));
            const wasAchieved = goal.achieved;
            const isNowAchieved = focusMinutes >= goal.target_deep_work && distractionCount <= goal.distraction_limit;

            if (!wasAchieved && isNowAchieved) {
                goal.achieved = true;
                await goal.save();
            }

            results.push({
                goalId: goal._id,
                title: goal.title,
                targetMinutes: goal.target_deep_work,
                actualMinutes: focusMinutes,
                targetDistractions: goal.distraction_limit,
                actualDistractions: distractionCount,
                progress,
                achieved: isNowAchieved,
                justAchieved: !wasAchieved && isNowAchieved
            });
        }

        return res.status(200).json({ 
            success: true, 
            data: results,
            summary: {
                total: results.length,
                achieved: results.filter(r => r.achieved).length,
                pending: results.filter(r => !r.achieved).length
            }
        });
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
    checkGoalProgress,
};
