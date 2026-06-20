import crypto from 'crypto';
import { createModel } from '../db/nedb.js';

export default createModel('projectrules', {
  _id: { type: String, default: () => crypto.randomUUID() },
  projectId: { type: String, ref: 'Project', required: true },
  pattern: { type: String, required: true },
  matchType: { type: String, required: true, enum: ['window_title', 'app_name', 'url'] },
  priority: { type: Number, default: 50 },
  userId: { type: String, ref: 'User', required: true },
}, { timestamps: true, modelName: 'ProjectRule', indices: ['projectId', 'userId'] });
