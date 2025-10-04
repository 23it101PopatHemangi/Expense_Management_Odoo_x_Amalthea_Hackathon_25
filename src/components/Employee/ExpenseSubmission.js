import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Tesseract from 'tesseract.js';
import axios from 'axios';
import { toast } from 'react-toastify';

const ExpenseSubmission = () => {
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: '',
    currency: 'USD',
    expenseDate: new Date().toISOString().split('T')[0],
    paidBy: '',
    remarks: ''
  });
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Food & Dining',
    'Transportation',
    'Accommodation',
    'Office Supplies',
    'Travel',
    'Entertainment',
    'Utilities',
    'Other'
  ];

  const currencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'
  ];

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file);
    setOcrProcessing(true);

    try {
      // Process OCR using backend endpoint
      const formData = new FormData();
      formData.append('receipt', file);
      
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/ocr/process-receipt', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const { extractedData } = response.data;
      
      // Auto-fill form with extracted data
      setFormData(prev => ({
        ...prev,
        description: extractedData.description || prev.description,
        category: extractedData.category || prev.category,
        amount: extractedData.amount || prev.amount,
        currency: extractedData.currency || prev.currency,
        expenseDate: extractedData.date || prev.expenseDate,
        paidBy: extractedData.merchant || prev.paidBy
      }));
      
      toast.success('Receipt processed successfully! Form auto-filled.');
    } catch (error) {
      console.error('OCR processing error:', error);
      toast.error('Failed to process receipt. Please fill manually.');
    } finally {
      setOcrProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    maxFiles: 1
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post('/api/expenses', formData);
      toast.success('Expense created successfully!');
      setFormData({
        description: '',
        category: '',
        amount: '',
        currency: 'USD',
        expenseDate: new Date().toISOString().split('T')[0],
        paidBy: '',
        remarks: ''
      });
      setUploadedFile(null);
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error(error.response?.data?.message || 'Failed to create expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Submit Expense</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new expense request or upload a receipt for automatic processing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Receipt */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Receipt</h2>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <div className="text-4xl">📄</div>
              <div className="text-sm text-gray-600">
                {isDragActive
                  ? 'Drop the receipt here...'
                  : 'Drag & drop a receipt here, or click to select'}
              </div>
              <div className="text-xs text-gray-500">
                Supports: JPEG, PNG, GIF, BMP, WebP
              </div>
            </div>
          </div>

          {uploadedFile && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="text-green-500 mr-2">✓</div>
                <div className="text-sm text-green-700">
                  File uploaded: {uploadedFile.name}
                </div>
              </div>
            </div>
          )}

          {ocrProcessing && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                <div className="text-sm text-blue-700">
                  Processing receipt with OCR...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Expense Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Expense Details</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g., Business lunch with client"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount *
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  required
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  Currency *
                </label>
                <select
                  id="currency"
                  name="currency"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  {currencies.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700">
                Expense Date *
              </label>
              <input
                type="date"
                id="expenseDate"
                name="expenseDate"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.expenseDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700">
                Paid By *
              </label>
              <input
                type="text"
                id="paidBy"
                name="paidBy"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.paidBy}
                onChange={handleChange}
                placeholder="e.g., Company Credit Card, Personal Cash"
              />
            </div>

            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                Remarks
              </label>
              <textarea
                id="remarks"
                name="remarks"
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Additional notes or comments..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => {
                  setFormData({
                    description: '',
                    category: '',
                    amount: '',
                    currency: 'USD',
                    expenseDate: new Date().toISOString().split('T')[0],
                    paidBy: '',
                    remarks: ''
                  });
                  setUploadedFile(null);
                }}
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseSubmission;
