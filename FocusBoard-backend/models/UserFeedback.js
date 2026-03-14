const mongoose = require('mongoose');

const userFeedbackSchema = new mongoose.Schema({
    _id: { type: String, default: () => require('crypto').randomUUID() },
    ticketId: { type: String, ref: 'SupportTicket', required: true },
    satisfactionRating: { type: Number, min: 1, max: 5, required: true },
    issueFixed: { type: String, enum: ['Yes', 'No', 'Partially'], default: 'Yes' },
    agentHelpfulness: { type: Number, min: 1, max: 10, default: 5 },
    comments: { type: String, trim: true, default: '' },
    canUseAsTestimonial: { type: Boolean, default: false },
}, { timestamps: true });

userFeedbackSchema.index({ ticketId: 1 });

module.exports = mongoose.model('UserFeedback', userFeedbackSchema);
