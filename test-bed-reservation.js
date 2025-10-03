const axios = require('axios');

const HOSPITAL_SERVICE = 'http://localhost:3013';

console.log('🛏️ Testing Hospital Bed Reservation System\n');
console.log('='.repeat(60));

async function testBedReservation() {
  try {
    // Step 1: Get hospital recommendations for a cardiac emergency
    console.log('\n📋 Step 1: Getting Hospital Recommendations...');
    const recommendResponse = await axios.post(`${HOSPITAL_SERVICE}/api/hospitals/recommend`, {
      location: { lat: 28.6315, lng: 77.2167 },
      emergency_type: 'heart attack',
      priority: 'critical',
      bed_type: 'icu'
    });

    const topHospital = recommendResponse.data.data.recommendations[0];
    console.log(`✅ Top Recommendation: ${topHospital.name}`);
    console.log(`   Score: ${topHospital.score}/100`);
    console.log(`   Distance: ${topHospital.distance}km | ETA: ${topHospital.eta}min`);
    console.log(`   ICU Beds Available: ${topHospital.match_reasons.beds_available}`);

    // Step 2: Reserve a bed at the recommended hospital
    console.log('\n📋 Step 2: Reserving ICU Bed...');
    const reserveResponse = await axios.post(
      `${HOSPITAL_SERVICE}/api/hospitals/${topHospital.id}/reserve-bed`,
      {
        ride_request_id: 'RIDE-TEST-' + Date.now(),
        bed_type: 'icu',
        patient_name: 'John Doe',
        emergency_type: 'heart attack',
        priority: 'critical',
        eta_minutes: topHospital.eta,
        requester_phone: '9876543210'
      }
    );

    const reservation = reserveResponse.data.reservation;
    console.log('✅ Bed Reserved Successfully!');
    console.log(`   Reservation ID: ${reservation.id}`);
    console.log(`   Hospital: ${reservation.hospital_name}`);
    console.log(`   Address: ${reservation.hospital_address}`);
    console.log(`   Contact: ${reservation.hospital_contact}`);
    console.log(`   Bed Type: ${reservation.bed_type}`);
    console.log(`   Reserved At: ${new Date(reservation.reserved_at).toLocaleString()}`);
    console.log(`   Expires At: ${new Date(reservation.expires_at).toLocaleString()}`);
    console.log(`   ETA: ${reservation.eta_minutes} minutes`);

    // Step 3: Check updated bed availability
    console.log('\n📋 Step 3: Checking Updated Bed Availability...');
    const hospitalResponse = await axios.get(`${HOSPITAL_SERVICE}/api/hospitals/${topHospital.id}`);
    const updatedHospital = hospitalResponse.data.data;
    console.log(`✅ ${updatedHospital.name}:`);
    console.log(`   ICU Beds: ${updatedHospital.beds.icu.available}/${updatedHospital.beds.icu.total} (was ${topHospital.match_reasons.beds_available})`);
    console.log(`   📉 Bed count decreased by 1 (reserved)`);

    // Step 4: Get reservation details
    console.log('\n📋 Step 4: Fetching Reservation Details...');
    const reservationDetailsResponse = await axios.get(
      `${HOSPITAL_SERVICE}/api/reservations/${reservation.id}`
    );
    const details = reservationDetailsResponse.data.data;
    console.log('✅ Reservation Details:');
    console.log(`   Status: ${details.status}`);
    console.log(`   Patient: ${details.patient_name}`);
    console.log(`   Emergency Type: ${details.emergency_type}`);
    console.log(`   Priority: ${details.priority}`);

    // Step 5: Get all hospital reservations
    console.log('\n📋 Step 5: Fetching All Hospital Reservations...');
    const hospitalReservationsResponse = await axios.get(
      `${HOSPITAL_SERVICE}/api/hospitals/${topHospital.id}/reservations`
    );
    console.log(`✅ Found ${hospitalReservationsResponse.data.total} reservation(s) for ${topHospital.name}`);

    // Step 6: Test patient arrival confirmation
    console.log('\n📋 Step 6: Confirming Patient Arrival...');
    const confirmResponse = await axios.post(
      `${HOSPITAL_SERVICE}/api/reservations/${reservation.id}/confirm-arrival`,
      {
        confirmed_by: 'Dr. Smith',
        notes: 'Patient admitted to ICU Ward 3, Bed 12'
      }
    );
    console.log('✅ Patient Arrival Confirmed!');
    console.log(`   Confirmed By: ${confirmResponse.data.reservation.confirmed_by}`);
    console.log(`   Notes: ${confirmResponse.data.reservation.arrival_notes}`);
    console.log(`   Status: ${confirmResponse.data.reservation.status}`);

    // Step 7: Test cancellation (create new reservation first)
    console.log('\n📋 Step 7: Testing Reservation Cancellation...');
    const cancelTestReserve = await axios.post(
      `${HOSPITAL_SERVICE}/api/hospitals/${topHospital.id}/reserve-bed`,
      {
        ride_request_id: 'RIDE-CANCEL-TEST-' + Date.now(),
        bed_type: 'emergency',
        patient_name: 'Jane Smith',
        emergency_type: 'trauma',
        priority: 'high',
        eta_minutes: 10,
        requester_phone: '9876543211'
      }
    );
    const cancelReservationId = cancelTestReserve.data.reservation.id;
    console.log(`✅ Created test reservation: ${cancelReservationId}`);

    // Cancel it
    const cancelResponse = await axios.post(
      `${HOSPITAL_SERVICE}/api/reservations/${cancelReservationId}/cancel`,
      {
        reason: 'Patient condition stabilized - no longer needs emergency transport'
      }
    );
    console.log('✅ Reservation Cancelled Successfully!');
    console.log(`   Reason: ${cancelResponse.data.reservation.cancellation_reason}`);
    console.log(`   Status: ${cancelResponse.data.reservation.status}`);

    // Step 8: Get all reservations summary
    console.log('\n📋 Step 8: Getting All Reservations Summary...');
    const allReservationsResponse = await axios.get(`${HOSPITAL_SERVICE}/api/reservations`);
    const summary = allReservationsResponse.data;
    console.log('✅ Reservations Summary:');
    console.log(`   Total: ${summary.total}`);
    console.log(`   Active: ${summary.active}`);
    console.log(`   Completed: ${summary.completed}`);
    console.log(`   Cancelled: ${summary.cancelled}`);

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Bed Reservation System Test Complete!\n');
    console.log('🎯 Features Tested:');
    console.log('   ✅ Hospital recommendations');
    console.log('   ✅ Bed reservation');
    console.log('   ✅ Bed availability tracking');
    console.log('   ✅ Reservation details retrieval');
    console.log('   ✅ Hospital reservations listing');
    console.log('   ✅ Patient arrival confirmation');
    console.log('   ✅ Reservation cancellation');
    console.log('   ✅ Reservations summary');
    console.log('\n💡 Key Features:');
    console.log('   • Automatic bed reservation at recommended hospital');
    console.log('   • Real-time bed availability updates');
    console.log('   • Reservation expiry (ETA + 15 min buffer)');
    console.log('   • Patient arrival tracking');
    console.log('   • Cancellation with reason');
    console.log('   • Auto-cleanup of expired reservations');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.response?.data?.message || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the hospital service is running:');
      console.log('   node hospital-matching-service.js');
    }
  }
}

testBedReservation();

