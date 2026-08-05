const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const { protect, authorize } = require('../middleware/auth.middleware');

// GET all approved properties (public)
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find({ status: 'Approved' }).populate('postedBy', 'name email mobileNumber');
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Removed /my-properties endpoint since only admins can post

// GET single property
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('postedBy', 'name email mobileNumber');
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

// POST new property (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const property = new Property({
      ...req.body,
      postedBy: req.user._id,
      status: 'Approved'
    });
    const createdProperty = await property.save();
    res.status(201).json(createdProperty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update property (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    if (property.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to update this property' });
    }

    Object.assign(property, req.body);

    const updatedProperty = await property.save();
    res.json(updatedProperty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE property (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    if (property.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this property' });
    }

    await property.deleteOne();
    res.json({ message: 'Property removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
