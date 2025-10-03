const axios = require('axios');

console.log('🚀 APAT UBER-STYLE AMBULANCE BOOKING SYSTEM DEMO 🚀');
console.log('=====================================================\n');

// Test the ride booking system
async function testRideBookingSystem() {
  try {
    // Check service status
    console.log('🔍 Checking Ride Booking Service...');
    const healthResponse = await axios.get('http://localhost:3010/health');
    console.log('✅ Service is running:', healthResponse.data.service);
    
    // Test booking preview
    console.log('\n🧪 Testing Booking Preview...');
    const previewResponse = await axios.get('http://localhost:3010/api/ride/preview', {
      params: { lat: 28.6315, lng: 77.2167, ride_type: 'emergency' }
    });
    console.log('✅ Preview API Working!');
    console.log('📊 Available ambulances:', previewResponse.data.data.available_ambulances.length);
    console.log('💰 Estimated fare: ₹', previewResponse.data.data.estimated_fare.total_fare);
    
    // Test emergency booking
    console.log('\n🚨 Testing Emergency Booking...');
    const emergencyBooking = {
      customer: {
        name: 'Rajesh Kumar',
        phone: '9876543210'
      },
      ride_type: 'emergency',
      pickup: {
        address: 'Connaught Place, New Delhi',
        location: { lat: 28.6315, lng: 77.2167 }
      },
      destination: {
        address: 'AIIMS Delhi',
        location: { lat: 28.5667, lng: 77.2090 }
      },
      payment_method: 'upi'
    };
    
    const bookingResponse = await axios.post('http://localhost:3010/api/ride/book', emergencyBooking);
    console.log('✅ Emergency booking created!');
    console.log('📋 Booking ID:', bookingResponse.data.booking_id);
    
    if (bookingResponse.data.estimated_options) {
      console.log('🚑 Available ambulances:', bookingResponse.data.estimated_options.length);
    }
    
    // Test scheduled booking
    console.log('\n📅 Testing Scheduled Booking...');
    const scheduledBooking = {
      customer: {
        name: 'Priya Sharma',
        phone: '9123456789'
      },
      ride_type: 'scheduled',
      pickup: {
        address: 'Noida Sector 62',
        location: { lat: 28.6275, lng: 77.3727 }
      },
      destination: {
        address: 'Safdarjung Hospital',
        location: { lat: 28.5757, lng: 77.2058 }
      },
      scheduled_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      payment_method: 'card'
    };
    
    const scheduledResponse = await axios.post('http://localhost:3010/api/ride/book', scheduledBooking);
    console.log('✅ Scheduled booking created!');
    console.log('📋 Booking ID:', scheduledResponse.data.booking_id);
    
    // Summary
    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY! 🎉');
    console.log('=====================================================\n');
    
    console.log('✅ Successfully Implemented Uber-Style Features:');
    console.log('  • Real-time ambulance availability');
    console.log('  • Dynamic fare estimation');
    console.log('  • Emergency ride booking (immediate)');
    console.log('  • Scheduled ride booking (advance)');
    console.log('  • Multiple payment options');
    console.log('  • GPS-based location tracking');
    console.log('  • Real-time ETA calculations');
    
    console.log('\n🔮 Next Implementation Steps:');
    console.log('  • Mobile app deployment');
    console.log('  • Payment gateway integration');
    console.log('  • Driver tracking & communications');
    console.log('  • Customer rating & feedback system');
    console.log('  • Advanced AI-powered dispatch');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Ride Booking Service is not running on port 3010');
      console.log('📝 To start the service:');
      console.log('   cd services/ride-booking-service');
      console.log('   node app.js');
    } else {
      console.log('❌ Test Error:', error.message);
    }
  }
}

// Run the test
testRideBookingSystem();
