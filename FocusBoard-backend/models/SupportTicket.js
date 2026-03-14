const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    _id: { type: String, default: () => require('crypto').randomUUID() },
    userId: { type: String, ref: 'User', required: true },
    issueTypeId: { type: String, ref: 'IssueType', required: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    screenshotUrl: { type: String, trim: true, default: '' },
    deviceInfo: { type: String, trim: true, default: '' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
    consentToShareLogs: { type: Boolean, default: false },
}, { timestamps: true });

supportTicketSchema.index({ userId: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
