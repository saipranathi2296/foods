const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  replacementOption1: { type: String },
  replacementOption2: { type: String }
});

const menuSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  mealType: { 
    type: String, 
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true
  },
  items: [menuItemSchema]
}, { timestamps: true });

// Prevent duplicate meal types on the same date
menuSchema.index({ date: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model('Menu', menuSchema);
