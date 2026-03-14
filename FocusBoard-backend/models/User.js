const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  _id: { type: String, default: () => require('crypto').randomUUID() },
  name: { type: String, required: true },
  email_id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  timezone: { type: String, default: 'IST' },
  age: { type: Number },
  parentEmail: { type: String },
  nsfwAlertPreference: { type: String, enum: ['email', 'in_app', 'both', 'none'], default: 'none' },
  role: { type: String, default: 'Member' },
  status: { type: String, enum: ['FOCUS', 'BREAK', 'RECOVERY', 'MEETING', 'DISTRACTED', 'BE_RIGHT_BACK', 'OFFLINE'], default: 'OFFLINE' },
  avatar: { type: String, default: '#3B82F6' },
  last_active_at: { type: Date, default: Date.now },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
