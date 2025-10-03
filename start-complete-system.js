const { spawn } = require('child_process');
const axios = require('axios');

console.log('🚀 Starting Complete Aapat System');
console.log('=' + '='.repeat(60));

const services = [
  {
    name: 'Hospital Matching Service',
    command: 'node',
    args: ['hospital-matching-service.js'],
    port: 3013,
    checkUrl: 'http://localhost:3013/health'
  },
  {
    name: 'Driver Matching Service',
    command: 'node',
    args: ['uber-style-driver-matching-service.js'],
    port: 3012,
    checkUrl: 'http://localhost:3012/health'
  },
  {
    name: 'Dashboard Server',
    command: 'node',
    args: ['serve-dashboard-simple.js'],
    port: 3000,
    checkUrl: 'http://localhost:3000'
  }
];

const processes = [];

function startService(service) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 Starting ${service.name}...`);
    
    const proc = spawn(service.command, service.args, {
      stdio: 'pipe',
      shell: true
    });

    proc.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`   [${service.name}] ${output}`);
      }
    });

    proc.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error && !error.includes('ExperimentalWarning')) {
        console.log(`   [${service.name} ERROR] ${error}`);
      }
    });

    proc.on('error', (error) => {
      console.error(`❌ Failed to start ${service.name}:`, error.message);
      reject(error);
    });

    processes.push({ name: service.name, process: proc });

    // Wait a bit for the service to start
    setTimeout(async () => {
      try {
        await axios.get(service.checkUrl, { timeout: 2000 });
        console.log(`✅ ${service.name} is running on port ${service.port}`);
        resolve();
      } catch (error) {
        console.log(`⏳ ${service.name} starting on port ${service.port}...`);
        resolve(); // Continue anyway
      }
    }, 2000);
  });
}

async function startAll() {
  try {
    // Start services sequentially
    for (const service of services) {
      await startService(service);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All Services Started!');
    console.log('='.repeat(60));
    console.log('\n📊 Access Points:');
    console.log('   🌐 Dashboard:          http://localhost:3000');
    console.log('   🏥 Hospital Service:   http://localhost:3013/health');
    console.log('   🚑 Driver Service:     http://localhost:3012/health');
    console.log('\n📚 Available Features:');
    console.log('   • Uber-style ambulance booking');
    console.log('   • Intelligent hospital matching');
    console.log('   • Driver fleet management');
    console.log('   • Real-time emergency dashboard');
    console.log('\n💡 Testing:');
    console.log('   • Open http://localhost:3000 in your browser');
    console.log('   • Click "Create Test Emergency"');
    console.log('   • View hospital recommendations in emergency details');
    console.log('   • Or run: node test-hospital-integration.js');
    console.log('\n🛑 Press Ctrl+C to stop all services');

  } catch (error) {
    console.error('\n❌ Failed to start system:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down services...');
  processes.forEach(({ name, process }) => {
    console.log(`   Stopping ${name}...`);
    process.kill();
  });
  console.log('✅ All services stopped');
  process.exit(0);
});

startAll();

