// Mock Data Generator for Aapat Platform (No Database Required)
const fs = require('fs');
const path = require('path');

// Generate comprehensive mock data
const mockData = {
  // Hospitals with realistic Indian data
  hospitals: [
    {
      id: 'hosp_001',
      name: 'All India Institute of Medical Sciences (AIIMS)',
      address: 'AIIMS, Ansari Nagar, New Delhi, Delhi 110029',
      lat: 28.5679,
      lng: 77.2110,
      phone: '+91-11-26588500',
      email: 'info@aiims.edu',
      total_beds: 2000,
      available_beds: 150,
      icu_beds: 200,
      available_icu_beds: 25,
      ventilator_beds: 50,
      available_ventilator_beds: 8,
      specializations: ['Cardiology', 'Neurology', 'Trauma', 'Emergency Medicine', 'Oncology', 'Pediatrics'],
      equipment_level: 'CRITICAL_CARE',
      rating: 4.8,
      is_active: true,
      established_year: 1956
    },
    {
      id: 'hosp_002',
      name: 'Safdarjung Hospital',
      address: 'Safdarjung Hospital, New Delhi, Delhi 110029',
      lat: 28.5800,
      lng: 77.2200,
      phone: '+91-11-26732000',
      email: 'info@safdarjunghospital.nic.in',
      total_beds: 1500,
      available_beds: 200,
      icu_beds: 150,
      available_icu_beds: 30,
      ventilator_beds: 30,
      available_ventilator_beds: 5,
      specializations: ['Emergency Medicine', 'Trauma', 'General Medicine', 'Surgery'],
      equipment_level: 'ADVANCED',
      rating: 4.5,
      is_active: true,
      established_year: 1962
    },
    {
      id: 'hosp_003',
      name: 'Apollo Hospital',
      address: 'Apollo Hospital, Sarita Vihar, New Delhi, Delhi 110076',
      lat: 28.5500,
      lng: 77.2500,
      phone: '+91-11-26925858',
      email: 'delhi@apollohospitals.com',
      total_beds: 800,
      available_beds: 100,
      icu_beds: 80,
      available_icu_beds: 15,
      ventilator_beds: 20,
      available_ventilator_beds: 3,
      specializations: ['Cardiology', 'Oncology', 'Neurology', 'Orthopedics'],
      equipment_level: 'ADVANCED',
      rating: 4.6,
      is_active: true,
      established_year: 1996
    },
    {
      id: 'hosp_004',
      name: 'Max Hospital',
      address: 'Max Hospital, Saket, New Delhi, Delhi 110017',
      lat: 28.5400,
      lng: 77.2400,
      phone: '+91-11-40554055',
      email: 'saket@maxhealthcare.com',
      total_beds: 600,
      available_beds: 80,
      icu_beds: 60,
      available_icu_beds: 12,
      ventilator_beds: 15,
      available_ventilator_beds: 2,
      specializations: ['Cardiology', 'Orthopedics', 'General Surgery', 'Gynecology'],
      equipment_level: 'INTERMEDIATE',
      rating: 4.4,
      is_active: true,
      established_year: 2005
    },
    {
      id: 'hosp_005',
      name: 'Fortis Hospital',
      address: 'Fortis Hospital, Vasant Kunj, New Delhi, Delhi 110070',
      lat: 28.5200,
      lng: 77.1800,
      phone: '+91-11-42776262',
      email: 'vasantkunj@fortishealthcare.com',
      total_beds: 400,
      available_beds: 60,
      icu_beds: 40,
      available_icu_beds: 8,
      ventilator_beds: 10,
      available_ventilator_beds: 1,
      specializations: ['Cardiology', 'Neurology', 'Emergency Medicine'],
      equipment_level: 'INTERMEDIATE',
      rating: 4.3,
      is_active: true,
      established_year: 2010
    }
  ],

  // Ambulances with realistic data
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
        email: 'rajesh.kumar@aapat.com',
        experience_years: 5,
        rating: 4.5,
        total_emergencies: 120,
        successful_emergencies: 115,
        specializations: ['Basic Life Support', 'First Aid']
      },
      fuel_level: 85,
      last_maintenance: '2024-01-15',
      next_maintenance: '2024-04-15',
      is_active: true
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
        email: 'suresh.singh@aapat.com',
        experience_years: 8,
        rating: 4.7,
        total_emergencies: 200,
        successful_emergencies: 195,
        specializations: ['Advanced Life Support', 'Trauma Care']
      },
      fuel_level: 92,
      last_maintenance: '2024-01-10',
      next_maintenance: '2024-04-10',
      is_active: true
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
        email: 'amit.sharma@aapat.com',
        experience_years: 10,
        rating: 4.8,
        total_emergencies: 300,
        successful_emergencies: 290,
        specializations: ['Critical Care', 'Pediatric Emergency']
      },
      fuel_level: 78,
      last_maintenance: '2024-01-05',
      next_maintenance: '2024-04-05',
      is_active: true
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
        email: 'vikram.patel@aapat.com',
        experience_years: 12,
        rating: 4.9,
        total_emergencies: 400,
        successful_emergencies: 395,
        specializations: ['Critical Care', 'Cardiac Emergency', 'Trauma Care']
      },
      fuel_level: 88,
      last_maintenance: '2024-01-12',
      next_maintenance: '2024-04-12',
      is_active: true
    },
    {
      id: 'amb_005',
      plate_number: 'DL-01-IJ-7890',
      type: 'BASIC',
      equipment_level: 'BASIC',
      status: 'MAINTENANCE',
      lat: 28.6400,
      lng: 77.2300,
      driver: null,
      fuel_level: 45,
      last_maintenance: '2024-01-20',
      next_maintenance: '2024-02-20',
      is_active: true
    },
    {
      id: 'amb_006',
      plate_number: 'DL-01-KL-2468',
      type: 'INTERMEDIATE',
      equipment_level: 'INTERMEDIATE',
      status: 'AVAILABLE',
      lat: 28.6100,
      lng: 77.1900,
      driver: {
        id: 'drv_005',
        name: 'Ravi Verma',
        phone: '+91-98765-43214',
        email: 'ravi.verma@aapat.com',
        experience_years: 3,
        rating: 4.2,
        total_emergencies: 80,
        successful_emergencies: 75,
        specializations: ['Basic Life Support']
      },
      fuel_level: 95,
      last_maintenance: '2024-01-08',
      next_maintenance: '2024-04-08',
      is_active: true
    }
  ],

  // Emergency types
  emergencyTypes: [
    { id: 1, name: 'Heart Attack', priority: 1, color: '#FF0000', description: 'Acute myocardial infarction' },
    { id: 2, name: 'Stroke', priority: 1, color: '#FF0000', description: 'Cerebrovascular accident' },
    { id: 3, name: 'Road Accident', priority: 2, color: '#FF6600', description: 'Motor vehicle accident' },
    { id: 4, name: 'Breathing Problems', priority: 2, color: '#FF6600', description: 'Respiratory distress' },
    { id: 5, name: 'Unconscious', priority: 2, color: '#FF6600', description: 'Loss of consciousness' },
    { id: 6, name: 'Severe Pain', priority: 3, color: '#FFCC00', description: 'Acute severe pain' },
    { id: 7, name: 'High Fever', priority: 4, color: '#00CC00', description: 'Elevated body temperature' },
    { id: 8, name: 'Minor Injury', priority: 4, color: '#00CC00', description: 'Non-life threatening injury' },
    { id: 9, name: 'Seizure', priority: 2, color: '#FF6600', description: 'Epileptic seizure' },
    { id: 10, name: 'Allergic Reaction', priority: 2, color: '#FF6600', description: 'Anaphylactic reaction' }
  ],

  // Sample patients
  patients: [
    {
      id: 'pat_001',
      name: 'Priya Sharma',
      phone: '+91-98765-12345',
      email: 'priya.sharma@gmail.com',
      age: 35,
      gender: 'Female',
      blood_group: 'B+',
      allergies: ['Penicillin', 'Shellfish'],
      medical_history: ['Diabetes Type 2', 'Hypertension'],
      emergency_contacts: [
        { name: 'Rahul Sharma', phone: '+91-98765-12346', relation: 'Husband', is_primary: true },
        { name: 'Dr. Mehta', phone: '+91-98765-12347', relation: 'Family Doctor', is_primary: false }
      ],
      address: '123, Connaught Place, New Delhi, Delhi 110001',
      created_at: '2023-01-15'
    },
    {
      id: 'pat_002',
      name: 'Amit Kumar',
      phone: '+91-98765-23456',
      email: 'amit.kumar@gmail.com',
      age: 45,
      gender: 'Male',
      blood_group: 'O+',
      allergies: [],
      medical_history: ['Hypertension'],
      emergency_contacts: [
        { name: 'Sunita Kumar', phone: '+91-98765-23457', relation: 'Wife', is_primary: true }
      ],
      address: '456, India Gate, New Delhi, Delhi 110003',
      created_at: '2023-02-20'
    },
    {
      id: 'pat_003',
      name: 'Sneha Patel',
      phone: '+91-98765-34567',
      email: 'sneha.patel@gmail.com',
      age: 28,
      gender: 'Female',
      blood_group: 'A+',
      allergies: ['Peanuts'],
      medical_history: ['Asthma'],
      emergency_contacts: [
        { name: 'Arjun Patel', phone: '+91-98765-34568', relation: 'Brother', is_primary: true },
        { name: 'Dr. Gupta', phone: '+91-98765-34569', relation: 'Family Doctor', is_primary: false }
      ],
      address: '789, Lajpat Nagar, New Delhi, Delhi 110024',
      created_at: '2023-03-10'
    },
    {
      id: 'pat_004',
      name: 'Rajesh Verma',
      phone: '+91-98765-45678',
      email: 'rajesh.verma@gmail.com',
      age: 52,
      gender: 'Male',
      blood_group: 'AB+',
      allergies: ['Latex'],
      medical_history: ['Heart Disease', 'Diabetes Type 1'],
      emergency_contacts: [
        { name: 'Meera Verma', phone: '+91-98765-45679', relation: 'Wife', is_primary: true },
        { name: 'Dr. Singh', phone: '+91-98765-45680', relation: 'Cardiologist', is_primary: false }
      ],
      address: '321, Karol Bagh, New Delhi, Delhi 110005',
      created_at: '2023-04-05'
    },
    {
      id: 'pat_005',
      name: 'Anita Desai',
      phone: '+91-98765-56789',
      email: 'anita.desai@gmail.com',
      age: 29,
      gender: 'Female',
      blood_group: 'O-',
      allergies: ['Aspirin'],
      medical_history: ['Migraine'],
      emergency_contacts: [
        { name: 'Rohit Desai', phone: '+91-98765-56790', relation: 'Husband', is_primary: true }
      ],
      address: '654, Hauz Khas, New Delhi, Delhi 110016',
      created_at: '2023-05-12'
    }
  ],

  // Sample emergency requests
  emergencyRequests: [
    {
      id: 'req_001',
      patient_id: 'pat_001',
      patient_name: 'Priya Sharma',
      patient_phone: '+91-98765-12345',
      emergency_type: 'Heart Attack',
      priority_level: 1,
      address: 'Connaught Place, New Delhi',
      lat: 28.6304,
      lng: 77.2177,
      status: 'ASSIGNED',
      assigned_ambulance_id: 'amb_001',
      assigned_driver: 'Rajesh Kumar',
      created_at: new Date(Date.now() - 300000), // 5 minutes ago
      estimated_arrival: '8 minutes'
    },
    {
      id: 'req_002',
      patient_id: 'pat_002',
      patient_name: 'Amit Kumar',
      patient_phone: '+91-98765-23456',
      emergency_type: 'Road Accident',
      priority_level: 2,
      address: 'India Gate, New Delhi',
      lat: 28.6129,
      lng: 77.2295,
      status: 'DISPATCHED',
      assigned_ambulance_id: 'amb_002',
      assigned_driver: 'Suresh Singh',
      created_at: new Date(Date.now() - 600000), // 10 minutes ago
      estimated_arrival: '12 minutes'
    },
    {
      id: 'req_003',
      patient_id: 'pat_003',
      patient_name: 'Sneha Patel',
      patient_phone: '+91-98765-34567',
      emergency_type: 'Breathing Problems',
      priority_level: 2,
      address: 'Lajpat Nagar, New Delhi',
      lat: 28.5700,
      lng: 77.2400,
      status: 'AMBULANCE_ARRIVED',
      assigned_ambulance_id: 'amb_004',
      assigned_driver: 'Vikram Patel',
      created_at: new Date(Date.now() - 900000), // 15 minutes ago
      estimated_arrival: '0 minutes'
    }
  ],

  // SMS message history
  smsHistory: [
    {
      id: 'sms_001',
      to: '+91-98765-12346',
      message: '🚨 EMERGENCY ALERT 🚨\n\nEmergency Type: Heart Attack\nPatient: Priya Sharma\nLocation: Connaught Place, New Delhi\nTime: ' + new Date().toLocaleString() + '\n\nAmbulance has been dispatched. ETA: 8 minutes\n\nPlease contact emergency services if needed.\n- Aapat Emergency Services',
      status: 'SENT',
      sent_at: new Date(Date.now() - 300000),
      type: 'EMERGENCY_ALERT'
    },
    {
      id: 'sms_002',
      to: '+91-98765-43210',
      message: '🚑 NEW EMERGENCY ASSIGNMENT\n\nEmergency Type: Heart Attack\nPatient: Priya Sharma\nLocation: Connaught Place, New Delhi\nPriority: 1\n\nPlease accept or decline this assignment.\n- Aapat Dispatch System',
      status: 'SENT',
      sent_at: new Date(Date.now() - 280000),
      type: 'DRIVER_ASSIGNMENT'
    },
    {
      id: 'sms_003',
      to: '+91-98765-12345',
      message: '📱 Aapat Status Update\n\nStatus: Ambulance Assigned\nDriver: Rajesh Kumar (DL-01-AB-1234)\nETA: 8 minutes\n\nThank you for using Aapat Emergency Services.',
      status: 'SENT',
      sent_at: new Date(Date.now() - 270000),
      type: 'STATUS_UPDATE'
    }
  ],

  // Payment orders
  paymentOrders: [
    {
      id: 'pay_001',
      emergency_request_id: 'req_001',
      amount: 750,
      currency: 'INR',
      status: 'PENDING',
      payment_method: 'UPI',
      created_at: new Date(Date.now() - 250000),
      description: 'Emergency ambulance service - Heart Attack'
    },
    {
      id: 'pay_002',
      emergency_request_id: 'req_002',
      amount: 650,
      currency: 'INR',
      status: 'PAID',
      payment_method: 'CARD',
      created_at: new Date(Date.now() - 550000),
      paid_at: new Date(Date.now() - 500000),
      description: 'Emergency ambulance service - Road Accident'
    }
  ]
};

// Save mock data to files
function saveMockData() {
  console.log('📊 Generating comprehensive mock data...\n');

  // Create data directory
  const dataDir = path.join(__dirname, '..', 'mock-data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Save individual data files
  Object.keys(mockData).forEach(key => {
    const filePath = path.join(dataDir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(mockData[key], null, 2));
    console.log(`✅ Generated ${key}.json (${mockData[key].length || Object.keys(mockData[key]).length} items)`);
  });

  // Save combined data file
  const combinedPath = path.join(dataDir, 'all-mock-data.json');
  fs.writeFileSync(combinedPath, JSON.stringify(mockData, null, 2));
  console.log(`✅ Generated all-mock-data.json (combined data)`);

  // Create data summary
  const summary = {
    generated_at: new Date().toISOString(),
    total_hospitals: mockData.hospitals.length,
    total_ambulances: mockData.ambulances.length,
    total_patients: mockData.patients.length,
    total_emergency_types: mockData.emergencyTypes.length,
    total_emergency_requests: mockData.emergencyRequests.length,
    total_sms_messages: mockData.smsHistory.length,
    total_payment_orders: mockData.paymentOrders.length
  };

  const summaryPath = path.join(dataDir, 'data-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`✅ Generated data-summary.json`);

  console.log('\n🎉 Mock data generation completed!');
  console.log(`📁 Data saved to: ${dataDir}`);
  console.log(`📊 Summary:`);
  console.log(`   • ${summary.total_hospitals} hospitals`);
  console.log(`   • ${summary.total_ambulances} ambulances`);
  console.log(`   • ${summary.total_patients} patients`);
  console.log(`   • ${summary.total_emergency_types} emergency types`);
  console.log(`   • ${summary.total_emergency_requests} emergency requests`);
  console.log(`   • ${summary.total_sms_messages} SMS messages`);
  console.log(`   • ${summary.total_payment_orders} payment orders`);
}

// Run if this file is executed directly
if (require.main === module) {
  saveMockData();
}

module.exports = { mockData, saveMockData };
