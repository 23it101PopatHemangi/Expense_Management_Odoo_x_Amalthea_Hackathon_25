import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    managerId: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [usersResponse, managersResponse] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/users/managers')
      ]);
      
      setUsers(usersResponse.data || []);
      setManagers(managersResponse.data || []);
      
      console.log('Loaded users:', usersResponse.data?.length || 0);
      console.log('Loaded managers:', managersResponse?.length || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Set empty arrays on error
      setUsers([]);
      setManagers([]);
      
      // Don't show error toast for empty data
      console.log('No users available - this is normal for new installations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update existing user
        await axios.put(`/api/users/${editingUser._id}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          managerId: formData.managerId || null
        });
        toast.success('User updated successfully');
      } else {
        // Create new user
        await axios.post('/api/users', formData);
        toast.success('User created successfully');
      }
      
      setShowModal(false);
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        managerId: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      managerId: user.manager?._id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const handleAssignManager = async (userId, managerId) => {
    try {
      await axios.put(`/api/users/${userId}/manager`, { managerId });
      toast.success('Manager assigned successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error assigning manager:', error);
      toast.error('Failed to assign manager');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage employees and managers
            </p>
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({
                name: '',
                email: '',
                password: '',
                role: 'employee',
                managerId: ''
              });
              setShowModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Users ({users.length})
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user._id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span>{user.email}</span>
                        {user.manager && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Manager: {user.manager.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.role === 'employee' && (
                      <select
                        value={user.manager?._id || ''}
                        onChange={(e) => handleAssignManager(user._id, e.target.value)}
                        className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Assign Manager</option>
                        {managers.map(manager => (
                          <option key={manager._id} value={manager._id}>
                            {manager.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {editingUser ? 'Edit User' : 'Add New User'}
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Name
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
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.email}
                            onChange={handleChange}
                          />
                        </div>

                        {!editingUser && (
                          <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                              Password
                            </label>
                            <input
                              type="password"
                              id="password"
                              name="password"
                              required={!editingUser}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={formData.password}
                              onChange={handleChange}
                            />
                          </div>
                        )}

                        <div>
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            Role
                          </label>
                          <select
                            id="role"
                            name="role"
                            required
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.role}
                            onChange={handleChange}
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                          </select>
                        </div>

                        {formData.role === 'employee' && (
                          <div>
                            <label htmlFor="managerId" className="block text-sm font-medium text-gray-700">
                              Manager
                            </label>
                            <select
                              id="managerId"
                              name="managerId"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={formData.managerId}
                              onChange={handleChange}
                            >
                              <option value="">Select a manager</option>
                              {managers.map(manager => (
                                <option key={manager._id} value={manager._id}>
                                  {manager.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingUser ? 'Update' : 'Create'}
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

export default UserManagement;
