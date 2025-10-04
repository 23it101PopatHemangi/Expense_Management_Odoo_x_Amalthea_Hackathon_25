const express = require('express');
const { body, validationResult } = require('express-validator');
const ApprovalRule = require('../models/ApprovalRule');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Get all approval rules
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rules = await ApprovalRule.find({ company: req.user.company })
      .populate('approvers.user', 'name email')
      .populate('conditionalApprovers.user', 'name email')
      .sort({ createdAt: -1 });

    res.json(rules);
  } catch (error) {
    console.error('Get approval rules error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create approval rule
router.post('/', authenticateToken, [
  body('name').notEmpty().withMessage('Name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('approvers').isArray().withMessage('Approvers must be an array'),
  body('minimumApprovalPercentage').isNumeric().withMessage('Minimum approval percentage must be a number')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create approval rules' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, category, isManagerApprover, approvers, minimumApprovalPercentage, conditionalApprovers } = req.body;

    const approvalRule = new ApprovalRule({
      company: req.user.company,
      name,
      category,
      isManagerApprover: isManagerApprover || false,
      approvers: approvers || [],
      minimumApprovalPercentage: minimumApprovalPercentage || 100,
      conditionalApprovers: conditionalApprovers || []
    });

    await approvalRule.save();

    res.status(201).json({
      message: 'Approval rule created successfully',
      rule: approvalRule
    });
  } catch (error) {
    console.error('Create approval rule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update approval rule
router.put('/:id', authenticateToken, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('approvers').optional().isArray().withMessage('Approvers must be an array'),
  body('minimumApprovalPercentage').optional().isNumeric().withMessage('Minimum approval percentage must be a number')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update approval rules' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    const approvalRule = await ApprovalRule.findOneAndUpdate(
      { _id: id, company: req.user.company },
      updates,
      { new: true, runValidators: true }
    );

    if (!approvalRule) {
      return res.status(404).json({ message: 'Approval rule not found' });
    }

    res.json({
      message: 'Approval rule updated successfully',
      rule: approvalRule
    });
  } catch (error) {
    console.error('Update approval rule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete approval rule
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete approval rules' });
    }

    const { id } = req.params;

    const approvalRule = await ApprovalRule.findOneAndDelete({
      _id: id,
      company: req.user.company
    });

    if (!approvalRule) {
      return res.status(404).json({ message: 'Approval rule not found' });
    }

    res.json({ message: 'Approval rule deleted successfully' });
  } catch (error) {
    console.error('Delete approval rule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle approval rule status
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can toggle approval rules' });
    }

    const { id } = req.params;

    const approvalRule = await ApprovalRule.findOneAndUpdate(
      { _id: id, company: req.user.company },
      { $set: { isActive: !req.body.isActive } },
      { new: true }
    );

    if (!approvalRule) {
      return res.status(404).json({ message: 'Approval rule not found' });
    }

    res.json({
      message: 'Approval rule status updated',
      rule: approvalRule
    });
  } catch (error) {
    console.error('Toggle approval rule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
