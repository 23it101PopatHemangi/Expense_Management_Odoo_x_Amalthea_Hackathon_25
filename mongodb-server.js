const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-management';
    console.log('🔗 Connecting to MongoDB:', mongoURI);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('🔄 Falling back to in-memory storage...');
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'employee'], default: 'employee' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Company Schema
const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  baseCurrency: { type: String, default: 'USD' },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Expense Schema
const expenseSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  amountInBaseCurrency: { type: Number, required: true },
  expenseDate: { type: Date, required: true },
  paidBy: { type: String, required: true },
  remarks: { type: String },
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft' },
  currentApprover: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalHistory: [{
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['approved', 'rejected'] },
    comment: { type: String },
    date: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Approval Rule Schema
const approvalRuleSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  isManagerApprover: { type: Boolean, default: false },
  approvers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  minimumApprovalPercentage: { type: Number, default: 100 },
  conditionalApprovers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Company = mongoose.model('Company', companySchema);
const Expense = mongoose.model('Expense', expenseSchema);
const ApprovalRule = mongoose.model('ApprovalRule', approvalRuleSchema);

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'bittupopat439@gmail.com',
      pass: process.env.EMAIL_PASS || 'bebtxfcxpxnnwbzy'
    }
});

// Email sending function
const sendEmail = async (to, subject, html) => {
  try {
    console.log('📧 Sending email to:', to);
    console.log('📧 Subject:', subject);
    console.log('📧 Using email user:', process.env.EMAIL_USER || 'bittupopat439@gmail.com');
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'bittupopat439@gmail.com',
      to,
      subject,
      html
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const companyCount = await Company.countDocuments();
    const expenseCount = await Expense.countDocuments();
    const ruleCount = await ApprovalRule.countDocuments();
    
    res.json({ 
      status: 'OK', 
      message: 'MongoDB server is running',
      database: mongoose.connection.db?.databaseName || 'Not connected',
      data: {
        users: userCount,
        companies: companyCount,
        expenses: expenseCount,
        approvalRules: ruleCount
      }
    });
  } catch (error) {
    res.json({ 
      status: 'OK', 
      message: 'Server running (MongoDB not connected)',
      database: 'Not connected',
      data: { users: 0, companies: 0, expenses: 0, approvalRules: 0 }
    });
  }
});

// Countries endpoint
app.get('/api/currency/countries', (req, res) => {
  const countries = [
    { name: 'United States', currencies: ['USD'] },
    { name: 'United Kingdom', currencies: ['GBP'] },
    { name: 'European Union', currencies: ['EUR'] },
    { name: 'Japan', currencies: ['JPY'] },
    { name: 'Canada', currencies: ['CAD'] },
    { name: 'Australia', currencies: ['AUD'] },
    { name: 'Switzerland', currencies: ['CHF'] },
    { name: 'China', currencies: ['CNY'] },
    { name: 'India', currencies: ['INR'] },
    { name: 'Brazil', currencies: ['BRL'] }
  ];
  res.json(countries);
});

// OCR endpoint for receipt processing
app.post('/api/ocr/process-receipt', authenticateToken, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No receipt image provided' });
    }

    console.log('🔍 Processing receipt with OCR...');
    
    // Process image with Tesseract OCR
    const { data: { text } } = await Tesseract.recognize(
      req.file.buffer,
      'eng',
      {
        logger: m => console.log('OCR Progress:', m)
      }
    );

    console.log('📄 OCR Text extracted:', text.substring(0, 100) + '...');

    // Parse OCR text to extract expense data
    const expenseData = parseReceiptText(text);
    
    console.log('✅ Receipt processed successfully');
    res.json({
      message: 'Receipt processed successfully',
      extractedData: expenseData,
      rawText: text
    });

  } catch (error) {
    console.error('❌ OCR processing error:', error);
    res.status(500).json({ 
      message: 'Error processing receipt',
      error: error.message 
    });
  }
});

// Helper function to parse receipt text
function parseReceiptText(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let amount = null;
  let date = null;
  let description = '';
  let category = 'Other';
  let merchant = '';

  // Extract amount (look for currency patterns)
  const amountRegex = /(\$|USD|INR|EUR|GBP|JPY|CAD|AUD|CHF|CNY|BRL)\s*(\d+\.?\d*)/gi;
  const amountMatch = text.match(amountRegex);
  if (amountMatch) {
    const lastAmount = amountMatch[amountMatch.length - 1];
    const numericAmount = lastAmount.replace(/[^\d.]/g, '');
    amount = parseFloat(numericAmount);
  }

  // Extract date (look for date patterns)
  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g;
  const dateMatch = text.match(dateRegex);
  if (dateMatch) {
    date = dateMatch[0];
  }

  // Extract merchant name (usually first few lines)
  if (lines.length > 0) {
    merchant = lines[0];
  }

  // Extract description (look for common receipt items)
  const descriptionKeywords = ['total', 'subtotal', 'tax', 'tip', 'service', 'food', 'meal', 'lunch', 'dinner'];
  for (const line of lines) {
    if (descriptionKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
      description = line;
      break;
    }
  }

  // Determine category based on keywords
  const categoryKeywords = {
    'Food & Dining': ['restaurant', 'food', 'meal', 'lunch', 'dinner', 'cafe', 'coffee'],
    'Travel': ['hotel', 'flight', 'taxi', 'uber', 'lyft', 'gas', 'fuel'],
    'Transportation': ['parking', 'toll', 'metro', 'bus', 'train'],
    'Entertainment': ['movie', 'theater', 'concert', 'show', 'ticket'],
    'Office Supplies': ['office', 'supplies', 'stationery', 'paper', 'pen'],
    'Accommodation': ['hotel', 'lodging', 'accommodation', 'stay']
  };

  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
      category = cat;
      break;
    }
  }

  return {
    amount,
    date,
    description: description || 'Receipt expense',
    category,
    merchant,
    currency: 'USD' // Default currency
  };
}

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, country } = req.body;
    
    console.log('📝 Registration attempt:', { name, email, country });
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create company
    const company = new Company({
      name: `${name}'s Company`,
      country,
      baseCurrency: 'USD'
    });
    await company.save();
    console.log('✅ Company created in MongoDB:', company._id);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      company: company._id
    });
    await user.save();
    console.log('✅ User created in MongoDB:', user._id);
    
    // Update company with admin reference
    company.admin = user._id;
    await company.save();
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, company: company._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );
    
    console.log('🎉 Registration successful - Data saved to MongoDB!');
    console.log('📊 User ID:', user._id);
    console.log('📊 Company ID:', company._id);
    
    res.status(201).json({
      message: 'Admin and company created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: company._id
      }
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// Send forgot password email
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    // Send reset email
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset for your expense management account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">Expense Management System</p>
      </div>
    `;
    
    await sendEmail(email, 'Password Reset Request', html);
    
    console.log('✅ Password reset email sent to:', email);
    res.json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    console.log('✅ Password reset successfully for:', user.email);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).populate('company');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, company: user.company._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login successful:', user.email);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('company');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (Admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view all users' });
    }

    const companyUsers = await User.find({ company: req.user.company })
      .select('-password')
      .populate('manager', 'name email');
    
    console.log('📊 Returning users for company:', req.user.company, 'Count:', companyUsers.length);
    res.json(companyUsers);
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get managers for assignment (Admin only)
app.get('/api/users/managers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view managers' });
    }

    const managers = await User.find({ 
      company: req.user.company,
      role: 'manager'
    }).select('_id name email');
    
    console.log('📊 Returning managers for company:', req.user.company, 'Count:', managers.length);
    res.json(managers);
  } catch (error) {
    console.error('❌ Get managers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (Admin only)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update users' });
    }

    const { id } = req.params;
    const { name, email, role, managerId } = req.body;
    
    const user = await User.findOne({ 
      _id: id, 
      company: req.user.company 
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (managerId !== undefined) user.manager = managerId || null;
    
    await user.save();
    console.log('✅ User updated in MongoDB:', user._id, user.email);
    console.log('📊 Manager assigned:', managerId);
    
    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        manager: user.manager
      }
    });
  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create users' });
    }

    const { name, email, password, role, managerId } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
      company: req.user.company,
      manager: managerId || null
    });
    
    await user.save();
    console.log('✅ User created in MongoDB:', user._id, user.email);
    console.log('📊 Manager assigned:', managerId);
    console.log('📊 User role:', user.role);
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all expenses (Admin and Manager only)
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ message: 'Only admins and managers can view all expenses' });
    }

    const companyExpenses = await Expense.find({ company: req.user.company })
      .populate('employee', 'name email')
      .populate('currentApprover', 'name email');
    
    console.log('📊 Returning expenses for company:', req.user.company, 'Count:', companyExpenses.length);
    res.json(companyExpenses);
  } catch (error) {
    console.error('❌ Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's expenses
app.get('/api/expenses/my-expenses', authenticateToken, async (req, res) => {
  try {
    const userExpenses = await Expense.find({ employee: req.user.userId })
      .populate('currentApprover', 'name email');
    
    console.log('📊 Returning user expenses:', req.user.userId, 'Count:', userExpenses.length);
    res.json(userExpenses);
  } catch (error) {
    console.error('❌ Get my expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create expense
app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const { description, category, amount, currency, expenseDate, paidBy, remarks } = req.body;
    
    const expense = new Expense({
      employee: req.user.userId,
      company: req.user.company,
      description,
      category,
      amount: parseFloat(amount),
      currency,
      amountInBaseCurrency: parseFloat(amount), // Simplified for now
      expenseDate: new Date(expenseDate),
      paidBy,
      remarks
    });
    
    await expense.save();
    console.log('✅ Expense created in MongoDB:', expense._id, expense.description);
    
    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error('❌ Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit expense for approval
app.post('/api/expenses/:id/submit', authenticateToken, async (req, res) => {
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
    
    // Find the employee's manager
    const employee = await User.findById(req.user.userId);
    let approver = null;
    
    if (employee && employee.manager) {
      // Assign to manager
      approver = employee.manager;
    } else {
      // If no manager, assign to admin
      const admin = await User.findOne({ 
        company: req.user.company, 
        role: 'admin' 
      });
      if (admin) {
        approver = admin._id;
      }
    }
    
    expense.status = 'pending';
    expense.currentApprover = approver;
    await expense.save();
    
    console.log('✅ Expense submitted for approval to:', approver);
    
    res.json({
      message: 'Expense submitted for approval',
      expense
    });
  } catch (error) {
    console.error('❌ Submit expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get approval rules
app.get('/api/approval-rules', authenticateToken, async (req, res) => {
  try {
    const companyRules = await ApprovalRule.find({ company: req.user.company })
      .populate('approvers', 'name email')
      .populate('conditionalApprovers', 'name email');
    
    console.log('📊 Returning approval rules for company:', req.user.company, 'Count:', companyRules.length);
    res.json(companyRules);
  } catch (error) {
    console.error('❌ Get approval rules error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create approval rule
app.post('/api/approval-rules', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create approval rules' });
    }

    const { name, category, isManagerApprover, approvers, minimumApprovalPercentage, conditionalApprovers } = req.body;
    
    const rule = new ApprovalRule({
      company: req.user.company,
      name,
      category,
      isManagerApprover: isManagerApprover || false,
      approvers: approvers || [],
      minimumApprovalPercentage: minimumApprovalPercentage || 100,
      conditionalApprovers: conditionalApprovers || []
    });
    
    await rule.save();
    console.log('✅ Approval rule created in MongoDB:', rule._id, rule.name);
    
    res.status(201).json({
      message: 'Approval rule created successfully',
      rule
    });
  } catch (error) {
    console.error('❌ Create approval rule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending approvals (Manager and Admin only)
app.get('/api/approvals/pending', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ message: 'Only managers and admins can view pending approvals' });
    }

    const pendingExpenses = await Expense.find({ 
      company: req.user.company, 
      currentApprover: req.user.userId, 
      status: 'pending' 
    }).populate('employee', 'name email')
      .populate('currentApprover', 'name email');
    
    console.log('📊 Returning pending approvals for user:', req.user.userId, 'Count:', pendingExpenses.length);
    res.json(pendingExpenses);
  } catch (error) {
    console.error('❌ Get pending approvals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all approvals (Manager and Admin only)
app.get('/api/approvals', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ message: 'Only managers and admins can view all approvals' });
    }

    const companyExpenses = await Expense.find({ company: req.user.company })
      .populate('employee', 'name email')
      .populate('currentApprover', 'name email');
    
    console.log('📊 Returning all approvals:', companyExpenses.length);
    res.json(companyExpenses);
  } catch (error) {
    console.error('❌ Get all approvals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manager dashboard - get team expenses
app.get('/api/manager/team-expenses', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only managers and admins can view team expenses' });
    }

    // Get all employees under this manager
    const teamMembers = await User.find({ 
      company: req.user.company,
      manager: req.user.userId 
    }).select('_id name email');

    const teamMemberIds = teamMembers.map(member => member._id);
    
    // Get expenses from team members
    const teamExpenses = await Expense.find({ 
      company: req.user.company,
      employee: { $in: teamMemberIds }
    }).populate('employee', 'name email')
      .populate('currentApprover', 'name email');
    
    console.log('📊 Returning team expenses for manager:', req.user.userId, 'Count:', teamExpenses.length);
    res.json({
      teamMembers,
      teamExpenses
    });
  } catch (error) {
    console.error('❌ Get team expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/reject expense (Manager and Admin only)
app.post('/api/approvals/:id/action', authenticateToken, async (req, res) => {
  try {
    console.log('🎯 APPROVAL ENDPOINT CALLED - User:', req.user.userId, 'Role:', req.user.role);
    
    if (req.user.role === 'employee') {
      return res.status(403).json({ message: 'Only managers and admins can approve/reject expenses' });
    }

    const { id } = req.params;
    const { action, comment } = req.body;
    
    console.log('🔍 Looking for expense:', id, 'Current approver:', req.user.userId);
    
    // Find expense that is pending approval by this user
    const expense = await Expense.findOne({ 
      _id: id, 
      currentApprover: req.user.userId, 
      status: 'pending' 
    });
    
    console.log('📄 Expense found:', expense ? 'YES' : 'NO');
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or not pending your approval' });
    }
    
    // Add to approval history
    expense.approvalHistory = expense.approvalHistory || [];
    expense.approvalHistory.push({
      approver: req.user.userId,
      action,
      comment,
      date: new Date()
    });
    
    if (action === 'rejected') {
      expense.status = 'rejected';
      expense.currentApprover = null;
    } else {
      // Check if this is the final approval or if there are more approvers
      // For now, we'll approve it directly (can be enhanced with multi-level approval)
      expense.status = 'approved';
      expense.currentApprover = null;
    }
    
    await expense.save();
    
    console.log('💾 Expense saved, now attempting email notification...');
    console.log('🔍 Expense details - Employee:', expense.employee, 'Status:', expense.status);
    
    // Send email notification to employee
    try {
      console.log('📧 Attempting to send email notification...');
      const employee = await User.findById(expense.employee);
      const approver = await User.findById(req.user.userId);
      
      console.log('👤 Employee found:', employee ? employee.email : 'Not found');
      console.log('👤 Approver found:', approver ? approver.name : 'Not found');
      console.log('🔍 Expense employee ID:', expense.employee);
      console.log('🔍 Employee lookup result:', employee);
      
      if (employee && employee.email) {
        const subject = action === 'approved' ? 'Expense Approved' : 'Expense Rejected';
        const statusColor = action === 'approved' ? '#4CAF50' : '#f44336';
        const statusText = action === 'approved' ? 'approved' : 'rejected';
        
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Expense ${subject}</h2>
            <p>Hello ${employee.name},</p>
            <p>Your expense has been <strong style="color: ${statusColor};">${statusText}</strong> by ${approver.name}.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Expense Details:</h3>
              <p><strong>Amount:</strong> ${expense.currency} ${expense.amount}</p>
              <p><strong>Category:</strong> ${expense.category}</p>
              <p><strong>Description:</strong> ${expense.description}</p>
              <p><strong>Date:</strong> ${new Date(expense.date).toLocaleDateString()}</p>
              ${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ''}
            </div>
            <p>You can view more details in your expense management dashboard.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Expense Management System</p>
          </div>
        `;
        
        await sendEmail(employee.email, subject, html);
        console.log('✅ Email notification sent to:', employee.email);
      }
    } catch (emailError) {
      console.error('❌ Failed to send email notification:', emailError);
      // Don't fail the approval if email fails
    }
    
    console.log('✅ Expense action:', action, 'for expense:', expense._id, 'by user:', req.user.userId);
    
    res.json({
      message: `Expense ${action} successfully`,
      expense
    });
  } catch (error) {
    console.error('❌ Approve/reject expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 MongoDB server running on port ${PORT}`);
    console.log(`📊 Database: ${mongoose.connection.db?.databaseName || 'Not connected'}`);
    console.log(`🌍 Countries: http://localhost:${PORT}/api/currency/countries`);
    console.log(`🔐 Register: http://localhost:${PORT}/api/auth/register`);
    console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
  });
};

startServer();
