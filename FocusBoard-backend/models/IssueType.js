const { createModel } = require('../db/nedb');

module.exports = createModel('issuetypes', {
  _id: { type: String, default: () => require('crypto').randomUUID() },
  name: { type: String, required: true },
  defaultPriority: { type: String, default: 'Medium' },
  slaResolutionDays: { type: Number, default: 3 },
  supportEmail: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  autoReplyTemplate: { type: String, default: '' },
}, { timestamps: true, modelName: 'IssueType' });
