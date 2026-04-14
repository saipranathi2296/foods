const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for Google OAuth
  phoneNumber: { type: String }, // Optional for Google users initially, required for email signups
  role: {
    type: String,
    required: true,
    enum: ['student', 'mess', 'ngo'],
    default: 'student'
  },
  authType: {
    type: String,
    required: true,
    enum: ['email', 'google'],
    default: 'email'
  },
  isVerified: { type: Boolean, default: false },
  gender: { type: String },
  hostelBlock: { type: String },
  otp: { type: String },
  otpExpires: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
