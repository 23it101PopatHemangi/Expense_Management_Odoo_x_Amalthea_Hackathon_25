const express = require('express');
const Company = require('../models/Company');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Get company details
router.get('/', authenticateToken, async (req, res) => {
  try {
    const company = await Company.findById(req.user.company);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update company
router.put('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update company' });
    }

    const { name, country, baseCurrency } = req.body;

    const company = await Company.findByIdAndUpdate(
      req.user.company,
      { name, country, baseCurrency },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({
      message: 'Company updated successfully',
      company
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
