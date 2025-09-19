// Start Aapat Platform in Full Mock Mode
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Aapat Platform in MOCK MODE...\n');

// Set environment variables for mock mode
process.env.NODE_ENV = 'development';
process.env.MOCK_MODE = 'true';
process.env.TWILIO_MOCK = 'true';
process.env.RAZORPAY_MOCK = 'true';
process.env.MAPS_MOCK = 'true';

// Services to start
const services = [
  { name: 'Emergency Service', port: 3001, file: 'services/emergency-service/app.js' },
  { name: 'Ambulance Service', port: 3002, file: 'services/ambulance-service/app.js' },
  { name: 'Dispatch Service', port: 3003, file: 'services/dispatch-service/app.js' },
  { name: 'Hospital Service', port: 3004, file: 'services/hospital-service/app.js' },
  { name: 'Communication Service', port: 3005, file: 'services/communication-service/app.js' },
  { name: 'Billing Service', port: 3006, file: 'services/billing-service/app.js' },
  { name: 'Patient Service', port: 3007, file: 'services/patient-service/app.js' },
  { name: 'Analytics Service', port: 3008, file: 'services/analytics-service/app.js' }
];

const processes = [];

// Start each service
services.forEach(service => {
  console.log(`📡 Starting ${service.name} on port ${service.port}...`);
  
  const child = spawn('node', [service.file], {
    stdio: 'pipe',
    env: { ...process.env, PORT: service.port }
  });

  child.stdout.on('data', (data) => {
    console.log(`[${service.name}] ${data.toString().trim()}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`[${service.name} ERROR] ${data.toString().trim()}`);
  });

  child.on('close', (code) => {
    console.log(`[${service.name}] Process exited with code ${code}`);
  });

  processes.push({ name: service.name, process: child });
});

// Start main API server
console.log('🌐 Starting Main API Server on port 3000...');
const mainServer = spawn('node', ['app.js'], {
  stdio: 'pipe',
  env: { ...process.env, PORT: 3000 }
});

mainServer.stdout.on('data', (data) => {
  console.log(`[Main API] ${data.toString().trim()}`);
});

mainServer.stderr.on('data', (data) => {
  console.error(`[Main API ERROR] ${data.toString().trim()}`);
});

processes.push({ name: 'Main API', process: mainServer });

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all services...');
  
  processes.forEach(({ name, process: child }) => {
    console.log(`Stopping ${name}...`);
    child.kill('SIGTERM');
  });
  
  setTimeout(() => {
    console.log('✅ All services stopped');
    process.exit(0);
  }, 2000);
});

// Wait a bit for services to start
setTimeout(() => {
  console.log('\n🎉 All services started in MOCK MODE!');
  console.log('📊 Available Services:');
  console.log('   • Main API: http://localhost:3000');
  console.log('   • Emergency Service: http://localhost:3001');
  console.log('   • Ambulance Service: http://localhost:3002');
  console.log('   • Dispatch Service: http://localhost:3003');
  console.log('   • Hospital Service: http://localhost:3004');
  console.log('   • Communication Service: http://localhost:3005');
  console.log('   • Billing Service: http://localhost:3006');
  console.log('   • Patient Service: http://localhost:3007');
  console.log('   • Analytics Service: http://localhost:3008');
  console.log('\n🧪 Run "node test-mock-mode.js" to test all features');
  console.log('\nPress Ctrl+C to stop all services');
}, 5000);
