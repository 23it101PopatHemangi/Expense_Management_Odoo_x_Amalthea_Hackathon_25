const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Expense Management System...\n');

// Start server
const server = spawn('npm', ['run', 'server'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// Start client
const client = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  server.kill();
  client.kill();
  process.exit(0);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

client.on('error', (err) => {
  console.error('❌ Client error:', err);
});
