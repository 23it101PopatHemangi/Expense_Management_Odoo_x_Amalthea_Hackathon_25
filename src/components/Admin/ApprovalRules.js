import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ApprovalRules = () => {
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    isManagerApprover: true,
    approvers: [],
    minimumApprovalPercentage: 100,
    conditionalApprovers: []
  });

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesResponse, usersResponse] = await Promise.all([
        axios.get('/api/approval-rules'),
        axios.get('/api/users')
      ]);
      
      setRules(rulesResponse.data || []);
      setUsers(usersResponse.data || []);
      
      console.log('Loaded rules:', rulesResponse.data?.length || 0);
      console.log('Loaded users:', usersResponse.data?.length || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Set empty arrays on error
      setRules([]);
      setUsers([]);
      
      // Don't show error toast for empty data, just log it
      console.log('No data available - this is normal for new installations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingRule) {
        // Update existing rule
        await axios.put(`/api/approval-rules/${editingRule._id}`, formData);
        toast.success('Approval rule updated successfully');
      } else {
        // Create new rule
        await axios.post('/api/approval-rules', formData);
        toast.success('Approval rule created successfully');
      }
      
      setShowModal(false);
      setEditingRule(null);
      setFormData({
        name: '',
        category: '',
        isManagerApprover: true,
        approvers: [],
        minimumApprovalPercentage: 100,
        conditionalApprovers: []
      });
      fetchData();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error(error.response?.data?.message || 'Failed to save rule');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      category: rule.category,
      isManagerApprover: rule.isManagerApprover,
      approvers: rule.approvers || [],
      minimumApprovalPercentage: rule.minimumApprovalPercentage,
      conditionalApprovers: rule.conditionalApprovers || []
    });
    setShowModal(true);
  };

  const handleDelete = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this approval rule?')) {
      try {
        await axios.delete(`/api/approval-rules/${ruleId}`);
        toast.success('Approval rule deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting rule:', error);
        toast.error('Failed to delete rule');
      }
    }
  };

  const handleToggleStatus = async (ruleId, isActive) => {
    try {
      await axios.patch(`/api/approval-rules/${ruleId}/toggle`, { isActive: !isActive });
      toast.success('Rule status updated');
      fetchData();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Failed to update rule status');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addApprover = () => {
    setFormData({
      ...formData,
      approvers: [...formData.approvers, { user: '', sequence: formData.approvers.length + 1 }]
    });
  };

  const removeApprover = (index) => {
    setFormData({
      ...formData,
      approvers: formData.approvers.filter((_, i) => i !== index)
    });
  };

  const updateApprover = (index, field, value) => {
    const newApprovers = [...formData.approvers];
    newApprovers[index] = { ...newApprovers[index], [field]: value };
    setFormData({ ...formData, approvers: newApprovers });
  };

  const addConditionalApprover = () => {
    setFormData({
      ...formData,
      conditionalApprovers: [...formData.conditionalApprovers, { user: '', autoApprove: false }]
    });
  };

  const removeConditionalApprover = (index) => {
    setFormData({
      ...formData,
      conditionalApprovers: formData.conditionalApprovers.filter((_, i) => i !== index)
    });
  };

  const updateConditionalApprover = (index, field, value) => {
    const newConditionalApprovers = [...formData.conditionalApprovers];
    newConditionalApprovers[index] = { ...newConditionalApprovers[index], [field]: value };
    setFormData({ ...formData, conditionalApprovers: newConditionalApprovers });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Approval Rules</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure approval workflows for different expense categories
            </p>
          </div>
          <button
            onClick={() => {
              setEditingRule(null);
              setFormData({
                name: '',
                category: '',
                isManagerApprover: true,
                approvers: [],
                minimumApprovalPercentage: 100,
                conditionalApprovers: []
              });
              setShowModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Rule
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Approval Rules ({rules.length})
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {rules.map((rule) => (
            <li key={rule._id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-medium">⚙️</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {rule.name}
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span>Category: {rule.category}</span>
                        <span className="mx-2">•</span>
                        <span>Min Approval: {rule.minimumApprovalPercentage}%</span>
                        {rule.isManagerApprover && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Manager Approval Required</span>
                          </>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        Approvers: {rule.approvers?.length || 0} | 
                        Conditional: {rule.conditionalApprovers?.length || 0}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleStatus(rule._id, rule.isActive)}
                      className={`text-sm font-medium ${
                        rule.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {rule.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(rule)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rule._id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Add/Edit Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {editingRule ? 'Edit Approval Rule' : 'Add New Approval Rule'}
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                              Rule Name
                            </label>
                            <input
                              type="text"
                              id="name"
                              name="name"
                              required
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={formData.name}
                              onChange={handleChange}
                            />
                          </div>

                          <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                              Category
                            </label>
                            <select
                              id="category"
                              name="category"
                              required
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={formData.category}
                              onChange={handleChange}
                            >
                              <option value="">Select category</option>
                              {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isManagerApprover"
                            name="isManagerApprover"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={formData.isManagerApprover}
                            onChange={(e) => setFormData({...formData, isManagerApprover: e.target.checked})}
                          />
                          <label htmlFor="isManagerApprover" className="ml-2 block text-sm text-gray-900">
                            Manager approval required
                          </label>
                        </div>

                        <div>
                          <label htmlFor="minimumApprovalPercentage" className="block text-sm font-medium text-gray-700">
                            Minimum Approval Percentage
                          </label>
                          <input
                            type="number"
                            id="minimumApprovalPercentage"
                            name="minimumApprovalPercentage"
                            min="0"
                            max="100"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.minimumApprovalPercentage}
                            onChange={handleChange}
                          />
                        </div>

                        {/* Approvers */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Approvers
                            </label>
                            <button
                              type="button"
                              onClick={addApprover}
                              className="text-sm text-indigo-600 hover:text-indigo-900"
                            >
                              + Add Approver
                            </button>
                          </div>
                          {formData.approvers.map((approver, index) => (
                            <div key={index} className="flex items-center space-x-2 mb-2">
                              <select
                                value={approver.user}
                                onChange={(e) => updateApprover(index, 'user', e.target.value)}
                                className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              >
                                <option value="">Select user</option>
                                {users.map(user => (
                                  <option key={user._id} value={user._id}>
                                    {user.name} ({user.role})
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                placeholder="Sequence"
                                value={approver.sequence}
                                onChange={(e) => updateApprover(index, 'sequence', parseInt(e.target.value))}
                                className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => removeApprover(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Conditional Approvers */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Conditional Approvers
                            </label>
                            <button
                              type="button"
                              onClick={addConditionalApprover}
                              className="text-sm text-indigo-600 hover:text-indigo-900"
                            >
                              + Add Conditional Approver
                            </button>
                          </div>
                          {formData.conditionalApprovers.map((approver, index) => (
                            <div key={index} className="flex items-center space-x-2 mb-2">
                              <select
                                value={approver.user}
                                onChange={(e) => updateConditionalApprover(index, 'user', e.target.value)}
                                className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              >
                                <option value="">Select user</option>
                                {users.map(user => (
                                  <option key={user._id} value={user._id}>
                                    {user.name} ({user.role})
                                  </option>
                                ))}
                              </select>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={approver.autoApprove}
                                  onChange={(e) => updateConditionalApprover(index, 'autoApprove', e.target.checked)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Auto Approve</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => removeConditionalApprover(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingRule ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalRules;
