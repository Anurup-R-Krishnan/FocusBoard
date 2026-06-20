import crypto from 'crypto';
import { createModel } from '../db/nedb.js';

export default createModel('supporttickets', {
  _id: { type: String, default: () => crypto.randomUUID() },
  userId: { type: String, ref: 'User', required: true },
  issueTypeId: { type: String, ref: 'IssueType', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  screenshotUrl: { type: String, default: '' },
  deviceInfo: { type: String, default: '' },
  priority: { type: String, default: 'Medium' },
  status: { type: String, default: 'Open' },
  consentToShareLogs: { type: Boolean, default: false },
}, { timestamps: true, modelName: 'SupportTicket', indices: ['userId', 'status'] });
