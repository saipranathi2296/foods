const mongoose = require('mongoose');

const requestDetailsSchema = new mongoose.Schema({
  ngoName: { type: String, required: true },
  personName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  pickupTime: { type: String, required: true } // format: HH:mm
});

const leftoverFoodSchema = new mongoose.Schema({
  universityName: { type: String, required: true }, // renamed from universityLocation
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  foodType: { 
    type: String, 
    enum: ['veg', 'nonveg'], 
    required: true 
  },
  preparedTime: { type: Date, required: true },
  expiryTime: { type: Date, required: true },
  date: { type: Date, required: true }, // The date of the posting
  comfortablePickupTime: { type: String, required: true }, // format: HH:mm
  foodImage: { type: String, required: true }, // uploaded image at posting
  
  ngoAccepted: { type: Boolean, default: false },
  pickupStatus: { 
    type: String, 
    enum: ['Posted', 'Requested', 'Accepted', 'Collected', 'Completed'], 
    default: 'Posted' 
  },
  ngoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  // Added fields for tracking completion
  requestDetails: requestDetailsSchema,
  collectionImage: { type: String }, // uploaded image when marking as Collected
  deliveryImage: { type: String }    // uploaded image when marking as Completed
}, {
  timestamps: true
});

module.exports = mongoose.model('LeftoverFood', leftoverFoodSchema);
