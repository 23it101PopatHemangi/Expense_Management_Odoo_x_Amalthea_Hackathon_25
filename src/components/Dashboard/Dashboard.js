import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingApprovals: 0,
    approvedExpenses: 0,
    totalAmount: 0
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch expenses based on user role
      let expensesResponse;
      if (user.role === 'employee') {
        expensesResponse = await axios.get('/api/expenses/my-expenses');
      } else {
        expensesResponse = await axios.get('/api/expenses');
      }
      const expenses = expensesResponse.data;

      // Calculate stats
      const totalExpenses = expenses.length;
      const pendingApprovals = expenses.filter(exp => exp.status === 'pending').length;
      const approvedExpenses = expenses.filter(exp => exp.status === 'approved').length;
      const totalAmount = expenses
        .filter(exp => exp.status === 'approved')
        .reduce((sum, exp) => sum + exp.amountInBaseCurrency, 0);

      setStats({
        totalExpenses,
        pendingApprovals,
        approvedExpenses,
        totalAmount
      });

      // Get recent expenses (last 5)
      setRecentExpenses(expenses.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBasedMessage = () => {
    switch (user?.role) {
      case 'admin':
        return 'Welcome to your admin dashboard. Manage users, approval rules, and oversee all expenses.';
      case 'manager':
        return 'Welcome to your manager dashboard. Review and approve expense requests from your team.';
      case 'employee':
        return 'Welcome to your employee dashboard. Submit expenses and track their approval status.';
      default:
        return 'Welcome to your dashboard.';
    }
  };

  const getQuickActions = () => {
    const actions = [];
    
    if (user?.role === 'employee' || user?.role === 'admin' || user?.role === 'manager') {
      actions.push({
        title: 'Submit Expense',
        description: 'Create a new expense request',
        href: '/expenses',
        icon: '💰'
      });
    }
    
    if (user?.role === 'manager' || user?.role === 'admin') {
      actions.push({
        title: 'Review Approvals',
        description: 'Review pending expense approvals',
        href: '/approvals',
        icon: '✅'
      });
    }
    
    if (user?.role === 'admin') {
      actions.push({
        title: 'Manage Users',
        description: 'Add and manage team members',
        href: '/users',
        icon: '👥'
      });
      actions.push({
        title: 'Configure Rules',
        description: 'Set up approval workflows',
        href: '/approval-rules',
        icon: '⚙️'
      });
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="animate-fade-in">
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 animate-slide-in">
                Welcome back, {user.name}!
              </h1>
              <p className="text-gray-600 text-lg">{getRoleBasedMessage()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              user.role === 'admin' 
                ? 'bg-red-100 text-red-800' 
                : user.role === 'manager' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </div>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-500">Last login: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Expenses
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalExpenses}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">⏳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Approvals
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.pendingApprovals}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">✅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Approved Expenses
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.approvedExpenses}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">💵</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Amount
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${stats.totalAmount.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {getQuickActions().map((action, index) => (
            <a
              key={index}
              href={action.href}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 text-2xl">
                  {action.icon}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {action.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {action.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Expenses */}
      {recentExpenses.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Expenses</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {recentExpenses.map((expense) => (
                <li key={expense._id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {expense.employee?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {expense.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {expense.employee?.name} • {expense.category}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">
                        ${expense.amountInBaseCurrency.toFixed(2)}
                      </div>
                      <div className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                        expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {expense.status}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
