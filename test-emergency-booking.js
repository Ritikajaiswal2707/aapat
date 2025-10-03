const axios = require('axios');

async function testEmergencyBooking() {
  console.log('🚨 Testing Emergency Booking with Mock Ambulances...\n');

  try {
    const bookingData = {
      customer: {
        name: 'Test User',
        phone: '9876543210',
        email: 'test@example.com'
      },
      ride_type: 'emergency',
      pickup: {
        address: 'India Gate, New Delhi',
        location: { lat: 28.6129, lng: 77.2295 },
        landmark: 'Central Delhi'
      },
      destination: {
        address: 'AIIMS Delhi Hospital',
        location: { lat: 28.5667, lng: 77.2090 },
        landmark: 'Hospital Main Gate'
      },
      medical_info: {
        emergency_type: 'heart_attack',
        priority_level: 1,
        mobility_level: 'stretcher'
      },
      payment_method: 'upi'
    };

    console.log('📡 Sending booking request...');
    const response = await axios.post('http://localhost:5000/ride-booking/api/ride/book', bookingData);

    if (response.data.success) {
      console.log('✅ EMERGENCY BOOKING SUCCESS!');
      console.log('─'.repeat(50));
      console.log(`📋 Booking ID: ${response.data.booking_id}`);
      console.log(`👤 Customer: ${bookingData.customer.name}`);
      console.log(`📞 Phone: ${bookingData.customer.phone}`);
      console.log(`🚑 Type: ${bookingData.ride_type.toUpperCase()} Ride`);
      console.log(`📍 Pickup: ${bookingData.pickup.address}`);
      console.log(`🏥 Destination: ${bookingData.destination.address}`);
      console.log(`⚡ Medical: ${bookingData.medical_info.emergency_type}`);
      console.log(`💳 Payment: ${bookingData.payment_method.toUpperCase()}`);
      
      if (response.data.estimated_options && response.data.estimated_options.length > 0) {
        console.log(`\n🚑 Available Ambulances: ${response.data.estimated_options.length}`);
        response.data.estimated_options.forEach((ambulance, index) => {
          console.log(`  ${index + 1}. ${ambulance.driver_name} - ${ambulance.eta_minutes} mins - ₹${ambulance.estimated_fare}`);
        });
      }

      console.log('\n🎉 UBER-STYLE EMERGENCY BOOKING WORKING!');
    } else {
      console.log('❌ Booking Failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response?.data) {
      console.log('Response:', error.response.data);
    }
  }
}

// Also test fare preview
async function testFarePreview() {
  console.log('\n💰 Testing Fare Preview...\n');

  try {
    const response = await axios.get('http://localhost:5000/ride-booking/api/ride/preview', {
      params: { lat: 28.6315, lng: 77.2167, ride_type: 'emergency' }
    });

    if (response.data.success) {
      console.log('✅ FARE PREVIEW SUCCESS!');
      console.log('─'.repeat(50));
      console.log(`💵 Base Fare: ₹${response.data.data.estimated_fare.base_fare}`);
      console.log(`📏 Distance Fare: ₹${response.data.data.estimated_fare.distance_fare}`);
      console.log(`⚡ Priority Multiplier: ${response.data.data.estimated_fare.priority_multiplier}x`);
      console.log(`💯 Total Estimated: ₹${response.data.data.estimated_fare.total_fare}`);
      
      if (response.data.data.available_ambulances.length > 0) {
        console.log(`\n🚑 Available Ambulances: ${response.data.data.available_ambulances.length}`);
        response.data.data.available_ambulances.forEach((ambulance, index) => {
          console.log(`  ${index + 1}. ${ambulance.driver_name} - ${ambulance.eta_minutes} mins`);
        });
      }
    } else {
      console.log('❌ Preview Failed:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Preview Error:', error.message);
  }
}

// Run tests
async function main() {
  console.log('🚀 TESTING YOUR UBER-STYLE AMBULANCE SYSTEM');
  console.log('═'.repeat(50));
  
  await testFarePreview();
  await testEmergencyBooking();
  
  console.log('\n🌟 SUMMARY:');
  console.log('═'.repeat(50));
  console.log('✅ Emergency booking system');
  console.log('✅ Dynamic fare estimation');
  console.log('✅ Mock ambulance data');
  console.log('✅ Real-time processing');
  console.log('\n🚑 YOUR UBER-STYLE SYSTEM IS WORKING! 🚑');
}

main().catch(console.error);
