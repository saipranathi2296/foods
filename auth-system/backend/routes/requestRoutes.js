const express = require('express');
const router = express.Router();
const { 
  createRequest, 
  acceptRequest, 
  rejectRequest, 
  cancelRequest, 
  getIncomingRequests, 
  getOutgoingRequests 
} = require('../controllers/requestController');
const { protect, allowStudent } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, allowStudent, upload.single('swapImage'), createRequest);

router.get('/incoming', protect, allowStudent, getIncomingRequests);
router.get('/outgoing', protect, allowStudent, getOutgoingRequests);

router.put('/:id/accept', protect, allowStudent, acceptRequest);
router.put('/:id/reject', protect, allowStudent, rejectRequest);
router.put('/:id/cancel', protect, allowStudent, cancelRequest);

module.exports = router;
