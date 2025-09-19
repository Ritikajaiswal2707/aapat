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
    
    // Test SMS sending
    const message = await client.messages.create({
      body: '🚑 Aapat Emergency Service Test - SMS is working!',
      from: config.twilio.phoneNumber,
      to: '+919876543210' // Replace with your test number
    });
    
    console.log('✅ Twilio SMS Test: SUCCESS');
    console.log(`   Message SID: ${message.sid}`);
    console.log(`   Status: ${message.status}`);
    return true;
  } catch (error) {
    console.log('❌ Twilio SMS Test: FAILED');
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
    
    console.log('✅ Razorpay Payment Test: SUCCESS');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Amount: ₹${order.amount / 100}`);
    return true;
  } catch (error) {
    console.log('❌ Razorpay Payment Test: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testDatabase() {
  console.log('🧪 Testing Database Connection...');
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      user: 'aapat_user',
      host: 'postgres',
      database: 'aapat_db',
      password: 'aapat_password',
      port: 5432,
    });
    
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database Test: SUCCESS');
    console.log(`   Current Time: ${result.rows[0].current_time}`);
    await pool.end();
    return true;
  } catch (error) {
    console.log('❌ Database Test: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testRedis() {
  console.log('🧪 Testing Redis Connection...');
  try {
    const redis = require('redis');
    const client = redis.createClient({
      host: 'redis',
      port: 6379,
    });
    
    await client.connect();
    await client.set('test_key', 'Aapat Emergency Service');
    const value = await client.get('test_key');
    await client.del('test_key');
    await client.disconnect();
    
    console.log('✅ Redis Test: SUCCESS');
    console.log(`   Test Value: ${value}`);
    return true;
  } catch (error) {
    console.log('❌ Redis Test: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testRapidAPI() {
  console.log('🧪 Testing RapidAPI Google Maps Places...');
  try {
    const response = await axios.post('https://google-map-places-new-v2.p.rapidapi.com/v1/places:autocomplete', {
      input: "Hospital",
      locationBias: {
        circle: {
          center: { latitude: 28.6139, longitude: 77.2090 }, // Delhi coordinates
          radius: 10000
        }
      },
      includedPrimaryTypes: ["hospital"],
      includedRegionCodes: ["IN"],
      languageCode: "en",
      regionCode: "IN",
      origin: { latitude: 28.6139, longitude: 77.2090 },
      inputOffset: 0,
      includeQueryPredictions: true,
      sessionToken: ""
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': '*',
        'x-rapidapi-host': config.rapidapi.host,
        'x-rapidapi-key': config.rapidapi.key
      }
    });
    
    console.log('✅ RapidAPI Google Maps Test: SUCCESS');
    console.log(`   Found ${response.data.suggestions?.length || 0} hospital suggestions`);
    if (response.data.suggestions && response.data.suggestions.length > 0) {
      console.log(`   First result: ${response.data.suggestions[0].placePrediction?.text?.text || 'N/A'}`);
    }
    return true;
  } catch (error) {
    console.log('❌ RapidAPI Google Maps Test: FAILED');
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚑 Aapat Emergency Service - API Keys Test\n');
  console.log('=' .repeat(50));
  
  const results = {
    twilio: await testTwilio(),
    razorpay: await testRazorpay(),
    database: await testDatabase(),
    redis: await testRedis(),
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
}

// Run tests
runAllTests().catch(console.error);
