const axios = require('axios');
const twilio = require('twilio');
const Razorpay = require('razorpay');

// Test configuration
const config = {
  twilio: {
    accountSid: 'ACa4cc047c52d3f093275ff9144c4ec351',
    authToken: 'fcc0e7431199c26382f30bc3a0ccda22',
    phoneNumber: '+16674463150'
  },
  razorpay: {
    keyId: 'rzp_test_RFghxBO5zdCwb',
    keySecret: 'c4kCtdCxSaNBZmJvcQWZL2LY'
  },
  rapidapi: {
    key: '960c7ab24amsh311ecec7c41e63cp183660jsn012f10980c13',
    host: 'google-map-places-new-v2.p.rapidapi.com'
  }
};

async function testTwilio() {
  console.log('🧪 Testing Twilio SMS Service...');
  try {
    const client = twilio(config.twilio.accountSid, config.twilio.authToken);
    
    // Test account verification instead of sending SMS
    const account = await client.api.accounts(config.twilio.accountSid).fetch();
    
    console.log('✅ Twilio Test: SUCCESS');
    console.log(`   Account: ${account.friendlyName}`);
    console.log(`   Status: ${account.status}`);
    return true;
  } catch (error) {
    console.log('❌ Twilio Test: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testRazorpay() {
  console.log('🧪 Testing Razorpay Payment Service...');
  try {
    const razorpay = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret
    });
    
    // Test order creation
    const order = await razorpay.orders.create({
      amount: 1000, // ₹10.00
      currency: 'INR',
      receipt: 'test-order-' + Date.now()
    });
    
    console.log('✅ Razorpay Test: SUCCESS');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Amount: ₹${order.amount / 100}`);
    return true;
  } catch (error) {
    console.log('❌ Razorpay Test: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testRapidAPI() {
  console.log('🧪 Testing RapidAPI Google Maps Places...');
  try {
    // First, let's check if we can access the API
    const response = await axios.get('https://google-map-places-new-v2.p.rapidapi.com/v1/places:autocomplete', {
      headers: {
        'x-rapidapi-host': config.rapidapi.host,
        'x-rapidapi-key': config.rapidapi.key
      },
      params: {
        input: "Hospital",
        locationBias: JSON.stringify({
          circle: {
            center: { latitude: 28.6139, longitude: 77.2090 },
            radius: 10000
          }
        }),
        includedPrimaryTypes: "hospital",
        includedRegionCodes: "IN"
      }
    });
    
    console.log('✅ RapidAPI Test: SUCCESS');
    console.log(`   Status: ${response.status}`);
    console.log(`   Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.log('❌ RapidAPI Test: FAILED');
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
    if (error.response?.status === 403) {
      console.log('   💡 You need to subscribe to the Google Maps Places API on RapidAPI');
      console.log('   🔗 Visit: https://rapidapi.com/googlecloud/api/google-map-places-new-v2');
    }
    return false;
  }
}

async function testBasicConnectivity() {
  console.log('🧪 Testing Basic Internet Connectivity...');
  try {
    const response = await axios.get('https://httpbin.org/get', { timeout: 5000 });
    console.log('✅ Internet Test: SUCCESS');
    console.log(`   Status: ${response.status}`);
    return true;
  } catch (error) {
    console.log('❌ Internet Test: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚑 Aapat Emergency Service - API Keys Test\n');
  console.log('=' .repeat(50));
  
  const results = {
    internet: await testBasicConnectivity(),
    twilio: await testTwilio(),
    razorpay: await testRazorpay(),
    rapidapi: await testRapidAPI()
  };
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results Summary:');
  console.log('=' .repeat(50));
  
  Object.entries(results).forEach(([service, success]) => {
    const status = success ? '✅ WORKING' : '❌ FAILED';
    console.log(`${service.toUpperCase().padEnd(12)}: ${status}`);
  });
  
  const workingCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log('=' .repeat(50));
  console.log(`Overall Status: ${workingCount}/${totalCount} services working`);
  
  if (workingCount === totalCount) {
    console.log('🎉 All services are working perfectly!');
  } else {
    console.log('⚠️  Some services need attention. Check the errors above.');
  }
  
  console.log('\n📋 Next Steps:');
  if (!results.rapidapi) {
    console.log('1. Subscribe to Google Maps Places API on RapidAPI');
    console.log('   🔗 https://rapidapi.com/googlecloud/api/google-map-places-new-v2');
  }
  if (!results.twilio) {
    console.log('2. Verify Twilio credentials in your account');
    console.log('   🔗 https://console.twilio.com/');
  }
  if (!results.razorpay) {
    console.log('3. Check Razorpay API keys in your dashboard');
    console.log('   🔗 https://dashboard.razorpay.com/');
  }
}

// Run tests
runAllTests().catch(console.error);
