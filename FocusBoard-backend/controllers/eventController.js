const { z } = require('zod');
const Event = require('../models/Event');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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

const mongoose = require('mongoose');
const { enqueueEventToFile } = require('../services/persistentQueue');


// Enhanced schema: stricter validation and sanitization at parse time
const eventSchema = z.object({
  event_id: z.string().uuid().optional().nullable(),
  title: z.string({ required_error: 'title is required.' }).min(1, 'title cannot be empty.').max(120),
  category_id: z.string().optional().nullable(),
  start_time: z.string({ required_error: 'start_time is required.' }).datetime(),
  end_time: z.string().optional().nullable(),
  priority: z.number().int().min(1).max(3).default(3),
  event_type: z.enum(['FOCUS', 'MEETING', 'PERSONAL', 'DEADLINE']).default('FOCUS'),
  is_recurring: z.boolean().default(false),
  label_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  attendees: z.array(z.string().email()).max(50).default([]),
  calendar: z.enum(['google', 'icloud', 'outlook']).default('google'),
}).strict().transform((obj) => {
  // server-side sanitization: redact obvious PII from title/location/description
  const hashValue = (value) =>
    crypto.createHash('sha256').update(value).digest('hex').slice(0, 8);

  const redact = (s, maxLen) => {
    if (!s || typeof s !== 'string') return s;
    // emails
    s = s.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]');
    // IPv4
    s = s.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[REDACTED_IP]');
    // unix paths
    s = s.replace(/\/(?:[^\s]+\/?)+/g, (match) => `[REDACTED_PATH:${hashValue(match)}]`);
    // windows paths
    s = s.replace(/[A-Za-z]:\\\\[^\s]+/g, (match) => `[REDACTED_PATH:${hashValue(match)}]`);
    if (maxLen && s.length > maxLen) s = s.slice(0, maxLen);
    return s;
  };

  return {
    ...obj,
    title: redact(obj.title, 120),
    location: redact(obj.location, 200),
    description: redact(obj.description, 500),
  };
});

const parseDateOrNull = (value) => {
  if (!value) return null;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const checkEventConflicts = async (userId, startTime, endTime, excludeEventId = null) => {
    const query = {
        user_id: userId,
        $or: [
            { start_time: { $lt: endTime }, end_time: { $gt: startTime } },
            { start_time: { $gte: startTime, $lt: endTime } },
            { end_time: { $gt: startTime, $lte: endTime } }
        ]
    };
    
    if (excludeEventId) {
        query._id = { $ne: excludeEventId };
    }
    
    const conflicts = await Event.find(query).select('title start_time end_time');
    return conflicts;
};

const createEvent = async (req, res) => {
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

  const result = eventSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Validation failed.', errors: result.error.issues });
  }

  try {
    // Idempotency: if client provided event_id, return existing event
    if (result.data.event_id) {
      const existing = await Event.findOne({ event_id: result.data.event_id, user_id: userId });
      if (existing) {
        return res.status(200).json({ success: true, data: existing, idempotent: true });
      }
    }

    const startTime = parseDateOrNull(result.data.start_time);
    const endTime = parseDateOrNull(result.data.end_time);
    if (!startTime) {
      return res.status(400).json({ success: false, message: 'Invalid start_time.' });
    }
    if (endTime && endTime < startTime) {
      return res.status(400).json({ success: false, message: 'end_time must be after start_time.' });
    }

    const conflicts = await checkEventConflicts(userId, startTime, endTime);
    const allowOverlap = req.body.allowOverlap === true;
    
    if (conflicts.length > 0 && !allowOverlap) {
      return res.status(409).json({ 
        success: false, 
        message: 'Event conflicts with existing events',
        conflicts: conflicts.map(c => ({ id: c._id, title: c.title, start_time: c.start_time, end_time: c.end_time }))
      });
    }

    // If DB is not connected, persist to on-disk queue for later flushing
    if (mongoose.connection.readyState !== 1) {
      try {
        enqueueEventToFile({
          ...result.data,
          user_id: userId,
          start_time: startTime,
          end_time: endTime,
        });
        return res.status(202).json({ success: true, queued: true, message: 'Event queued for later delivery.' });
      } catch (e) {
        console.error('Failed to enqueue event when DB down', e);
        return res.status(503).json({ success: false, message: 'Database unavailable and queueing failed.' });
      }
    }

    const event = new Event({
      ...result.data,
      user_id: userId,
      category_id: result.data.category_id || undefined,
      start_time: startTime,
      end_time: endTime,
    });
    const saved = await event.save();
    return res.status(201).json({ success: true, data: saved });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const upsertEvent = async (req, res) => {
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

  const result = eventSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Validation failed.', errors: result.error.issues });
  }

  if (!result.data.event_id) {
    return res.status(400).json({ success: false, message: 'event_id is required for upsert.' });
  }

  try {
    if (mongoose.connection.readyState === 1) {
      const existing = await Event.findOne({ event_id: result.data.event_id, user_id: userId });
      if (existing) {
        return res.status(200).json({ success: true, data: existing, idempotent: true });
      }
    }

    const startTime = parseDateOrNull(result.data.start_time);
    const endTime = parseDateOrNull(result.data.end_time);
    if (!startTime) {
      return res.status(400).json({ success: false, message: 'Invalid start_time.' });
    }
    if (endTime && endTime < startTime) {
      return res.status(400).json({ success: false, message: 'end_time must be after start_time.' });
    }

    const conflicts = await checkEventConflicts(userId, startTime, endTime);
    const allowOverlap = req.body.allowOverlap === true;

    if (conflicts.length > 0 && !allowOverlap) {
      return res.status(409).json({
        success: false,
        message: 'Event conflicts with existing events',
        conflicts: conflicts.map(c => ({ id: c._id, title: c.title, start_time: c.start_time, end_time: c.end_time }))
      });
    }

    if (mongoose.connection.readyState !== 1) {
      try {
        enqueueEventToFile({
          ...result.data,
          user_id: userId,
          start_time: startTime,
          end_time: endTime,
        });
        return res.status(202).json({ success: true, queued: true, message: 'Event queued for later delivery.' });
      } catch (e) {
        console.error('Failed to enqueue event when DB down', e);
        return res.status(503).json({ success: false, message: 'Database unavailable and queueing failed.' });
      }
    }

    const event = new Event({
      ...result.data,
      user_id: userId,
      category_id: result.data.category_id || undefined,
      start_time: startTime,
      end_time: endTime,
    });
    const saved = await event.save();
    return res.status(201).json({ success: true, data: saved });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const MAX_LIMIT = 100;

const getAllEvents = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = { user_id: userId };
    
    if (startDate || endDate) {
      filter.start_time = {};
      if (startDate) filter.start_time.$gte = new Date(startDate);
      if (endDate) filter.start_time.$lte = new Date(endDate);
    }
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), MAX_LIMIT);
    const skip = (safePage - 1) * safeLimit;
    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .sort({ start_time: -1 })
      .skip(skip)
      .limit(safeLimit);
    return res.status(200).json({ success: true, total, page: safePage, limit: safeLimit, data: events });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const event = await Event.findOne({ _id: req.params.id, user_id: userId });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { title, category_id, start_time, end_time, priority, event_type, is_recurring, label_color, description, location, attendees, calendar } = req.body;
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (category_id !== undefined) updateFields.category_id = category_id || null;
    if (start_time !== undefined) {
      const parsedStart = parseDateOrNull(start_time);
      if (!parsedStart) return res.status(400).json({ success: false, message: 'Invalid start_time.' });
      updateFields.start_time = parsedStart;
    }
    if (end_time !== undefined) {
      const parsedEnd = parseDateOrNull(end_time);
      if (end_time && !parsedEnd) return res.status(400).json({ success: false, message: 'Invalid end_time.' });
      updateFields.end_time = parsedEnd;
    }
    if (priority !== undefined) updateFields.priority = priority;
    if (event_type !== undefined) updateFields.event_type = event_type;
    if (is_recurring !== undefined) updateFields.is_recurring = is_recurring;
    if (label_color !== undefined) updateFields.label_color = label_color;
    if (description !== undefined) updateFields.description = description;
    if (location !== undefined) updateFields.location = location;
    if (attendees !== undefined) updateFields.attendees = attendees;
    if (calendar !== undefined) updateFields.calendar = calendar;
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
    }

    if (updateFields.end_time && updateFields.start_time && updateFields.end_time < updateFields.start_time) {
      return res.status(400).json({ success: false, message: 'end_time must be after start_time.' });
    }

    const updated = await Event.findOneAndUpdate(
      { _id: req.params.id, user_id: userId },
      { $set: updateFields },
      { returnDocument: 'after', runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Event not found.' });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const deleted = await Event.findOneAndDelete({ _id: req.params.id, user_id: userId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Event not found.' });
    return res.status(200).json({ success: true, message: 'Event deleted successfully.', data: deleted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createEvent,
  upsertEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
