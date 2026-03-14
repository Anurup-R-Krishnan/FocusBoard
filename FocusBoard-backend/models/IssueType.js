const mongoose = require('mongoose');

const issueTypeSchema = new mongoose.Schema({
    _id: { type: String, default: () => require('crypto').randomUUID() },
    name: { type: String, required: true, trim: true },
    defaultPriority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    slaResolutionDays: { type: Number, min: 1, default: 3 },
    supportEmail: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
    autoReplyTemplate: { type: String, trim: true, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('IssueType', issueTypeSchema);
