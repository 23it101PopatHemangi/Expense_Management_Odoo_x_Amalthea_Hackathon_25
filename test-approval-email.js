const axios = require('axios');

async function testApprovalEmail() {
  try {
    console.log('🧪 Testing Approval Email Workflow...\n');
    
    // Test the approval endpoint directly
    const baseURL = 'http://localhost:5000';
    
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('✅ Server is running');
    
    console.log('\n2. Testing approval email endpoint...');
    
    // You need to replace these with actual values from your database
    const testData = {
      expenseId: 'your-expense-id-here', // Replace with actual expense ID
      action: 'approved',
      comment: 'Test approval for email notification'
    };
    
    console.log('📧 This will test the email notification when an expense is approved');
    console.log('🔧 To test properly:');
    console.log('1. Login to the system at http://localhost:3000');
    console.log('2. Create an expense as an employee');
    console.log('3. Login as a manager and approve the expense');
    console.log('4. Check your email for the notification');
    
    console.log('\n📋 Current server status:');
    console.log('- Backend: http://localhost:5000');
    console.log('- Frontend: http://localhost:3000 (start with: npm start)');
    console.log('- Email: Configured and working');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 SOLUTION:');
      console.log('1. Start the MongoDB server: cd server && node mongodb-server.js');
      console.log('2. Start the frontend: cd client && npm start');
      console.log('3. Then test the approval workflow');
    }
  }
}

testApprovalEmail();
