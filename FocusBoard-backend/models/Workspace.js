import crypto from 'crypto';
import { createModel } from '../db/nedb.js';

export default createModel('workspaces', {
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  owner_id: { type: String, ref: 'User', required: true },
  member_ids: { type: Array, default: [] },
  seat_limit: { type: Number, default: 10 },
  billing_plan: { type: String, default: 'free' },
}, { timestamps: true, modelName: 'Workspace', indices: ['owner_id'] });
