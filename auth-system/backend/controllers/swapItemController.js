const SwapItem = require('../models/SwapItem');
const Request = require('../models/Request');

// @desc    Create a swap/donate item
// @route   POST /api/items
// @access  Private/Student
exports.createItem = async (req, res) => {
  try {
    const { itemName, description, returnItemDetails, category, condition, quantity, exchangeType, hostelBlock, genderVisibility } = req.body;
    
    // Multer adds file to req.file
    if (!req.file) {
      return res.status(400).json({ message: 'Image upload is required' });
    }

    if (!description) {
      return res.status(400).json({ message: 'Description is mandatory' });
    }

    if (exchangeType === 'swap' && !returnItemDetails) {
      return res.status(400).json({ message: '"What I want in return" field is mandatory for swap' });
    }

    const image = `/uploads/${req.file.filename}`;

    const item = await SwapItem.create({
      itemName,
      description,
      returnItemDetails,
      category,
      condition,
      image,
      quantity,
      exchangeType,
      hostelBlock,
      genderVisibility,
      studentId: req.user._id
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get swap/donate items
// @route   GET /api/items
// @access  Private
exports.getItems = async (req, res) => {
  try {
    const { category, hostelBlock } = req.query;
    
    let query = { status: 'active' };
    
    if (category) query.category = category;
    if (hostelBlock) query.hostelBlock = hostelBlock;
    
    if (req.user && req.user.gender) {
      query.$or = [
        { genderVisibility: 'all' },
        { genderVisibility: req.user.gender }
      ];
    }

    // Explicitly exclude the requests array from public GET requests for privacy
    const items = await SwapItem.find(query)
      .populate('studentId', 'name')
      .select('-requests')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current user's item listings
// @route   GET /api/items/my-listings
// @access  Private/Student
exports.getMyListings = async (req, res) => {
  try {
    const items = await SwapItem.find({ studentId: req.user._id })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a swap/donate item
// @route   DELETE /api/items/:id
// @access  Private/Student
exports.deleteItem = async (req, res) => {
  try {
    const item = await SwapItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    await Request.updateMany({ itemId: item._id, status: 'pending' }, { status: 'cancelled' });
    await item.deleteOne();

    res.json({ message: 'Item deleted manually' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
