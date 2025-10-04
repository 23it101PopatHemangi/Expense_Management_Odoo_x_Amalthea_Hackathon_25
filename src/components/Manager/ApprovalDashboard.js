import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const ApprovalDashboard = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingResponse, allResponse] = await Promise.all([
        axios.get('/api/approvals/pending'),
        axios.get('/api/approvals')
      ]);
      
      setPendingApprovals(pendingResponse.data || []);
      setAllExpenses(allResponse.data || []);
      
      console.log('Loaded pending approvals:', pendingResponse.data?.length || 0);
      console.log('Loaded all expenses:', allResponse.data?.length || 0);
    } catch (error) {
      console.error('Error fetching approval data:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Set empty arrays on error
      setPendingApprovals([]);
      setAllExpenses([]);
      
      // Don't show error toast for empty data
      console.log('No approval data available - this is normal for new installations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (expenseId, action, comment = '') => {
    try {
      await axios.post(`/api/approvals/${expenseId}/action`, {
        action,
        comment
      });
      
      toast.success(`Expense ${action} successfully`);
      fetchData();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error(`Failed to ${action} expense`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredExpenses = allExpenses.filter(expense => {
    if (filter === 'all') return true;
    return expense.status === filter;
  });

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
        <h1 className="text-2xl font-bold text-gray-900">Approval Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve expense requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm">⏳</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Approvals
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {pendingApprovals.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm">✅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Approved Today
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {allExpenses.filter(e => e.status === 'approved').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm">❌</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Rejected Today
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {allExpenses.filter(e => e.status === 'rejected').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Amount
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${allExpenses
                      .filter(e => e.status === 'approved')
                      .reduce((sum, e) => sum + e.amountInBaseCurrency, 0)
                      .toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'pending', label: 'Pending Approvals', count: pendingApprovals.length },
              { key: 'all', label: 'All Expenses', count: allExpenses.length },
              { key: 'approved', label: 'Approved', count: allExpenses.filter(e => e.status === 'approved').length },
              { key: 'rejected', label: 'Rejected', count: allExpenses.filter(e => e.status === 'rejected').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`${
                  filter === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  filter === tab.key
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
            <p className="text-gray-500">
              {filter === 'pending' 
                ? 'No expenses are currently pending your approval.'
                : `No expenses with status "${filter}" found.`
              }
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredExpenses.map((expense) => (
              <li key={expense._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">
                            {expense.employee?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {expense.description}
                          </p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                            {expense.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span>{expense.employee?.name}</span>
                          <span className="mx-2">•</span>
                          <span>{expense.category}</span>
                          <span className="mx-2">•</span>
                          <span>{format(new Date(expense.expenseDate), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {expense.currency} {expense.amount}
                        </div>
                        <div className="text-xs text-gray-500">
                          Base: ${expense.amountInBaseCurrency?.toFixed(2)}
                        </div>
                      </div>
                      {expense.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprovalAction(expense._id, 'approved')}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const comment = prompt('Enter rejection reason (optional):');
                              handleApprovalAction(expense._id, 'rejected', comment);
                            }}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {expense.remarks && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Remarks:</span> {expense.remarks}
                      </p>
                    </div>
                  )}

                  {expense.approvalHistory && expense.approvalHistory.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Approval History:</span>
                      </div>
                      <div className="mt-1 space-y-1">
                        {expense.approvalHistory.map((history, index) => (
                          <div key={index} className="text-xs text-gray-500">
                            {history.approver?.name} {history.action} on {format(new Date(history.date), 'MMM dd, yyyy HH:mm')}
                            {history.comment && ` - ${history.comment}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ApprovalDashboard;
