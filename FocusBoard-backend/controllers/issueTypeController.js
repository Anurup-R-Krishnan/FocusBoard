const { z } = require('zod');
const IssueType = require('../models/IssueType');

const issueTypeSchema = z.object({
    name: z.string({ required_error: 'name is required.' }).min(1),
    defaultPriority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
    slaResolutionDays: z.number().min(1).optional(),
    supportEmail: z.string().optional(),
    isActive: z.boolean().optional(),
    autoReplyTemplate: z.string().optional(),
});

// POST /api/issue-types
const createIssueType = async (req, res) => {
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ success: false, message: 'Request body is missing or not valid JSON.' });
    }

    const result = issueTypeSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ success: false, message: 'Validation failed.', errors: result.error.issues });
    }

    try {
        const issueType = new IssueType(result.data);
        const saved = await issueType.save();
        return res.status(201).json({ success: true, data: saved });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/issue-types
const getAllIssueTypes = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await IssueType.countDocuments();
        const issueTypes = await IssueType.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        return res.status(200).json({ success: true, total, page: parseInt(page), limit: parseInt(limit), data: issueTypes });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/issue-types/:id
const getIssueTypeById = async (req, res) => {
    try {
        const issueType = await IssueType.findById(req.params.id);
        if (!issueType) return res.status(404).json({ success: false, message: 'Issue type not found.' });
        return res.status(200).json({ success: true, data: issueType });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/issue-types/:id
const updateIssueType = async (req, res) => {
    try {
        const allowedFields = ['name', 'defaultPriority', 'slaResolutionDays', 'supportEmail', 'isActive', 'autoReplyTemplate'];
        const updateFields = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updateFields[field] = req.body[field];
        }
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
        }
        const updated = await IssueType.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { returnDocument: 'after', runValidators: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Issue type not found.' });
        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/issue-types/:id
const deleteIssueType = async (req, res) => {
    try {
        const deleted = await IssueType.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Issue type not found.' });
        return res.status(200).json({ success: true, message: 'Issue type deleted successfully.', data: deleted });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createIssueType,
    getAllIssueTypes,
    getIssueTypeById,
    updateIssueType,
    deleteIssueType,
};
