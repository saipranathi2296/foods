const Request = require('../models/Request');
const SwapItem = require('../models/SwapItem');

// @desc    Create a new request for an item (Swap/Donate)
// @route   POST /api/requests
// @access  Private
exports.createRequest = async (req, res) => {
  try {
    const { itemId, quantityRequested, offeredItemDetails } = req.body;
    
    const item = await SwapItem.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    if (item.studentId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot request your own item' });
    }

    if (item.status === 'locked' || item.status === 'unavailable') {
      return res.status(400).json({ message: 'This item is currently locked by another request or unavailable' });
    }
    
    if (!quantityRequested || quantityRequested < 1) {
      return res.status(400).json({ message: 'Quantity requested is required and must be at least 1' });
    }

    if (quantityRequested > item.quantity) {
      return res.status(400).json({ message: 'Requested quantity exceeds available quantity' });
    }
    
    // Prevent duplicate active requests by the same user for the same item
    const alreadyRequested = await Request.findOne({ 
      itemId, 
      requesterId: req.user._id, 
      status: { $in: ['pending', 'accepted'] } 
    });
    
    if (alreadyRequested) {
      return res.status(400).json({ message: 'You already have an active request for this item' });
    }

    const swapImage = req.file ? `/uploads/${req.file.filename}` : null;
    
    if (item.exchangeType === 'swap' && !offeredItemDetails) {
      return res.status(400).json({ message: 'Swap requests must include offered item details' });
    }

    if (item.exchangeType === 'swap') {
      const offered = offeredItemDetails.trim().toLowerCase();
      const required = item.returnItemDetails.trim().toLowerCase();
      
      // Enforce match by cross-checking substrings
      if (!offered.includes(required) && !required.includes(offered)) {
         return res.status(400).json({ message: `Your offered item must exactly match the poster's requirement: ${item.returnItemDetails}` });
      }
    }

    if (item.exchangeType === 'swap' && !swapImage) {
        return res.status(400).json({ message: 'Image of the offered item is required for swaps' });
    }

    const request = await Request.create({
      requesterId: req.user._id,
      ownerId: item.studentId,
      itemId,
      type: item.exchangeType,
      quantityRequested,
      offeredItemDetails,
      swapImage
    });

    // Deduct reserved quantity immediately; hide item only if none left
    item.quantity -= quantityRequested;
    if (item.quantity <= 0) {
      item.quantity = 0;
      item.status = 'locked';
    }
    await item.save();

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Accept a request
// @route   PUT /api/requests/:id/accept
// @access  Private
exports.acceptRequest = async (req, res) => {
  try {
    const { meetingBlock, meetingTime, genderPreference } = req.body;
    const request = await Request.findById(req.params.id);
    
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    if (request.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is already processed' });
    }

    const item = await SwapItem.findById(request.itemId);
    if (!item) return res.status(404).json({ message: 'Item no longer exists' });

    if (request.quantityRequested > item.quantity) {
      return res.status(400).json({ message: 'Not enough available quantity for this request' });
    }

    if (!meetingBlock || !meetingTime) {
      return res.status(400).json({ message: 'Meeting details (block, time) are required to accept any request' });
    }

    request.status = 'accepted';
    request.meetingBlock = meetingBlock;
    request.meetingTime = meetingTime;
    if (request.type === 'swap') {
      request.genderPreference = genderPreference;
    }
    await request.save();

    // Quantity was already reserved at request time - just finalize status
    item.quantity -= 0; // No further deduction needed
    if (item.quantity === 0) {
      item.status = 'unavailable';
      // Auto-cancel any remaining pending requests since the item is fully claimed
      await Request.updateMany(
        { itemId: item._id, status: 'pending', _id: { $ne: request._id } },
        { status: 'cancelled' }
      );
    }
    await item.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reject a request
// @route   PUT /api/requests/:id/reject
// @access  Private
exports.rejectRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.ownerId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    
    request.status = 'rejected';
    await request.save();

    const item = await SwapItem.findById(request.itemId);
    if (item) {
      // Restore the reserved quantity
      item.quantity += request.quantityRequested;
      // Unlock item if it was fully locked
      if (item.status === 'locked' || item.status === 'unavailable') {
        item.status = 'active';
      }
      await item.save();
    }
    
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Cancel a request
// @route   PUT /api/requests/:id/cancel
// @access  Private
exports.cancelRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    // Both users can cancel! Owner OR Requester
    if (request.requesterId.toString() !== req.user._id.toString() && request.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (request.status === 'accepted') {
      // If cancelled AFTER acceptance, restore quantity
      const item = await SwapItem.findById(request.itemId);
      if (item) {
        item.quantity += request.quantityRequested;
        if (item.status === 'unavailable' || item.status === 'locked') {
          item.status = 'active';
        }
        await item.save();
      }
    } else if (request.status === 'pending') {
      const item = await SwapItem.findById(request.itemId);
      if (item) {
        item.quantity += request.quantityRequested;
        if (item.status === 'locked' && item.quantity > 0) {
          item.status = 'active';
        }
        await item.save();
      }
    }

    request.status = 'cancelled';
    await request.save();
    
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get incoming requests for owner
// @route   GET /api/requests/incoming
// @access  Private
exports.getIncomingRequests = async (req, res) => {
  try {
    const requests = await Request.find({ ownerId: req.user._id })
      .populate('requesterId', 'name email gender')
      .populate('itemId')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get outgoing requests for requester
// @route   GET /api/requests/outgoing
// @access  Private
exports.getOutgoingRequests = async (req, res) => {
  try {
    const requests = await Request.find({ requesterId: req.user._id })
      .populate('ownerId', 'name email')
      .populate('itemId')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
