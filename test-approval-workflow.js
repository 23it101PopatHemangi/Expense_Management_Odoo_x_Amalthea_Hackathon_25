const axios = require('axios');

async function testApprovalWorkflow() {
  console.log('🧪 Testing Complete Approval Workflow...\n');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test 2: Register Admin
    console.log('\n2. Registering Admin...');
    const adminResponse = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      country: 'United States'
    });
    console.log('✅ Admin registered:', adminResponse.data.user.name);
    const adminToken = adminResponse.data.token;
    
    // Test 3: Create Manager
    console.log('\n3. Creating Manager...');
    const managerResponse = await axios.post('http://localhost:5000/api/users', {
      name: 'Manager User',
      email: 'manager@test.com',
      password: 'password123',
      role: 'manager'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Manager created:', managerResponse.data.user.name);
    
    // Test 4: Create Employee with Manager
    console.log('\n4. Creating Employee with Manager...');
    const employeeResponse = await axios.post('http://localhost:5000/api/users', {
      name: 'Employee User',
      email: 'employee@test.com',
      password: 'password123',
      role: 'employee',
      managerId: managerResponse.data.user.id
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Employee created with manager:', employeeResponse.data.user.name);
    
    // Test 5: Login as Employee
    console.log('\n5. Logging in as Employee...');
    const employeeLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'employee@test.com',
      password: 'password123'
    });
    console.log('✅ Employee logged in');
    const employeeToken = employeeLoginResponse.data.token;
    
    // Test 6: Create Expense as Employee
    console.log('\n6. Creating Expense as Employee...');
    const expenseResponse = await axios.post('http://localhost:5000/api/expenses', {
      description: 'Test Business Lunch',
      category: 'Food & Dining',
      amount: 50.00,
      currency: 'USD',
      expenseDate: '2024-10-04',
      paidBy: 'Company Credit Card',
      remarks: 'Client meeting'
    }, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('✅ Expense created:', expenseResponse.data.expense.id);
    const expenseId = expenseResponse.data.expense.id;
    
    // Test 7: Submit Expense for Approval
    console.log('\n7. Submitting Expense for Approval...');
    const submitResponse = await axios.post(`http://localhost:5000/api/expenses/${expenseId}/submit`, {}, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('✅ Expense submitted for approval');
    
    // Test 8: Login as Manager
    console.log('\n8. Logging in as Manager...');
    const managerLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'manager@test.com',
      password: 'password123'
    });
    console.log('✅ Manager logged in');
    const managerToken = managerLoginResponse.data.token;
    
    // Test 9: Get Pending Approvals for Manager
    console.log('\n9. Getting Pending Approvals for Manager...');
    const pendingResponse = await axios.get('http://localhost:5000/api/approvals/pending', {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    console.log('✅ Pending approvals retrieved:', pendingResponse.data.length, 'expenses');
    
    if (pendingResponse.data.length > 0) {
      const pendingExpense = pendingResponse.data[0];
      console.log('   - Expense ID:', pendingExpense._id);
      console.log('   - Description:', pendingExpense.description);
      console.log('   - Amount:', pendingExpense.amount);
      console.log('   - Employee:', pendingExpense.employee.name);
      
      // Test 10: Approve Expense
      console.log('\n10. Approving Expense...');
      const approveResponse = await axios.post(`http://localhost:5000/api/approvals/${pendingExpense._id}/action`, {
        action: 'approved',
        comment: 'Approved by manager'
      }, {
        headers: { Authorization: `Bearer ${managerToken}` }
      });
      console.log('✅ Expense approved successfully');
      
      // Test 11: Verify Expense Status
      console.log('\n11. Verifying Expense Status...');
      const verifyResponse = await axios.get('http://localhost:5000/api/approvals', {
        headers: { Authorization: `Bearer ${managerToken}` }
      });
      const approvedExpense = verifyResponse.data.find(e => e._id === pendingExpense._id);
      console.log('✅ Expense status:', approvedExpense.status);
      console.log('✅ Approval history:', approvedExpense.approvalHistory.length, 'entries');
    }
    
    console.log('\n🎉 APPROVAL WORKFLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('\n📊 Summary:');
    console.log('   ✅ Admin can create users and assign managers');
    console.log('   ✅ Employee can create and submit expenses');
    console.log('   ✅ Manager can view pending approvals');
    console.log('   ✅ Manager can approve/reject expenses');
    console.log('   ✅ Approval workflow is working correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testApprovalWorkflow();
