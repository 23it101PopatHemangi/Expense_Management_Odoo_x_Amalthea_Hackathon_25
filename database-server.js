const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect('mongodb://localhost:27017/expense-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.log('❌ MongoDB connection failed, using in-memory storage');
  console.log('Error:', err.message);
});

// Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'employee'], default: 'employee' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  baseCurrency: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

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
  receipt: { type: String },
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft' },
  approvalRule: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalRule' },
  currentApprover: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalHistory: [{
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['approved', 'rejected'] },
    comment: String,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const approvalRuleSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  isManagerApprover: { type: Boolean, default: true },
  approvers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sequence: { type: Number, required: true }
  }],
  minimumApprovalPercentage: { type: Number, default: 100 },
  conditionalApprovers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    autoApprove: { type: Boolean, default: false }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Models
const User = mongoose.model('User', userSchema);
const Company = mongoose.model('Company', companySchema);
const Expense = mongoose.model('Expense', expenseSchema);
const ApprovalRule = mongoose.model('ApprovalRule', approvalRuleSchema);

// In-memory fallback storage
let memoryUsers = [];
let memoryCompanies = [];
let memoryExpenses = [];
let memoryApprovalRules = [];

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Database server is running' });
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

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, country } = req.body;
    
    console.log('Registration attempt:', { name, email, country });
    
    // Check if user already exists
    let existingUser;
    if (mongoose.connection.readyState === 1) {
      existingUser = await User.findOne({ email });
    } else {
      existingUser = memoryUsers.find(u => u.email === email);
    }
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create company
    const companyData = {
      name: `${name}'s Company`,
      country,
      baseCurrency: 'USD'
    };
    
    let company;
    if (mongoose.connection.readyState === 1) {
      company = new Company(companyData);
      await company.save();
    } else {
      company = { id: Date.now(), ...companyData };
      memoryCompanies.push(company);
    }
    
    // Create user
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      company: company._id || company.id
    };
    
    let user;
    if (mongoose.connection.readyState === 1) {
      user = new User(userData);
      await user.save();
      
      // Update company with admin reference
      company.admin = user._id;
      await company.save();
    } else {
      user = { id: Date.now() + 1, ...userData };
      memoryUsers.push(user);
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id || user.id, email: user.email, role: user.role, company: company._id || company.id },
      'fallback_secret',
      { expiresIn: '24h' }
    );
    
    console.log('✅ User created successfully');
    res.status(201).json({
      message: 'Admin and company created successfully',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: company._id || company.id
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email }).populate('company');
    } else {
      user = memoryUsers.find(u => u.email === email);
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id || user.id, email: user.email, role: user.role, company: user.company },
      'fallback_secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findById(req.user.userId).populate('company').populate('manager');
    } else {
      user = memoryUsers.find(u => (u._id || u.id) == req.user.userId);
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        manager: user.manager
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    let users;
    if (mongoose.connection.readyState === 1) {
      users = await User.find({ company: req.user.company })
        .populate('manager', 'name email')
        .select('-password');
    } else {
      users = memoryUsers.filter(u => u.company == req.user.company)
        .map(u => ({ ...u, password: undefined }));
    }
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all expenses
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    let expenses;
    if (mongoose.connection.readyState === 1) {
      expenses = await Expense.find({ company: req.user.company })
        .populate('employee', 'name email')
        .populate('approvalRule', 'name')
        .sort({ createdAt: -1 });
    } else {
      expenses = memoryExpenses.filter(e => e.company == req.user.company);
    }
    
    res.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's expenses
app.get('/api/expenses/my-expenses', authenticateToken, async (req, res) => {
  try {
    let expenses;
    if (mongoose.connection.readyState === 1) {
      expenses = await Expense.find({ employee: req.user.userId })
        .populate('approvalRule', 'name')
        .sort({ createdAt: -1 });
    } else {
      expenses = memoryExpenses.filter(e => e.employee == req.user.userId);
    }
    
    res.json(expenses);
  } catch (error) {
    console.error('Get my expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get approval rules
app.get('/api/approval-rules', authenticateToken, async (req, res) => {
  try {
    let rules;
    if (mongoose.connection.readyState === 1) {
      rules = await ApprovalRule.find({ company: req.user.company })
        .populate('approvers.user', 'name email')
        .populate('conditionalApprovers.user', 'name email')
        .sort({ createdAt: -1 });
    } else {
      rules = memoryApprovalRules.filter(r => r.company == req.user.company);
    }
    
    res.json(rules);
  } catch (error) {
    console.error('Get approval rules error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending approvals
app.get('/api/approvals/pending', authenticateToken, async (req, res) => {
  try {
    let expenses;
    if (mongoose.connection.readyState === 1) {
      expenses = await Expense.find({
        company: req.user.company,
        currentApprover: req.user.userId,
        status: 'pending'
      })
      .populate('employee', 'name email')
      .populate('approvalRule', 'name')
      .sort({ createdAt: -1 });
    } else {
      expenses = memoryExpenses.filter(e => 
        e.company == req.user.company && 
        e.currentApprover == req.user.userId && 
        e.status === 'pending'
      );
    }
    
    res.json(expenses);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all approvals
app.get('/api/approvals', authenticateToken, async (req, res) => {
  try {
    let expenses;
    if (mongoose.connection.readyState === 1) {
      expenses = await Expense.find({ company: req.user.company })
        .populate('employee', 'name email')
        .populate('currentApprover', 'name email')
        .populate('approvalRule', 'name')
        .sort({ createdAt: -1 });
    } else {
      expenses = memoryExpenses.filter(e => e.company == req.user.company);
    }
    
    res.json(expenses);
  } catch (error) {
    console.error('Get all approvals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create expense
app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const { description, category, amount, currency, expenseDate, paidBy, remarks } = req.body;
    
    const expenseData = {
      employee: req.user.userId,
      company: req.user.company,
      description,
      category,
      amount,
      currency,
      amountInBaseCurrency: amount, // Simplified for now
      expenseDate: new Date(expenseDate),
      paidBy,
      remarks,
      status: 'draft'
    };
    
    let expense;
    if (mongoose.connection.readyState === 1) {
      expense = new Expense(expenseData);
      await expense.save();
    } else {
      expense = { id: Date.now(), ...expenseData };
      memoryExpenses.push(expense);
    }
    
    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit expense for approval
app.post('/api/expenses/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    let expense;
    if (mongoose.connection.readyState === 1) {
      expense = await Expense.findOne({
        _id: id,
        employee: req.user.userId,
        status: 'draft'
      });
      
      if (expense) {
        expense.status = 'pending';
        await expense.save();
      }
    } else {
      expense = memoryExpenses.find(e => e.id == id && e.employee == req.user.userId && e.status === 'draft');
      if (expense) {
        expense.status = 'pending';
      }
    }
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or already submitted' });
    }
    
    res.json({
      message: 'Expense submitted for approval',
      expense
    });
  } catch (error) {
    console.error('Submit expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/reject expense
app.post('/api/approvals/:id/action', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;
    
    let expense;
    if (mongoose.connection.readyState === 1) {
      expense = await Expense.findOne({
        _id: id,
        currentApprover: req.user.userId,
        status: 'pending'
      });
      
      if (expense) {
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
          expense.status = 'approved';
          expense.currentApprover = null;
        }
        
        await expense.save();
      }
    } else {
      expense = memoryExpenses.find(e => 
        e.id == id && 
        e.currentApprover == req.user.userId && 
        e.status === 'pending'
      );
      
      if (expense) {
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
          expense.status = 'approved';
          expense.currentApprover = null;
        }
      }
    }
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or not pending your approval' });
    }
    
    res.json({
      message: `Expense ${action} successfully`,
      expense
    });
  } catch (error) {
    console.error('Approve/reject expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Database server running on port ${PORT}`);
  console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'In-memory fallback'}`);
  console.log(`🌍 Countries: http://localhost:${PORT}/api/currency/countries`);
  console.log(`🔐 Register: http://localhost:${PORT}/api/auth/register`);
});
