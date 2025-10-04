const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const ApprovalRule = require('../models/ApprovalRule');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// OCR processing function
const processOCR = async (imagePath) => {
  try {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
    
    // Extract amount, date, and description from OCR text
    const amountMatch = text.match(/(?:total|amount|sum)[\s:]*\$?(\d+\.?\d*)/i);
    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    const descriptionMatch = text.match(/(?:restaurant|cafe|store|shop|hotel|gas|fuel)[\w\s]*/i);
    
    return {
      amount: amountMatch ? parseFloat(amountMatch[1]) : null,
      date: dateMatch ? new Date(dateMatch[1]) : new Date(),
      description: descriptionMatch ? descriptionMatch[0] : 'Receipt expense',
      rawText: text
    };
  } catch (error) {
    console.error('OCR processing error:', error);
    return null;
  }
};

// Create expense
router.post('/', authenticateToken, [
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('currency').notEmpty().withMessage('Currency is required'),
  body('expenseDate').isISO8601().withMessage('Valid date is required'),
  body('paidBy').notEmpty().withMessage('Paid by is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description, category, amount, currency, expenseDate, paidBy, remarks } = req.body;

    // Convert amount to base currency
    const axios = require('axios');
    const company = await require('../models/Company').findById(req.user.company);
    
    let amountInBaseCurrency = amount;
    if (currency !== company.baseCurrency) {
      try {
        const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${currency}`);
        const rate = response.data.rates[company.baseCurrency];
        amountInBaseCurrency = amount * rate;
      } catch (error) {
        console.error('Currency conversion error:', error);
        return res.status(400).json({ message: 'Currency conversion failed' });
      }
    }

    // Find applicable approval rule
    const approvalRule = await ApprovalRule.findOne({
      company: req.user.company,
      category,
      isActive: true
    });

    const expense = new Expense({
      employee: req.user.userId,
      company: req.user.company,
      description,
      category,
      amount,
      currency,
      amountInBaseCurrency,
      expenseDate: new Date(expenseDate),
      paidBy,
      remarks,
      approvalRule: approvalRule?._id,
      status: 'draft'
    });

    await expense.save();

    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload receipt and process with OCR
router.post('/upload-receipt', authenticateToken, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const ocrResult = await processOCR(req.file.path);
    
    if (!ocrResult) {
      return res.status(400).json({ message: 'Failed to process receipt' });
    }

    res.json({
      message: 'Receipt processed successfully',
      ocrData: ocrResult
    });
  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's expenses
router.get('/my-expenses', authenticateToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ employee: req.user.userId })
      .populate('approvalRule', 'name')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all expenses (admin/manager)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = { company: req.user.company };
    
    // If user is manager, only show expenses from their team
    if (req.user.role === 'manager') {
      const User = require('../models/User');
      const teamMembers = await User.find({ manager: req.user.userId }).select('_id');
      query.employee = { $in: teamMembers.map(member => member._id) };
    }

    const expenses = await Expense.find(query)
      .populate('employee', 'name email')
      .populate('approvalRule', 'name')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Get all expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit expense for approval
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOne({
      _id: id,
      employee: req.user.userId,
      status: 'draft'
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or already submitted' });
    }

    // Update status and set current approver
    expense.status = 'pending';
    
    if (expense.approvalRule) {
      const approvalRule = await ApprovalRule.findById(expense.approvalRule);
      if (approvalRule && approvalRule.approvers.length > 0) {
        // Sort approvers by sequence and set first one as current
        const sortedApprovers = approvalRule.approvers.sort((a, b) => a.sequence - b.sequence);
        expense.currentApprover = sortedApprovers[0].user;
      }
    }

    await expense.save();

    res.json({
      message: 'Expense submitted for approval',
      expense
    });
  } catch (error) {
    console.error('Submit expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expense details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id)
      .populate('employee', 'name email')
      .populate('approvalRule', 'name')
      .populate('currentApprover', 'name email')
      .populate('approvalHistory.approver', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if user has access to this expense
    if (expense.employee._id.toString() !== req.user.userId && 
        req.user.role !== 'admin' && 
        req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
