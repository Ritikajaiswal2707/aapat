const axios = require('axios');

async function debugOTP() {
  try {
    // Get the latest ride
    const ridesResponse = await axios.get('http://localhost:3012/api/rides');
    const rides = ridesResponse.data.data || [];
    
    console.log('All rides:');
    rides.forEach(ride => {
      console.log(`  ${ride.id}: ${ride.status}`);
    });
    
    // Find driver_accepted ride
    const acceptedRide = rides.find(r => r.status === 'driver_accepted');
    
    if (acceptedRide) {
      console.log(`\nFound accepted ride: ${acceptedRide.id}`);
      
      // Try to generate OTP
      console.log('Generating OTP...');
      const otpResponse = await axios.post(`http://localhost:3012/api/ride/${acceptedRide.id}/generate-otp`);
      console.log('OTP Response:', JSON.stringify(otpResponse.data, null, 2));
      
      if (otpResponse.data.success) {
        const otp = otpResponse.data.otp;
        console.log(`Generated OTP: ${otp}`);
        
        // Try to verify OTP
        const driverId = acceptedRide.assigned_driver?.id;
        if (driverId) {
          console.log(`Verifying OTP with driver ${driverId}...`);
          const verifyResponse = await axios.post(`http://localhost:3012/api/driver/${driverId}/verify-otp`, {
            otp: otp
          });
          console.log('Verify Response:', JSON.stringify(verifyResponse.data, null, 2));
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

debugOTP();
