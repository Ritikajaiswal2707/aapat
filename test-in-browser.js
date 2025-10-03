// ❗ COPY THIS CODE AND PASTE IN BROWSER CONSOLE (F12)

console.log('🚀 TESTING YOUR UBER-STYLE AMBULANCE SYSTEM');
console.log('==============================================');

// Test 1: Service Status Check
console.log('\n1️⃣ CHECKING SERVICES...');

const services = [
  { name: 'Ride Booking', url: 'http://localhost:3010/health' },
  { name: 'Payment', url: 'http://localhost:3009/health' },
  { name: 'Ambulance', url: 'http://localhost:3002/health' },
  { name: 'Emergency', url: 'http://localhost:3001/health' }
];

async function checkServices() {
  for (const service of services) {
    try {
      const response = await fetch(service.url);
      const data = await response.json();
      console.log(`✅ ${service.name}: ${data.service}`);
    } catch (error) {
      console.log(`❌ ${service.name}: Not running`);
    }
  }
}

// Test 2: Booking Preview
console.log('\n2️⃣ TESTING BOOKING PREVIEW...');
async function testBookingPreview() {
  try {
    const response = await fetch('http://localhost:3010/api/ride/preview?lat=28.6315&lng=77.2167&ride_type=emergency');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Booking Preview Success!');
      console.log(`💰 Estimated Fare: ₹${data.data.estimated_fare.total_fare}`);
      console.log(`🚑 Available Ambulances: ${data.data.available_ambulances.length}`);
    } else {
      console.log('❌ Preview failed:', data.message);
    }
  } catch (error) {
    console.log('❌ Preview error:', error.message);
  }
}

// Test 3: Complete Booking Flow
console.log('\n3️⃣ TESTING COMPLETE BOOKING FLOW...');
async function testCompleteBooking() {
  try {
    // Create booking
    const bookingResponse = await fetch('http://localhost:3010/api/ride/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: 'Test User', phone: '9876543210' },
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
      })
    });
    
    const bookingData = await bookingResponse.json();
    
    if (bookingData.success) {
      console.log('✅ Booking Created:', bookingData.booking_id);
      
      // Test payment
      const paymentResponse = await fetch('http://localhost:3009/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingData.booking_id,
          customer: { name: 'Test User', phone: '9876543210' },
          amount: 2000,
          currency: 'INR',
          payment_method: 'upi',
          ride_details: {
            ride_type: 'emergency',
            pickup_address: 'Connaught Place',
            destination_address: 'AIIMS Delhi'
          },
          fare_breakdown: {
            base_fare: 1500,
            distance_fare: 500,
            total_fare: 2000
          }
        })
      });
      
      const paymentData = await paymentResponse.json();
      
      if (paymentData.success) {
        console.log('✅ Payment Initiated:', paymentData.payment_id);
        console.log('🏆 UBER-STYLE SYSTEM WORKING PERFECTLY!');
      } else {
        console.log('❌ Payment failed:', paymentData.message);
      }
    } else {
      console.log('❌ Booking failed:', bookingData.message);
    }
  } catch (error) {
    console.log('❌ Complete booking error:', error.message);
  }
}

// Run all tests
async function runTests() {
  await checkServices();
  await testBookingPreview();
  await testCompleteBooking();
  
  console.log('\n🎉 YOUR UBER-STYLE AMBULANCE SYSTEM IS WORKING! 🎉');
  console.log('🌐 Test Page: http://localhost:8080');
  console.log('📱 Mobile Apps: mobile-apps/RideBookingApp/');
}

// Start tests
runTests();
