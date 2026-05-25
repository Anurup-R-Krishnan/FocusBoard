const { createModel } = require('../db/nedb');

function validateEvent(doc) {
  if (doc.end_time && doc.start_time && new Date(doc.end_time) < new Date(doc.start_time)) {
    throw new Error('end_time must be greater than or equal to start_time.');
  }
}

module.exports = Object.assign(createModel('events', {
  event_id: { type: String },
  title: { type: String, required: true },
  category_id: { type: String, ref: 'Category' },
  start_time: { type: Date, required: true },
  end_time: { type: Date, default: null },
  priority: { type: Number, default: 3 },
  event_type: { type: String, default: 'FOCUS' },
  is_recurring: { type: Boolean, default: false },
  label_color: { type: String, default: '#93c5fd' },
  description: { type: String },
  location: { type: String, default: '' },
  attendees: { type: Array, default: [] },
  calendar: { type: String, default: 'google' },
  user_id: { type: String, required: true },
}, { timestamps: true, modelName: 'Event', indices: ['event_id', 'user_id'] }), { validateEvent });
