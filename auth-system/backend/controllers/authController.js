const User = require('../models/User'); 
const TempRegistration = require('../models/TempRegistration');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/emailService');
const sendSMS = require('../utils/smsService');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Validate Manual Signup
exports.manualValidate = async (req, res) => {
  try {
    const { email } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Account already exists. Please login.' });
    }
    res.status(200).json({ valid: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Initiate Email Signup (Generates OTP, doesn't create real User yet)
exports.initiateSignup = async (req, res) => {
  try {
    const { name, email, password, role, gender, hostelBlock, phoneNumber } = req.body;
    
    // Allow going to next step
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await TempRegistration.deleteMany({ email });

    await TempRegistration.create({
      name, email, password: hashedPassword, role, gender, hostelBlock, phoneNumber, otp, otpExpires
    });

    try {
      await sendEmail({
        to: email,
        subject: 'Verify your account',
        text: `Your OTP for account verification is: ${otp}. It expires in 10 minutes.`
      });
    } catch (e) {
      console.error('Failed to send OTP email', e);
      // For development, return the OTP in the response if email fails
      return res.status(200).json({ message: 'OTP generated (Email Failed).', devOtp: otp });
    }

    res.status(200).json({ message: 'OTP sent to your email. Please verify to complete registration.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Final Manual Signup (Skips OTP for backwards compatibility if needed, but not primarily used)
exports.manualSignup = async (req, res) => {
  try {
    const { name, email, password, role, gender, hostelBlock, phoneNumber } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Account already exists. Please login.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      gender,
      hostelBlock,
      phoneNumber,
      authType: 'email',
      isVerified: true
    });

    try {
      await sendSMS(newUser.phoneNumber, `Thanks for registering into our app, ${newUser.name}!`);
      await sendEmail({
        to: newUser.email,
        subject: 'Welcome to our App!',
        text: `Thank you for signing up, ${newUser.name}!`
      });
    } catch (msgErr) {
      console.error('Failed to send welcome messages:', msgErr);
    }

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token: generateToken(newUser._id, newUser.role),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify OTP and Create Account
exports.verifySignup = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const tempRecord = await TempRegistration.findOne({ email });
    if (!tempRecord) {
      return res.status(400).json({ message: 'Session expired or not found. Please sign up again.' });
    }

    if (tempRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (tempRecord.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Please sign up again.' });
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

    try {
      await sendSMS(newUser.phoneNumber, `Thanks for registering into our app, ${newUser.name}!`);
      await sendEmail({
        to: newUser.email,
        subject: 'Welcome to our App!',
        text: `Thank you for signing up, ${newUser.name}!`
      });
    } catch (e) {
      console.error('Failed to send welcome messages after OTP verify', e);
    }

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token: generateToken(newUser._id, newUser.role),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Validate Google Authentication
exports.googleValidate = async (req, res) => {
  try {
    const { token } = req.body;
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google Client ID not configured.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email } = payload;
    const user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: 'Account already exists. Please login.' });
    }

    res.status(200).json({ valid: true });
  } catch (error) {
    console.error('Google Validate Error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
};

// @desc    Google Authentication (Login or Signup)
exports.googleAuth = async (req, res) => {
  try {
    const { token, role, phoneNumber, gender, hostelBlock } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google Client ID not configured.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Final Google Save
      if (!role) {
         return res.status(400).json({ message: 'Role is required' });
      }

      user = await User.create({
        name,
        email,
        authType: 'google',
        isVerified: true, // Google verifies natively
        role: role || 'student',
        phoneNumber,
        gender,
        hostelBlock
      });
      try {
        await sendSMS(user.phoneNumber, `Thanks for registering into our app via Google, ${user.name}!`);
        await sendEmail({
          to: user.email,
          subject: 'Welcome to our App!',
          text: `Thank you for signing up via Google, ${user.name}!`
        });
      } catch (msgErr) {
        console.error('Failed to send Google welcome messages:', msgErr);
      }
    } else {
      if (user.authType !== 'google') {
        // Optionally bind them, or enforce standard login
        // Let's just allow it for ease of use 
      }
      try {
        await sendSMS(user.phoneNumber, `Thanks for logging in to the system, ${user.name}!`);
      } catch (smsErr) {
        console.error('Failed to send login sms:', smsErr);
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Invalid Google Token' });
  }
};

// @desc    Standard Email Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found in DB:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.authType === 'google' && !user.password) {
      return res.status(400).json({ message: 'Please login using Google.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Email not verified. Please contact support or register again.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Entered password:", password);
    console.log("Stored password:", user.password);
    console.log("Match result:", isMatch);

    if (isMatch) {
      // Trigger SMS
      if (user.phoneNumber) {
        await sendSMS(user.phoneNumber, `Thanks for logging in to the system, ${user.name}!`);
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Forgot Password (Send OTP)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    if (user.authType === 'google') {
      return res.status(400).json({ message: 'This account uses Google to log in. Password reset not available.' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    await sendEmail({
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP to reset your password is: ${otp}. It expires in 10 minutes.`
    });

    res.json({ message: 'Reset OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset Password with OTP
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP expired.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    
    await user.save();

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        hostelBlock: user.hostelBlock
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
