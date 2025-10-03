const axios = require('axios');

async function testDirectBooking() {
  console.log('🧪 DIRECT TEST: Emergency Booking...\n');

  const bookingData = {
    customer: {
      name: 'Test User',
      phone: '9876543210'
    },
    ride_type: 'emergency',
    pickup: {
      address: 'India Gate, New Delhi',
      location: { lat: 28.6129, lng: 77.2295 }
    },
    destination: {
      address: 'AIIMS Delhi',
      location: { lat: 28.5667, lng: 77.2090 }
    },
    payment_method: 'upi'
  };

  try {
    console.log('📡 Calling ride booking service directly...');
    const response = await axios.post('http://localhost:3010/api/ride/book', bookingData);
    
    console.log('✅ Booking Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error Details:');
    console.log('Status:', error.response?.status);
    console.log('Response:', error.response?.data);
    console.log('Message:', error.message);
  }
}

testDirectBooking();
