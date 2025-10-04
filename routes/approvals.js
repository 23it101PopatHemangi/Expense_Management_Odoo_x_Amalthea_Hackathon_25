const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const ApprovalRule = require('../models/ApprovalRule');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Get pending approvals for current user
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const expenses = await Expense.find({
      company: req.user.company,
      currentApprover: req.user.userId,
      status: 'pending'
    })
    .populate('employee', 'name email')
    .populate('approvalRule', 'name')
    .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve or reject expense
router.post('/:id/action', authenticateToken, [
  body('action').isIn(['approved', 'rejected']).withMessage('Action must be approved or rejected'),
  body('comment').optional().isString().withMessage('Comment must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { action, comment } = req.body;

    const expense = await Expense.findOne({
      _id: id,
      currentApprover: req.user.userId,
      status: 'pending'
    }).populate('approvalRule');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or not pending your approval' });
    }

    // Add to approval history
    expense.approvalHistory.push({
      approver: req.user.userId,
      action,
      comment,
      date: new Date()
    });

    // Check if this is the final approval or if we need to move to next approver
    if (action === 'rejected') {
      expense.status = 'rejected';
      expense.currentApprover = null;
    } else {
      // Check if this was the last approver or if we need to move to next
      if (expense.approvalRule) {
        const sortedApprovers = expense.approvalRule.approvers.sort((a, b) => a.sequence - b.sequence);
        const currentApproverIndex = sortedApprovers.findIndex(
          approver => approver.user.toString() === req.user.userId.toString()
        );

        if (currentApproverIndex < sortedApprovers.length - 1) {
          // Move to next approver
          expense.currentApprover = sortedApprovers[currentApproverIndex + 1].user;
        } else {
          // This was the last approver, check if we meet minimum approval percentage
          const approvalCount = expense.approvalHistory.filter(h => h.action === 'approved').length;
          const totalApprovers = sortedApprovers.length;
          const approvalPercentage = (approvalCount / totalApprovers) * 100;

          if (approvalPercentage >= expense.approvalRule.minimumApprovalPercentage) {
            expense.status = 'approved';
            expense.currentApprover = null;
          } else {
            // Check conditional approvers
            const conditionalApprovers = expense.approvalRule.conditionalApprovers;
            const hasConditionalApproval = conditionalApprovers.some(conditional => 
              expense.approvalHistory.some(h => 
                h.approver.toString() === conditional.user.toString() && 
                h.action === 'approved' && 
                conditional.autoApprove
              )
            );

            if (hasConditionalApproval) {
              expense.status = 'approved';
              expense.currentApprover = null;
            } else {
              // Still need more approvals
              expense.currentApprover = null;
            }
          }
        }
      } else {
        // No approval rule, just approve
        expense.status = 'approved';
        expense.currentApprover = null;
      }
    }

    await expense.save();

    res.json({
      message: `Expense ${action} successfully`,
      expense
    });
  } catch (error) {
    console.error('Approve/reject expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get approval history for an expense
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id)
      .populate('approvalHistory.approver', 'name email')
      .select('approvalHistory');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense.approvalHistory);
  } catch (error) {
    console.error('Get approval history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all approvals (admin view)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let query = { company: req.user.company };

    // If user is manager, only show approvals from their team
    if (req.user.role === 'manager') {
      const User = require('../models/User');
      const teamMembers = await User.find({ manager: req.user.userId }).select('_id');
      query.employee = { $in: teamMembers.map(member => member._id) };
    }

    const expenses = await Expense.find(query)
      .populate('employee', 'name email')
      .populate('currentApprover', 'name email')
      .populate('approvalRule', 'name')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Get all approvals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
