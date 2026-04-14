const LeftoverFood = require('../models/LeftoverFood');

// @desc    Log leftover food
// @route   POST /api/leftovers
// @access  Private/Mess
exports.addLeftoverFood = async (req, res) => {
  try {
    const { itemName, quantity, foodType, preparedTime, expiryTime, universityName, date, comfortablePickupTime } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Food image is required' });
    }
    
    // required fields check
    if (!universityName || !itemName || !quantity || !foodType || !date || !comfortablePickupTime) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const leftover = await LeftoverFood.create({
      itemName,
      quantity,
      foodType,
      preparedTime,
      expiryTime,
      universityName,
      date,
      comfortablePickupTime,
      foodImage: `/uploads/${req.file.filename}`
    });

    res.status(201).json(leftover);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get leftover food logs
// @route   GET /api/leftovers
// @access  Private (Mess/NGO)
exports.getLeftovers = async (req, res) => {
  try {
    let query = {};
    
    // If user is NGO, they usually see Posted or the ones they've requested/accepted/collected from
    if (req.user && req.user.role === 'ngo') {
      query = {
        $or: [
          { pickupStatus: 'Posted' },
          { ngoId: req.user._id }
        ]
      };
    }

    const leftovers = await LeftoverFood.find(query).sort({ createdAt: -1 });
    res.json(leftovers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    NGO requests food
// @route   POST /api/leftovers/request/:id
// @access  Private/NGO
exports.requestFood = async (req, res) => {
  try {
    const food = await LeftoverFood.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });
    
    if (food.pickupStatus !== 'Posted') {
      return res.status(400).json({ message: `Food is already ${food.pickupStatus}` });
    }

    const { ngoName, personName, phoneNumber, pickupTime } = req.body;
    if (!ngoName || !personName || !phoneNumber || !pickupTime) {
      return res.status(400).json({ message: 'All request details are required' });
    }

    // Validation: pickup time must not exceed university's comfortable time
    // using lexicographical string comparison for "HH:mm"
    if (pickupTime > food.comfortablePickupTime) {
      return res.status(400).json({ message: 'Pickup time cannot exceed the University comfortable time' });
    }

    food.pickupStatus = 'Requested';
    food.ngoId = req.user._id;
    food.requestDetails = { ngoName, personName, phoneNumber, pickupTime };

    await food.save();
    res.json({ message: 'Food requested successfully', food });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mess accepts food request
// @route   PUT /api/leftovers/accept/:id
// @access  Private/Mess
exports.acceptFood = async (req, res) => {
  try {
    const food = await LeftoverFood.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });
    
    if (food.pickupStatus !== 'Requested') {
      return res.status(400).json({ message: `Cannot accept unless status is Requested. Current: ${food.pickupStatus}` });
    }

    food.pickupStatus = 'Accepted';
    food.ngoAccepted = true;

    await food.save();
    res.json({ message: 'Food request accepted', food });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reject food request (Mess)
// @route   PUT /api/leftovers/reject/:id
// @access  Private/Mess
exports.rejectFood = async (req, res) => {
  try {
    const food = await LeftoverFood.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });
    
    if (food.pickupStatus !== 'Requested') {
      return res.status(400).json({ message: 'Food cannot be rejected right now' });
    }

    food.pickupStatus = 'Posted'; // fallback to posted so someone else can request
    food.ngoId = undefined;
    food.requestDetails = undefined;
    
    await food.save();
    res.json({ message: 'Food request rejected and relisted', food });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Collect food (NGO uploads proof)
// @route   PUT /api/leftovers/collect/:id
// @access  Private/NGO
exports.collectFood = async (req, res) => {
  try {
    const food = await LeftoverFood.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });

    if (food.pickupStatus !== 'Accepted') {
      return res.status(400).json({ message: 'Only accepted food can be marked as collected' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Collection proof image is required' });
    }

    food.pickupStatus = 'Collected';
    food.collectionImage = `/uploads/${req.file.filename}`;

    await food.save();
    res.json({ message: 'Food marked as collected', food });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Complete food delivery (NGO uploads proof)
// @route   PUT /api/leftovers/complete/:id
// @access  Private/NGO
exports.completeFood = async (req, res) => {
  try {
    const food = await LeftoverFood.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });

    if (food.pickupStatus !== 'Collected') {
      return res.status(400).json({ message: 'Food must be marked collected before it can be completed' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Delivery proof image is required' });
    }

    food.pickupStatus = 'Completed';
    food.deliveryImage = `/uploads/${req.file.filename}`;

    await food.save();
    res.json({ message: 'Food delivery completed', food });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
