// AI Services Comprehensive Test Suite
const AITriageService = require('../ai-services/ai-triage-service');
const PredictiveAnalyticsService = require('../ai-services/predictive-analytics-service');
const WearableIntegrationService = require('../ai-services/wearable-integration-service');

class AIServicesTest {
  constructor() {
    this.triageService = new AITriageService();
    this.analyticsService = new PredictiveAnalyticsService();
    this.wearableService = new WearableIntegrationService();
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
    this.log(`\n🧪 Running AI Test: ${testName}`, 'cyan');
    this.log('-' .repeat(50), 'blue');
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.log(`✅ AI Test passed in ${duration}ms`, 'green');
      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration: duration,
        result: result
      });
      
      return result;
    } catch (error) {
      this.log(`❌ AI Test failed: ${error.message}`, 'red');
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration: 0,
        error: error.message
      });
      
      throw error;
    }
  }

  // Test 1: AI Triage Service
  async testAITriage() {
    this.log('🤖 Testing AI Triage Service...', 'yellow');
    
    const testCases = [
      {
        name: 'Heart Attack Emergency',
        data: {
          emergency_id: 'triage_test_001',
          emergency_type: 'Heart Attack',
          symptoms: 'severe chest pain, difficulty breathing, sweating, nausea',
          patient_info: {
            name: 'John Doe',
            age: 65,
            medical_history: ['hypertension', 'diabetes', 'heart disease'],
            blood_group: 'A+'
          },
          address: '123 Main Street, New Delhi',
          vital_signs: {
            blood_pressure: 180,
            heart_rate: 120
          }
        }
      },
      {
        name: 'Minor Injury',
        data: {
          emergency_id: 'triage_test_002',
          emergency_type: 'Minor Injury',
          symptoms: 'small cut on finger, minor bleeding',
          patient_info: {
            name: 'Jane Smith',
            age: 30,
            medical_history: [],
            blood_group: 'O+'
          },
          address: '456 Park Avenue, New Delhi'
        }
      },
      {
        name: 'Stroke Symptoms',
        data: {
          emergency_id: 'triage_test_003',
          emergency_type: 'Stroke',
          symptoms: 'facial droop, slurred speech, weakness on one side',
          patient_info: {
            name: 'Bob Johnson',
            age: 70,
            medical_history: ['hypertension', 'atrial fibrillation'],
            blood_group: 'B+'
          },
          address: '789 Oak Street, New Delhi'
        }
      }
    ];

    const results = [];
    
    for (const testCase of testCases) {
      this.log(`   Testing: ${testCase.name}`, 'blue');
      const result = await this.triageService.classifyEmergency(testCase.data);
      results.push({
        case: testCase.name,
        priority: result.data.priority_level,
        confidence: result.data.confidence_score,
        recommendations: result.data.recommendations.length
      });
      this.log(`     Priority: ${result.data.priority_name} (${result.data.priority_level})`, 'green');
      this.log(`     Confidence: ${(result.data.confidence_score * 100).toFixed(1)}%`, 'green');
    }

    // Get triage statistics
    const stats = this.triageService.getTriageStatistics();
    this.log(`   Total triages: ${stats.data.total_triages}`, 'blue');
    this.log(`   Average confidence: ${stats.data.average_confidence}`, 'blue');

    return {
      test_cases: results,
      statistics: stats.data
    };
  }

  // Test 2: Predictive Analytics Service
  async testPredictiveAnalytics() {
    this.log('📊 Testing Predictive Analytics Service...', 'yellow');
    
    // Test emergency hotspot prediction
    this.log('   Predicting emergency hotspots...', 'blue');
    const hotspotsResult = await this.analyticsService.predictEmergencyHotspots(24);
    this.log(`     Predicted emergencies: ${hotspotsResult.data.summary.total_predicted_emergencies}`, 'green');
    this.log(`     High risk hours: ${hotspotsResult.data.summary.high_risk_hours}`, 'green');
    
    // Test demand prediction for specific emergency type
    this.log('   Predicting demand for Heart Attack...', 'blue');
    const demandResult = await this.analyticsService.predictEmergencyDemand('Heart Attack', 12);
    this.log(`     Predicted Heart Attack cases: ${demandResult.data.total_predicted}`, 'green');
    
    // Get analytics statistics
    const stats = this.analyticsService.getAnalyticsStatistics();
    this.log(`   Total records: ${stats.data.total_records}`, 'blue');
    this.log(`   Success rate: ${stats.data.success_rate}%`, 'blue');
    this.log(`   Average response time: ${stats.data.average_response_time} minutes`, 'blue');

    return {
      hotspots_prediction: hotspotsResult.data.summary,
      demand_prediction: demandResult.data,
      statistics: stats.data
    };
  }

  // Test 3: Wearable Integration Service
  async testWearableIntegration() {
    this.log('⌚ Testing Wearable Integration Service...', 'yellow');
    
    // Register test devices
    const devices = [
      {
        device_id: 'watch_001',
        type: 'smartwatch',
        user_name: 'Alice Johnson',
        capabilities: ['heart_rate', 'fall_detection', 'blood_pressure'],
        emergency_contacts: ['+91-98765-11111'],
        medical_history: ['hypertension']
      },
      {
        device_id: 'fitness_band_002',
        type: 'fitness_band',
        user_name: 'Bob Smith',
        capabilities: ['heart_rate', 'temperature'],
        emergency_contacts: ['+91-98765-22222'],
        medical_history: ['diabetes']
      },
      {
        device_id: 'medical_device_003',
        type: 'medical_monitor',
        user_name: 'Carol Davis',
        capabilities: ['heart_rate', 'blood_pressure', 'oxygen_saturation', 'eeg'],
        emergency_contacts: ['+91-98765-33333'],
        medical_history: ['epilepsy', 'heart_disease']
      }
    ];

    const registeredDevices = [];
    
    for (const device of devices) {
      this.log(`   Registering device: ${device.type} for ${device.user_name}`, 'blue');
      const result = this.wearableService.registerDevice(device);
      registeredDevices.push(result.data);
    }

    // Set up event listeners for testing
    let alertCount = 0;
    let emergencyCount = 0;

    this.wearableService.on('device_alert', (data) => {
      alertCount++;
      this.log(`     Alert from ${data.user_name}: ${data.alerts[0].message}`, 'yellow');
    });

    this.wearableService.on('emergency_detected', (data) => {
      emergencyCount++;
      this.log(`     Emergency detected for ${data.user_name}: ${data.emergency_type}`, 'red');
    });

    // Wait for some monitoring data
    this.log('   Monitoring devices for 10 seconds...', 'blue');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Get device status
    const allDevices = this.wearableService.getAllDevices();
    this.log(`   Connected devices: ${allDevices.data.total_devices}`, 'green');
    this.log(`   Active devices: ${allDevices.data.active_devices}`, 'green');
    this.log(`   Alerts generated: ${alertCount}`, 'green');
    this.log(`   Emergencies detected: ${emergencyCount}`, 'green');

    // Disconnect one device
    this.log('   Disconnecting one device...', 'blue');
    this.wearableService.disconnectDevice('watch_001');

    return {
      registered_devices: registeredDevices.length,
      total_devices: allDevices.data.total_devices,
      active_devices: allDevices.data.active_devices,
      alerts_generated: alertCount,
      emergencies_detected: emergencyCount
    };
  }

  // Test 4: Integrated AI Workflow
  async testIntegratedAIWorkflow() {
    this.log('🔄 Testing Integrated AI Workflow...', 'yellow');
    
    // Simulate a complete emergency workflow using all AI services
    
    // Step 1: Wearable device detects emergency
    this.log('   Step 1: Wearable device detects emergency...', 'blue');
    const device = this.wearableService.connectedDevices.values().next().value;
    if (device) {
      // Simulate critical heart rate
      const criticalData = {
        timestamp: new Date(),
        device_id: device.id,
        user_id: device.user_id,
        heart_rate: 180, // Critical high
        blood_pressure: { systolic: 200, diastolic: 120 },
        oxygen_saturation: 85
      };
      
      this.wearableService.processSensorData(device.id, criticalData);
      this.log(`     Emergency detected by ${device.user_name}'s device`, 'red');
    }

    // Step 2: AI Triage classifies the emergency
    this.log('   Step 2: AI Triage classifies emergency...', 'blue');
    const triageResult = await this.triageService.classifyEmergency({
      emergency_id: 'integrated_test_001',
      emergency_type: 'Heart Attack',
      symptoms: 'critical heart rate, high blood pressure, low oxygen',
      patient_info: {
        name: 'Test Patient',
        age: 65,
        medical_history: ['heart disease']
      },
      address: 'Test Location, New Delhi'
    });
    this.log(`     Priority: ${triageResult.data.priority_name}`, 'green');
    this.log(`     Confidence: ${(triageResult.data.confidence_score * 100).toFixed(1)}%`, 'green');

    // Step 3: Predictive Analytics forecasts demand
    this.log('   Step 3: Predictive Analytics forecasts demand...', 'blue');
    const analyticsResult = await this.analyticsService.predictEmergencyHotspots(1);
    this.log(`     Predicted emergencies in next hour: ${analyticsResult.data.summary.total_predicted_emergencies}`, 'green');

    // Step 4: Generate recommendations
    this.log('   Step 4: Generating AI recommendations...', 'blue');
    const recommendations = triageResult.data.recommendations;
    this.log(`     Recommendations generated: ${recommendations.length}`, 'green');
    recommendations.forEach((rec, index) => {
      this.log(`       ${index + 1}. ${rec}`, 'blue');
    });

    return {
      triage_priority: triageResult.data.priority_name,
      triage_confidence: triageResult.data.confidence_score,
      predicted_emergencies: analyticsResult.data.summary.total_predicted_emergencies,
      recommendations_count: recommendations.length
    };
  }

  // Test 5: AI Performance and Accuracy
  async testAIPerformance() {
    this.log('⚡ Testing AI Performance and Accuracy...', 'yellow');
    
    const startTime = Date.now();
    const promises = [];
    
    // Test concurrent AI operations
    for (let i = 0; i < 10; i++) {
      promises.push(this.triageService.classifyEmergency({
        emergency_id: `perf_test_${i}`,
        emergency_type: 'Test Emergency',
        symptoms: 'test symptoms',
        patient_info: { name: `Test Patient ${i}`, age: 30 }
      }));
    }
    
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    const successCount = results.filter(r => r.success).length;
    const avgConfidence = results.reduce((sum, r) => sum + r.data.confidence_score, 0) / results.length;
    
    this.log(`   Concurrent AI operations: ${successCount}/10 successful`, successCount === 10 ? 'green' : 'yellow');
    this.log(`   Total time: ${duration}ms`, 'blue');
    this.log(`   Average time per operation: ${Math.round(duration / 10)}ms`, 'blue');
    this.log(`   Average confidence: ${(avgConfidence * 100).toFixed(1)}%`, 'blue');

    return {
      concurrent_operations: 10,
      successful_operations: successCount,
      total_time: duration,
      average_time: Math.round(duration / 10),
      average_confidence: avgConfidence
    };
  }

  // Run all AI tests
  async runAllAITests() {
    this.log('🚀 Starting AI Services Comprehensive Test Suite', 'bright');
    this.log('=' .repeat(80), 'cyan');
    
    const startTime = Date.now();
    
    try {
      // Run individual AI tests
      await this.runTest('AI Triage Service', () => this.testAITriage());
      await this.runTest('Predictive Analytics Service', () => this.testPredictiveAnalytics());
      await this.runTest('Wearable Integration Service', () => this.testWearableIntegration());
      await this.runTest('Integrated AI Workflow', () => this.testIntegratedAIWorkflow());
      await this.runTest('AI Performance and Accuracy', () => this.testAIPerformance());
      
      // Generate summary
      this.generateAITestSummary();
      
    } catch (error) {
      this.log(`❌ AI Test suite failed: ${error.message}`, 'red');
    }
    
    const totalDuration = Date.now() - startTime;
    this.log(`\n🎉 All AI tests completed in ${totalDuration}ms`, 'green');
  }

  // Generate AI test summary
  generateAITestSummary() {
    this.log('\n📊 AI Test Results Summary', 'bright');
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
    
    this.log(`\n📈 AI Test Statistics:`, 'blue');
    this.log(`   Total Tests: ${this.testResults.length}`, 'blue');
    this.log(`   Passed: ${passed}`, 'green');
    this.log(`   Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    this.log(`   Total Duration: ${totalDuration}ms`, 'blue');
    this.log(`   Average Duration: ${Math.round(totalDuration / this.testResults.length)}ms`, 'blue');
    this.log(`   Success Rate: ${Math.round((passed / this.testResults.length) * 100)}%`, 
      passed === this.testResults.length ? 'green' : 'yellow');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  const aiTest = new AIServicesTest();
  aiTest.runAllAITests().catch(console.error);
}

module.exports = AIServicesTest;
