const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    event_id: { type: String, required: false, index: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    category_id: {
      type: String,
      ref: 'Category',
      required: false,
    },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: false, default: null },
    priority: {
      type: Number,
      enum: [1, 2, 3],
      default: 3,
    },
    event_type: {
      type: String,
      enum: ['FOCUS', 'MEETING', 'PERSONAL', 'DEADLINE'],
      default: 'FOCUS',
    },
    is_recurring: { type: Boolean, default: false },
    label_color: {
      type: String,
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      default: '#93c5fd',
    },
    description: { type: String, trim: true, maxlength: 500 },
    location: { type: String, trim: true, maxlength: 200, default: '' },
    attendees: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 50;
        },
        message: 'Cannot have more than 50 attendees.',
      },
    },
    calendar: {
      type: String,
      enum: ['google', 'icloud', 'outlook'],
      default: 'google',
    },
    user_id: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Add unique index for idempotency (event_id + user_id)
eventSchema.index({ user_id: 1, start_time: -1 });
eventSchema.index({ event_id: 1, user_id: 1 }, { unique: true, sparse: true });

eventSchema.index({ user_id: 1, start_time: -1 });

eventSchema.pre('validate', function validateTimes() {
  if (this.end_time && this.start_time && this.end_time < this.start_time) {
    throw new Error('end_time must be greater than or equal to start_time.');
  }
});

module.exports = mongoose.model('Event', eventSchema);
