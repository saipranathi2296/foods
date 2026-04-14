require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const TempRegistration = require('./models/TempRegistration');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const email = 'vavilalapranathi@gmail.com';
    const password = 'vavilala';

    // 1. Simulate initiateSignup
    console.log('--- Simulating initiateSignup ---');
    const otp = "123456";
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await TempRegistration.deleteMany({ email });

    await TempRegistration.create({
      name: 'vavilala', 
      email, 
      password: hashedPassword, 
      role: 'student', 
      gender: 'female', 
      hostelBlock: 'narmada', 
      otp, 
      otpExpires
    });
    
    console.log('TempRegistration Document Created successfully!');

    // 2. Simulate verifySignup
    console.log('--- Simulating verifySignup ---');
    const tempRecord = await TempRegistration.findOne({ email });
    
    if (!tempRecord) {
      console.log('Error: Temp not found');
      process.exit(1);
    }
    
    const newUser = await User.create({
      name: tempRecord.name,
      email: tempRecord.email,
      password: tempRecord.password,
      role: tempRecord.role,
      gender: tempRecord.gender,
      hostelBlock: tempRecord.hostelBlock,
      phoneNumber: tempRecord.phoneNumber,
      authType: 'email',
      isVerified: true
    });
    
    await TempRegistration.deleteOne({ _id: tempRecord._id });
    console.log('User created successfully:', newUser);

    // 3. Simulate Login
    console.log('--- Simulating Login ---');
    const user = await User.findOne({ email });
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Match result:', isMatch);
    
    // Clean up
    await User.deleteOne({ email });
    console.log('Cleaned up!');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB error:', err);
    process.exit(1);
  });
