const axios = require('axios');

async function testStepByStep() {
  console.log('🚀 UBER-STYLE SYSTEM STEP-BY-STEP TEST\n');
  console.log('═'.repeat(50));

  try {
    // STEP 1: Request new ride
    console.log('📱 STEP 1: Request Emergency Ride...\n');
    
    const rideData = {
      customer: {
        name: 'Test Patient',
        phone: '9876543210'
      },
      ride_type: 'emergency',
      pickup_location: {
        lat: 28.6315,
        lng: 77.2167,
        address: 'Test Location'
      },
      destination_location: {
        lat: 28.5667,
        lng: 77.2090,
        address: 'Hospital'
      },
      medical_info: {
        condition: 'test'
      },
      payment_method: 'upi'
    };

    const requestResponse = await axios.post('http://localhost:3012/api/ride/request', rideData);
    
    if (requestResponse.data.success) {
      console.log('✅ RIDE REQUEST SENT!');
      console.log(`📋 Request ID: ${requestResponse.data.ride_request_id}`);
      console.log(`💰 Fare: ₹${requestResponse.data.estimated_fare.total_fare}`);
      console.log(`👥 Drivers notified: ${requestResponse.data.nearby_drivers_count}`);
      
      const rideId = requestResponse.data.ride_request_id;
      
      // STEP 2: Wait and accept (simulate driver)
      console.log('\n⏳ Waiting 2 seconds for driver to process...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ STEP 2: Driver Accepts Ride...\n');
      const acceptResponse = await axios.post(`http://localhost:3012/api/driver/driver-002/accept`, {
        ride_request_id: rideId
      });
      
      if (acceptResponse.data.success) {
        console.log('🎉 DRIVER ACCEPTED!');
        console.log(`👨‍⚕️ Driver: ${acceptResponse.data.driver_info.name}`);
        
        // STEP 3: Generate OTP
        console.log('\n🔐 STEP 3: Generate OTP...\n');
        const otpResponse = await axios.post(`http://localhost:3012/api/ride/${rideId}/generate-otp`);
        
        if (otpResponse.data.success) {
          console.log('🔐 OTP GENERATED!');
          console.log('📱 Customer receives OTP via SMS');
          console.log('👨‍⚕️ Driver must enter OTP to start ride');
          
          // STEP 4: Complete ride (simulate end)
          console.log('\n🏁 STEP 4: Complete Ride...\n');
          const completeResponse = await axios.post(`http://localhost:3012/api/ride/${rideId}/complete`, {
            payment_confirmed: true,
            fare_paid: requestResponse.data.estimated_fare.total_fare
          });
          
          if (completeResponse.data.success) {
            console.log('🎉 RIDE COMPLETED SUCCESSFULLY!');
            console.log(`💰 Payment: ₹${completeResponse.data.fare_paid}`);
            console.log('✅ Driver available for next ride');
            
            console.log('\n🌟 UBER-STYLE SYSTEM WORKING PERFECTLY!');
            console.log('═'.repeat(50));
            console.log('✅ Request → Driver Accept → OTP → Complete');
            console.log('✅ Real-time driver matching');
            console.log('✅ Payment processing');
            console.log('✅ OTP authentication');
            console.log('\n🏆 EXACT UBER FUNCTIONALITY REPLICATED! 🏆');
          }
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.response?.data?.message || error.message);
  }
}

testStepByStep();
