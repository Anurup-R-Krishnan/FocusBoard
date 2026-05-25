const { createModel } = require('../db/nedb');
const bcrypt = require('bcryptjs');

const UserModel = createModel('users', {
  _id: { type: String, default: () => require('crypto').randomUUID() },
  name: { type: String, required: true },
  email_id: { type: String, required: true },
  password: { type: String, required: true },
  timezone: { type: String, default: 'IST' },
  age: { type: Number },
  parentEmail: { type: String },
  nsfwAlertPreference: { type: String, default: 'none' },
  role: { type: String, default: 'Member' },
  status: { type: String, default: 'OFFLINE' },
  avatar: { type: String, default: '#3B82F6' },
  last_active_at: { type: Date, default: () => new Date() },
}, { timestamps: true, modelName: 'User', indices: [{ fieldName: 'email_id', unique: true }] });

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function comparePassword(candidatePassword, hashedPassword) {
  return bcrypt.compare(candidatePassword, hashedPassword);
}

module.exports = Object.assign(UserModel, { hashPassword, comparePassword });
