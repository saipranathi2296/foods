const mongoose = require('mongoose');

const swapItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  description: { type: String, required: true },
  returnItemDetails: { type: String },
  category: { 
    type: String, 
    enum: ['Notebooks', 'Books', 'Dresses', 'Bags', 'Daily-use items'],
    required: true
  },
  condition: { type: String, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  exchangeType: { 
    type: String, 
    enum: ['swap', 'donate'], 
    required: true 
  },
  hostelBlock: { type: String, required: true },
  genderVisibility: { 
    type: String,
    enum: ['male', 'female', 'all'],
    default: 'all'
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'swapped', 'donated', 'unavailable', 'locked'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SwapItem', swapItemSchema);
