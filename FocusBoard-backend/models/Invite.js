import crypto from 'crypto';
import { createModel } from '../db/nedb.js';

export default createModel('invites', {
  _id: { type: String, default: () => crypto.randomUUID() },
  workspace_id: { type: String, ref: 'Workspace', required: true },
  inviter_id: { type: String, ref: 'User', required: true },
  invitee_email: { type: String, required: true },
  token: { type: String, default: () => crypto.randomUUID() },
  status: { type: String, default: 'pending' },
  role: { type: String, default: 'Member' },
}, { timestamps: true, modelName: 'Invite', indices: [{ fieldName: 'token', unique: true }] });
