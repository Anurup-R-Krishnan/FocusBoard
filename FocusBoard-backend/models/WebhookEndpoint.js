import crypto from 'crypto';
import { createModel } from '../db/nedb.js';

export default createModel('webhook_endpoints', {
  _id: { type: String, default: () => crypto.randomUUID() },
  user_id: { type: String, ref: 'User', required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  events: { type: Array, default: ['integration.sync.*', 'integration.updated'] },
  secret: { type: String, default: () => crypto.randomBytes(32).toString('hex') },
  active: { type: Boolean, default: true },
  lastDeliveryAt: { type: Date },
  lastDeliveryStatus: { type: String },
}, { timestamps: true, modelName: 'WebhookEndpoint' });
