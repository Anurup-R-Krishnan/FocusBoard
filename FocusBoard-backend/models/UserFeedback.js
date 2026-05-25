const { createModel } = require('../db/nedb');

module.exports = createModel('userfeedbacks', {
  _id: { type: String, default: () => require('crypto').randomUUID() },
  ticketId: { type: String, ref: 'SupportTicket', required: true },
  satisfactionRating: { type: Number, required: true },
  issueFixed: { type: String, default: 'Yes' },
  agentHelpfulness: { type: Number, default: 5 },
  comments: { type: String, default: '' },
  canUseAsTestimonial: { type: Boolean, default: false },
}, { timestamps: true, modelName: 'UserFeedback', indices: ['ticketId'] });
