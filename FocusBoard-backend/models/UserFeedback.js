import crypto from 'crypto';
import { createModel } from '../db/nedb.js';

export default createModel('userfeedbacks', {
  _id: { type: String, default: () => crypto.randomUUID() },
  ticketId: { type: String, ref: 'SupportTicket', required: true },
  satisfactionRating: { type: Number, required: true },
  issueFixed: { type: String, default: 'Yes' },
  agentHelpfulness: { type: Number, default: 5 },
  comments: { type: String, default: '' },
  canUseAsTestimonial: { type: Boolean, default: false },
}, { timestamps: true, modelName: 'UserFeedback', indices: ['ticketId'] });
