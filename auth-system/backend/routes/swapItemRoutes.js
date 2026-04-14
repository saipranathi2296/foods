const express = require('express');
const router = express.Router();
const { createItem, getItems, getMyListings, deleteItem } = require('../controllers/swapItemController');
const { protect, allowStudent } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, allowStudent, upload.single('image'), createItem)
  .get(protect, getItems);
  
router.get('/my-listings', protect, allowStudent, getMyListings);

router.delete('/:id', protect, allowStudent, deleteItem);

module.exports = router;
