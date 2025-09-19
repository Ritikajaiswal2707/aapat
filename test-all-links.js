// Test All Working Links and Services
const axios = require('axios');

class LinkTester {
  constructor() {
    this.results = [];
    this.baseUrls = {
      emergency: 'http://localhost:3001',
      ambulance: 'http://localhost:3002', 
      dispatch: 'http://localhost:3003',
      hospital: 'http://localhost:3004',
      patient: 'http://localhost:3005',
      communication: 'http://localhost:3006',
      billing: 'http://localhost:3007',
      analytics: 'http://localhost:3008',
      frontend: 'http://localhost:3000',
      publicApp: 'http://localhost:3001',
      driverApp: 'http://localhost:3002'
    };
  }

  async testUrl(name, url, expectedStatus = 200) {
    try {
      console.log(`🔍 Testing ${name}: ${url}`);
      const response = await axios.get(url, { timeout: 5000 });
      const success = response.status === expectedStatus;
      
      this.results.push({
        name,
        url,
        status: response.status,
        success,
        responseTime: response.headers['x-response-time'] || 'N/A'
      });
      
      console.log(`   ${success ? '✅' : '❌'} Status: ${response.status} (Expected: ${expectedStatus})`);
      return success;
    } catch (error) {
      this.results.push({
        name,
        url,
        status: 'ERROR',
        success: false,
        error: error.message
      });
      
      console.log(`   ❌ Error: ${error.message}`);
      return false;
    }
  }

  async testAllServices() {
    console.log('🚀 Testing All Aapat Platform Services');
    console.log('=' .repeat(60));
    
    const tests = [
      { name: 'Emergency Service', url: this.baseUrls.emergency + '/health' },
      { name: 'Ambulance Service', url: this.baseUrls.ambulance + '/health' },
      { name: 'Dispatch Service', url: this.baseUrls.dispatch + '/health' },
      { name: 'Hospital Service', url: this.baseUrls.hospital + '/health' },
      { name: 'Patient Service', url: this.baseUrls.patient + '/health' },
      { name: 'Communication Service', url: this.baseUrls.communication + '/health' },
      { name: 'Billing Service', url: this.baseUrls.billing + '/health' },
      { name: 'Analytics Service', url: this.baseUrls.analytics + '/health' },
      { name: 'Frontend Dashboard', url: this.baseUrls.frontend },
      { name: 'Public Emergency App', url: this.baseUrls.publicApp },
      { name: 'Driver App', url: this.baseUrls.driverApp }
    ];

    let successCount = 0;
    
    for (const test of tests) {
      const success = await this.testUrl(test.name, test.url);
      if (success) successCount++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    }

    this.generateReport(successCount, tests.length);
  }

  generateReport(successCount, totalTests) {
    console.log('\n📊 Test Results Summary');
    console.log('=' .repeat(60));
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${index + 1}. ${result.name}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Status: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });

    console.log(`📈 Overall Statistics:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${totalTests - successCount}`);
    console.log(`   Success Rate: ${Math.round((successCount / totalTests) * 100)}%`);

    if (successCount === totalTests) {
      console.log('\n🎉 All services are running successfully!');
      console.log('\n🌐 Working Links:');
      console.log('   📊 Main Dashboard: http://localhost:3000');
      console.log('   🚨 Emergency Service: http://localhost:3001');
      console.log('   🚑 Ambulance Service: http://localhost:3002');
      console.log('   📱 Public App: http://localhost:3001');
      console.log('   👨‍⚕️ Driver App: http://localhost:3002');
    } else {
      console.log('\n⚠️ Some services are not running. Please check the logs.');
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new LinkTester();
  tester.testAllServices().catch(console.error);
}

module.exports = LinkTester;
