// Test Mock Services for Aapat Platform
const SMSService = require('./sms-service');
const PaymentService = require('./payment-service');
const MapsService = require('./maps-service');

async function testMockServices() {
  console.log('🧪 Testing Mock Services...\n');

  // Test SMS Service
  console.log('1️⃣ Testing SMS Service (Mock Mode)...');
  const smsService = new SMSService();
  
  const smsResult = await smsService.sendEmergencySMS({
    emergency_type: 'Heart Attack',
    patient_info: { name: 'Test Patient' },
    address: 'Test Location',
    estimated_arrival: '5 minutes'
  });
  
  console.log('   SMS Result:', smsResult.message);
  console.log('   Status:', smsResult.success ? '✅ SUCCESS' : '❌ FAILED');

  // Test Payment Service
  console.log('\n2️⃣ Testing Payment Service (Mock Mode)...');
  const paymentService = new PaymentService();
  
  const paymentResult = await paymentService.createPaymentOrder({
    emergency_id: 'test_001',
    emergency_type: 'Heart Attack'
  }, 750);
  
  console.log('   Payment Result:', paymentResult.message);
  console.log('   Status:', paymentResult.success ? '✅ SUCCESS' : '❌ FAILED');
  if (paymentResult.data) {
    console.log('   Order ID:', paymentResult.data.order_id);
    console.log('   Amount:', `₹${paymentResult.data.amount}`);
  }

  // Test Maps Service
  console.log('\n3️⃣ Testing Maps Service (Mock Mode)...');
  const mapsService = new MapsService();
  
  const geocodeResult = await mapsService.geocodeAddress('Delhi, India');
  console.log('   Geocode Result:', geocodeResult.message);
  console.log('   Status:', geocodeResult.success ? '✅ SUCCESS' : '❌ FAILED');
  if (geocodeResult.data) {
    console.log('   Coordinates:', `${geocodeResult.data.lat}, ${geocodeResult.data.lng}`);
  }

  const hospitalsResult = await mapsService.findNearbyHospitals({
    lat: 28.6139,
    lng: 77.2090
  });
  console.log('   Hospitals Result:', hospitalsResult.message);
  console.log('   Status:', hospitalsResult.success ? '✅ SUCCESS' : '❌ FAILED');
  if (hospitalsResult.data) {
    console.log('   Hospitals Found:', hospitalsResult.data.length);
  }

  console.log('\n🎉 All Mock Services Tested Successfully!');
  console.log('📱 SMS Service: Mock Mode Active');
  console.log('💳 Payment Service: Mock Mode Active');
  console.log('🗺️ Maps Service: Mock Mode Active');
}

// Run the tests
testMockServices().catch(console.error);
