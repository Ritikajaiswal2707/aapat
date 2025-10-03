const axios = require('axios');

const HOSPITAL_SERVICE = 'http://localhost:3013';
const DRIVER_SERVICE = 'http://localhost:3012';

console.log('🏥 Testing Hospital Integration System\n');
console.log('=' .repeat(60));

async function testSystem() {
  try {
    // Step 1: Check hospital service health
    console.log('\n📋 Step 1: Checking Hospital Service...');
    const healthCheck = await axios.get(`${HOSPITAL_SERVICE}/health`);
    console.log('✅ Hospital Service:', healthCheck.data.status);
    console.log(`   Total Hospitals: ${healthCheck.data.total_hospitals}`);

    // Step 2: Get all hospitals
    console.log('\n📋 Step 2: Fetching All Hospitals...');
    const hospitalsResponse = await axios.get(`${HOSPITAL_SERVICE}/api/hospitals`);
    const hospitals = hospitalsResponse.data.data;
    console.log(`✅ Found ${hospitals.length} hospitals`);
    hospitals.slice(0, 3).forEach(h => {
      console.log(`   • ${h.name}`);
      console.log(`     Beds: ${h.beds.general.available}/${h.beds.general.total} General, ${h.beds.icu.available}/${h.beds.icu.total} ICU`);
    });

    // Step 3: Test hospital recommendation for a CARDIAC emergency
    console.log('\n📋 Step 3: Getting Recommendations for CARDIAC Emergency...');
    const cardiacRecommendation = await axios.post(`${HOSPITAL_SERVICE}/api/hospitals/recommend`, {
      location: { lat: 28.6315, lng: 77.2167 },
      emergency_type: 'heart attack',
      priority: 'critical',
      bed_type: 'icu'
    });

    const cardiacRecs = cardiacRecommendation.data.data.recommendations;
    console.log(`✅ Found ${cardiacRecs.length} recommendations`);
    console.log(`   Required Specialty: ${cardiacRecommendation.data.data.required_specialty}`);
    console.log(`   Required Equipment: ${cardiacRecommendation.data.data.required_equipment.join(', ')}`);
    
    console.log('\n   🏆 Top 3 Recommended Hospitals:');
    cardiacRecs.slice(0, 3).forEach((h, i) => {
      console.log(`   ${i + 1}. ${h.name} ${h.recommended ? '⭐' : ''}`);
      console.log(`      Score: ${h.score}/100 | Distance: ${h.distance}km | ETA: ${h.eta}min`);
      console.log(`      Available Beds: ${h.match_reasons.beds_available}`);
      console.log(`      Specialty Match: ${h.match_reasons.specialty_match ? '✅' : '❌'}`);
      console.log(`      Equipment Match: ${h.match_reasons.has_required_equipment ? '✅' : '❌'}`);
    });

    // Step 4: Test hospital recommendation for a TRAUMA emergency
    console.log('\n📋 Step 4: Getting Recommendations for TRAUMA Emergency...');
    const traumaRecommendation = await axios.post(`${HOSPITAL_SERVICE}/api/hospitals/recommend`, {
      location: { lat: 28.5672, lng: 77.2100 },
      emergency_type: 'accident',
      priority: 'high',
      bed_type: 'emergency'
    });

    const traumaRecs = traumaRecommendation.data.data.recommendations;
    console.log(`✅ Top Recommendation: ${traumaRecs[0].name}`);
    console.log(`   Distance: ${traumaRecs[0].distance}km | ETA: ${traumaRecs[0].eta}min`);
    console.log(`   Score: ${traumaRecs[0].score}/100`);

    // Step 5: Create a ride request and verify hospital recommendations
    console.log('\n📋 Step 5: Creating Ride Request with Hospital Recommendations...');
    const rideRequest = await axios.post(`${DRIVER_SERVICE}/api/ride/request`, {
      customer: {
        name: 'Test Patient',
        phone: '9876543210'
      },
      ride_type: 'emergency',
      pickup_location: {
        lat: 28.6315,
        lng: 77.2167,
        address: 'Test Location, Delhi'
      },
      medical_info: {
        emergency_type: 'heart attack',
        priority: 'critical',
        symptoms: ['chest pain', 'shortness of breath']
      },
      payment_method: 'upi'
    });

    if (rideRequest.data.success) {
      const ride = rideRequest.data.data || rideRequest.data;
      const rideId = ride.ride_request_id || ride.id;
      console.log('✅ Ride Request Created:', rideId);
      
      if (ride.recommended_hospitals && ride.recommended_hospitals.length > 0) {
        console.log(`\n   🏥 Recommended Hospitals for this Emergency:`);
        ride.recommended_hospitals.forEach((h, i) => {
          console.log(`   ${i + 1}. ${h.name} ${h.recommended ? '⭐ RECOMMENDED' : ''}`);
          console.log(`      Distance: ${h.distance}km | ETA: ${h.eta}min | Score: ${h.score}`);
        });
      } else {
        console.log('   ⚠️ No hospital recommendations received');
      }
    } else {
      console.log('❌ Ride request failed:', rideRequest.data.message);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Hospital Integration Test Complete!\n');
    console.log('🎯 Features Tested:');
    console.log('   • Hospital service health check');
    console.log('   • Fetching all hospitals');
    console.log('   • Intelligent hospital matching (Cardiac)');
    console.log('   • Intelligent hospital matching (Trauma)');
    console.log('   • Ride request with hospital recommendations');
    console.log('\n💡 The system automatically recommends hospitals based on:');
    console.log('   • Emergency type & severity');
    console.log('   • Distance from pickup location');
    console.log('   • Bed availability (General/ICU/Emergency)');
    console.log('   • Hospital specialties');
    console.log('   • Required equipment availability');
    console.log('   • Hospital rating');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.response?.data?.message || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure services are running:');
      console.log('   1. node hospital-matching-service.js');
      console.log('   2. node uber-style-driver-matching-service.js');
    }
  }
}

testSystem();

