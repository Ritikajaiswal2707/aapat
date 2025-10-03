const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock hospital data with specialties and real-time availability
const hospitals = new Map();

// Bed reservations tracking
const bedReservations = new Map(); // Map<reservationId, reservation>
const hospitalReservations = new Map(); // Map<hospitalId, Set<reservationId>>

const mockHospitals = [
  {
    id: 'hospital-001',
    name: 'AIIMS Delhi',
    location: { lat: 28.5672, lng: 77.2100 },
    address: 'Ansari Nagar, New Delhi',
    contact: '+91-11-26588500',
    specialties: ['cardiac', 'trauma', 'neurology', 'general', 'pediatric', 'burns'],
    equipment: ['icu', 'cath_lab', 'ct_scan', 'mri', 'ventilators', 'dialysis', 'blood_bank'],
    beds: {
      general: { total: 200, available: 45 },
      icu: { total: 50, available: 8 },
      emergency: { total: 30, available: 12 }
    },
    rating: 4.8,
    emergency_ready: true
  },
  {
    id: 'hospital-002',
    name: 'Max Super Specialty Hospital',
    location: { lat: 28.5432, lng: 77.2571 },
    address: 'Saket, New Delhi',
    contact: '+91-11-26515050',
    specialties: ['cardiac', 'neurology', 'orthopedic', 'oncology'],
    equipment: ['icu', 'cath_lab', 'ct_scan', 'mri', 'ventilators', 'blood_bank'],
    beds: {
      general: { total: 150, available: 32 },
      icu: { total: 40, available: 5 },
      emergency: { total: 25, available: 10 }
    },
    rating: 4.7,
    emergency_ready: true
  },
  {
    id: 'hospital-003',
    name: 'Apollo Hospital',
    location: { lat: 28.5425, lng: 77.2975 },
    address: 'Jasola, New Delhi',
    contact: '+91-11-29871090',
    specialties: ['cardiac', 'trauma', 'general', 'maternity', 'pediatric'],
    equipment: ['icu', 'nicu', 'ct_scan', 'mri', 'ventilators', 'blood_bank', 'burn_unit'],
    beds: {
      general: { total: 180, available: 28 },
      icu: { total: 45, available: 12 },
      emergency: { total: 28, available: 8 }
    },
    rating: 4.9,
    emergency_ready: true
  },
  {
    id: 'hospital-004',
    name: 'Fortis Escorts Heart Institute',
    location: { lat: 28.6328, lng: 77.2197 },
    address: 'Okhla Road, New Delhi',
    contact: '+91-11-47135000',
    specialties: ['cardiac', 'vascular'],
    equipment: ['icu', 'cath_lab', 'ct_scan', 'mri', 'ventilators', 'ecmo'],
    beds: {
      general: { total: 120, available: 15 },
      icu: { total: 35, available: 6 },
      emergency: { total: 20, available: 7 }
    },
    rating: 4.9,
    emergency_ready: true
  },
  {
    id: 'hospital-005',
    name: 'Safdarjung Hospital',
    location: { lat: 28.5677, lng: 77.2063 },
    address: 'Safdarjung Enclave, New Delhi',
    contact: '+91-11-26165060',
    specialties: ['trauma', 'general', 'burns', 'orthopedic'],
    equipment: ['icu', 'ct_scan', 'ventilators', 'blood_bank', 'burn_unit'],
    beds: {
      general: { total: 250, available: 62 },
      icu: { total: 60, available: 15 },
      emergency: { total: 40, available: 18 }
    },
    rating: 4.5,
    emergency_ready: true
  },
  {
    id: 'hospital-006',
    name: 'Sir Ganga Ram Hospital',
    location: { lat: 28.6415, lng: 77.1910 },
    address: 'Rajinder Nagar, New Delhi',
    contact: '+91-11-25750000',
    specialties: ['general', 'cardiac', 'neurology', 'respiratory', 'gastroenterology'],
    equipment: ['icu', 'ct_scan', 'mri', 'ventilators', 'blood_bank', 'dialysis'],
    beds: {
      general: { total: 160, available: 38 },
      icu: { total: 42, available: 9 },
      emergency: { total: 22, available: 11 }
    },
    rating: 4.7,
    emergency_ready: true
  },
  {
    id: 'hospital-007',
    name: 'Manipal Hospital',
    location: { lat: 28.5672, lng: 77.2652 },
    address: 'Dwarka, New Delhi',
    contact: '+91-11-45440000',
    specialties: ['general', 'maternity', 'pediatric', 'orthopedic'],
    equipment: ['icu', 'nicu', 'ct_scan', 'ventilators', 'blood_bank'],
    beds: {
      general: { total: 140, available: 42 },
      icu: { total: 38, available: 11 },
      emergency: { total: 24, available: 13 }
    },
    rating: 4.6,
    emergency_ready: true
  },
  {
    id: 'hospital-008',
    name: 'BLK Super Specialty Hospital',
    location: { lat: 28.6507, lng: 77.1719 },
    address: 'Pusa Road, New Delhi',
    contact: '+91-11-30403040',
    specialties: ['cardiac', 'neurology', 'oncology', 'orthopedic'],
    equipment: ['icu', 'cath_lab', 'ct_scan', 'mri', 'ventilators', 'pet_scan'],
    beds: {
      general: { total: 130, available: 22 },
      icu: { total: 36, available: 4 },
      emergency: { total: 20, available: 6 }
    },
    rating: 4.8,
    emergency_ready: true
  }
];

// Initialize hospitals
mockHospitals.forEach(hospital => {
  hospitals.set(hospital.id, hospital);
});

// Helper: Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper: Map emergency type to required specialty
function getRequiredSpecialty(emergencyType) {
  const typeMap = {
    'heart attack': 'cardiac',
    'cardiac': 'cardiac',
    'stroke': 'neurology',
    'accident': 'trauma',
    'trauma': 'trauma',
    'breathing issue': 'respiratory',
    'respiratory': 'respiratory',
    'burns': 'burns',
    'maternity': 'maternity',
    'pediatric': 'pediatric',
    'broken bones': 'orthopedic',
    'orthopedic': 'orthopedic'
  };
  
  const lowerType = (emergencyType || '').toLowerCase();
  for (const [key, value] of Object.entries(typeMap)) {
    if (lowerType.includes(key)) {
      return value;
    }
  }
  return 'general';
}

// Helper: Get required equipment based on emergency
function getRequiredEquipment(emergencyType, priority) {
  const equipment = [];
  const lowerType = (emergencyType || '').toLowerCase();
  
  if (lowerType.includes('heart') || lowerType.includes('cardiac')) {
    equipment.push('cath_lab', 'icu', 'ventilators');
  } else if (lowerType.includes('stroke') || lowerType.includes('neuro')) {
    equipment.push('ct_scan', 'mri', 'icu');
  } else if (lowerType.includes('trauma') || lowerType.includes('accident')) {
    equipment.push('ct_scan', 'blood_bank', 'icu');
  } else if (lowerType.includes('breathing') || lowerType.includes('respiratory')) {
    equipment.push('ventilators', 'icu');
  } else if (lowerType.includes('burn')) {
    equipment.push('burn_unit', 'icu');
  }
  
  if (priority === 'critical') {
    equipment.push('icu', 'ventilators');
  }
  
  return [...new Set(equipment)]; // Remove duplicates
}

// Intelligent hospital matching algorithm
function matchHospital(emergencyLocation, emergencyType, priority, requiredBedType = 'emergency') {
  const allHospitals = Array.from(hospitals.values());
  const requiredSpecialty = getRequiredSpecialty(emergencyType);
  const requiredEquipment = getRequiredEquipment(emergencyType, priority);
  
  const scoredHospitals = allHospitals.map(hospital => {
    // Calculate distance
    const distance = calculateDistance(
      emergencyLocation.lat,
      emergencyLocation.lng,
      hospital.location.lat,
      hospital.location.lng
    );
    
    // Calculate ETA (assuming 40 km/h average speed in city)
    const eta = Math.round((distance / 40) * 60); // minutes
    
    // Scoring system
    let score = 0;
    
    // 1. Specialty match (40 points max)
    if (hospital.specialties.includes(requiredSpecialty)) {
      score += 40;
    } else if (hospital.specialties.includes('general')) {
      score += 20; // General can handle most cases
    }
    
    // 2. Equipment availability (30 points max)
    const equipmentMatch = requiredEquipment.filter(eq => 
      hospital.equipment.includes(eq)
    ).length;
    score += (equipmentMatch / Math.max(requiredEquipment.length, 1)) * 30;
    
    // 3. Bed availability (20 points max)
    const bedType = priority === 'critical' ? 'icu' : requiredBedType;
    const bedsAvailable = hospital.beds[bedType]?.available || 0;
    const bedCapacity = hospital.beds[bedType]?.total || 1;
    const availabilityRatio = bedsAvailable / bedCapacity;
    score += availabilityRatio * 20;
    
    // Penalty if no beds available
    if (bedsAvailable === 0) {
      score -= 50;
    }
    
    // 4. Distance factor (10 points max) - closer is better
    const maxDistance = 20; // km
    const distanceScore = Math.max(0, (1 - distance / maxDistance)) * 10;
    score += distanceScore;
    
    // 5. Hospital rating
    score += (hospital.rating / 5) * 5;
    
    // 6. Emergency readiness
    if (hospital.emergency_ready) {
      score += 5;
    }
    
    return {
      ...hospital,
      distance: parseFloat(distance.toFixed(2)),
      eta,
      score: Math.round(score),
      recommended: false,
      match_reasons: {
        specialty_match: hospital.specialties.includes(requiredSpecialty),
        has_required_equipment: equipmentMatch === requiredEquipment.length,
        beds_available: bedsAvailable,
        distance_km: parseFloat(distance.toFixed(2))
      }
    };
  });
  
  // Sort by score
  scoredHospitals.sort((a, b) => b.score - a.score);
  
  // Mark top recommendation
  if (scoredHospitals.length > 0) {
    scoredHospitals[0].recommended = true;
  }
  
  return scoredHospitals;
}

// API Endpoints

// Get all hospitals
app.get('/api/hospitals', (req, res) => {
  const allHospitals = Array.from(hospitals.values());
  res.json({
    success: true,
    data: allHospitals,
    total: allHospitals.length
  });
});

// Get hospital recommendations for an emergency
app.post('/api/hospitals/recommend', (req, res) => {
  try {
    const {
      location,
      emergency_type,
      priority,
      bed_type
    } = req.body;
    
    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({
        success: false,
        message: 'Location (lat, lng) is required'
      });
    }
    
    const recommendations = matchHospital(
      location,
      emergency_type || 'general',
      priority || 'normal',
      bed_type || 'emergency'
    );
    
    res.json({
      success: true,
      data: {
        emergency_type,
        priority,
        required_specialty: getRequiredSpecialty(emergency_type),
        required_equipment: getRequiredEquipment(emergency_type, priority),
        recommendations: recommendations.slice(0, 5), // Top 5
        total_available: recommendations.filter(h => h.match_reasons.beds_available > 0).length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Hospital matching failed',
      error: error.message
    });
  }
});

// Get specific hospital details
app.get('/api/hospitals/:id', (req, res) => {
  const hospital = hospitals.get(req.params.id);
  
  if (!hospital) {
    return res.status(404).json({
      success: false,
      message: 'Hospital not found'
    });
  }
  
  res.json({
    success: true,
    data: hospital
  });
});

// Update bed availability (for hospital portal)
app.put('/api/hospitals/:id/beds', (req, res) => {
  const hospital = hospitals.get(req.params.id);
  
  if (!hospital) {
    return res.status(404).json({
      success: false,
      message: 'Hospital not found'
    });
  }
  
  const { bed_type, available } = req.body;
  
  if (hospital.beds[bed_type]) {
    hospital.beds[bed_type].available = available;
    hospitals.set(req.params.id, hospital);
    
    res.json({
      success: true,
      message: 'Bed availability updated',
      data: hospital
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid bed type'
    });
  }
});

// Reserve a bed at a hospital
app.post('/api/hospitals/:hospitalId/reserve-bed', (req, res) => {
  try {
    const { hospitalId } = req.params;
    const {
      ride_request_id,
      bed_type,
      patient_name,
      emergency_type,
      priority,
      eta_minutes,
      requester_phone
    } = req.body;

    const hospital = hospitals.get(hospitalId);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Check bed availability
    if (!hospital.beds[bed_type] || hospital.beds[bed_type].available <= 0) {
      return res.status(400).json({
        success: false,
        message: `No ${bed_type} beds available`,
        available_beds: hospital.beds[bed_type]?.available || 0
      });
    }

    // Create reservation
    const reservationId = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const reservation = {
      id: reservationId,
      hospital_id: hospitalId,
      hospital_name: hospital.name,
      ride_request_id,
      bed_type,
      patient_name,
      emergency_type,
      priority,
      eta_minutes,
      requester_phone,
      status: 'active',
      reserved_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + (eta_minutes + 15) * 60 * 1000).toISOString(), // ETA + 15 min buffer
      confirmed_by_hospital: false
    };

    // Decrease available beds
    hospital.beds[bed_type].available--;
    hospitals.set(hospitalId, hospital);

    // Store reservation
    bedReservations.set(reservationId, reservation);
    
    // Track hospital reservations
    if (!hospitalReservations.has(hospitalId)) {
      hospitalReservations.set(hospitalId, new Set());
    }
    hospitalReservations.get(hospitalId).add(reservationId);

    console.log(`🛏️ Bed reserved: ${bed_type} at ${hospital.name} for ${patient_name} (ETA: ${eta_minutes} min)`);

    res.json({
      success: true,
      message: 'Bed reserved successfully',
      reservation: {
        id: reservationId,
        hospital_name: hospital.name,
        hospital_address: hospital.address,
        hospital_contact: hospital.contact,
        bed_type,
        reserved_at: reservation.reserved_at,
        expires_at: reservation.expires_at,
        eta_minutes
      }
    });

  } catch (error) {
    console.error('Bed reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reserve bed',
      error: error.message
    });
  }
});

// Cancel bed reservation
app.post('/api/reservations/:reservationId/cancel', (req, res) => {
  try {
    const { reservationId } = req.params;
    const { reason } = req.body;

    const reservation = bedReservations.get(reservationId);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status === 'cancelled' || reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: `Reservation already ${reservation.status}`
      });
    }

    // Release the bed
    const hospital = hospitals.get(reservation.hospital_id);
    if (hospital) {
      hospital.beds[reservation.bed_type].available++;
      hospitals.set(reservation.hospital_id, hospital);
    }

    // Update reservation
    reservation.status = 'cancelled';
    reservation.cancelled_at = new Date().toISOString();
    reservation.cancellation_reason = reason || 'Not specified';
    bedReservations.set(reservationId, reservation);

    console.log(`❌ Bed reservation cancelled: ${reservationId} - ${reason}`);

    res.json({
      success: true,
      message: 'Reservation cancelled successfully',
      reservation
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel reservation',
      error: error.message
    });
  }
});

// Confirm patient arrival (hospital confirms)
app.post('/api/reservations/:reservationId/confirm-arrival', (req, res) => {
  try {
    const { reservationId } = req.params;
    const { confirmed_by, notes } = req.body;

    const reservation = bedReservations.get(reservationId);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm reservation with status: ${reservation.status}`
      });
    }

    // Update reservation
    reservation.status = 'completed';
    reservation.confirmed_by_hospital = true;
    reservation.confirmed_by = confirmed_by;
    reservation.confirmed_at = new Date().toISOString();
    reservation.arrival_notes = notes;
    bedReservations.set(reservationId, reservation);

    console.log(`✅ Patient arrived: ${reservation.patient_name} at ${reservation.hospital_name}`);

    res.json({
      success: true,
      message: 'Patient arrival confirmed',
      reservation
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to confirm arrival',
      error: error.message
    });
  }
});

// Get reservation details
app.get('/api/reservations/:reservationId', (req, res) => {
  try {
    const { reservationId } = req.params;
    const reservation = bedReservations.get(reservationId);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.json({
      success: true,
      data: reservation
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservation',
      error: error.message
    });
  }
});

// Get all reservations for a hospital
app.get('/api/hospitals/:hospitalId/reservations', (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { status } = req.query; // Filter by status: active, completed, cancelled

    const reservationIds = hospitalReservations.get(hospitalId) || new Set();
    let reservations = Array.from(reservationIds)
      .map(id => bedReservations.get(id))
      .filter(r => r); // Remove any undefined

    // Filter by status if provided
    if (status) {
      reservations = reservations.filter(r => r.status === status);
    }

    // Sort by reserved_at, newest first
    reservations.sort((a, b) => new Date(b.reserved_at) - new Date(a.reserved_at));

    res.json({
      success: true,
      data: reservations,
      total: reservations.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservations',
      error: error.message
    });
  }
});

// Get all active reservations
app.get('/api/reservations', (req, res) => {
  try {
    const { status } = req.query;
    
    let reservations = Array.from(bedReservations.values());

    // Filter by status if provided
    if (status) {
      reservations = reservations.filter(r => r.status === status);
    }

    // Sort by reserved_at, newest first
    reservations.sort((a, b) => new Date(b.reserved_at) - new Date(a.reserved_at));

    res.json({
      success: true,
      data: reservations,
      total: reservations.length,
      active: reservations.filter(r => r.status === 'active').length,
      completed: reservations.filter(r => r.status === 'completed').length,
      cancelled: reservations.filter(r => r.status === 'cancelled').length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservations',
      error: error.message
    });
  }
});

// Auto-cleanup expired reservations (runs every minute)
setInterval(() => {
  const now = new Date();
  let expiredCount = 0;

  bedReservations.forEach((reservation, reservationId) => {
    if (reservation.status === 'active' && new Date(reservation.expires_at) < now) {
      // Release the bed
      const hospital = hospitals.get(reservation.hospital_id);
      if (hospital) {
        hospital.beds[reservation.bed_type].available++;
        hospitals.set(reservation.hospital_id, hospital);
      }

      // Mark as expired
      reservation.status = 'expired';
      reservation.expired_at = now.toISOString();
      bedReservations.set(reservationId, reservation);
      
      expiredCount++;
      console.log(`⏰ Reservation expired: ${reservationId} - ${reservation.hospital_name}`);
    }
  });

  if (expiredCount > 0) {
    console.log(`🧹 Cleaned up ${expiredCount} expired reservations`);
  }
}, 60000); // Check every minute

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Hospital Matching Service',
    timestamp: new Date().toISOString(),
    total_hospitals: hospitals.size,
    active_reservations: Array.from(bedReservations.values()).filter(r => r.status === 'active').length
  });
});

const PORT = process.env.PORT || 3013;

app.listen(PORT, () => {
  console.log('🏥 Hospital Matching Service running on port ' + PORT);
  console.log('🔍 Health check: http://localhost:' + PORT + '/health');
  console.log('📊 Total Hospitals: ' + hospitals.size);
  console.log('🎯 Intelligent matching based on:');
  console.log('   • Severity & Emergency Type');
  console.log('   • Distance & ETA');
  console.log('   • Bed Availability');
  console.log('   • Equipment & Specialties');
});

