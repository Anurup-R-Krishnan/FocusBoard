const { z } = require('zod');
const SupportTicket = require('../models/SupportTicket');
require('../models/User');
require('../models/IssueType');

const ticketSchema = z.object({
    userId: z.string({ required_error: 'userId is required.' }).min(1),
    issueTypeId: z.string({ required_error: 'issueTypeId is required.' }).min(1),
    subject: z.string({ required_error: 'subject is required.' }).min(1),
    description: z.string({ required_error: 'description is required.' }).min(1),
    screenshotUrl: z.string().optional(),
    deviceInfo: z.string().optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
    status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']).optional(),
    consentToShareLogs: z.boolean().optional(),
});

// POST /api/support-tickets
const createTicket = async (req, res) => {
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ success: false, message: 'Request body is missing or not valid JSON.' });
    }

    const result = ticketSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ success: false, message: 'Validation failed.', errors: result.error.issues });
    }

    try {
        const ticket = new SupportTicket(result.data);
        const saved = await ticket.save();
        const populated = await saved.populate([
            { path: 'userId', select: 'name email_id' },
            { path: 'issueTypeId', select: 'name defaultPriority' },
        ]);
        return res.status(201).json({ success: true, data: populated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/support-tickets
const getAllTickets = async (req, res) => {
    try {
        const { userId, status, priority, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (userId) filter.userId = userId;
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await SupportTicket.countDocuments(filter);
        const tickets = await SupportTicket.find(filter)
            .populate('userId', 'name email_id')
            .populate('issueTypeId', 'name defaultPriority slaResolutionDays')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({ success: true, total, page: parseInt(page), limit: parseInt(limit), data: tickets });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/support-tickets/:id
const getTicketById = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id)
            .populate('userId', 'name email_id')
            .populate('issueTypeId', 'name defaultPriority slaResolutionDays');
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
        return res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/support-tickets/:id
const updateTicket = async (req, res) => {
    try {
        const allowedFields = ['subject', 'description', 'screenshotUrl', 'deviceInfo', 'priority', 'status', 'consentToShareLogs', 'issueTypeId'];
        const updateFields = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updateFields[field] = req.body[field];
        }
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
        }
        const updated = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { returnDocument: 'after', runValidators: true }
        ).populate('userId', 'name email_id')
            .populate('issueTypeId', 'name defaultPriority slaResolutionDays');
        if (!updated) return res.status(404).json({ success: false, message: 'Ticket not found.' });
        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/support-tickets/:id
const deleteTicket = async (req, res) => {
    try {
        const deleted = await SupportTicket.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Ticket not found.' });
        return res.status(200).json({ success: true, message: 'Ticket deleted successfully.', data: deleted });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createTicket,
    getAllTickets,
    getTicketById,
    updateTicket,
    deleteTicket,
};
