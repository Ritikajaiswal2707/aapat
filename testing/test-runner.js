// Comprehensive Test Runner for Aapat Platform
const DemoScenarios = require('./demo-scenarios');
const RealTimeSimulator = require('./real-time-simulator');
const EnhancedSMSService = require('../mock-services/enhanced-sms-service');
const EnhancedPaymentService = require('../mock-services/enhanced-payment-service');
const EnhancedMapsService = require('../mock-services/enhanced-maps-service');

class TestRunner {
  constructor() {
    this.demoScenarios = new DemoScenarios();
    this.simulator = new RealTimeSimulator();
    this.smsService = new EnhancedSMSService();
    this.paymentService = new EnhancedPaymentService();
    this.mapsService = new EnhancedMapsService();
    this.testResults = [];
  }

  // Colors for console output
  log(message, color = 'reset') {
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m'
    };
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async runTest(testName, testFunction) {
    this.log(`\n🧪 Running Test: ${testName}`, 'cyan');
    this.log('-' .repeat(50), 'blue');
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.log(`✅ Test passed in ${duration}ms`, 'green');
      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration: duration,
        result: result
      });
      
      return result;
    } catch (error) {
      this.log(`❌ Test failed: ${error.message}`, 'red');
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration: 0,
        error: error.message
      });
      
      throw error;
    }
  }

  // Test 1: Mock Services Functionality
  async testMockServices() {
    this.log('🔧 Testing Mock Services...', 'yellow');
    
    // Test SMS Service
    const smsTest = await this.smsService.testSMS();
    this.log(`   SMS Service: ${smsTest.success ? 'PASS' : 'FAIL'}`, smsTest.success ? 'green' : 'red');
    
    // Test Payment Service
    const paymentTest = await this.paymentService.testPayment();
    this.log(`   Payment Service: ${paymentTest.success ? 'PASS' : 'FAIL'}`, paymentTest.success ? 'green' : 'red');
    
    // Test Maps Service
    const mapsTest = await this.mapsService.testMaps();
    this.log(`   Maps Service: ${mapsTest.success ? 'PASS' : 'FAIL'}`, mapsTest.success ? 'green' : 'red');
    
    return {
      sms: smsTest.success,
      payment: paymentTest.success,
      maps: mapsTest.success
    };
  }

  // Test 2: Data Generation and Storage
  async testDataGeneration() {
    this.log('📊 Testing Data Generation...', 'yellow');
    
    // Test SMS data storage
    const smsHistory = this.smsService.getSMSHistory();
    this.log(`   SMS History: ${smsHistory.total} messages`, 'blue');
    
    // Test Payment data storage
    const paymentHistory = this.paymentService.getPaymentHistory();
    this.log(`   Payment History: ${paymentHistory.total} orders`, 'blue');
    
    // Test Maps data storage
    const mapsHistory = this.mapsService.getLocationHistory();
    this.log(`   Maps History: ${mapsHistory.total} requests`, 'blue');
    
    return {
      sms_messages: smsHistory.total,
      payment_orders: paymentHistory.total,
      maps_requests: mapsHistory.total
    };
  }

  // Test 3: Emergency Response Workflow
  async testEmergencyWorkflow() {
    this.log('🚨 Testing Emergency Response Workflow...', 'yellow');
    
    const emergencyData = {
      emergency_id: 'test_emergency_001',
      emergency_type: 'Heart Attack',
      priority_level: 1,
      patient_info: {
        name: 'Test Patient',
        age: 35,
        blood_group: 'B+',
        allergies: ['Penicillin'],
        medical_history: ['Diabetes']
      },
      address: 'Test Location, New Delhi',
      lat: 28.6139,
      lng: 77.2090,
      emergency_contacts: [
        { name: 'Emergency Contact', phone: '+91-98765-12345' }
      ]
    };

    // Step 1: Send emergency SMS
    const smsResult = await this.smsService.sendEmergencySMS(emergencyData);
    this.log(`   Emergency SMS: ${smsResult.success ? 'SENT' : 'FAILED'}`, smsResult.success ? 'green' : 'red');
    
    // Step 2: Create payment order
    const paymentOrder = await this.paymentService.createPaymentOrder(emergencyData);
    this.log(`   Payment Order: ${paymentOrder.success ? 'CREATED' : 'FAILED'}`, paymentOrder.success ? 'green' : 'red');
    
    // Step 3: Process payment
    const paymentResult = await this.paymentService.processPayment({
      order_id: paymentOrder.data.order_id,
      payment_method: 'UPI',
      amount: paymentOrder.data.amount,
      payment_reference: 'TEST_' + Date.now()
    });
    this.log(`   Payment Processing: ${paymentResult.success ? 'SUCCESS' : 'FAILED'}`, paymentResult.success ? 'green' : 'red');
    
    // Step 4: Get directions
    const directions = await this.mapsService.getDirections(
      { lat: emergencyData.lat, lng: emergencyData.lng },
      { lat: 28.5679, lng: 77.2110 } // AIIMS
    );
    this.log(`   Directions: ${directions.success ? 'CALCULATED' : 'FAILED'}`, directions.success ? 'green' : 'red');
    
    // Step 5: Find hospitals
    const hospitals = await this.mapsService.findNearbyHospitals(
      { lat: emergencyData.lat, lng: emergencyData.lng }
    );
    this.log(`   Hospital Search: ${hospitals.success ? 'SUCCESS' : 'FAILED'}`, hospitals.success ? 'green' : 'red');
    
    return {
      sms_sent: smsResult.success,
      payment_created: paymentOrder.success,
      payment_processed: paymentResult.success,
      directions_calculated: directions.success,
      hospitals_found: hospitals.success,
      total_hospitals: hospitals.data.length
    };
  }

  // Test 4: Real-time Simulation
  async testRealTimeSimulation() {
    this.log('⏱️ Testing Real-time Simulation...', 'yellow');
    
    // Start simulation
    this.simulator.start();
    this.log('   Simulation started', 'blue');
    
    // Wait a bit for simulation to run
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get ambulance status
    const ambulances = this.simulator.getAllAmbulancesStatus();
    this.log(`   Ambulances tracked: ${ambulances.length}`, 'blue');
    
    // Simulate emergency
    const emergency = this.simulator.simulateRandomEmergency();
    this.log(`   Emergency simulated: ${emergency.type}`, 'blue');
    
    // Auto-dispatch ambulance
    const dispatch = this.simulator.autoDispatchNearestAmbulance(
      emergency.id, 
      emergency.location
    );
    this.log(`   Ambulance dispatch: ${dispatch.success ? 'SUCCESS' : 'FAILED'}`, dispatch.success ? 'green' : 'red');
    
    // Get statistics
    const stats = this.simulator.getSimulationStatistics();
    this.log(`   Available ambulances: ${stats.available_ambulances}`, 'blue');
    this.log(`   Active emergencies: ${stats.active_emergencies}`, 'blue');
    
    // Stop simulation
    this.simulator.stop();
    this.log('   Simulation stopped', 'blue');
    
    return {
      simulation_started: true,
      ambulances_tracked: ambulances.length,
      emergency_simulated: true,
      dispatch_successful: dispatch.success,
      available_ambulances: stats.available_ambulances
    };
  }

  // Test 5: Demo Scenarios
  async testDemoScenarios() {
    this.log('🎬 Testing Demo Scenarios...', 'yellow');
    
    // Run a subset of demo scenarios
    const heartAttackResult = await this.demoScenarios.heartAttackEmergency();
    this.log(`   Heart Attack Scenario: ${heartAttackResult.emergency_id}`, 'blue');
    
    const paymentResult = await this.demoScenarios.paymentProcessingWorkflow();
    this.log(`   Payment Scenario: ${paymentResult.payment_successful ? 'SUCCESS' : 'FAILED'}`, paymentResult.payment_successful ? 'green' : 'red');
    
    return {
      heart_attack_scenario: heartAttackResult,
      payment_scenario: paymentResult
    };
  }

  // Test 6: Performance Testing
  async testPerformance() {
    this.log('⚡ Testing Performance...', 'yellow');
    
    const startTime = Date.now();
    const promises = [];
    
    // Create multiple concurrent requests
    for (let i = 0; i < 10; i++) {
      promises.push(this.smsService.sendEmergencySMS({
        emergency_id: `perf_test_${i}`,
        emergency_type: 'Test Emergency',
        patient_info: { name: `Test Patient ${i}` },
        address: 'Test Location',
        emergency_contacts: ['+91-98765-0000' + i]
      }));
    }
    
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    const successCount = results.filter(r => r.success).length;
    this.log(`   Concurrent SMS requests: ${successCount}/10 successful`, successCount === 10 ? 'green' : 'yellow');
    this.log(`   Total time: ${duration}ms`, 'blue');
    this.log(`   Average time per request: ${Math.round(duration / 10)}ms`, 'blue');
    
    return {
      concurrent_requests: 10,
      successful_requests: successCount,
      total_time: duration,
      average_time: Math.round(duration / 10)
    };
  }

  // Test 7: Data Persistence
  async testDataPersistence() {
    this.log('💾 Testing Data Persistence...', 'yellow');
    
    // Create some data
    const emergencyData = {
      emergency_id: 'persistence_test_001',
      emergency_type: 'Test Emergency',
      patient_info: { name: 'Persistence Test Patient' },
      address: 'Test Location',
      emergency_contacts: ['+91-98765-99999']
    };
    
    // Send SMS
    await this.smsService.sendEmergencySMS(emergencyData);
    
    // Create payment
    const paymentOrder = await this.paymentService.createPaymentOrder(emergencyData);
    await this.paymentService.processPayment({
      order_id: paymentOrder.data.order_id,
      payment_method: 'CARD',
      amount: paymentOrder.data.amount,
      payment_reference: 'PERSISTENCE_TEST'
    });
    
    // Get data back
    const smsHistory = this.smsService.getSMSHistory();
    const paymentHistory = this.paymentService.getPaymentHistory();
    
    this.log(`   SMS data persisted: ${smsHistory.total} messages`, 'blue');
    this.log(`   Payment data persisted: ${paymentHistory.total} orders`, 'blue');
    
    return {
      sms_persisted: smsHistory.total > 0,
      payment_persisted: paymentHistory.total > 0
    };
  }

  // Run all tests
  async runAllTests() {
    this.log('🚀 Starting Comprehensive Aapat Platform Tests', 'bright');
    this.log('=' .repeat(80), 'cyan');
    
    const startTime = Date.now();
    
    try {
      // Run individual tests
      await this.runTest('Mock Services Functionality', () => this.testMockServices());
      await this.runTest('Data Generation and Storage', () => this.testDataGeneration());
      await this.runTest('Emergency Response Workflow', () => this.testEmergencyWorkflow());
      await this.runTest('Real-time Simulation', () => this.testRealTimeSimulation());
      await this.runTest('Demo Scenarios', () => this.testDemoScenarios());
      await this.runTest('Performance Testing', () => this.testPerformance());
      await this.runTest('Data Persistence', () => this.testDataPersistence());
      
      // Generate summary
      this.generateTestSummary();
      
    } catch (error) {
      this.log(`❌ Test suite failed: ${error.message}`, 'red');
    }
    
    const totalDuration = Date.now() - startTime;
    this.log(`\n🎉 All tests completed in ${totalDuration}ms`, 'green');
  }

  // Generate test summary
  generateTestSummary() {
    this.log('\n📊 Test Results Summary', 'bright');
    this.log('=' .repeat(60), 'cyan');
    
    const passed = this.testResults.filter(t => t.status === 'PASSED').length;
    const failed = this.testResults.filter(t => t.status === 'FAILED').length;
    const totalDuration = this.testResults.reduce((sum, t) => sum + t.duration, 0);
    
    this.testResults.forEach((test, index) => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      const duration = test.duration > 0 ? `${test.duration}ms` : 'N/A';
      this.log(`${status} ${index + 1}. ${test.name} (${duration})`, 
        test.status === 'PASSED' ? 'green' : 'red');
    });
    
    this.log(`\n📈 Overall Statistics:`, 'blue');
    this.log(`   Total Tests: ${this.testResults.length}`, 'blue');
    this.log(`   Passed: ${passed}`, 'green');
    this.log(`   Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    this.log(`   Total Duration: ${totalDuration}ms`, 'blue');
    this.log(`   Average Duration: ${Math.round(totalDuration / this.testResults.length)}ms`, 'blue');
    this.log(`   Success Rate: ${Math.round((passed / this.testResults.length) * 100)}%`, 
      passed === this.testResults.length ? 'green' : 'yellow');
  }

  // Get service statistics
  async getServiceStatistics() {
    this.log('\n📊 Service Statistics', 'bright');
    this.log('=' .repeat(60), 'cyan');
    
    // SMS Statistics
    const smsStats = this.smsService.getSMSStatistics();
    this.log(`📱 SMS Service:`, 'blue');
    this.log(`   Total SMS: ${smsStats.data.total_sms}`, 'blue');
    this.log(`   Recent 24h: ${smsStats.data.recent_24h}`, 'blue');
    this.log(`   By Type: ${JSON.stringify(smsStats.data.by_type)}`, 'blue');
    
    // Payment Statistics
    const paymentStats = this.paymentService.getPaymentStatistics();
    this.log(`\n💳 Payment Service:`, 'blue');
    this.log(`   Total Orders: ${paymentStats.data.total_orders}`, 'blue');
    this.log(`   Total Amount: ₹${paymentStats.data.total_amount}`, 'blue');
    this.log(`   Success Rate: ${paymentStats.data.success_rate}%`, 'blue');
    this.log(`   Recent 24h: ${paymentStats.data.recent_24h}`, 'blue');
    
    // Maps Statistics
    const mapsStats = this.mapsService.getMapsStatistics();
    this.log(`\n🗺️ Maps Service:`, 'blue');
    this.log(`   Total Requests: ${mapsStats.data.total_requests}`, 'blue');
    this.log(`   Total Distance: ${mapsStats.data.total_distance}km`, 'blue');
    this.log(`   Average Distance: ${mapsStats.data.average_distance}km`, 'blue');
    this.log(`   Recent 24h: ${mapsStats.data.recent_24h}`, 'blue');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  const testRunner = new TestRunner();
  testRunner.runAllTests()
    .then(() => testRunner.getServiceStatistics())
    .catch(console.error);
}

module.exports = TestRunner;
