const mongoose = require('mongoose');

const ticketResolutionSchema = new mongoose.Schema({
    _id: { type: String, default: () => require('crypto').randomUUID() },
    ticketId: { type: String, ref: 'SupportTicket', required: true },
    agentName: { type: String, required: true, trim: true },
    resolutionNotes: { type: String, trim: true, default: '' },
    escalateToDevTeam: { type: Boolean, default: false },
    statusUpdate: { type: String, enum: ['Resolved', 'Waiting on User', 'Open'], default: 'Resolved' },
    resolvedAt: { type: Date, default: null },
}, { timestamps: true });

ticketResolutionSchema.index({ ticketId: 1 });

module.exports = mongoose.model('TicketResolution', ticketResolutionSchema);
