// Test SMS functionality with Twilio integration
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSMSFeatures() {
  console.log('📱 Testing SMS Integration...\n');

  try {
    // Test 1: Health Check with SMS status
    console.log('1️⃣ Testing Health Check with SMS Status...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('   SMS Service:', healthResponse.data.features['SMS Service']);

    // Test 2: SMS Service Test
    console.log('\n2️⃣ Testing SMS Service...');
    const smsTestResponse = await axios.get(`${BASE_URL}/api/sms/test`);
    console.log('✅ SMS Test:', smsTestResponse.data.message);
    if (smsTestResponse.data.sid) {
      console.log('   Message SID:', smsTestResponse.data.sid);
    }

    // Test 3: Emergency Request with SMS
    console.log('\n3️⃣ Testing Emergency Request with SMS...');
    const emergencyData = {
      caller_phone: "+919876543210",
      patient_info: {
        name: "Test Patient",
        age: 30,
        gender: "MALE",
        blood_type: "O+"
      },
      location: {
        latitude: 28.6139,
        longitude: 77.2090
      },
      address: "Test Location, Delhi",
      emergency_type: "CARDIAC",
      symptoms: "Chest pain, difficulty breathing",
      conscious: true,
      breathing: true,
      pain_level: 8
    };

    const emergencyResponse = await axios.post(`${BASE_URL}/api/emergency/request`, emergencyData);
    console.log('✅ Emergency Request:', emergencyResponse.data.message);
    console.log('   Emergency ID:', emergencyResponse.data.data.emergency_id);
    console.log('   SMS Sent:', emergencyResponse.data.data.sms_sent ? 'Yes' : 'No');

    // Test 4: Send Custom SMS
    console.log('\n4️⃣ Testing Custom SMS...');
    const customSMSData = {
      phone: "+919876543210",
      message: "🧪 Aapat SMS Test - This is a test message from the emergency platform!"
    };

    const customSMSResponse = await axios.post(`${BASE_URL}/api/sms/send`, customSMSData);
    console.log('✅ Custom SMS:', customSMSResponse.data.message);
    if (customSMSResponse.data.sid) {
      console.log('   Message SID:', customSMSResponse.data.sid);
    }

    console.log('\n🎉 SMS Integration Test Complete!');
    console.log('\n📱 SMS Features Available:');
    console.log('   - Emergency alerts to contacts');
    console.log('   - Driver assignment notifications');
    console.log('   - Status update messages');
    console.log('   - Hospital notifications');
    console.log('   - Custom SMS sending');

    console.log('\n🔧 SMS Test Endpoints:');
    console.log('   - Health Check: GET /health');
    console.log('   - SMS Test: GET /api/sms/test');
    console.log('   - Send SMS: POST /api/sms/send');
    console.log('   - Emergency Request: POST /api/emergency/request');

  } catch (error) {
    console.error('❌ SMS Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Run SMS tests
testSMSFeatures();
