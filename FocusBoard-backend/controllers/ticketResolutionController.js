const { z } = require('zod');
const TicketResolution = require('../models/TicketResolution');
require('../models/SupportTicket');

const resolutionSchema = z.object({
    ticketId: z.string({ required_error: 'ticketId is required.' }).min(1),
    agentName: z.string({ required_error: 'agentName is required.' }).min(1),
    resolutionNotes: z.string().optional(),
    escalateToDevTeam: z.boolean().optional(),
    statusUpdate: z.enum(['Resolved', 'Waiting on User', 'Open']).optional(),
    resolvedAt: z.string().optional(),
});

// POST /api/ticket-resolutions
const createResolution = async (req, res) => {
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ success: false, message: 'Request body is missing or not valid JSON.' });
    }

    const result = resolutionSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ success: false, message: 'Validation failed.', errors: result.error.issues });
    }

    try {
        const data = { ...result.data };
        if (data.resolvedAt) data.resolvedAt = new Date(data.resolvedAt);
        const resolution = new TicketResolution(data);
        const saved = await resolution.save();
        const populated = await saved.populate({ path: 'ticketId', select: 'subject status priority' });
        return res.status(201).json({ success: true, data: populated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/ticket-resolutions
const getAllResolutions = async (req, res) => {
    try {
        const { ticketId, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (ticketId) filter.ticketId = ticketId;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await TicketResolution.countDocuments(filter);
        const resolutions = await TicketResolution.find(filter)
            .populate('ticketId', 'subject status priority')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({ success: true, total, page: parseInt(page), limit: parseInt(limit), data: resolutions });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/ticket-resolutions/:id
const getResolutionById = async (req, res) => {
    try {
        const resolution = await TicketResolution.findById(req.params.id)
            .populate('ticketId', 'subject status priority');
        if (!resolution) return res.status(404).json({ success: false, message: 'Resolution not found.' });
        return res.status(200).json({ success: true, data: resolution });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/ticket-resolutions/:id
const updateResolution = async (req, res) => {
    try {
        const allowedFields = ['agentName', 'resolutionNotes', 'escalateToDevTeam', 'statusUpdate', 'resolvedAt'];
        const updateFields = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateFields[field] = field === 'resolvedAt' ? new Date(req.body[field]) : req.body[field];
            }
        }
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
        }
        const updated = await TicketResolution.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { returnDocument: 'after', runValidators: true }
        ).populate('ticketId', 'subject status priority');
        if (!updated) return res.status(404).json({ success: false, message: 'Resolution not found.' });
        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/ticket-resolutions/:id
const deleteResolution = async (req, res) => {
    try {
        const deleted = await TicketResolution.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Resolution not found.' });
        return res.status(200).json({ success: true, message: 'Resolution deleted successfully.', data: deleted });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createResolution,
    getAllResolutions,
    getResolutionById,
    updateResolution,
    deleteResolution,
};
