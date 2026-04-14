const mongoose = require('mongoose');

const tempRegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true }, // Hashed
  role: {
    type: String,
    required: true,
    enum: ['student', 'mess', 'ngo'],
  },
  gender: { type: String },
  hostelBlock: { type: String },
  phoneNumber: { type: String },
  
  otp: { type: String, required: true },
  otpExpires: { type: Date, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('TempRegistration', tempRegistrationSchema);
