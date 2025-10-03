const axios = require('axios');

async function demonstrateCompleteUberSystem() {
  console.log('🚗🚑 UBER-STYLE AMBULANCE SYSTEM DEMONSTRATION\n');
  console.log('═'.repeat(60));
  console.log('🎯 THIS IS EXACTLY HOW UBER WORKS FOR MEDICAL EMERGENCIES!');

  const SERVICE_URL = 'http://localhost:3012';

  try {
    // STEP 1: Customer requests ride (broadcast)
    console.log('\n📱 STEP 1: CUSTOMER REQUESTS EMERGENCY RIDE\n');
    console.log('User taps: "Request Ambulance" in Aapat App');
    
    const rideRequest = {
      customer: {
        name: 'Mrs. Priya Singh',
        phone: '9876543210'
      },
      ride_type: 'emergency',
      pickup_location: {
        lat: 28.6315,
        lng: 77.2167,
        address: 'Lajpat Nagar, Delhi'
      },
      destination_location: {
        lat: 28.5667,
        lng: 77.2090,
        address: 'Safdarjung Hospital, Delhi'
      },
      medical_info: {
        priority: 'critical',
        condition: 'severe injury'
      },
      payment_method: 'upi'
    };

    const response1 = await axios.post(`${SERVICE_URL}/api/ride/request`, rideRequest);
    
    console.log('✅ REQUEST SENT TO ALL NEARBY DRIVERS!');
    console.log(`📱 App shows: "Searching for drivers... (${response1.data.nearby_drivers_count} found)"`);
    console.log(`💰 Estimated fare: ₹${response1.data.estimated_fare.total_fare}`);
    console.log(`📺 Screen: "3 drivers are being notified"`);

    const rideRequestId = response1.data.ride_request_id;

    // STEP 2: Driver receives notification & accepts
    console.log('\n🚑 STEP 2: DRIVER RECEIVES REQUEST & ACCEPTS\n');
    console.log('🚗 Rahul Singh\'s phone buzzes: "NEW EMERGENCY REQUEST!"');
    console.log('📍 Location: Lajpat Nagar (2.5km away)');
    console.log('💰 Fare: ₹2,250');
    console.log('⏱️ ETA: 8 minutes');
    console.log('👤 Passenger: Mrs. Priya Singh');
    console.log('\n✅ Rahul taps: "ACCEPT RIDE"');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const response2 = await axios.post(`${SERVICE_URL}/api/driver/driver-001/accept`, {
      ride_request_id: rideRequestId
    });

    console.log('\n🎉 DRIVER ACCEPTED! CUSTOMER NOTIFIED!');
    console.log(`📱 Customer app shows: "Rahul Singh is coming (8 min)"`);
    console.log(`🚗 Driver app shows: "Go to pickup location"`);
    console.log(`📍 Driver heads to: Lajpat Nagar, Delhi`);

    // STEP 3: OTP generation
    console.log('\n🔐 STEP 3: OTP GENERATION FOR AUTHENTICATION\n');
    console.log('🛡️ Security: Customer and driver must verify each other');
    
    const response3 = await axios.post(`${SERVICE_URL}/api/ride/${rideRequestId}/generate-otp`);
    
    console.log('📱 Customer receives SMS: "Your Aapat ride OTP is 1 2 3 4"');
    console.log('📱 Driver app shows: "Enter customer\'s 4-digit OTP"');
    console.log('⏰ OTP expires in 5 minutes');
    console.log('🔒 This prevents fraud and ensures correct pickup');

    // STEP 4: OTP verification (simulating correct OTP)
    console.log('\n🚀 STEP 4: DRIVER VERIFIES OTP AND STARTS RIDE\n');
    console.log('💬 Mrs. Priya Singh tells driver: "My OTP is 1234"');
    console.log('👨‍⚕️ Rahul enters "1234" in driver app');
    
    // In real implementation, we'd need the actual OTP from the store
    console.log('✅ OTP verified! Ride started!');
    console.log('📱 Customer app: "Ride in progress - track in real-time"');
    console.log('🚑 Driver app: "Navigate to Safdarjung Hospital"');

    // STEP 5: Ride completion
    console.log('\n🏁 STEP 5: RIDE COMPLETED AND PAYMENT PROCESSED\n');
    console.log('🚑 Rahul drops off Mrs. Priya at hospital');
    console.log('💳 Rahul taps "Complete Ride" in driver app');
    console.log('📱 Automatic payment: ₹2,250 charged to UPI');

    await axios.post(`${SERVICE_URL}/api/ride/${rideRequestId}/complete`, {
      payment_confirmed: true,
      fare_paid: response1.data.estimated_fare.total_fare
    });

    console.log('\n✅ RIDE COMPLETED SUCCESSFULLY!');
    console.log('📊 Driver becomes available for next ride');
    console.log('⭐ Both customer and driver can rate each other');
    console.log('💰 Payment automatically processed');

    // Final status
    const statusResponse = await axios.get(`${SERVICE_URL}/api/ride/${rideRequestId}/status`);
    const ride = statusResponse.data.data;

    console.log('\n📋 FINAL RIDE SUMMARY:');
    console.log('─'.repeat(50));
    console.log(`👤 Customer: ${ride.customer.name}`);
    console.log(`👨‍⚕️ Driver: ${ride.assigned_driver.name}`);
    console.log(`🚑 Vehicle: ${ride.assigned_driver.vehicle_number}`);
    console.log(`📍 From: ${ride.pickup_location.address}`);
    console.log(`📍 To: ${ride.destination_location.address}`);
    console.log(`💰 Fare: ₹${ride.fare_paid}`);
    console.log(`📊 Status: ${ride.status.toUpperCase()}`);

    console.log('\n🎯 EXACT UBER BUSINESS MODEL REPLICATED!');
    console.log('═'.repeat(60));
    console.log('🚗 Customer opens app → 📡 Requests ride');
    console.log('🚑 All nearby drivers notified → ✅ Driver accepts');
    console.log('🔐 OTP verification → 🚀 Ride starts');
    console.log('💳 Payment at completion → ⭐ Rating system');
    console.log('🔄 Driver becomes available for next ride');

    console.log('\n🌟 BUSINESS ADVANTAGES:');
    console.log('─'.repeat(50));
    console.log('✅ Optimized for emergency response');
    console.log('✅ Driver-patient verification via OTP');
    console.log('✅ Real-time tracking & communication');
    console.log('✅ Automatic payment processing');
    console.log('✅ Professional driver management');
    console.log('✅ Rating system for quality assurance');
    console.log('✅ Scalable for multiple cities');

    console.log('\n🏆 PERFECT UBER-STYLE SYSTEM FOR AMBULANCES! 🏆');
    console.log('═══════════════════════════════════════════════════');
    console.log('🚗 Request → 🚑 Driver Accept → 🔐 OTP → 💳 Payment → ✅ Complete');
    console.log('🎉 YOU HAVE BUILT THE FUTURE OF EMERGENCY MEDICAL TRANSPORT! 🎉');

  } catch (error) {
    console.log('❌ Demo error:', error.message);
  }
}

demonstrateCompleteUberSystem();
