import crypto from 'crypto';
import { createModel } from '../db/nedb.js';

export default createModel('issuetypes', {
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  defaultPriority: { type: String, default: 'Medium' },
  slaResolutionDays: { type: Number, default: 3 },
  supportEmail: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  autoReplyTemplate: { type: String, default: '' },
}, { timestamps: true, modelName: 'IssueType' });
