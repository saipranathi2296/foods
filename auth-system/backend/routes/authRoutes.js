const express = require('express');
const router = express.Router();
const { 
  manualValidate,
  manualSignup,
  initiateSignup,
  verifySignup,
  googleValidate,
  googleAuth,
  login, 
  getProfile,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup/validate', manualValidate);
router.post('/signup/initiate', initiateSignup);
router.post('/signup/verify', verifySignup);
router.post('/signup/final', manualSignup);
router.post('/google/validate', googleValidate);
router.post('/google', googleAuth);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
