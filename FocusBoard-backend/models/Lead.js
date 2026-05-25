const { createModel } = require('../db/nedb');

module.exports = createModel('leads', {
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, default: '' },
  source: { type: String, default: 'landing_page' },
}, { timestamps: true, modelName: 'Lead' });
