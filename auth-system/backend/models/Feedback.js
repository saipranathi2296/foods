const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: { type: Date, required: true },
  mealType: { 
    type: String, 
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true
  },
  items: [{
    itemName: { type: String, required: true },
    response: {
      type: String,
      enum: ['Completely Ate', 'Partially Ate', 'Did Not Eat'],
      required: true
    },
    replacementOption: { type: String }
  }]
}, {
  timestamps: true
});

feedbackSchema.index({ studentId: 1, date: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
