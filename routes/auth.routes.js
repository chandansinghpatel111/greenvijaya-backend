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

    const status = 'active';
    const user = await User.create({ name, email, password, mobileNumber, role: role || 'user', status });
    if (user) {
      // Create notification for admin
      await Notification.create({
        title: 'New Registration',
        message: `A new ${user.role} (${user.name}) has registered with email: ${user.email}`,
        type: 'registration'
      });

      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
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
        success: true,
        message: "Login successfully",
        _id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
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

// Firebase Auth Login / Register (Google & Mobile OTP)
router.post('/firebase', async (req, res) => {
  try {
    const { email, mobileNumber, name } = req.body;
    
    // Check if user exists by email OR mobile number
    let query = {};
    if (email) query.email = email;
    else if (mobileNumber) query.mobileNumber = mobileNumber;
    else return res.status(400).json({ message: 'Email or Mobile Number is required' });

    let user = await User.findOne(query);

    if (user) {
      // User exists -> Log them in
      if (user.status === 'pending') {
        return res.status(401).json({ message: 'Your account is pending approval.' });
      }
      if (user.status === 'rejected') {
        return res.status(401).json({ message: 'Your account has been rejected.' });
      }
    } else {
      // User does not exist -> Register them
      // We need a dummy password since password is required in the User schema
      const dummyPassword = Math.random().toString(36).slice(-10) + 'A1!'; 
      
      user = await User.create({
        name: name || 'User',
        email: email || `${mobileNumber}@placeholder.com`, // Email is required in schema
        mobileNumber: mobileNumber || '',
        password: dummyPassword,
        role: 'user',
        status: 'active'
      });

      // Create notification for admin
      await Notification.create({
        title: 'New Registration via Firebase',
        message: `A new user (${user.name}) registered via Firebase auth.`,
        type: 'registration'
      });
    }

    res.json({
      success: true,
      message: "Firebase Login successfully",
      _id: user._id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: user.role,
      status: user.status,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Profile
router.get('/profile', protect, async (req, res) => {
  res.json(req.user);
});

// Update Profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.mobileNumber = req.body.mobileNumber || user.mobileNumber;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      mobileNumber: updatedUser.mobileNumber,
      role: updatedUser.role,
      status: updatedUser.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
