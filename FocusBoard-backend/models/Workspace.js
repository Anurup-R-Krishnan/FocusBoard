const { createModel } = require('../db/nedb');

module.exports = createModel('workspaces', {
  _id: { type: String, default: () => require('crypto').randomUUID() },
  name: { type: String, required: true },
  owner_id: { type: String, ref: 'User', required: true },
  member_ids: { type: Array, default: [] },
  seat_limit: { type: Number, default: 10 },
  billing_plan: { type: String, default: 'free' },
}, { timestamps: true, modelName: 'Workspace', indices: ['owner_id'] });
