const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SwapItem',
    required: true
  },
  type: {
    type: String,
    enum: ['swap', 'donate'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  quantityRequested: {
    type: Number,
    required: true,
    min: 1
  },
  // Fields for Swap Request From Requester
  offeredItemDetails: { type: String },
  swapImage: { type: String },
  // Fields for Donate Request From Requester
  pickupBlock: { type: String },
  pickupTime: { type: String },
  // Fields provided by Owner upon Accepting Swap
  meetingBlock: { type: String },
  meetingTime: { type: String },
  genderPreference: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Request', requestSchema);
