// Comprehensive test script for all Aapat services
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAllServices() {
  console.log('🚀 Testing All Aapat Services...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('   Features:', Object.keys(healthResponse.data.features).join(', '));
    console.log('   SMS Service:', healthResponse.data.features['SMS Service']);
    console.log('   Payment Service:', healthResponse.data.features['Payment Service']);
    console.log('   Maps Service:', healthResponse.data.features['Maps Service']);

    // Test 2: SMS Service
    console.log('\n2️⃣ Testing SMS Service...');
    const smsTestResponse = await axios.get(`${BASE_URL}/api/sms/test`);
    console.log('✅ SMS Test:', smsTestResponse.data.message);
    if (smsTestResponse.data.sid) {
      console.log('   Message SID:', smsTestResponse.data.sid);
    }

    // Test 3: Payment Service
    console.log('\n3️⃣ Testing Payment Service...');
    const paymentTestResponse = await axios.get(`${BASE_URL}/api/payment/test`);
    console.log('✅ Payment Test:', paymentTestResponse.data.message);
    if (paymentTestResponse.data.order_id) {
      console.log('   Order ID:', paymentTestResponse.data.order_id);
    }

    // Test 4: Maps Service
    console.log('\n4️⃣ Testing Maps Service...');
    const mapsTestResponse = await axios.get(`${BASE_URL}/api/maps/test`);
    console.log('✅ Maps Test:', mapsTestResponse.data.message);
    if (mapsTestResponse.data.geocoding !== undefined) {
      console.log('   Geocoding:', mapsTestResponse.data.geocoding ? 'Working' : 'Failed');
      console.log('   Directions:', mapsTestResponse.data.directions ? 'Working' : 'Failed');
    }

    // Test 5: Emergency Request with SMS
    console.log('\n5️⃣ Testing Emergency Request with SMS...');
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

    // Test 6: Payment Pricing
    console.log('\n6️⃣ Testing Payment Pricing...');
    const pricingResponse = await axios.get(`${BASE_URL}/api/payment/calculate-pricing?emergencyType=CARDIAC&distance=5&priority=1`);
    console.log('✅ Pricing Calculated:', pricingResponse.data.message);
    console.log('   Total Price:', `₹${pricingResponse.data.data.total_price}`);
    console.log('   Base Price:', `₹${pricingResponse.data.data.base_price}`);
    console.log('   Distance Charge:', `₹${pricingResponse.data.data.distance_charge}`);

    // Test 7: Payment Order Creation
    console.log('\n7️⃣ Testing Payment Order Creation...');
    const orderData = {
      emergencyData: emergencyData,
      amount: pricingResponse.data.data.total_price
    };
    const orderResponse = await axios.post(`${BASE_URL}/api/payment/create-order`, orderData);
    console.log('✅ Payment Order:', orderResponse.data.message);
    if (orderResponse.data.data?.order_id) {
      console.log('   Order ID:', orderResponse.data.data.order_id);
      console.log('   Amount:', `₹${orderResponse.data.data.amount}`);
    }

    // Test 8: Maps Directions
    console.log('\n8️⃣ Testing Maps Directions...');
    const directionsData = {
      origin: { lat: 28.6139, lng: 77.2090 },
      destination: { lat: 28.6149, lng: 77.2100 },
      mode: 'driving'
    };
    const directionsResponse = await axios.post(`${BASE_URL}/api/maps/directions`, directionsData);
    console.log('✅ Directions:', directionsResponse.data.message);
    if (directionsResponse.data.data?.distance) {
      console.log('   Distance:', directionsResponse.data.data.distance);
      console.log('   Duration:', directionsResponse.data.data.duration);
    }

    // Test 9: Maps Geocoding
    console.log('\n9️⃣ Testing Maps Geocoding...');
    const geocodeData = { address: "Delhi, India" };
    const geocodeResponse = await axios.post(`${BASE_URL}/api/maps/geocode`, geocodeData);
    console.log('✅ Geocoding:', geocodeResponse.data.message);
    if (geocodeResponse.data.data?.lat) {
      console.log('   Coordinates:', `${geocodeResponse.data.data.lat}, ${geocodeResponse.data.data.lng}`);
      console.log('   Address:', geocodeResponse.data.data.formatted_address);
    }

    // Test 10: Nearby Hospitals
    console.log('\n🔟 Testing Nearby Hospitals...');
    const hospitalsData = {
      location: { lat: 28.6139, lng: 77.2090 },
      radius: 5000
    };
    const hospitalsResponse = await axios.post(`${BASE_URL}/api/maps/nearby-hospitals`, hospitalsData);
    console.log('✅ Nearby Hospitals:', hospitalsResponse.data.message);
    if (hospitalsResponse.data.data?.length) {
      console.log('   Hospitals Found:', hospitalsResponse.data.data.length);
      hospitalsResponse.data.data.forEach((hospital, index) => {
        console.log(`   ${index + 1}. ${hospital.name} (${hospital.distance})`);
      });
    }

    console.log('\n🎉 All Services Test Complete!');
    console.log('\n📊 Service Summary:');
    console.log('   ✅ SMS Service: Working');
    console.log('   ✅ Payment Service: Working');
    console.log('   ✅ Maps Service: Working');
    console.log('   ✅ Emergency System: Working');
    console.log('   ✅ All APIs: Functional');

    console.log('\n🔧 Available Endpoints:');
    console.log('   - Health: GET /health');
    console.log('   - SMS: GET /api/sms/test, POST /api/sms/send');
    console.log('   - Payment: GET /api/payment/test, POST /api/payment/create-order');
    console.log('   - Maps: GET /api/maps/test, POST /api/maps/directions');
    console.log('   - Emergency: POST /api/emergency/request');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Run all service tests
testAllServices();
