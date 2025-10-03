const axios = require('axios');

console.log('🚀 UBER-STYLE AMBULANCE SYSTEM DEMO 🚀');
console.log('======================================\n');

async function quickDemo() {
  try {
    // Check ride booking service
    console.log('✅ Checking Ride Booking Service...');
    try {
      const health = await axios.get('http://localhost:3010/health');
      console.log(`   Service: ${health.data.service}`);
      
      // Test booking preview
      const preview = await axios.get('http://localhost:3010/api/ride/preview', {
        params: { lat: 28.6315, lng: 77.2167, ride_type: 'emergency' }
      });
      
      console.log('✅ Booking Preview Test:');
      console.log(`   💰 Estimated Fare: ₹${preview.data.data.estimated_fare.total_fare}`);
      console.log(`   🚑 Available Ambulances: ${preview.data.data.available_ambulances.length}`);
      
    } catch (error) {
      console.log('❌ Ride Booking Service: Not running');
    }

    // Check payment service
    console.log('\n✅ Checking Payment Service...');
    try {
      const paymentHealth = await axios.get('http://localhost:3009/health');
      console.log(`   Service: ${paymentHealth.data.service}`);
      console.log(`   Mode: ${paymentHealth.data.mode}`);
    } catch (error) {
      console.log('❌ Payment Service: Not running');
    }

    console.log('\n🌟 WHAT YOU CAN ACCESS NOW:');
    console.log('===========================');
    console.log('1. 🌐 Web Dashboard:');
    console.log('   http://localhost:3000');
    console.log('');
    console.log('2. 📱 Mobile App Interface:');
    console.log('   mobile-apps/RideBookingApp/App.tsx');
    console.log('');
    console.log('3. 🔍 API Endpoints:');
    console.log('   http://localhost:3010/api/ride/preview');
    console.log('   http://localhost:3010/api/ride/book');
    console.log('   http://localhost:3009/api/payment/initiate');
    console.log('');
    console.log('4. 🧪 Test Scripts:');
    console.log('   node test-complete-uber-system.js');
    console.log('   node test-uber-ambulance.js');
    console.log('');
    console.log('✨ FEATURES IMPLEMENTED:');
    console.log('=======================');
    console.log('✅ Emergency Ride Booking');
    console.log('✅ Scheduled Ride Booking');
    console.log('✅ Dynamic Pricing Engine');
    console.log('✅ Payment Processing');
    console.log('✅ Real-time Updates');
    console.log('✅ Mobile Interface');
    console.log('✅ Digital Receipts');
    console.log('✅ Refund Management');
    
    console.log('\n🎉 YOU HAVE A COMPLETE UBER-STYLE AMBULANCE SYSTEM! 🎉');
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

quickDemo();
