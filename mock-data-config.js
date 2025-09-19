// Mock Data Configuration for Aapat Platform Testing
// This file provides comprehensive fake data for all services

const MOCK_DATA = {
  // Mock Hospitals
  hospitals: [
    {
      id: 'hosp_001',
      name: 'AIIMS Delhi',
      address: 'AIIMS, Ansari Nagar, New Delhi, Delhi 110029',
      lat: 28.5679,
      lng: 77.2110,
      phone: '+91-11-26588500',
      total_beds: 2000,
      available_beds: 150,
      icu_beds: 200,
      available_icu_beds: 25,
      specializations: ['Cardiology', 'Neurology', 'Trauma', 'Emergency Medicine'],
      equipment_level: 'CRITICAL_CARE',
      rating: 4.8,
      is_active: true
    },
    {
      id: 'hosp_002',
      name: 'Safdarjung Hospital',
      address: 'Safdarjung Hospital, New Delhi, Delhi 110029',
      lat: 28.5800,
      lng: 77.2200,
      phone: '+91-11-26732000',
      total_beds: 1500,
      available_beds: 200,
      icu_beds: 150,
      available_icu_beds: 30,
      specializations: ['Emergency Medicine', 'Trauma', 'General Medicine'],
      equipment_level: 'ADVANCED',
      rating: 4.5,
      is_active: true
    },
    {
      id: 'hosp_003',
      name: 'Apollo Hospital',
      address: 'Apollo Hospital, Sarita Vihar, New Delhi, Delhi 110076',
      lat: 28.5500,
      lng: 77.2500,
      phone: '+91-11-26925858',
      total_beds: 800,
      available_beds: 100,
      icu_beds: 80,
      available_icu_beds: 15,
      specializations: ['Cardiology', 'Oncology', 'Neurology'],
      equipment_level: 'ADVANCED',
      rating: 4.6,
      is_active: true
    },
    {
      id: 'hosp_004',
      name: 'Max Hospital',
      address: 'Max Hospital, Saket, New Delhi, Delhi 110017',
      lat: 28.5400,
      lng: 77.2400,
      phone: '+91-11-40554055',
      total_beds: 600,
      available_beds: 80,
      icu_beds: 60,
      available_icu_beds: 12,
      specializations: ['Cardiology', 'Orthopedics', 'General Surgery'],
      equipment_level: 'INTERMEDIATE',
      rating: 4.4,
      is_active: true
    }
  ],

  // Mock Ambulances
  ambulances: [
    {
      id: 'amb_001',
      plate_number: 'DL-01-AB-1234',
      type: 'BASIC',
      equipment_level: 'BASIC',
      status: 'AVAILABLE',
      lat: 28.6139,
      lng: 77.2090,
      driver: {
        id: 'drv_001',
        name: 'Rajesh Kumar',
        phone: '+91-98765-43210',
        rating: 4.5,
        experience: '5 years'
      }
    },
    {
      id: 'amb_002',
      plate_number: 'DL-01-CD-5678',
      type: 'INTERMEDIATE',
      equipment_level: 'INTERMEDIATE',
      status: 'AVAILABLE',
      lat: 28.6200,
      lng: 77.2150,
      driver: {
        id: 'drv_002',
        name: 'Suresh Singh',
        phone: '+91-98765-43211',
        rating: 4.7,
        experience: '8 years'
      }
    },
    {
      id: 'amb_003',
      plate_number: 'DL-01-EF-9012',
      type: 'ADVANCED',
      equipment_level: 'ADVANCED',
      status: 'ON_DUTY',
      lat: 28.6000,
      lng: 77.2000,
      driver: {
        id: 'drv_003',
        name: 'Amit Sharma',
        phone: '+91-98765-43212',
        rating: 4.8,
        experience: '10 years'
      }
    },
    {
      id: 'amb_004',
      plate_number: 'DL-01-GH-3456',
      type: 'CRITICAL_CARE',
      equipment_level: 'CRITICAL_CARE',
      status: 'AVAILABLE',
      lat: 28.6300,
      lng: 77.2200,
      driver: {
        id: 'drv_004',
        name: 'Vikram Patel',
        phone: '+91-98765-43213',
        rating: 4.9,
        experience: '12 years'
      }
    }
  ],

  // Mock Emergency Types
  emergencyTypes: [
    { id: 1, name: 'Heart Attack', priority: 1, color: '#FF0000' },
    { id: 2, name: 'Stroke', priority: 1, color: '#FF0000' },
    { id: 3, name: 'Accident', priority: 2, color: '#FF6600' },
    { id: 4, name: 'Breathing Problems', priority: 2, color: '#FF6600' },
    { id: 5, name: 'Unconscious', priority: 2, color: '#FF6600' },
    { id: 6, name: 'Severe Pain', priority: 3, color: '#FFCC00' },
    { id: 7, name: 'Fever', priority: 4, color: '#00CC00' },
    { id: 8, name: 'Minor Injury', priority: 4, color: '#00CC00' }
  ],

  // Mock Patients
  patients: [
    {
      id: 'pat_001',
      name: 'Priya Sharma',
      phone: '+91-98765-12345',
      age: 35,
      blood_group: 'B+',
      allergies: ['Penicillin'],
      medical_history: ['Diabetes'],
      emergency_contacts: [
        { name: 'Rahul Sharma', phone: '+91-98765-12346', relation: 'Husband' },
        { name: 'Dr. Mehta', phone: '+91-98765-12347', relation: 'Family Doctor' }
      ]
    },
    {
      id: 'pat_002',
      name: 'Amit Kumar',
      phone: '+91-98765-23456',
      age: 45,
      blood_group: 'O+',
      allergies: [],
      medical_history: ['Hypertension'],
      emergency_contacts: [
        { name: 'Sunita Kumar', phone: '+91-98765-23457', relation: 'Wife' }
      ]
    }
  ],

  // Mock Emergency Requests
  emergencyRequests: [
    {
      id: 'req_001',
      patient_id: 'pat_001',
      emergency_type: 'Heart Attack',
      priority: 1,
      address: 'Connaught Place, New Delhi',
      lat: 28.6304,
      lng: 77.2177,
      status: 'ASSIGNED',
      created_at: new Date(Date.now() - 300000), // 5 minutes ago
      assigned_ambulance: 'amb_001'
    },
    {
      id: 'req_002',
      patient_id: 'pat_002',
      emergency_type: 'Accident',
      priority: 2,
      address: 'India Gate, New Delhi',
      lat: 28.6129,
      lng: 77.2295,
      status: 'DISPATCHED',
      created_at: new Date(Date.now() - 600000), // 10 minutes ago
      assigned_ambulance: 'amb_002'
    }
  ],

  // Mock SMS Messages
  smsMessages: [
    {
      id: 'sms_001',
      to: '+91-98765-12346',
      message: '🚨 EMERGENCY ALERT 🚨\n\nEmergency Type: Heart Attack\nPatient: Priya Sharma\nLocation: Connaught Place, New Delhi\nTime: ' + new Date().toLocaleString() + '\n\nAmbulance has been dispatched. ETA: 8 minutes\n\nPlease contact emergency services if needed.\n- Aapat Emergency Services',
      status: 'SENT',
      sent_at: new Date()
    }
  ],

  // Mock Payment Orders
  paymentOrders: [
    {
      id: 'pay_001',
      emergency_request_id: 'req_001',
      amount: 750,
      currency: 'INR',
      status: 'PENDING',
      created_at: new Date()
    }
  ],

  // Mock Location Data
  locations: {
    delhi: { lat: 28.6139, lng: 77.2090, name: 'Delhi' },
    mumbai: { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
    bangalore: { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
    chennai: { lat: 13.0827, lng: 80.2707, name: 'Chennai' }
  }
};

// Mock Service Responses
const MOCK_RESPONSES = {
  // SMS Service
  sms: {
    send: (phone, message) => ({
      success: true,
      message: 'SMS sent successfully (MOCK MODE)',
      data: {
        sid: 'mock_sms_' + Date.now(),
        to: phone,
        status: 'sent',
        message: message.substring(0, 50) + '...'
      }
    })
  },

  // Payment Service
  payment: {
    createOrder: (amount, currency = 'INR') => ({
      success: true,
      message: 'Payment order created successfully (MOCK MODE)',
      data: {
        order_id: 'mock_order_' + Date.now(),
        amount: amount,
        currency: currency,
        status: 'created',
        key_id: 'mock_key_id'
      }
    }),
    verifyPayment: (paymentData) => ({
      success: true,
      message: 'Payment verified successfully (MOCK MODE)',
      data: {
        verified: true,
        amount: paymentData.amount,
        currency: paymentData.currency
      }
    })
  },

  // Maps Service
  maps: {
    geocode: (address) => ({
      success: true,
      message: 'Address geocoded successfully (MOCK MODE)',
      data: {
        lat: 28.6139 + (Math.random() - 0.5) * 0.1,
        lng: 77.2090 + (Math.random() - 0.5) * 0.1,
        formatted_address: address,
        place_id: 'mock_place_' + Date.now()
      }
    }),
    reverseGeocode: (lat, lng) => ({
      success: true,
      message: 'Coordinates reverse geocoded successfully (MOCK MODE)',
      data: {
        address: `Mock Address near ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        formatted_address: `Mock Street, Mock Area, New Delhi, Delhi 110001`,
        place_id: 'mock_place_' + Date.now()
      }
    }),
    directions: (origin, destination) => ({
      success: true,
      message: 'Directions calculated successfully (MOCK MODE)',
      data: {
        distance: '5.2 km',
        duration: '12 minutes',
        route: [
          { lat: origin.lat, lng: origin.lng },
          { lat: (origin.lat + destination.lat) / 2, lng: (origin.lng + destination.lng) / 2 },
          { lat: destination.lat, lng: destination.lng }
        ]
      }
    }),
    nearbyHospitals: (location, radius = 5000) => ({
      success: true,
      message: 'Nearby hospitals found successfully (MOCK MODE)',
      data: MOCK_DATA.hospitals.map(hospital => ({
        ...hospital,
        distance: (Math.random() * 5).toFixed(1) + ' km'
      }))
    })
  }
};

module.exports = {
  MOCK_DATA,
  MOCK_RESPONSES
};
