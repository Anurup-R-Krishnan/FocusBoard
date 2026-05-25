const { createModel } = require('../db/nedb');

module.exports = createModel('integrations', {
  _id: { type: String, default: () => require('crypto').randomUUID() },
  name: { type: String, required: true },
  category: { type: String, required: true },
  connected: { type: Boolean, default: false },
  syncStatus: { type: String, default: 'Pending' },
  lastSync: { type: Date },
  config: { type: Object, default: {} },
  user_id: { type: String, ref: 'User', required: true },
}, { timestamps: true, modelName: 'Integration' });
