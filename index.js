const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Test endpoint for countries
app.get('/api/test-countries', async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
    res.json({ 
      status: 'OK', 
      count: response.data.length,
      sample: response.data.slice(0, 3).map(c => ({ name: c.name.common, currencies: Object.keys(c.currencies || {}) }))
    });
  } catch (error) {
    res.json({ status: 'ERROR', message: error.message });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/users', require('./routes/users'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/approval-rules', require('./routes/approvalRules'));
app.use('/api/approvals', require('./routes/approvals'));
app.use('/api/currency', require('./routes/currency'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 MongoDB connected successfully`);
});
