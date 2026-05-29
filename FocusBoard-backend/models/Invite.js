const { createModel } = require('../db/nedb');

module.exports = createModel('invites', {
  _id: { type: String, default: () => require('crypto').randomUUID() },
  workspace_id: { type: String, ref: 'Workspace', required: true },
  inviter_id: { type: String, ref: 'User', required: true },
  invitee_email: { type: String, required: true },
  token: { type: String, default: () => require('crypto').randomUUID() },
  status: { type: String, default: 'pending' },
  role: { type: String, default: 'Member' },
}, { timestamps: true, modelName: 'Invite', indices: [{ fieldName: 'token', unique: true }] });
