const axios = require('axios');

async function forceCompleteRides() {
  try {
    console.log('🔄 Forcing Emergency Completion Test');
    console.log('=================================');
    
    // Get all rides
    const ridesResponse = await axios.get('http://localhost:3012/api/rides');
    const rides = ridesResponse.data.data || [];
    
    console.log(`📊 Total rides found: ${rides.length}`);
    
    // Filter active rides (those that count as active emergencies)
    const activeRides = rides.filter(r => 
      r.status === 'searching_drivers' || 
      r.status === 'broadcasting' || 
      r.status === 'pending_assignment' ||
      r.status === 'driver_accepted' ||
      r.status === 'otp_generated' ||
      r.status === 'otp_verified' ||
      r.status === 'in_progress' ||
      r.status === 'en_route'
    );
    
    console.log(`🔄 Active emergencies: ${activeRides.length}`);
    
    if (activeRides.length > 0) {
      console.log('\n🏁 Forcing completion of active rides...');
      
      for (const ride of activeRides.slice(0, 1)) { // Complete just one for demo
        console.log(`📝 Ride ${ride.id} - Current status: ${ride.status}`);
        
        // Try to complete it directly
        try {
          const completeResponse = await axios.post(
            `http://localhost:3012/api/ride/${ride.id}/complete`,
            {
              payment_confirmed: true,
              fare_paid: 400
            }
          );
          
          if (completeResponse.data.success) {
            console.log(`✅ Ride ${ride.id} completed!`);
            console.log(`💵 Fare paid: ₹${completeResponse.data.fare_paid}`);
          } else {
            console.log(`❌ Failed to complete ride ${ride.id}: ${completeResponse.data.message}`);
          }
        } catch (error) {
          console.log(`❌ Error completing ride ${ride.id}:`, error.response?.data?.message || error.message);
        }
      }
    } else {
      console.log('\n⚠️ No active rides found to complete');
    }
    
    // Check metrics after completion
    console.log('\n📊 Checking metrics after completion...');
    
    const finalRidesResponse = await axios.get('http://localhost:3012/api/rides');
    const finalRides = finalRidesResponse.data.data || [];
    
    const finalActive = finalRides.filter(r => 
      r.status === 'searching_drivers' || 
      r.status === 'broadcasting' || 
      r.status === 'pending_assignment' ||
      r.status === 'driver_accepted' ||
      r.status === 'otp_generated' ||
      r.status === 'otp_verified' ||
      r.status === 'in_progress' ||
      r.status === 'en_route'
    );
    
    const completed = finalRides.filter(r => r.status === 'completed');
    
    console.log('📈 Final Results:');
    console.log(`   🔄 Active emergencies: ${finalActive.length} ${finalActive.length < activeRides.length ? '📉 (DECREASED!)' : ''}`);
    console.log(`   ✅ Completed emergencies: ${completed.length}`);
    console.log(`   📋 Total emergencies: ${finalRides.length}`);
    
    // Demonstrate that active count decreased
    if (finalActive.length < activeRides.length) {
      console.log('\n🎉 SUCCESS! Active emergency count decreased!');
      console.log(`   📉 Before: ${activeRides.length} active`);
      console.log(`   📉 After: ${finalActive.length} active`);
      console.log(`   📊 Reduction: ${activeRides.length - finalActive.length} emergency completed`);
    } else {
      console.log('\n⚠️ Active emergency count unchanged');
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

forceCompleteRides();
