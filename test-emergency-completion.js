const axios = require('axios');

const BASE_URL = 'http://localhost:3012';

async function testEmergencyCompletion() {
  try {
    console.log('🧪 Testing Emergency Completion Process');
    console.log('======================================');

    // Step 1: Get current rides
    console.log('\n📋 Step 1: Getting current rides...');
    const ridesResponse = await axios.get(`${BASE_URL}/api/rides`);
    
    if (!ridesResponse.data.success) {
      throw new Error('Failed to fetch rides');
    }

    const rides = ridesResponse.data.data || [];
    const activeRides = rides.filter(r => 
      r.status === 'searching_drivers' || 
      r.status === 'driver_accepted' || 
      r.status === 'in_progress' ||
      r.status === 'en_route'
    );

    console.log(`📊 Total rides: ${rides.length}`);
    console.log(`🔄 Active rides: ${activeRides.length}`);

    if (activeRides.length === 0) {
      console.log('⚠️ No active rides found. Creating a test ride...');
      
      const newRideResponse = await axios.post(`${BASE_URL}/api/ride/request`, {
        customer: {
          name: 'Test Patient',
          phone: '9876543210'
        },
        pickup_location: {
          lat: 28.6139,
          lng: 77.2090,
          address: 'Central Delhi'
        },
        medical_info: {
          condition: 'chest_pain',
          severity: 8,
          emergency_type: 'cardiac',
          priority: 'critical'
        }
      });

      if (newRideResponse.data.success) {
        console.log('✅ Test ride created:', newRideResponse.data.ride_request_id);
      } else {
        throw new Error('Failed to create test ride');
      }
    }

    // Step 2: Assign a driver to an active ride
    console.log('\n🎯 Step 2: Assigning driver...');
    const driversResponse = await axios.get(`${BASE_URL}/api/drivers`);
    
    if (!driversResponse.data.success) {
      throw new Error('Failed to fetch drivers');
    }

    const availableDrivers = driversResponse.data.data.filter(d => d.is_available);
    console.log(`👨‍⚕️ Available drivers: ${availableDrivers.length}`);

    // Get the newly created ride if no active rides found initially
    let ridesToAssign = activeRides;
    if (ridesToAssign.length === 0) {
      const newRidesResponse = await axios.get(`${BASE_URL}/api/rides`);
      ridesToAssign = newRidesResponse.data.data.filter(r => 
        r.status === 'searching_drivers' || 
        r.status === 'broadcasting' || 
        r.status === 'pending_assignment'
      );
    }

    if (availableDrivers.length > 0 && ridesToAssign.length > 0) {
      const ride = ridesToAssign[0];
      const driver = availableDrivers[0];

      console.log(`🆔 Assigning driver ${driver.name} to ride ${ride.id}`);

      const assignResponse = await axios.post(
        `${BASE_URL}/api/ride/${ride.id}/assign-driver/${driver.id}`
      );

      if (assignResponse.data.success) {
        console.log('✅ Driver assigned successfully');
        console.log(`📍 Assignment result:`, assignResponse.data.message);
      } else {
        console.log('❌ Assignment failed:', assignResponse.data.message);
      }
    } else {
      console.log('⚠️ No available drivers or rides to assign');
    }

    // Step 3: Generate OTP and verify it
    console.log('\n🔐 Step 3: Generating and confirming OTP...');
    
    // Get updated rides to find assigned ride
    const updatedRidesResponse = await axios.get(`${BASE_URL}/api/rides`);
    const assignedRides = updatedRidesResponse.data.data.filter(r => 
      r.status === 'driver_accepted'
    );

    if (assignedRides.length > 0) {
      const rideForOTP = assignedRides[0];
      console.log(`🔢 Generating OTP for ride: ${rideForOTP.id}`);

      // Generate OTP
      const otpResponse = await axios.post(`${BASE_URL}/api/ride/${rideForOTP.id}/generate-otp`);
      
      if (otpResponse.data.success) {
        const otp = otpResponse.data.otp;
        console.log(`📱 Generated OTP: ${otp}`);
        
        // Verify OTP with driver
        const verifyResponse = await axios.post(
          `${BASE_URL}/api/driver/${rideForOTP.assigned_driver.id}/verify-otp`,
          { otp: otp }
        );

        if (verifyResponse.data.success) {
          console.log('✅ OTP verified, ride started');
        } else {
          console.log('❌ OTP verification failed:', verifyResponse.data.message);
        }
      }
    }

    // Step 4: Complete the ride
    console.log('\n🏁 Step 4: Completing ride...');
    
    // Get rides that are in progress
    const progressRidesResponse = await axios.get(`${BASE_URL}/api/rides`);
    const progressRides = progressRidesResponse.data.data.filter(r => 
      r.status === 'otp_verified' || r.status === 'in_progress'
    );

    if (progressRides.length > 0) {
      const rideToComplete = progressRides[0];
      console.log(`🚗 Completing ride: ${rideToComplete.id}`);

      const completeResponse = await axios.post(
        `${BASE_URL}/api/ride/${rideToComplete.id}/complete`,
        {
          payment_confirmed: true,
          fare_paid: rideToComplete.estimated_fare?.total_fare || 500
        }
      );

      if (completeResponse.data.success) {
        console.log('🎉 Ride completed successfully!');
        console.log(`💵 Fare paid: ₹${completeResponse.data.fare_paid}`);
      } else {
        console.log('❌ Failed to complete ride:', completeResponse.data.message);
      }
    } else {
      console.log('⚠️ No rides in progress found to complete');
    }

    // Step 5: Check final status
    console.log('\n📊 Step 5: Checking final ride status...');
    const finalRidesResponse = await axios.get(`${BASE_URL}/api/rides`);
    
    if (finalRidesResponse.data.success) {
      const finalRides = finalRidesResponse.data.data || [];
      const finalActive = finalRides.filter(r => 
        r.status === 'searching_drivers' || 
        r.status === 'driver_accepted' || 
        r.status === 'in_progress' ||
        r.status === 'en_route'
      );
      const completed = finalRides.filter(r => r.status === 'completed');

      console.log(`📈 Final Results:`);
      console.log(`   🔄 Active rides: ${finalActive.length}`);
      console.log(`   ✅ Completed rides: ${completed.length}`);
      console.log(`   📋 Total rides: ${finalRides.length}`);
    }

    console.log('\n✅ Emergency completion test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run test
testEmergencyCompletion();
