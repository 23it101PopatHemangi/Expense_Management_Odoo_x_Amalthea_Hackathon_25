const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// File-based storage
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json');
const EXPENSES_FILE = path.join(DATA_DIR, 'expenses.json');
const APPROVAL_RULES_FILE = path.join(DATA_DIR, 'approval_rules.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data from files
const loadData = (filePath, defaultValue = []) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
  }
  return defaultValue;
};

// Save data to files
const saveData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error);
    return false;
  }
};

// Load initial data
let users = loadData(USERS_FILE, []);
let companies = loadData(COMPANIES_FILE, []);
let expenses = loadData(EXPENSES_FILE, []);
let approvalRules = loadData(APPROVAL_RULES_FILE, []);

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
  res.json({ 
    status: 'OK', 
    message: 'Working server is running',
    data: {
      users: users.length,
      companies: companies.length,
      expenses: expenses.length,
      approvalRules: approvalRules.length
    }
  });
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
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create company
    const company = {
      id: Date.now(),
      name: `${name}'s Company`,
      country,
      baseCurrency: 'USD',
      admin: null
    };
    companies.push(company);
    
    // Create user
    const user = {
      id: Date.now() + 1,
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      company: company.id,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    
    // Update company with admin reference
    company.admin = user.id;
    
    // Save data to files
    saveData(USERS_FILE, users);
    saveData(COMPANIES_FILE, companies);
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, company: company.id },
      'fallback_secret',
      { expiresIn: '24h' }
    );
    
    console.log('✅ User created successfully:', user.id);
    console.log('✅ Company created successfully:', company.id);
    console.log('📊 Total users:', users.length);
    console.log('📊 Total companies:', companies.length);
    
    res.status(201).json({
      message: 'Admin and company created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: company.id
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
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, company: user.company },
      'fallback_secret',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login successful:', user.email);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
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
    const user = users.find(u => u.id == req.user.userId);
    const company = companies.find(c => c.id == user?.company);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: company
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
    const companyUsers = users.filter(u => u.company == req.user.company)
      .map(u => ({ ...u, password: undefined }));
    
    console.log('📊 Returning users for company:', req.user.company, 'Count:', companyUsers.length);
    res.json(companyUsers);
  } catch (error) {
    console.error('Get users error:', error);
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
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = {
      id: Date.now(),
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
      company: req.user.company,
      manager: managerId || null,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    users.push(user);
    saveData(USERS_FILE, users);
    
    console.log('✅ User created:', user.id, user.email);
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all expenses
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const companyExpenses = expenses.filter(e => e.company == req.user.company);
    
    console.log('📊 Returning expenses for company:', req.user.company, 'Count:', companyExpenses.length);
    res.json(companyExpenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's expenses
app.get('/api/expenses/my-expenses', authenticateToken, async (req, res) => {
  try {
    const userExpenses = expenses.filter(e => e.employee == req.user.userId);
    
    console.log('📊 Returning user expenses:', req.user.userId, 'Count:', userExpenses.length);
    res.json(userExpenses);
  } catch (error) {
    console.error('Get my expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create expense
app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const { description, category, amount, currency, expenseDate, paidBy, remarks } = req.body;
    
    const expense = {
      id: Date.now(),
      employee: req.user.userId,
      company: req.user.company,
      description,
      category,
      amount: parseFloat(amount),
      currency,
      amountInBaseCurrency: parseFloat(amount), // Simplified for now
      expenseDate: new Date(expenseDate).toISOString(),
      paidBy,
      remarks,
      status: 'draft',
      createdAt: new Date().toISOString()
    };
    
    expenses.push(expense);
    saveData(EXPENSES_FILE, expenses);
    
    console.log('✅ Expense created:', expense.id, expense.description);
    
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
    
    const expense = expenses.find(e => e.id == id && e.employee == req.user.userId && e.status === 'draft');
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or already submitted' });
    }
    
    expense.status = 'pending';
    saveData(EXPENSES_FILE, expenses);
    
    console.log('✅ Expense submitted:', expense.id);
    
    res.json({
      message: 'Expense submitted for approval',
      expense
    });
  } catch (error) {
    console.error('Submit expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get approval rules
app.get('/api/approval-rules', authenticateToken, async (req, res) => {
  try {
    const companyRules = approvalRules.filter(r => r.company == req.user.company);
    
    console.log('📊 Returning approval rules for company:', req.user.company, 'Count:', companyRules.length);
    res.json(companyRules);
  } catch (error) {
    console.error('Get approval rules error:', error);
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
    
    const rule = {
      id: Date.now(),
      company: req.user.company,
      name,
      category,
      isManagerApprover: isManagerApprover || false,
      approvers: approvers || [],
      minimumApprovalPercentage: minimumApprovalPercentage || 100,
      conditionalApprovers: conditionalApprovers || [],
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    approvalRules.push(rule);
    saveData(APPROVAL_RULES_FILE, approvalRules);
    
    console.log('✅ Approval rule created:', rule.id, rule.name);
    
    res.status(201).json({
      message: 'Approval rule created successfully',
      rule
    });
  } catch (error) {
    console.error('Create approval rule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending approvals
app.get('/api/approvals/pending', authenticateToken, async (req, res) => {
  try {
    const pendingExpenses = expenses.filter(e => 
      e.company == req.user.company && 
      e.currentApprover == req.user.userId && 
      e.status === 'pending'
    );
    
    console.log('📊 Returning pending approvals:', pendingExpenses.length);
    res.json(pendingExpenses);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all approvals
app.get('/api/approvals', authenticateToken, async (req, res) => {
  try {
    const companyExpenses = expenses.filter(e => e.company == req.user.company);
    
    console.log('📊 Returning all approvals:', companyExpenses.length);
    res.json(companyExpenses);
  } catch (error) {
    console.error('Get all approvals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/reject expense
app.post('/api/approvals/:id/action', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;
    
    const expense = expenses.find(e => 
      e.id == id && 
      e.currentApprover == req.user.userId && 
      e.status === 'pending'
    );
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or not pending your approval' });
    }
    
    // Add to approval history
    expense.approvalHistory = expense.approvalHistory || [];
    expense.approvalHistory.push({
      approver: req.user.userId,
      action,
      comment,
      date: new Date().toISOString()
    });
    
    if (action === 'rejected') {
      expense.status = 'rejected';
      expense.currentApprover = null;
    } else {
      expense.status = 'approved';
      expense.currentApprover = null;
    }
    
    saveData(EXPENSES_FILE, expenses);
    
    console.log('✅ Expense action:', action, 'for expense:', expense.id);
    
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
  console.log(`🚀 Working server running on port ${PORT}`);
  console.log(`📊 Data storage: File-based (${DATA_DIR})`);
  console.log(`📊 Current data: ${users.length} users, ${companies.length} companies, ${expenses.length} expenses, ${approvalRules.length} rules`);
  console.log(`🌍 Countries: http://localhost:${PORT}/api/currency/countries`);
  console.log(`🔐 Register: http://localhost:${PORT}/api/auth/register`);
  console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
});
