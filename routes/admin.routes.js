const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const Enquiry = require('../models/Enquiry');
const { protect, authorize } = require('../middleware/auth.middleware');

// GET all properties (Admin only)
router.get('/properties', protect, authorize('admin'), async (req, res) => {
  try {
    const properties = await Property.find().populate('postedBy', 'name email mobileNumber role');
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all users (Admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sellers/Brokers routes removed

// GET pending properties
router.get('/properties/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const properties = await Property.find({ status: 'Pending' });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve property
router.put('/properties/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, { status: 'Approved', isApproved: true, rejectionReason: '' }, { new: true });
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject property
router.put('/properties/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const property = await Property.findByIdAndUpdate(req.params.id, { status: 'Rejected', rejectionReason: reason }, { new: true });
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark property as sold
router.put('/properties/:id/sold', protect, authorize('admin'), async (req, res) => {
  try {
    const { buyerDetails } = req.body;
    const property = await Property.findByIdAndUpdate(
      req.params.id, 
      { 
        status: 'Sold', 
        buyerDetails: { ...buyerDetails, soldDate: new Date() }
      }, 
      { new: true }
    );
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete property
router.delete('/properties/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all notifications
router.get('/notifications', protect, authorize('admin'), async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', protect, authorize('admin'), async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET dashboard stats
router.get('/dashboard-stats', protect, authorize('admin'), async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const activeServices = 8; // Assuming services are static as we don't have a model
    const totalPostings = await Property.countDocuments();
    const totalInquiries = await Enquiry.countDocuments();

    // Chart Data (Properties and Inquiries created per month for last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const propertyAgg = await Property.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const enquiryAgg = await Enquiry.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartDataMap = new Map();

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = monthNames[d.getMonth()];
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      chartDataMap.set(key, { name: monthName, properties: 0, inquiries: 0 });
    }

    propertyAgg.forEach(p => {
      const key = `${p._id.year}-${p._id.month}`;
      if (chartDataMap.has(key)) {
        chartDataMap.get(key).properties = p.count;
      }
    });

    enquiryAgg.forEach(e => {
      const key = `${e._id.year}-${e._id.month}`;
      if (chartDataMap.has(key)) {
        chartDataMap.get(key).inquiries = e.count;
      }
    });

    const chartData = Array.from(chartDataMap.values());

    // Recent Activity (Latest 5 notifications)
    const recentActivity = await Notification.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      totalProjects,
      activeServices,
      totalPostings,
      totalInquiries,
      chartData,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
