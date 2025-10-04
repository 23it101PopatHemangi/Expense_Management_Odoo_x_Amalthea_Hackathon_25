const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Get all countries and their currencies
router.get('/countries', async (req, res) => {
  try {
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
    const countries = response.data.map(country => ({
      name: country.name.common,
      currencies: Object.keys(country.currencies || {})
    }));
    
    res.json(countries);
  } catch (error) {
    console.error('Get countries error:', error);
    
    // Fallback countries data if API fails
    const fallbackCountries = [
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
    
    res.json(fallbackCountries);
  }
});

// Convert currency
router.post('/convert', authenticateToken, async (req, res) => {
  try {
    const { from, to, amount } = req.body;

    if (!from || !to || !amount) {
      return res.status(400).json({ message: 'From, to, and amount are required' });
    }

    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`);
    const rate = response.data.rates[to];

    if (!rate) {
      return res.status(400).json({ message: 'Currency conversion not available' });
    }

    const convertedAmount = amount * rate;

    res.json({
      from,
      to,
      originalAmount: amount,
      convertedAmount: convertedAmount,
      rate
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    res.status(500).json({ message: 'Failed to convert currency' });
  }
});

// Get exchange rates for base currency
router.get('/rates/:baseCurrency', authenticateToken, async (req, res) => {
  try {
    const { baseCurrency } = req.params;
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    
    res.json({
      base: response.data.base,
      rates: response.data.rates,
      date: response.data.date
    });
  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({ message: 'Failed to fetch exchange rates' });
  }
});

module.exports = router;
