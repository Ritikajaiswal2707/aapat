const axios = require('axios');

async function completeRide(rideId) {
  try {
    console.log(`🏁 Completing ride: ${rideId}`);
    
    const completeResponse = await axios.post(
      `http://localhost:3012/api/ride/${rideId}/complete`,
      {
        payment_confirmed: true,
        fare_paid: 500
      }
    );

    if (completeResponse.data.success) {
      console.log('🎉 Ride completed successfully!');
      console.log(`💵 Fare paid: ₹${completeResponse.data.fare_paid}`);
      return true;
    } else {
      console.log('❌ Failed to complete ride:', completeResponse.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error completing ride:', error.response?.data || error.message);
    return false;
  }
}

async function checkMetrics() {
  try {
    const ridesResponse = await axios.get('http://localhost:3012/api/rides');
    const rides = ridesResponse.data.data || [];
    
    const active = rides.filter(r => 
      r.status === 'searching_drivers' || 
      r.status === 'broadcasting' || 
      r.status === 'pending_assignment' ||
      r.status === 'driver_accepted' ||
      r.status === 'otp_generated' ||
      r.status === 'otp_verified' ||
      r.status === 'in_progress' ||
      r.status === 'en_route'
    );
    
    const completed = rides.filter(r => r.status === 'completed');

    console.log(`\n📊 Metrics:`);
    console.log(`   🔄 Active rides: ${active.length}`);
    console.log(`   ✅ Completed rides: ${completed.length}`);
    console.log(`   📋 Total rides: ${rides.length}`);
    
    console.log(`\n📋 All rides:`);
    rides.forEach(ride => {
      console.log(`   🆔 ${ride.id} - Status: ${ride.status}`);
    });
    
    return { active, completed, total: rides.length };
  } catch (error) {
    console.error('Error fetching metrics:', error.message);
    return null;
  }
}

async function main() {
  console.log('🧪 Testing Emergency Completion with Real Metrics');
  console.log('================================================');
  
  // Check initial metrics
  console.log('\n📊 Initial metrics:');
  await checkMetrics();
  
  // Try to complete any rides that can be completed
  const ridesResponse = await axios.get('http://localhost:3012/api/rides');
  const rides = ridesResponse.data.data || [];
  
  const completableRides = rides.filter(r => 
    r.status === 'in_progress' || 
    r.status === 'otp_verified' || 
    r.status === 'en_route'
  );
  
  if (completableRides.length > 0) {
    console.log('\n🏁 Found completable rides:')
    completableRides.forEach(ride => {
      console.log(`   🆔 ${ride.id}`);
    });
    
    // Complete first ride
    await completeRide(completableRides[0].id);
  } else {
    console.log('\n⚠️ No rides currently in progress to complete');
    console.log('💡 Try completing an "otp_generated" ride by simulating OTP verification...');
    
    // Try to verify OTP for an otp_generated ride
    const otpRides = rides.filter(r => r.status === 'otp_generated');
    if (otpRides.length > 0) {
      const ride = otpRides[0];
      console.log(`🔐 Trying to verify OTP for ride: ${ride.id}`);
      
      // We need to check what OTP was generated
      const driver = ride.assigned_driver;
      if (driver) {
        console.log(`👨‍⚕️ Driver: ${driver.name} (ID: ${driver.id})`);
        
        // For testing, try with a common OTP pattern
        const testOTPs = ['1234', '9876', '0000', '1111'];
        
        for (const testOTP of testOTPs) {
          try {
            console.log(`🧪 Testing OTP: ${testOTP}`);
            const verifyResponse = await axios.post(
              `http://localhost:3012/api/driver/${driver.id}/verify-otp`,
              { otp: testOTP }
            );
            
            if (verifyResponse.data.success) {
              console.log(`✅ OTP ${testOTP} worked! Ride verified.`);
              
              // Now try to complete it
              await completeRide(ride.id);
              break;
            }
          } catch (error) {
            console.log(`❌ OTP ${testOTP} failed`);
          }
        }
      }
    }
  }
  
  // Check final metrics
  console.log('\n📊 Final metrics:');
  await checkMetrics();
  
  console.log('\n✅ Test completed!');
}

main();
