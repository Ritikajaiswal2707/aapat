const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock hospital data with specialties and real-time availability
const hospitals = new Map();

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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Hospital Matching Service',
    timestamp: new Date().toISOString(),
    total_hospitals: hospitals.size
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

