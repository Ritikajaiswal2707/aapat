// Demo Scenarios for Aapat Platform Testing
const EnhancedSMSService = require('../mock-services/enhanced-sms-service');
const EnhancedPaymentService = require('../mock-services/enhanced-payment-service');
const EnhancedMapsService = require('../mock-services/enhanced-maps-service');
const { mockData } = require('../scripts/generate-mock-data');

class DemoScenarios {
  constructor() {
    this.smsService = new EnhancedSMSService();
    this.paymentService = new EnhancedPaymentService();
    this.mapsService = new EnhancedMapsService();
    this.scenarios = [];
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

  async runScenario(scenarioName, scenarioFunction) {
    this.log(`\n🎬 Running Scenario: ${scenarioName}`, 'cyan');
    this.log('=' .repeat(60), 'blue');
    
    try {
      const startTime = Date.now();
      const result = await scenarioFunction();
      const duration = Date.now() - startTime;
      
      this.log(`✅ Scenario completed in ${duration}ms`, 'green');
      this.scenarios.push({
        name: scenarioName,
        status: 'SUCCESS',
        duration: duration,
        result: result
      });
      
      return result;
    } catch (error) {
      this.log(`❌ Scenario failed: ${error.message}`, 'red');
      this.scenarios.push({
        name: scenarioName,
        status: 'FAILED',
        duration: 0,
        error: error.message
      });
      
      throw error;
    }
  }

  // Scenario 1: Heart Attack Emergency
  async heartAttackEmergency() {
    this.log('🚨 Scenario 1: Heart Attack Emergency Response', 'red');
    
    const emergencyData = {
      emergency_id: 'emergency_001',
      emergency_type: 'Heart Attack',
      priority_level: 1,
      patient_info: {
        name: 'Priya Sharma',
        age: 35,
        blood_group: 'B+',
        allergies: ['Penicillin'],
        medical_history: ['Diabetes Type 2']
      },
      address: 'Connaught Place, New Delhi',
      lat: 28.6304,
      lng: 77.2177,
      emergency_contacts: [
        { name: 'Rahul Sharma', phone: '+91-98765-12346', relation: 'Husband' },
        { name: 'Dr. Mehta', phone: '+91-98765-12347', relation: 'Family Doctor' }
      ],
      estimated_arrival: '8 minutes',
      driver_name: 'Rajesh Kumar',
      ambulance_plate: 'DL-01-AB-1234'
    };

    // Step 1: Send emergency SMS
    this.log('📱 Step 1: Sending emergency SMS alerts...', 'yellow');
    const smsResult = await this.smsService.sendEmergencySMS(emergencyData);
    this.log(`   SMS sent to ${smsResult.total_sent} contacts`, 'blue');

    // Step 2: Send driver assignment SMS
    this.log('🚑 Step 2: Sending driver assignment SMS...', 'yellow');
    const driverData = {
      id: 'drv_001',
      name: 'Rajesh Kumar',
      phone: '+91-98765-43210'
    };
    const driverSMS = await this.smsService.sendDriverAssignmentSMS(driverData, emergencyData);
    this.log(`   Driver SMS sent: ${driverSMS.sid}`, 'blue');

    // Step 3: Create payment order
    this.log('💳 Step 3: Creating payment order...', 'yellow');
    const paymentOrder = await this.paymentService.createPaymentOrder(emergencyData);
    this.log(`   Payment order created: ₹${paymentOrder.data.amount}`, 'blue');

    // Step 4: Get directions to hospital
    this.log('🗺️ Step 4: Getting directions to nearest hospital...', 'yellow');
    const origin = { lat: emergencyData.lat, lng: emergencyData.lng };
    const destination = { lat: 28.5679, lng: 77.2110 }; // AIIMS
    const directions = await this.mapsService.getDirections(origin, destination);
    this.log(`   Route: ${directions.data.distance}, ETA: ${directions.data.duration}`, 'blue');

    // Step 5: Find nearby hospitals
    this.log('🏥 Step 5: Finding nearby hospitals...', 'yellow');
    const hospitals = await this.mapsService.findNearbyHospitals(origin, 5000);
    this.log(`   Found ${hospitals.data.length} hospitals within 5km`, 'blue');

    return {
      emergency_id: emergencyData.emergency_id,
      sms_sent: smsResult.total_sent,
      payment_amount: paymentOrder.data.amount,
      route_distance: directions.data.distance,
      hospitals_found: hospitals.data.length
    };
  }

  // Scenario 2: Road Accident Response
  async roadAccidentResponse() {
    this.log('🚗 Scenario 2: Road Accident Response', 'yellow');
    
    const emergencyData = {
      emergency_id: 'emergency_002',
      emergency_type: 'Road Accident',
      priority_level: 2,
      patient_info: {
        name: 'Amit Kumar',
        age: 45,
        blood_group: 'O+',
        allergies: [],
        medical_history: ['Hypertension']
      },
      address: 'India Gate, New Delhi',
      lat: 28.6129,
      lng: 77.2295,
      emergency_contacts: [
        { name: 'Sunita Kumar', phone: '+91-98765-23457', relation: 'Wife' }
      ],
      estimated_arrival: '12 minutes',
      driver_name: 'Suresh Singh',
      ambulance_plate: 'DL-01-CD-5678',
      equipment_level: 'INTERMEDIATE'
    };

    // Step 1: Emergency SMS
    this.log('📱 Step 1: Sending emergency SMS...', 'yellow');
    const smsResult = await this.smsService.sendEmergencySMS(emergencyData);
    this.log(`   SMS sent to ${smsResult.total_sent} contacts`, 'blue');

    // Step 2: Driver assignment
    this.log('🚑 Step 2: Assigning driver...', 'yellow');
    const driverData = {
      id: 'drv_002',
      name: 'Suresh Singh',
      phone: '+91-98765-43211'
    };
    const driverSMS = await this.smsService.sendDriverAssignmentSMS(driverData, emergencyData);
    this.log(`   Driver assigned: ${driverData.name}`, 'blue');

    // Step 3: Payment processing
    this.log('💳 Step 3: Processing payment...', 'yellow');
    const paymentOrder = await this.paymentService.createPaymentOrder(emergencyData);
    const paymentResult = await this.paymentService.processPayment({
      order_id: paymentOrder.data.order_id,
      payment_method: 'UPI',
      amount: paymentOrder.data.amount,
      payment_reference: 'UPI_' + Date.now()
    });
    this.log(`   Payment ${paymentResult.success ? 'successful' : 'failed'}: ₹${paymentOrder.data.amount}`, 'blue');

    // Step 4: Status updates
    this.log('📱 Step 4: Sending status updates...', 'yellow');
    const statusUpdate = await this.smsService.sendStatusUpdateSMS(
      emergencyData.patient_info.name,
      'Ambulance Dispatched',
      'Your ambulance is on the way. Driver: ' + driverData.name
    );
    this.log(`   Status update sent: ${statusUpdate.sid}`, 'blue');

    return {
      emergency_id: emergencyData.emergency_id,
      payment_status: paymentResult.success ? 'PAID' : 'FAILED',
      driver_assigned: driverData.name,
      status_updates: 1
    };
  }

  // Scenario 3: Multiple Emergency Handling
  async multipleEmergencyHandling() {
    this.log('🚨 Scenario 3: Multiple Emergency Handling', 'magenta');
    
    const emergencies = [
      {
        id: 'emergency_003',
        type: 'Breathing Problems',
        priority: 2,
        patient: 'Sneha Patel',
        location: { lat: 28.5700, lng: 77.2400 }
      },
      {
        id: 'emergency_004',
        type: 'Seizure',
        priority: 2,
        patient: 'Rajesh Verma',
        location: { lat: 28.5200, lng: 77.1800 }
      },
      {
        id: 'emergency_005',
        type: 'High Fever',
        priority: 4,
        patient: 'Anita Desai',
        location: { lat: 28.5400, lng: 77.2000 }
      }
    ];

    const results = [];

    for (let i = 0; i < emergencies.length; i++) {
      const emergency = emergencies[i];
      this.log(`\n   🚨 Processing Emergency ${i + 1}: ${emergency.type}`, 'yellow');
      
      const emergencyData = {
        emergency_id: emergency.id,
        emergency_type: emergency.type,
        priority_level: emergency.priority,
        patient_info: { name: emergency.patient },
        address: 'Test Location',
        lat: emergency.location.lat,
        lng: emergency.location.lng,
        emergency_contacts: [{ name: 'Emergency Contact', phone: '+91-98765-0000' + i }]
      };

      // Send SMS
      const smsResult = await this.smsService.sendEmergencySMS(emergencyData);
      
      // Create payment
      const paymentOrder = await this.paymentService.createPaymentOrder(emergencyData);
      
      // Find hospitals
      const hospitals = await this.mapsService.findNearbyHospitals(emergency.location);
      
      results.push({
        emergency_id: emergency.id,
        type: emergency.type,
        priority: emergency.priority,
        sms_sent: smsResult.total_sent,
        payment_amount: paymentOrder.data.amount,
        hospitals_found: hospitals.data.length
      });

      this.log(`     ✅ Emergency ${i + 1} processed`, 'green');
    }

    return {
      total_emergencies: emergencies.length,
      results: results
    };
  }

  // Scenario 4: Hospital Bed Management
  async hospitalBedManagement() {
    this.log('🏥 Scenario 4: Hospital Bed Management', 'blue');
    
    // Simulate checking bed availability
    this.log('📊 Step 1: Checking bed availability...', 'yellow');
    const origin = { lat: 28.6139, lng: 77.2090 };
    const hospitals = await this.mapsService.findNearbyHospitals(origin, 10000);
    
    let totalBeds = 0;
    let availableBeds = 0;
    
    hospitals.data.forEach(hospital => {
      totalBeds += hospital.total_beds;
      availableBeds += hospital.available_beds;
      this.log(`   ${hospital.name}: ${hospital.available_beds}/${hospital.total_beds} beds available`, 'blue');
    });

    // Simulate patient admission
    this.log('🏥 Step 2: Simulating patient admission...', 'yellow');
    const selectedHospital = hospitals.data[0]; // Select first hospital
    this.log(`   Patient admitted to: ${selectedHospital.name}`, 'blue');
    this.log(`   Bed type: General Ward`, 'blue');
    this.log(`   ETA: ${selectedHospital.eta_minutes} minutes`, 'blue');

    // Send hospital notification
    this.log('📱 Step 3: Sending hospital notification...', 'yellow');
    const hospitalNotification = await this.smsService.sendHospitalNotificationSMS(
      selectedHospital,
      {
        emergency_id: 'emergency_006',
        patient_info: { name: 'Test Patient' },
        emergency_type: 'Heart Attack',
        priority_level: 1,
        estimated_arrival: selectedHospital.eta_minutes + ' minutes'
      }
    );
    this.log(`   Hospital notification sent: ${hospitalNotification.sid}`, 'blue');

    return {
      hospitals_checked: hospitals.data.length,
      total_beds: totalBeds,
      available_beds: availableBeds,
      selected_hospital: selectedHospital.name,
      notification_sent: true
    };
  }

  // Scenario 5: Payment Processing Workflow
  async paymentProcessingWorkflow() {
    this.log('💳 Scenario 5: Payment Processing Workflow', 'green');
    
    const emergencyData = {
      emergency_id: 'emergency_007',
      emergency_type: 'Severe Pain',
      priority_level: 3,
      patient_info: { name: 'Test Patient' },
      equipment_level: 'ADVANCED'
    };

    // Step 1: Create payment order
    this.log('💳 Step 1: Creating payment order...', 'yellow');
    const paymentOrder = await this.paymentService.createPaymentOrder(emergencyData);
    this.log(`   Order created: ${paymentOrder.data.order_id}`, 'blue');
    this.log(`   Amount: ₹${paymentOrder.data.amount}`, 'blue');

    // Step 2: Process UPI payment
    this.log('📱 Step 2: Processing UPI payment...', 'yellow');
    const upiPayment = await this.paymentService.processPayment({
      order_id: paymentOrder.data.order_id,
      payment_method: 'UPI',
      amount: paymentOrder.data.amount,
      payment_reference: 'UPI_' + Date.now()
    });
    this.log(`   UPI Payment: ${upiPayment.success ? 'SUCCESS' : 'FAILED'}`, upiPayment.success ? 'green' : 'red');

    // Step 3: Process card payment (if UPI failed)
    if (!upiPayment.success) {
      this.log('💳 Step 3: Processing card payment...', 'yellow');
      const cardPayment = await this.paymentService.processPayment({
        order_id: paymentOrder.data.order_id,
        payment_method: 'CARD',
        amount: paymentOrder.data.amount,
        payment_reference: 'CARD_' + Date.now()
      });
      this.log(`   Card Payment: ${cardPayment.success ? 'SUCCESS' : 'FAILED'}`, cardPayment.success ? 'green' : 'red');
    }

    // Step 4: Send payment reminder
    this.log('📱 Step 4: Sending payment reminder...', 'yellow');
    const reminder = await this.smsService.sendPaymentReminderSMS(
      '+91-98765-12345',
      {
        amount: paymentOrder.data.amount,
        emergency_type: emergencyData.emergency_type,
        payment_method: 'UPI',
        payment_id: paymentOrder.data.order_id
      }
    );
    this.log(`   Payment reminder sent: ${reminder.sid}`, 'blue');

    return {
      order_id: paymentOrder.data.order_id,
      amount: paymentOrder.data.amount,
      payment_successful: upiPayment.success,
      reminder_sent: true
    };
  }

  // Run all scenarios
  async runAllScenarios() {
    this.log('🎬 Starting Aapat Platform Demo Scenarios', 'bright');
    this.log('=' .repeat(80), 'cyan');
    
    const startTime = Date.now();
    
    try {
      // Run individual scenarios
      await this.runScenario('Heart Attack Emergency', () => this.heartAttackEmergency());
      await this.runScenario('Road Accident Response', () => this.roadAccidentResponse());
      await this.runScenario('Multiple Emergency Handling', () => this.multipleEmergencyHandling());
      await this.runScenario('Hospital Bed Management', () => this.hospitalBedManagement());
      await this.runScenario('Payment Processing Workflow', () => this.paymentProcessingWorkflow());
      
      // Generate summary
      this.generateSummary();
      
    } catch (error) {
      this.log(`❌ Demo scenarios failed: ${error.message}`, 'red');
    }
    
    const totalDuration = Date.now() - startTime;
    this.log(`\n🎉 All scenarios completed in ${totalDuration}ms`, 'green');
  }

  // Generate summary report
  generateSummary() {
    this.log('\n📊 Demo Scenarios Summary', 'bright');
    this.log('=' .repeat(60), 'cyan');
    
    const successful = this.scenarios.filter(s => s.status === 'SUCCESS').length;
    const failed = this.scenarios.filter(s => s.status === 'FAILED').length;
    const totalDuration = this.scenarios.reduce((sum, s) => sum + s.duration, 0);
    
    this.scenarios.forEach((scenario, index) => {
      const status = scenario.status === 'SUCCESS' ? '✅' : '❌';
      const duration = scenario.duration > 0 ? `${scenario.duration}ms` : 'N/A';
      this.log(`${status} ${index + 1}. ${scenario.name} (${duration})`, 
        scenario.status === 'SUCCESS' ? 'green' : 'red');
    });
    
    this.log(`\n📈 Statistics:`, 'blue');
    this.log(`   Total Scenarios: ${this.scenarios.length}`, 'blue');
    this.log(`   Successful: ${successful}`, 'green');
    this.log(`   Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    this.log(`   Total Duration: ${totalDuration}ms`, 'blue');
    this.log(`   Average Duration: ${Math.round(totalDuration / this.scenarios.length)}ms`, 'blue');
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
  const demo = new DemoScenarios();
  demo.runAllScenarios()
    .then(() => demo.getServiceStatistics())
    .catch(console.error);
}

module.exports = DemoScenarios;
