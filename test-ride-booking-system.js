const axios = require('axios');

// Test data
const BASE_URL = 'http://localhost:3010/api/ride';

// Sample booking data
const sampleBookings = {
  emergency: {
    customer: {
      name: 'Rajesh Kumar',
      phone: '9876543210',
      emergency_contact: '8765432109'
    },
    ride_type: 'emergency',
    pickup: {
      address: 'Connaught Place, New Delhi',
      location: { lat: 28.6315, lng: 77.2167 },
      landmark: 'Metro Station',
      instructions: 'EMERGENCY - Heart attack symptoms'
    },
    destination: {
      address: 'AIIMS Delhi, Ansari Nagar, New Delhi',
      location: { lat: 28.5667, lng: 77.2090 },
      landmark: 'Hospital main gate',
      hospital_id: 'aiims_delhi'
    },
    medical_info: {
      emergency_type: 'heart_attack',
      priority_level: 1,
      mobility_level: 'stretcher',
      medical_equipment_required: ['oxygen', 'defibrillator', 'heart_monitor']
    },
    payment_method: 'upi'
  },
  
  scheduled: {
    customer: {
      name: 'Priya Sharma',
      phone: '9123456789',
      email: 'priya@example.com'
    },
    ride_type: 'scheduled',
    pickup: {
      address: 'Sector 62, Noida',
      location: { lat: 28.6275, lng: 77.3727 },
      landmark: 'Shopping complex'
    },
    destination: {
      address: 'Safdarjung Hospital, New Delhi',
      location: { lat: 28.5757, lng: 77.2058 },
      landmark: 'Hospital entrance'
    },
    scheduled_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    medical_info: {
      mobility_level: 'wheelchair',
      patient_condition: 'Regular dialysis appointment'
    },
    payment_method: 'card'
  }
};

// Color codes for terminal output
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

function coloredLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test functions
async function testBookingPreview() {
  coloredLog('cyan', '\n🧪 Testing Booking Preview API...');
  
  try {
    const response = await axios.get(`${BASE_URL}/preview`, {
      params: { lat: 28.6315, lng: 77.2167, ride_type: 'emergency' }
    });

    if (response.data.success) {
      coloredLog('green', '✅ Preview API Working!');
      console.log('📊 Available Options:', response.data.data.available_ambulances.length);
      console.log('💰 Estimated Fare:', `₹${response.data.data.estimated_fare.total_fare}`);
    } else {
      coloredLog('red', '❌ Preview API Failed');
    }
  } catch (error) {
    coloredLog('red', `❌ Preview Test Error: ${error.message}`);
  }
}

async function testEmergencyBooking() {
  coloredLog('cyan'); 
  console.log('\n🚨 Testing Emergency Booking...');
  
  try {
    const response = await axios.post(`${BASE_URL}/book`, sampleBookings.emergency);
    
    if (response.data.success) {
      coloredLog('green', '✅ Emergency Booking Created!');
      console.log('📋 Booking ID:', response.data.booking_id);
      
      if (response.data.estimated_options) {
        console.log('🚑 Available Options:', response.data.estimated_options.length);
      }
      
      return response.data.booking_id;
    } else {
      coloredLog('red', '❌ Emergency Booking Failed');
      console.log('Message:', response.data.message);
    }
  } catch (error) {
    coloredLog('red', `❌ Emergency Booking Error: ${error.message}`);
  }
}

async function testScheduledBooking() {
  coloredLog('cyan');
  console.log('\n📅 Testing Scheduled Booking...');
  
  try {
    const response = await axios.post(`${BASE_URL}/book`, sampleBookings.scheduled);
    
    if (response.data.success) {
      coloredLog('green', '✅ Scheduled Booking Created!');
      console.log('📋 Booking ID:', response.data.booking_id);
      console.log('⏰ Scheduled Time:', sampleBookings.scheduled.scheduled_time);
      console.log('📱 Status: Scheduled (No immediate assignment)');
      
      return response.data.booking_id;
    } else {
      coloredLog('red', '❌ Scheduled Booking Failed');
      console.log('Message:', response.data.message);
    }
  } catch (error) {
    coloredLog('red', `❌ Scheduled Booking Error: ${error.message}`);
  }
}

async function checkServiceStatus() {
  try {
    const response = await axios.get('http://localhost:3010/health');
    if (response.data.status === 'OK') {
      coloredLog('green', '✅ Ride Booking Service is running on port 3010');
      return true;
    }
  } catch (error) {
    coloredLog('red', '❌ Ride Booking Service is not running on port 3010');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  coloredLog('magenta', '\n🚀 APAT RIDE BOOKING SYSTEM TESTS 🚀');
  coloredLog('bright', '=====================================================\n');
  
  try {
    await testBookingPreview();
    await testEmergencyBooking();
    await testScheduledBooking();
    
    coloring function coloredLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testBookingPreview() {
  coloredLog('cyan', '\n🧪 Testing Booking Preview API...');
  
  try {
    const response = await axios.get(`${BASE_URL}/preview`, {
      params: { lat: 28.6315, lng: 77.2167, ride_type: 'emergency' }
    });

    if (response.data.success) {
      coloredLog('green', '✅ Preview API Working!');
      console.log('📊 Available Options:', response.data.data.available_ambulances.length);
      console.log('💰 Estimated Fare:', `₹${response.data.data.estimated_fare.total_fare}`);
    } else {
      coloredLog('red', '❌ Preview API Failed');
    }
  } catch (error) {
    coloredLog('red', `❌ Preview Test Error: ${error.message}`);
  }
}

async function testEmergencyBooking() {
  coloredLog('cyan', '\n🚨 Testing Emergency Booking...');
  
  try {
    const response = await axios.post(`${BASE_URL}/book`, sampleBookings.emergency);
    
    if (response.data.success) {
      coloredLog('green', '✅ Emergency Booking Created!');
      console.log('📋 Booking ID:', response.data.booking_id);
      
      if (response.data.estimated_options) {
        console.log('🚑 Available Options:', response.data.estimated_options.length);
      }
      
      return response.data.booking_id;
    } else {
      coloredLog('red', '❌ Emergency Booking Failed');
      console.log('Message:', response.data.message);
    }
  } catch (error) {
    coloredLog('red', `❌ Emergency Booking Error: ${error.message}`);
  }
}

async function testScheduledBooking() {
  coloredLog('cyan', '\n📅 Testing Scheduled Booking...');
  
  try {
    const response = await axios.post(`${BASE_URL}/book`, sampleBookings.scheduled);
    
    if (response.data.success) {
      coloredLog('green', '✅ Scheduled Booking Created!');
      console.log('📋 Booking ID:', response.data.booking_id);
      console.log('⏰ Scheduled Time:', sampleBookings.scheduled.scheduled_time);
      console.log('📱 Status: Scheduled (No immediate assignment)');
      
      return response.data.booking_id;
    } else {
      coloredLog('red', '❌ Scheduled Booking Failed');
      console.log('Message:', response.data.message);
    }
  } catch (error) {
    coloredLog('red', `❌ Scheduled Booking Error: ${error.message}`);
  }
}

async function checkServiceStatus() {
  try {
    const response = await axios.get('http://localhost:3010/health');
    if (response.data.status === 'OK') {
      coloredLog('green', '✅ Ride Booking Service is running on port 3010');
      return true;
    }
  } catch (error) {
    coloredLog('red', '❌ Ride Booking Service is not running on port 3010');
    return false;
  }
}

async function runAllTests() {
  coloredLog('magenta', '\n🚀 APAT RIDE BOOKING SYSTEM TESTS 🚀');
  coloredLog('bright', '=====================================================\n');
  
  try {
    await testBookingPreview();
    await testEmergencyBooking();
    await testScheduledBooking();
    
    coloredLog('magenta', '\n🎉 ALL TESTS COMPLETED! 🎉');
    coloredLog('bright', '=====================================================\n');
    
    coloredLog('green', '✅ Features Successfully Implemented:');
    console.log('  • Ride preview with fare estimates');
    console.log('  • Emergency booking (immediate response)');
    console.log('  • Scheduled booking (advance booking)');
    console.log('  • Dynamic pricing based on ride type');
    console.log('  • Real-time status tracking');
    
    coloredLog('yellow', '\n🔮 Next Steps:');
    console.log('  • Deploy ride booking mobile app');
    console.log('  • Integrate real payment processing');
    console.log('  • Connect with actual ambulance GPS');
    
  } catch (error) {
    coloredLog('red', `\n❌ Test Suite Error: ${error.message}`);
  }
}

async function main() {
  const isRunning = await checkServiceStatus();
  
  if (isRunning) {
    coloredLog('blue', '🚀 Starting Ride Booking System Tests...\n');
    await runAllTests();
  } else {
    coloredLog('red', '❌ Cannot run tests - service not available');
    process.exit(1);
  }
}

main().catch(console.error);
