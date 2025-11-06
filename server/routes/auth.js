const express = require('express');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

const router = express.Router();

// Register new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login user
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    // This endpoint should be protected by authentication middleware
    const token = req.headers.authorization?.substring(7);
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const { verifyToken } = require('../middleware/auth');
    const decoded = verifyToken(token);
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    res.json({
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const { verifyToken } = require('../middleware/auth');
    const decoded = verifyToken(token);
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const { firstName, lastName, phone, addresses } = req.body;

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (addresses) user.addresses = addresses;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// Change password
router.put('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const { verifyToken } = require('../middleware/auth');
    const decoded = verifyToken(token);
    
    const user = await User.findById(decoded.userId).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
});

module.exports = router;
