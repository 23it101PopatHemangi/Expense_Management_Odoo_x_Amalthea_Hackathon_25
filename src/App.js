import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import Dashboard from './components/Dashboard/Dashboard';
import UserManagement from './components/Admin/UserManagement';
import ApprovalRules from './components/Admin/ApprovalRules';
import ExpenseSubmission from './components/Employee/ExpenseSubmission';
import ExpenseHistory from './components/Employee/ExpenseHistory';
import ApprovalDashboard from './components/Manager/ApprovalDashboard';
import Layout from './components/Layout/Layout';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } />
            <Route path="/forgot-password" element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } />
            <Route path="/reset-password" element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            } />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Admin Routes */}
              <Route path="users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="approval-rules" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ApprovalRules />
                </ProtectedRoute>
              } />
              
              {/* Employee Routes */}
              <Route path="expenses" element={
                <ProtectedRoute allowedRoles={['employee', 'admin', 'manager']}>
                  <ExpenseSubmission />
                </ProtectedRoute>
              } />
              <Route path="expense-history" element={
                <ProtectedRoute allowedRoles={['employee', 'admin', 'manager']}>
                  <ExpenseHistory />
                </ProtectedRoute>
              } />
              
              {/* Manager Routes */}
              <Route path="approvals" element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <ApprovalDashboard />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
          <ToastContainer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
