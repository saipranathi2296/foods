const express = require('express');
const router = express.Router();
const { 
  addLeftoverFood, 
  getLeftovers,
  requestFood,
  acceptFood,
  rejectFood,
  collectFood,
  completeFood
} = require('../controllers/leftoverController');
const { protect, allowMess, allowNGO } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, allowMess, upload.single('foodImage'), addLeftoverFood)
  .get(protect, getLeftovers);

router.post('/request/:id', protect, allowNGO, requestFood);
router.put('/accept/:id', protect, allowMess, acceptFood);
router.put('/reject/:id', protect, allowMess, rejectFood);
router.put('/collect/:id', protect, allowNGO, upload.single('collectionImage'), collectFood);
router.put('/complete/:id', protect, allowNGO, upload.single('deliveryImage'), completeFood);

module.exports = router;
