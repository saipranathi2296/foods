const Menu = require('../models/Menu');

// @desc    Create a new menu
// @route   POST /api/menu
// @access  Private/Mess
exports.createMenu = async (req, res) => {
  try {
    const { date, mealType, items } = req.body;

    // ── Guard: no past-date menus ──────────────────────────────────────────
    const selectedDate = new Date(date);
    selectedDate.setUTCHours(0, 0, 0, 0);
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    if (selectedDate < todayUTC) {
      return res.status(400).json({ message: 'Cannot create a menu for a past date.' });
    }

    // Check if menu for this date and meal type already exists
    const existingMenu = await Menu.findOne({ date, mealType });
    if (existingMenu) {
      return res.status(400).json({ message: 'Menu already exists for this date and meal. Please delete it before adding a new one.' });
    }

    const menu = await Menu.create({ date, mealType, items });
    res.status(201).json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get menus (all, or filtered by ?date=YYYY-MM-DD)
// @route   GET /api/menu
// @access  Private
exports.getMenus = async (req, res) => {
  try {
    let query = {};

    if (req.query.date) {
      const d = new Date(req.query.date);
      const start = new Date(d.setUTCHours(0, 0, 0, 0));
      const end   = new Date(d.setUTCHours(23, 59, 59, 999));
      query.date  = { $gte: start, $lte: end };
    }

    const menus = await Menu.find(query).sort({ date: -1 });
    res.json(menus);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete menu by ID
// @route   DELETE /api/menu/:id
// @access  Private/Mess
exports.deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.id);
    
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    res.json({ message: 'Menu removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
