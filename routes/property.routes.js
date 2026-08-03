const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const { protect, authorize } = require('../middleware/auth.middleware');

// GET all approved properties (public)
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find({ status: 'Approved' }).populate('broker', 'name email mobileNumber');
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET broker's own properties
router.get('/my-properties', protect, authorize('broker'), async (req, res) => {
  try {
    const properties = await Property.find({ broker: req.user._id }).sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single property
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('broker', 'name email mobileNumber');
    if (property) {
      // Increment views
      property.views += 1;
      await property.save();
      res.json(property);
    } else {
      res.status(404).json({ message: 'Property not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new property (Broker only)
router.post('/', protect, authorize('broker', 'admin'), async (req, res) => {
  try {
    const property = new Property({
      ...req.body,
      broker: req.user._id,
      status: req.user.role === 'admin' ? 'Approved' : 'Pending'
    });
    const createdProperty = await property.save();
    res.status(201).json(createdProperty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update property
router.put('/:id', protect, authorize('broker', 'admin'), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    if (property.broker.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to update this property' });
    }

    Object.assign(property, req.body);
    // If broker updates a rejected property, set it back to pending
    if (req.user.role === 'broker' && property.status === 'Rejected') {
      property.status = 'Pending';
      property.rejectionReason = '';
    }

    const updatedProperty = await property.save();
    res.json(updatedProperty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE property
router.delete('/:id', protect, authorize('broker', 'admin'), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    if (property.broker.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this property' });
    }

    await property.deleteOne();
    res.json({ message: 'Property removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
