const axios = require('axios');

const BASE_URL = 'http://localhost:3012';

async function testEmergencyCompletion() {
  try {
    console.log('🧪 Testing Emergency Completion Process - Simple Version');
    console.log('========================================================');

    // Step 1: Get current rides
    console.log('\n📋 Step 1: Getting current rides...');
    const ridesResponse = await axios.get(`${BASE_URL}/api/rides`);
    
    if (!ridesResponse.data.success) {
      throw new Error('Failed to fetch rides');
    }

    const rides = ridesResponse.data.data || [];
    console.log(`📊 Total rides: ${rides.length}`);
    
    // Show all ride statuses
    rides.forEach(ride => {
      console.log(`   🆔 Ride ${ride.id} - Status: ${ride.status}`);
    });

    // Step 2: Find rides that can be completed
    const completableRides = rides.filter(r => 
      r.status === 'in_progress' || 
      r.status === 'otp_verified' ||
      r.status === 'en_route'
    );

    if (completableRides.length > 0) {
      const rideToComplete = completableRides[0];
      console.log(`\n🏁 Step 2: Completing ride ${rideToComplete.id}...`);

      const completeResponse = await axios.post(
        `${BASE_URL}/api/ride/${rideToComplete.id}/complete`,
        {
          payment_confirmed: true,
          fare_paid: 500
        }
      );

      if (completeResponse.data.success) {
        console.log('🎉 Ride completed successfully!');
        console.log(`💵 Fare paid: ₹${completeResponse.data.fare_paid}`);
      } else {
        console.log('❌ Failed to complete ride:', completeResponse.data.message);
      }
    } else {
      console.log('\n⚠️ No completable rides found');
      
      // Let's create a ride and complete it step by step
      console.log('\n🆕 Creating new ride for testing...');
      const newRideResponse = await axios.post(`${BASE_URL}/api/ride/request`, {
        customer: {
          name: 'Test Patient Update',
          phone: '9123456780'
        },
        pickup_location: {
          lat: 28.6139,
          lng: 77.2090,
          address: 'Central Delhi Test'
        },
        medical_info: {
          condition: 'fracture',
          severity: 5,
          emergency_type: 'trauma',
          priority: 'high'
        }
      });

      if (newRideResponse.data.success) {
        console.log('✅ New ride created:', newRideResponse.data.ride_request_id);
        
        // Get drivers and assign one
        const driversResponse = await axios.get(`${BASE_URL}/api/drivers`);
        const availableDrivers = driversResponse.data.data.filter(d => d.is_available);
        
        if (availableDrivers.length > 0) {
          const driver = availableDrivers[0];
          const rideId = newRideResponse.data.ride_request_id;
          
          console.log(`🎯 Assigning driver ${driver.name} to ride ${rideId}...`);
          
          const assignResponse = await axios.post(
            `${BASE_URL}/api/ride/${rideId}/assign-driver/${driver.id}`
          );
          
          if (assignResponse.data.success) {
            console.log('✅ Driver assigned');
            
            // Generate OTP
            console.log('🔐 Generating OTP...');
            const otpResponse = await axios.post(`${BASE_URL}/api/ride/${rideId}/generate-otp`);
            
            if (otpResponse.data.success) {
              const otp = otpResponse.data.otp;
              console.log(`📱 OTP: ${otp}`);
              
              // Verify OTP
              console.log('✅ Verifying OTP...');
              const verifyResponse = await axios.post(
                `${BASE_URL}/api/driver/${driver.id}/verify-otp`,
                { otp: otp }
              );
              
              if (verifyResponse.data.success) {
                console.log('✅ OTP verified, ride started');
                
                // Complete the ride
                console.log('🏁 Completing ride...');
                const completeResponse = await axios.post(
                  `${BASE_URL}/api/ride/${rideId}/complete`,
                  {
                    payment_confirmed: true,
                    fare_paid: 450
                  }
                );
                
                if (completeResponse.data.success) {
                  console.log('🎉 SUCCESS! Ride completed!');
                  console.log(`💵 Fare paid: ₹${completeResponse.data.fare_paid}`);
                } else {
                  console.log('❌ Completion failed:', completeResponse.data.message);
                }
              } else {
                console.log('❌ OTP verification failed:', verifyResponse.data.message);
              }
            } else {
              console.log('❌ OTP generation failed:', otpResponse.data.message);
            }
          } else {
            console.log('❌ Driver assignment failed:', assignResponse.data.message);
          }
        }
      }
    }

    // Step 3: Check final metrics
    console.log('\n📊 Step 3: Final ride status...');
    const finalRidesResponse = await axios.get(`${BASE_URL}/api/rides`);
    
    if (finalRidesResponse.data.success) {
      const finalRides = finalRidesResponse.data.data || [];
      const active = finalRides.filter(r => 
        r.status === 'searching_drivers' || 
        r.status === 'driver_accepted' && 
        r.status === 'otp_verified' ||
        r.status === 'in_progress' ||
        r.status === 'en_route'
      );
      const completed = finalRides.filter(r => r.status === 'completed');

      console.log(`📈 Results:`);
      console.log(`   🔄 Active rides: ${active.length}`);
      console.log(`   ✅ Completed rides: ${completed.length}`);
      console.log(`   📋 Total rides:${finalRides.length}`);
      
      // Show all ride statuses
      console.log(`\n📋 All rides:`);
      finalRides.forEach(ride => {
        console.log(`   🆔 ${ride.id} - Status: ${ride.status}`);
      });
    }

    console.log('\n✅ Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run test
testEmergencyCompletion();
