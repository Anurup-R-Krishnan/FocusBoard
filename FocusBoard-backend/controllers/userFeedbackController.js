const { z } = require('zod');
const UserFeedback = require('../models/UserFeedback');
require('../models/SupportTicket');

const feedbackSchema = z.object({
    ticketId: z.string({ required_error: 'ticketId is required.' }).min(1),
    satisfactionRating: z.number({ required_error: 'satisfactionRating is required.' }).min(1).max(5),
    issueFixed: z.enum(['Yes', 'No', 'Partially']).optional(),
    agentHelpfulness: z.number().min(1).max(10).optional(),
    comments: z.string().optional(),
    canUseAsTestimonial: z.boolean().optional(),
});

// POST /api/user-feedback
const createFeedback = async (req, res) => {
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ success: false, message: 'Request body is missing or not valid JSON.' });
    }

    const result = feedbackSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ success: false, message: 'Validation failed.', errors: result.error.issues });
    }

    try {
        const feedback = new UserFeedback(result.data);
        const saved = await feedback.save();
        const populated = await saved.populate({ path: 'ticketId', select: 'subject status' });
        return res.status(201).json({ success: true, data: populated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/user-feedback
const getAllFeedback = async (req, res) => {
    try {
        const { ticketId, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (ticketId) filter.ticketId = ticketId;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await UserFeedback.countDocuments(filter);
        const feedback = await UserFeedback.find(filter)
            .populate('ticketId', 'subject status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({ success: true, total, page: parseInt(page), limit: parseInt(limit), data: feedback });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/user-feedback/:id
const getFeedbackById = async (req, res) => {
    try {
        const feedback = await UserFeedback.findById(req.params.id)
            .populate('ticketId', 'subject status');
        if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found.' });
        return res.status(200).json({ success: true, data: feedback });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/user-feedback/:id
const updateFeedback = async (req, res) => {
    try {
        const allowedFields = ['satisfactionRating', 'issueFixed', 'agentHelpfulness', 'comments', 'canUseAsTestimonial'];
        const updateFields = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updateFields[field] = req.body[field];
        }
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
        }
        const updated = await UserFeedback.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { returnDocument: 'after', runValidators: true }
        ).populate('ticketId', 'subject status');
        if (!updated) return res.status(404).json({ success: false, message: 'Feedback not found.' });
        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/user-feedback/:id
const deleteFeedback = async (req, res) => {
    try {
        const deleted = await UserFeedback.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Feedback not found.' });
        return res.status(200).json({ success: true, message: 'Feedback deleted successfully.', data: deleted });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createFeedback,
    getAllFeedback,
    getFeedbackById,
    updateFeedback,
    deleteFeedback,
};
