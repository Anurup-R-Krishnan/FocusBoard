const { createModel } = require('../db/nedb');

module.exports = createModel('activitymappings', {
  _id: { type: String, default: () => require('crypto').randomUUID() },
  activityId: { type: String, ref: 'Activity', required: true },
  categoryId: { type: String, ref: 'Category', required: true },
  isManualOverride: { type: Boolean, default: false },
  overrideReason: { type: String, default: '' },
  confidenceScore: { type: Number, default: 0 },
  model_name: { type: String, default: null },
  model_version: { type: String, default: null },
  embedding_dim: { type: Number, default: null },
}, { timestamps: true, modelName: 'ActivityMapping', indices: ['activityId', 'categoryId'] });
