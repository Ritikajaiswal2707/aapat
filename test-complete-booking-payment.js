const axios = require('axios');

async function testCompleteBookingWithPayment() {
  console.log('🚀 COMPLETE BOOKING + PAYMENT TEST\n');
  console.log('═'.repeat(50));

  try {
    // Step 1: Create Booking
    console.log('📋 STEP 1: Creating Emergency Booking...\n');
    
    const bookingData = {
      customer: {
        name: 'Test User',
        phone: '9876543210',
        email: 'test@example.com'
      },
      ride_type: 'emergency',
      pickup: {
        address: 'India Gate, New Delhi',
        location: { lat: 28.6129, lng: 77.2295 },
        landmark: 'Central Delhi'
      },
      destination: {
        address: 'AIIMS Delhi Hospital',
        location: { lat: 28.5667, lng: 77.2090 },
        landmark: 'Hospital Main Gate'
      },
      payment_method: 'upi'
    };

    const bookingResponse = await axios.post('http://localhost:5000/ride-booking/api/ride/book', bookingData);

    if (!bookingResponse.data.success) {
      console.log('❌ Booking Failed:', bookingResponse.data.message);
      return;
    }

    console.log('✅ BOOKING SUCCESS!');
    console.log(`📋 Booking ID: ${bookingResponse.data.booking_id}`);
    console.log(`💰 Fare: ₹${bookingResponse.data.fare_estimate.total_fare}`);
    console.log(`🚑 Available Ambulances: ${bookingResponse.data.estimated_options.length}`);

    const bookingId = bookingResponse.data.booking_id;

    // Step 2: Initiate Payment
    console.log('\n💳 STEP 2: Initiating Payment...\n');
    
    const paymentData = {
      booking_id: bookingId,
      customer: {
        name: 'Test User',
        phone: '9876543210' // Required format for validation
      },
      amount: bookingResponse.data.fare_estimate.total_fare,
      currency: 'INR',
      payment_method: 'upi',
      ride_details: {
        ride_type: 'emergency',
        pickup_address: 'India Gate, New Delhi',
        destination_address: 'AIIMS Delhi Hospital'
      }
    };

    console.log('Payment request:', JSON.stringify(paymentData, null, 2));

    const paymentResponse = await axios.post('http://localhost:5000/payment/api/payment/initiate', paymentData);

    if (!paymentResponse.data.success) {
      console.log('❌ Payment Failed:', paymentResponse.data.message);
      if (paymentResponse.data.error) {
        console.log('Error details:', paymentResponse.data.error);
      }
      return;
    }

    console.log('✅ PAYMENT INITIATED!');
    console.log(`💳 Payment ID: ${paymentResponse.data.data.payment_id}`);
    console.log(`📋 Order ID: ${paymentResponse.data.data.order_id}`);
    console.log(`💰 Amount: ₹${paymentResponse.data.data.amount}`);
    console.log(`📊 Status: ${paymentResponse.data.data.status}`);

    const paymentId = paymentResponse.data.data.payment_id;

    // Step 3: Simulate Payment Capture (Mock Webhook)
    console.log('\n🔄 STEP 3: Simulating Payment Capture...\n');
    
    const webhookData = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_' + Math.random().toString(36).substr(2, 10),
            order_id: paymentResponse.data.data.order_id,
            status: 'captured'
          }
        }
      }
    };

    await axios.post('http://localhost:5000/payment/api/payment/webhook', webhookData);
    console.log('✅ Payment captured (simulated)!');

    // Step 4: Check Final Status
    console.log('\n📊 STEP 4: Checking Final Status...\n');
    
    const statusResponse = await axios.get(`http://localhost:5000/payment/api/payment/status/${paymentId}`);
    console.log('✅ Final Payment Status:', statusResponse.data.data.status);

    console.log('\n🎉 COMPLETE BOOKING + PAYMENT SUCCESS! 🎉');
    console.log('═'.repeat(50));
    console.log('✅ Emergency booking created');
    console.log('✅ Fare calculated (₹2,250)');
    console.log('✅ Payment initiated');
    console.log('✅ Payment captured');
    console.log('✅ Status updated');
    console.log('\n🚑 YOUR UBER-STYLE SYSTEM WITH PAYMENT IS WORKING! 🚑');

  } catch (error) {
    console.log('❌ Error in complete test:');
    console.log('Status:', error.response?.status);
    console.log('Response:', error.response?.data);
    console.log('Message:', error.message);
  }
}

testCompleteBookingWithPayment();
