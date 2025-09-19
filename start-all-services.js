// Start All Aapat Platform Services
const { spawn } = require('child_process');
const path = require('path');

class ServiceManager {
  constructor() {
    this.services = [];
    this.ports = {
      emergency: 3001,
      ambulance: 3002,
      dispatch: 3003,
      hospital: 3004,
      patient: 3005,
      communication: 3006,
      billing: 3007,
      analytics: 3008,
      frontend: 3000
    };
  }

  startService(name, command, args = [], cwd = process.cwd()) {
    console.log(`🚀 Starting ${name}...`);
    
    const service = spawn(command, args, {
      cwd: cwd,
      stdio: 'pipe',
      shell: true
    });

    service.stdout.on('data', (data) => {
      console.log(`[${name}] ${data.toString().trim()}`);
    });

    service.stderr.on('data', (data) => {
      console.log(`[${name} ERROR] ${data.toString().trim()}`);
    });

    service.on('close', (code) => {
      console.log(`[${name}] Process exited with code ${code}`);
    });

    this.services.push({ name, process: service });
    return service;
  }

  async startAllServices() {
    console.log('🚀 Starting Aapat Platform Services');
    console.log('=' .repeat(50));

    // Start microservices
    this.startService('Emergency Service', 'node', ['services/emergency-service/app.js']);
    await this.sleep(2000);

    this.startService('Ambulance Service', 'node', ['services/ambulance-service/app.js']);
    await this.sleep(2000);

    this.startService('Dispatch Service', 'node', ['services/dispatch-service/app.js']);
    await this.sleep(2000);

    this.startService('Hospital Service', 'node', ['services/hospital-service/app.js']);
    await this.sleep(2000);

    this.startService('Patient Service', 'node', ['services/patient-service/app.js']);
    await this.sleep(2000);

    this.startService('Communication Service', 'node', ['services/communication-service/app.js']);
    await this.sleep(2000);

    this.startService('Billing Service', 'node', ['services/billing-service/app.js']);
    await this.sleep(2000);

    this.startService('Analytics Service', 'node', ['services/analytics-service/app.js']);
    await this.sleep(2000);

    // Start frontend applications
    this.startService('Frontend Dashboard', 'npm', ['start'], path.join(process.cwd(), 'frontend'));
    await this.sleep(3000);

    this.startService('Public Emergency App', 'npm', ['start'], path.join(process.cwd(), 'mobile-apps/PublicEmergencyApp'));
    await this.sleep(3000);

    this.startService('Driver App', 'npm', ['start'], path.join(process.cwd(), 'mobile-apps/DriverApp'));
    await this.sleep(3000);

    console.log('\n🎉 All services started!');
    this.printAccessLinks();
  }

  printAccessLinks() {
    console.log('\n🌐 Access Your Aapat Platform:');
    console.log('=' .repeat(50));
    console.log('📊 Main Dashboard: http://localhost:3000');
    console.log('🚨 Emergency Service: http://localhost:3001');
    console.log('🚑 Ambulance Service: http://localhost:3002');
    console.log('📱 Public Emergency App: http://localhost:3001');
    console.log('👨‍⚕️ Driver App: http://localhost:3002');
    console.log('\n🔗 API Endpoints:');
    console.log('   Emergency API: http://localhost:3001/api/emergencies');
    console.log('   Ambulance API: http://localhost:3002/api/ambulances');
    console.log('   Hospital API: http://localhost:3004/api/hospitals');
    console.log('   Analytics API: http://localhost:3008/api/analytics');
    console.log('\n🧪 Test Commands:');
    console.log('   node testing/test-runner.js');
    console.log('   node testing/ai-services-test.js');
    console.log('   node test-all-links.js');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stopAllServices() {
    console.log('\n🛑 Stopping all services...');
    this.services.forEach(service => {
      service.process.kill();
      console.log(`✅ ${service.name} stopped`);
    });
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down services...');
  process.exit(0);
});

// Start services if this file is run directly
if (require.main === module) {
  const manager = new ServiceManager();
  manager.startAllServices().catch(console.error);
}

module.exports = ServiceManager;
