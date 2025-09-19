// Comprehensive testing script for Aapat platform
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testFeatures() {
  console.log('🧪 Testing Aapat Platform Features...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('   Features available:', Object.keys(healthResponse.data.features).join(', '));

    // Test 2: Emergency Request
    console.log('\n2️⃣ Testing Emergency Request...');
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

    // Test 3: Ambulances
    console.log('\n3️⃣ Testing Ambulances...');
    const ambulancesResponse = await axios.get(`${BASE_URL}/api/ambulances`);
    console.log('✅ Ambulances:', ambulancesResponse.data.data.length, 'ambulances found');
    ambulancesResponse.data.data.forEach(amb => {
      console.log(`   - ${amb.license_plate} (${amb.status}) - Driver: ${amb.driver_name}`);
    });

    // Test 4: Hospitals
    console.log('\n4️⃣ Testing Hospitals...');
    const hospitalsResponse = await axios.get(`${BASE_URL}/api/hospitals`);
    console.log('✅ Hospitals:', hospitalsResponse.data.data.length, 'hospitals found');
    hospitalsResponse.data.data.forEach(hosp => {
      console.log(`   - ${hosp.name}: ${hosp.available_beds}/${hosp.total_beds} beds available`);
    });

    // Test 5: Analytics
    console.log('\n5️⃣ Testing Analytics...');
    const analyticsResponse = await axios.get(`${BASE_URL}/api/analytics/dashboard`);
    console.log('✅ Analytics:', 'Dashboard metrics loaded');
    console.log(`   - Total Emergencies: ${analyticsResponse.data.data.metrics.total_emergencies}`);
    console.log(`   - Available Ambulances: ${analyticsResponse.data.data.metrics.available_ambulances}`);
    console.log(`   - Avg Response Time: ${analyticsResponse.data.data.metrics.avg_response_time_minutes} minutes`);

    console.log('\n🎉 All tests passed! Platform is working correctly.');
    console.log('\n📱 Test the following URLs in your browser:');
    console.log('   - Emergency Dashboard: http://localhost:3000');
    console.log('   - Mobile Apps: http://localhost:3000/mobile');
    console.log('   - Hospital Portal: http://localhost:3000/hospital');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Run tests
testFeatures();
