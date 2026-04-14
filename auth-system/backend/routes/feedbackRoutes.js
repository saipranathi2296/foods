const express = require('express');
const router  = express.Router();
const {
  submitFeedback,
  getStudentFeedback,
  checkFeedbackStatus,
  getAnalytics
} = require('../controllers/feedbackController');
const { protect, allowStudent, allowMess } = require('../middleware/authMiddleware');

// Mess analytics
router.get('/analytics', protect, allowMess, getAnalytics);

// Check if THIS student already submitted for a given date+mealType
// GET /api/feedback/status?date=YYYY-MM-DD&mealType=lunch
router.get('/status', protect, allowStudent, checkFeedbackStatus);

// Submit feedback (all items of a meal in one shot)
router.post('/', protect, allowStudent, submitFeedback);

// Get this student's own feedback history
router.get('/student', protect, allowStudent, getStudentFeedback);

module.exports = router;
