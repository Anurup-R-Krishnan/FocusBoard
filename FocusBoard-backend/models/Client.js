const { createModel } = require('../db/nedb');

module.exports = createModel('clients', {
  _id: { type: String, default: () => require('crypto').randomUUID() },
  name: { type: String, required: true },
  company: { type: String, default: '' },
  total_hours: { type: Number, default: 0 },
  billable_amount: { type: Number, default: 0 },
  color: { type: String, default: '#3B82F6' },
  hourlyRate: { type: Number, default: 0 },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  notes: { type: String, default: '' },
  user_id: { type: String, ref: 'User', required: true },
}, { timestamps: true, modelName: 'Client', indices: ['user_id', { fieldName: 'user_id' }, { fieldName: 'name' }] });
