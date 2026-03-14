const { z } = require('zod');
const Lead = require('../models/Lead');

const leadSchema = z.object({
  name: z.string({ required_error: 'name is required.' }).trim().min(1, 'name cannot be empty.'),
  email: z.string({ required_error: 'email is required.' }).trim().email('Invalid email.'),
  message: z.string().trim().optional().nullable(),
  source: z.string().trim().optional().nullable(),
});

// POST /api/leads
const createLead = async (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Request body is missing or not valid JSON.',
    });
  }
  const result = leadSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Validation failed.', errors: result.error.issues });
  }
  try {
    const lead = new Lead({
      ...result.data,
      source: result.data.source || 'landing_page',
      message: result.data.message || '',
    });
    const saved = await lead.save();
    return res.status(201).json({ success: true, data: saved });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/leads
const MAX_LIMIT = 100;

const getAllLeads = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), MAX_LIMIT);
    const skip = (safePage - 1) * safeLimit;
    const total = await Lead.countDocuments();
    const leads = await Lead.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit);
    return res.status(200).json({ success: true, total, page: safePage, limit: safeLimit, data: leads });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/leads/:id
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
    return res.status(200).json({ success: true, data: lead });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/leads/:id
const updateLead = async (req, res) => {
  try {
    const allowedFields = ['name', 'email', 'message', 'source'];
    const updateFields = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updateFields[field] = req.body[field];
    }
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
    }
    const updated = await Lead.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { returnDocument: 'after', runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Lead not found.' });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/leads/:id
const deleteLead = async (req, res) => {
  try {
    const deleted = await Lead.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Lead not found.' });
    return res.status(200).json({ success: true, message: 'Lead deleted successfully.', data: deleted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createLead, getAllLeads, getLeadById, updateLead, deleteLead };
