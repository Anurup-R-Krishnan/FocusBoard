const { createModel } = require('../db/nedb');

module.exports = createModel('tasks', {
  _id: { type: String, default: () => require('crypto').randomUUID() },
  title: { type: String, required: true },
  project: { type: String },
  client: { type: String },
  status: { type: String, default: 'TODO' },
  priority: { type: String, default: 'MEDIUM' },
  timeSpent: { type: Number, default: 0 },
  billable: { type: Boolean, default: true },
  archived: { type: Boolean, default: false },
  notes: { type: String, default: '' },
  dueDate: { type: Date },
  user_id: { type: String, ref: 'User', required: true },
}, { timestamps: true, modelName: 'Task', indices: ['user_id', 'status', 'due_date'] });
