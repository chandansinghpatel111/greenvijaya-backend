const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const { protect, authorize } = require('../middleware/auth.middleware');

// POST new enquiry
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, property, broker, message } = req.body;
    const enquiry = new Enquiry({
      name,
      email,
      phone,
      property,
      broker,
      message,
      // If user is logged in, you could optionally pass their ID here, but for now we rely on the guest fields.
      ...(req.body.user && { user: req.body.user })
    });
    const savedEnquiry = await enquiry.save();
    res.status(201).json(savedEnquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET enquiries (Admin sees all, Broker sees theirs, User sees theirs)
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'user') {
      query.user = req.user._id;
    } else if (req.user.role === 'broker') {
      query.broker = req.user._id;
    }
    
    const enquiries = await Enquiry.find(query)
      .populate('user', 'name email mobileNumber')
      .populate({
        path: 'property',
        populate: { path: 'broker' }
      })
      .populate('broker');
    res.json(enquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
