const { createModel } = require('../db/nedb');

module.exports = createModel('projects', {
  _id: { type: String, default: () => require('crypto').randomUUID() },
  title: { type: String, required: true },
  members: { type: Number, default: 1 },
  progress: { type: Number, default: 0 },
  status: { type: String, default: 'On Track' },
  due_date: { type: Date },
  user_id: { type: String, ref: 'User', required: true },
}, { timestamps: true, modelName: 'Project', indices: ['user_id', 'status', 'due_date'] });
