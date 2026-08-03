const express = require('express');
const router = express.Router();
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/auth.middleware');
const Notification = require('../models/Notification');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, mobileNumber, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const status = role === 'broker' ? 'pending' : 'active';
    const user = await User.create({ name, email, password, mobileNumber, role: role || 'user', status });
    if (user) {
      // Create notification for admin
      await Notification.create({
        title: 'New Registration',
        message: `A new ${user.role} (${user.name}) has registered with email: ${user.email}`,
        type: 'registration'
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (user.status === 'pending') {
        return res.status(401).json({ message: 'Your account is pending approval by an administrator.' });
      }
      if (user.status === 'rejected') {
        return res.status(401).json({ message: 'Your account has been rejected by an administrator.' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Profile
router.get('/profile', protect, async (req, res) => {
  res.json(req.user);
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { emailOrMobile, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Find user by email or mobile number
    const user = await User.findOne({
      $or: [{ email: emailOrMobile }, { mobileNumber: emailOrMobile }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found with provided email or mobile number' });
    }

    // Update password (hashing is handled by pre-save hook in User model)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Change Password (Authenticated)
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
