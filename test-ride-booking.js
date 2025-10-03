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
    scheduled_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    medical_info: {
      mobility_level: 'wheelchair',
      patient_condition: 'Regular dialysis appointment'
    },
    payment_method: 'card'
  },
  
  medical_transport: {
    customer: {
      name: 'Ankur Singh',
      phone: '9988776655'
    },
    ride_type: 'medical_transport',
    pickup: {
      address: 'Dwarka Sector 12, New Delhi',
      location: { lat: 28.5945, lng: 77.0427 },
      landmark: 'Residential area'
    },
    destination: {
      address: 'Fortis Hospital, Vasant Kunj, New Delhi',
      location: { lat: 28.5231, lng: 77.1612 },
      landmark: 'Hospital main gate'
    },
    medical_info: {
      mobility_level: 'independent',
      patient_condition: 'Regular health check-up'
    },
    payment_method: 'insurance'
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
      params: {
        lat: 28.6315,
        lng: 77.2167,
        ride_type: 'emergency'
      }
    });

    if (response.data.success) {
      coloredLog('green', '✅ Preview API Working!');
      console.log('📊 Available Options:', response.data.data.available_ambulances.length);
      console.log('💰 Estimated Fare:', `₹${response.data.data.estimated_fare.total_fare}`);
      
      if (response.data.data.available_ambulances.length > 0) {
        const option = response.data.data.available_ambulances[0];
        console.log(`🚑 Best Option: ${option.driver_name} - ${option.eta_minutes} mins - ₹${option.estimated_fare}`);
      }
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
        response.data.estimated_options.forEach((option, index) => {
          console.log(`   ${index + 1}. ${option.driver_name} - ${option.eta_minutes} mins - ₹${option.estimated_fare}`);
        });
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

async function testMedicalTransportBooking() {
  coloredLog('cyan', '\n🚑 Testing Medical Transport Booking...');
  
  try {
    const response = await axios.post(`${BASE_URL}/book`, sampleBookings.medical_transport);
    
    if (response.data.success) {
      coloredLog('green', '✅ Medical Transport Booking Created!');
      console.log('📋 Booking ID:', response.data.booking_id);
      console.log('🏥 Transport Type: Regular medical transport');
      console.log('💰 Payment Method: Insurance');
      
      if (response.data.estimated_options) {
        console.log('🚑 Available Options:', response.data.estimated_options.length);
      }
      
      return response.data.booking_id;
    } else {
      coloredLog('red', '❌ Medical Transport Booking Failed');
      console.log('Message:', response.data.message);
    }
  } catch (error) {
    coloredLog('red', `❌ Medical Transport Booking Error: ${error.message}`);
  }
}

async function testAmbulanceAssignment(bookingId, ambulanceIndex = 0) {
  if (!bookingId) return;
  
  coloredLog('cyan', '\n🚑 Testing Ambulance Assignment...');
  
  try {
    // First get the booking to see available options
    const bookingResponse = await axios.get(`${BASE_URL}/status/${bookingId}`);
    
    if (bookingResponse.data.success) {
