const Feedback = require('../models/Feedback');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────
// @desc    Check if a specific student already submitted feedback
//          for a given date + mealType (used by frontend on load)
// @route   GET /api/feedback/status?date=YYYY-MM-DD&mealType=lunch
// @access  Private/Student
// ─────────────────────────────────────────────────────────────
exports.checkFeedbackStatus = async (req, res) => {
  try {
    const { date, mealType } = req.query;
    if (!date || !mealType) {
      return res.status(400).json({ message: 'date and mealType are required' });
    }

    const d     = new Date(date);
    const start = new Date(d.setUTCHours(0, 0, 0, 0));
    const end   = new Date(d.setUTCHours(23, 59, 59, 999));

    // Find feedback record for THIS student only
    const feedback = await Feedback.findOne({
      studentId: req.user._id,
      date: { $gte: start, $lte: end },
      mealType: mealType.toLowerCase()
    });

    if (!feedback) {
      return res.json({ submitted: false, items: [] });
    }

    // Return the list of submitted item names for this meal
    const submittedItems = feedback.items.map(i => i.itemName);
    return res.json({ submitted: true, items: submittedItems });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Submit feedback for ALL items of a meal in one shot
// @route   POST /api/feedback
// @access  Private/Student
// 
// Body: {
//   date: "YYYY-MM-DD",
//   mealType: "breakfast"|"lunch"|"dinner",
//   items: [
//     { itemName: "Idli", response: "Completely Ate", replacementOption: "" },
//     { itemName: "Dosa", response: "Did Not Eat",    replacementOption: "Roti" }
//   ]
// }
// ─────────────────────────────────────────────────────────────
exports.submitFeedback = async (req, res) => {
  try {
    const { date, mealType, items } = req.body;

    // ── 1. Basic presence checks ────────────────────────────
    if (!date || !mealType) {
      return res.status(400).json({ message: 'date and mealType are required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item feedback is required' });
    }

    // ── 2. Validate every item has a response selected ──────
    const validResponses = ['Completely Ate', 'Partially Ate', 'Did Not Eat'];
    for (const item of items) {
      if (!item.itemName || !item.itemName.trim()) {
        return res.status(400).json({ message: 'Each item must have a name' });
      }
      if (!item.response || !validResponses.includes(item.response)) {
        return res.status(400).json({
          message: `Please select a feedback option for "${item.itemName}". Allowed values: ${validResponses.join(', ')}`
        });
      }
      // If replacementOption is explicitly set to empty string, that's fine (means no replacement)
      // But we reject null/undefined when the field is present
      if (item.replacementOption !== undefined && item.replacementOption !== null) {
        // OK — empty string means "no replacement"
      }
    }

    // ── 3. Check duplicate (studentId + date + mealType) ─────
    const d     = new Date(date);
    const start = new Date(d.setUTCHours(0, 0, 0, 0));
    const end   = new Date(d.setUTCHours(23, 59, 59, 999));

    const existing = await Feedback.findOne({
      studentId: req.user._id,
      date:      { $gte: start, $lte: end },
      mealType:  mealType.toLowerCase()
    });

    if (existing) {
      return res.status(400).json({
        message: `You have already submitted feedback for ${mealType} on this date.`
      });
    }

    // ── 4. Build clean items array ────────────────────────────
    const cleanItems = items.map(item => ({
      itemName:          item.itemName.trim(),
      response:          item.response,
      replacementOption: item.replacementOption ? item.replacementOption.trim() : ''
    }));

    // ── 5. Create feedback document ───────────────────────────
    const feedback = await Feedback.create({
      studentId: req.user._id,
      date:      new Date(date),
      mealType:  mealType.toLowerCase(),
      items:     cleanItems
    });

    return res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });

  } catch (error) {
    // Mongo duplicate key (extra safety net)
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'You have already submitted feedback for this meal today.'
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get THIS student's own feedback (optionally by date)
// @route   GET /api/feedback/student?date=YYYY-MM-DD
// @access  Private/Student
// ─────────────────────────────────────────────────────────────
exports.getStudentFeedback = async (req, res) => {
  try {
    const query = { studentId: req.user._id };

    if (req.query.date) {
      const d     = new Date(req.query.date);
      const start = new Date(d.setUTCHours(0, 0, 0, 0));
      const end   = new Date(d.setUTCHours(23, 59, 59, 999));
      query.date  = { $gte: start, $lte: end };
    }

    const feedback = await Feedback.find(query).sort({ date: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get analytics for mess dashboard
// @route   GET /api/feedback/analytics?date=YYYY-MM-DD&mealType=lunch
// @access  Private/Mess
// ─────────────────────────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    const { date, mealType } = req.query;

    if (!date || !mealType) {
      return res.status(400).json({ message: 'Date and mealType are required' });
    }

    const queryDate  = new Date(date);
    const startOfDay = new Date(queryDate.setUTCHours(0, 0, 0, 0));
    const endOfDay   = new Date(queryDate.setUTCHours(23, 59, 59, 999));

    const feedbacks = await Feedback.find({
      date:     { $gte: startOfDay, $lte: endOfDay },
      mealType: mealType.toLowerCase()
    });

    // Per-item breakdown: { itemName -> { ate, partial, wasted, replacements: { option -> count } } }
    const itemBreakdown = {};
    const globalReplacementVotes = {};
    let totalEaten = 0, totalPartial = 0, totalWasted = 0;

    feedbacks.forEach(f => {
      f.items.forEach(item => {
        if (!itemBreakdown[item.itemName]) {
          itemBreakdown[item.itemName] = { ate: 0, partial: 0, wasted: 0, replacements: {} };
        }

        if (item.response === 'Completely Ate') {
          itemBreakdown[item.itemName].ate++;
          totalEaten++;
        } else if (item.response === 'Partially Ate') {
          itemBreakdown[item.itemName].partial++;
          totalPartial++;
        } else if (item.response === 'Did Not Eat') {
          itemBreakdown[item.itemName].wasted++;
          totalWasted++;
        }

        if (item.replacementOption && item.replacementOption.trim() !== '') {
          const opt = item.replacementOption.trim();
          itemBreakdown[item.itemName].replacements[opt] =
            (itemBreakdown[item.itemName].replacements[opt] || 0) + 1;
          globalReplacementVotes[opt] = (globalReplacementVotes[opt] || 0) + 1;
        }
      });
    });

    const eatenBarData = Object.entries(itemBreakdown)
      .map(([itemName, counts]) => ({ itemName, eaten: counts.ate }))
      .sort((a, b) => b.eaten - a.eaten);

    const wastedBarData = Object.entries(itemBreakdown).map(([itemName, counts]) => ({
      itemName,
      wasted: counts.wasted
    }));

    const itemConsumptionData = Object.entries(itemBreakdown).map(([itemName, counts]) => ({
      itemName,
      ate:          counts.ate,
      partial:      counts.partial,
      wasted:       counts.wasted,
      replacements: Object.entries(counts.replacements)
        .map(([option, votes]) => ({ option, votes }))
        .sort((a, b) => b.votes - a.votes)
    }));

    const pieChartData = { eaten: totalEaten, partial: totalPartial, wasted: totalWasted };

    const totalReplacementVotes = Object.values(globalReplacementVotes).reduce((a, b) => a + b, 0);
    const replacementSuggestions = Object.entries(globalReplacementVotes)
      .map(([option, votes]) => ({
        option,
        votes,
        percentage: totalReplacementVotes > 0 ? Math.round((votes / totalReplacementVotes) * 100) : 0
      }))
      .sort((a, b) => b.votes - a.votes);

    const itemReplacementData = Object.entries(itemBreakdown)
      .filter(([_, counts]) => Object.keys(counts.replacements).length > 0)
      .map(([itemName, counts]) => ({
        itemName,
        suggestions: Object.entries(counts.replacements)
          .map(([option, votes]) => ({ option, votes }))
          .sort((a, b) => b.votes - a.votes)
      }));

    const totalStudents     = await User.countDocuments({ role: 'student' });
    const respondedStudents = feedbacks.length;

    res.json({
      eatenBarData,
      wastedBarData,
      itemConsumptionData,
      pieChartData,
      replacementSuggestions,
      itemReplacementData,
      totalStudents,
      respondedStudents
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
