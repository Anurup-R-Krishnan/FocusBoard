const { z } = require('zod');
const Activity = require('../models/Activity');
const ActivityMapping = require('../models/ActivityMapping');
const User = require('../models/User');
const { matchByRules } = require('../services/categorizationService');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const config = require('../config');
require('../models/Category');

const ML_SERVICE_URL = config.ML_SERVICE_URL;
const JWT_SECRET = config.JWT_SECRET;
const DEFAULT_ACTIVITY_COLOR = config.DEFAULT_ACTIVITY_COLOR;

const MAX_URL_LENGTH = 2048;
const DUPLICATE_TIME_WINDOW_MS = 5000;

const activitySchema = z.object({
  app_name: z.string({ required_error: 'app_name is required.' }).min(1, 'app_name cannot be empty.').max(200),
  window_title: z.string().max(500).optional(),
  url: z.string().max(MAX_URL_LENGTH).optional(),
  start_time: z.string(),
  end_time: z.string().optional(),
  user_id: z.string().optional(),
  category_id: z.string().optional(),
  color: z.string().default(DEFAULT_ACTIVITY_COLOR),
  idle: z.union([z.number().int().nonnegative(), z.boolean()]).default(0),
});

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
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded?.id || null;
  } catch (error) {
    return null;
  }
};

// POST /api/activities
// Create a new activity (used by the auto-tracker to insert logged app usage)
const createActivity = async (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Request body is missing or not valid JSON. Ensure Content-Type: application/json is set.',
    });
  }

  const result = activitySchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues;
    return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  }

  try {
    const { app_name, window_title, url, start_time, end_time, category_id, color, idle, user_id } = result.data;
    const resolvedUserId = getUserIdFromRequest(req) || user_id || null;
    const normalizedIdle = typeof idle === 'boolean' ? (idle ? 1 : 0) : idle;

    if (resolvedUserId) {
      const startTimeMs = new Date(start_time).getTime();
      const timeWindowStart = new Date(startTimeMs - DUPLICATE_TIME_WINDOW_MS);
      const timeWindowEnd = new Date(startTimeMs + DUPLICATE_TIME_WINDOW_MS);

      const duplicate = await Activity.findOne({
        user_id: resolvedUserId,
        app_name,
        start_time: { $gte: timeWindowStart, $lte: timeWindowEnd }
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'Duplicate activity detected within time window',
          duplicateId: duplicate._id
        });
      }
    }

    const activity = new Activity({
      app_name,
      window_title: window_title || '',
      url: url || '',
      start_time,
      end_time: end_time || null,
      user_id: resolvedUserId,
      category_id: category_id || null,
      color,
      idle: normalizedIdle,
    });

    const saved = await activity.save();

    const matchedCategoryId = await matchByRules(saved);
    if (matchedCategoryId) {
      const mapping = new ActivityMapping({
        activityId: saved._id,
        categoryId: matchedCategoryId,
        confidenceScore: 100,
        isManualOverride: false,
      });
      await mapping.save();

      if (!saved.category_id) {
        saved.category_id = matchedCategoryId;
        await saved.save();
      }
    }

    if (url) {
      try {
        const nsfwCheck = await axios.post(`${ML_SERVICE_URL}/check-nsfw`, { url, window_title: '' });
        if (nsfwCheck.data.flagged && resolvedUserId) {
          const user = await User.findById(resolvedUserId);
          if (user && user.age && user.age < 16) {
            saved.nsfw_flagged = true;
            await saved.save();
          }
        }
      } catch (error) {
        logger.warn(`NSFW check failed: ${error.message}`);
      }
    }

    const io = req.app.get('io');
    if (io) {
      try { io.emit('data_updated', { type: 'activity', data: saved }); }
      catch (e) { console.error('Socket emit error:', e.message); }
    }

    return res.status(201).json({ success: true, data: saved });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const MAX_BATCH_SIZE = 50;

const createActivitiesBatch = async (req, res) => {
  if (!req.body || !Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Request body must be an array of activities',
    });
  }

  const activities = req.body;

  if (activities.length > MAX_BATCH_SIZE) {
    return res.status(400).json({
      success: false,
      message: `Maximum batch size is ${MAX_BATCH_SIZE}`,
    });
  }

  const results = [];
  const errors = [];

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    const parseResult = activitySchema.safeParse(act);

    if (!parseResult.success) {
      errors.push({ index: i, error: parseResult.error.issues });
      continue;
    }

    try {
      const { app_name, window_title, url, start_time, end_time, category_id, color, idle, user_id } = parseResult.data;
      const resolvedUserId = getUserIdFromRequest(req) || user_id || null;
      const normalizedIdle = typeof idle === 'boolean' ? (idle ? 1 : 0) : idle;

      const activity = new Activity({
        app_name,
        window_title: window_title || '',
        url: url || '',
        start_time,
        end_time: end_time || null,
        user_id: resolvedUserId,
        category_id: category_id || null,
        color: color || DEFAULT_ACTIVITY_COLOR,
        idle: normalizedIdle,
      });

      const saved = await activity.save();
      results.push(saved);
    } catch (e) {
      errors.push({ index: i, error: e.message });
    }
  }

  return res.status(201).json({
    success: true,
    data: {
      created: results.length,
      errors: errors.length,
      activities: results,
      errorDetails: errors
    }
  });
};

const getRecentActivities = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const safeLimit = Math.min(Math.max(1, parseInt(req.query.limit || '15', 10)), 50);

    const activities = await Activity.find({ user_id: userId })
      .populate('category_id', 'name description')
      .sort({ start_time: -1 })
      .limit(safeLimit);

    return res.status(200).json({ success: true, data: activities });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/activities
// Get all activities, with optional date-range and app_name filters
// Query params: startDate, endDate, app_name, page, limit
const MAX_LIMIT = 100;

const getAllActivities = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { startDate, endDate, app_name, page = 1, limit = 50 } = req.query;

    const filter = { user_id: userId };

    if (app_name) {
      const safeAppName = app_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.app_name = { $regex: safeAppName, $options: 'i' };
    }

    if (startDate || endDate) {
      filter.start_time = {};
      if (startDate) filter.start_time.$gte = new Date(startDate);
      if (endDate) filter.start_time.$lte = new Date(endDate);
    }

    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), MAX_LIMIT);
    const skip = (safePage - 1) * safeLimit;
    const total = await Activity.countDocuments(filter);

    const activities = await Activity.find(filter)
      .populate('category_id', 'name description')
      .sort({ start_time: -1 })
      .skip(skip)
      .limit(safeLimit);

    return res.status(200).json({
      success: true,
      total,
      page: safePage,
      limit: safeLimit,
      data: activities,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/activities/:id
// Get a single activity by ID
const getActivityById = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const activity = await Activity.findOne({ _id: req.params.id, user_id: userId }).populate('category_id', 'name description');

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found.' });
    }

    return res.status(200).json({ success: true, data: activity });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/activities/:id
// Update an activity (e.g. set end_time, assign category, update color)
const updateActivity = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { app_name, window_title, url, start_time, end_time, category_id, color, idle } = req.body;

    const updateFields = {};
    if (app_name !== undefined) updateFields.app_name = app_name;
    if (window_title !== undefined) updateFields.window_title = window_title;
    if (url !== undefined) updateFields.url = url;
    if (start_time !== undefined) updateFields.start_time = start_time;
    if (end_time !== undefined) updateFields.end_time = end_time;
    if (category_id !== undefined) updateFields.category_id = category_id;
    if (color !== undefined) updateFields.color = color;
    if (idle !== undefined) updateFields.idle = idle;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
    }

    const updated = await Activity.findOneAndUpdate(
      { _id: req.params.id, user_id: userId },
      { $set: updateFields },
      { returnDocument: 'after', runValidators: true }
    ).populate('category_id', 'name description');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Activity not found.' });
    }

    if (category_id !== undefined) {
        await ActivityMapping.findOneAndUpdate(
            { activityId: updated._id },
            { 
                activityId: updated._id,
                categoryId: category_id, 
                confidenceScore: 100, 
                isManualOverride: true,
                overrideReason: 'Manual category assignment'
            },
            { upsert: true }
        );
    }

    if (app_name !== undefined || url !== undefined || window_title !== undefined) {
        const newAppName = app_name || updated.app_name;
        const newUrl = url || updated.url;
        const newWindowTitle = window_title || updated.window_title;
        
        const matchedCategoryId = await matchByRules({
            app_name: newAppName,
            url: newUrl,
            window_title: newWindowTitle
        });
        
        if (matchedCategoryId && matchedCategoryId !== updated.category_id) {
            updated.category_id = matchedCategoryId;
            await updated.save();
            
            await ActivityMapping.findOneAndUpdate(
                { activityId: updated._id },
                { categoryId: matchedCategoryId, confidenceScore: 100, isManualOverride: false },
                { upsert: true }
            );
        }
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/activities/:id
// Delete a single activity by ID
const deleteActivity = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const deleted = await Activity.findOneAndDelete({ _id: req.params.id, user_id: userId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Activity not found.' });
    }

    return res.status(200).json({ success: true, message: 'Activity deleted successfully.', data: deleted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/activities
// Bulk delete activities by date range (useful for clearing old logs)
// Query params: startDate, endDate (both required)
const bulkDeleteActivities = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both startDate and endDate query parameters are required for bulk delete.',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use ISO 8601 format.',
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'startDate must be before endDate.',
      });
    }

    const maxRangeMs = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > maxRangeMs) {
      return res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 365 days.',
      });
    }

    const result = await Activity.deleteMany({
      user_id: userId,
      start_time: {
        $gte: start,
        $lte: end,
      },
    });

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} activities deleted.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const exportActivities = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { startDate, endDate, format = 'json' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required.' });
    }

    const filter = { user_id: userId };
    
    if (startDate || endDate) {
      filter.start_time = {};
      if (startDate) filter.start_time.$gte = new Date(startDate);
      if (endDate) filter.start_time.$lte = new Date(endDate);
    }

    const activities = await Activity.find(filter)
      .populate('category_id', 'name color')
      .sort({ start_time: -1 });

    if (format === 'csv') {
      const csvHeader = 'app_name,window_title,url,start_time,end_time,category,color,idle,nsfw_flagged\n';
      const csvRows = activities.map(a => 
        `"${a.app_name}","${a.window_title || ''}","${a.url || ''}","${a.start_time}","${a.end_time || ''}","${a.category_id?.name || ''}","${a.color || ''}",${a.idle},${a.nsfw_flagged}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activities.csv');
      return res.send(csvHeader + csvRows);
    }

    return res.status(200).json({ success: true, data: activities, count: activities.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const importActivities = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!req.body || !Array.isArray(req.body)) {
      return res.status(400).json({ success: false, message: 'Request body must be an array of activities.' });
    }

    const activities = req.body;
    const MAX_IMPORT = 1000;
    
    if (activities.length > MAX_IMPORT) {
      return res.status(400).json({ success: false, message: `Maximum import size is ${MAX_IMPORT} activities.` });
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < activities.length; i++) {
      try {
        const act = activities[i];
        
        const activity = new Activity({
          app_name: act.app_name || act.appName || 'Unknown',
          window_title: act.window_title || act.windowTitle || '',
          url: act.url || '',
          start_time: act.start_time || act.startTime || new Date(),
          end_time: act.end_time || act.endTime || null,
          user_id: userId,
          category_id: act.category_id || act.categoryId || null,
          color: act.color || '#3B82F6',
          idle: act.idle || 0,
          nsfw_flagged: act.nsfw_flagged || act.nsfwFlagged || false,
        });

        await activity.save();
        results.success++;
      } catch (e) {
        results.failed++;
        results.errors.push({ index: i, error: e.message });
      }
    }

    return res.status(201).json({ 
      success: true, 
      message: `Imported ${results.success} activities, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createActivity,
  createActivitiesBatch,
  getAllActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  bulkDeleteActivities,
  getRecentActivities,
  exportActivities,
  importActivities,
};
