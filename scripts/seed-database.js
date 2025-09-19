// Database Seeding Script for Aapat Platform
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: 'aapat_user',
  host: 'localhost', // Change to 'postgres' if using Docker
  database: 'aapat_db',
  password: 'aapat_password',
  port: 5432,
});

// Sample data
const sampleData = {
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
      driver_id: 'drv_001',
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
      driver_id: 'drv_002',
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
      driver_id: 'drv_003',
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
      driver_id: 'drv_004',
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
      driver_id: null,
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
      driver_id: 'drv_005',
      fuel_level: 95,
      last_maintenance: '2024-01-08',
      next_maintenance: '2024-04-08',
      is_active: true
    }
  ],

  // Drivers with realistic profiles
  drivers: [
    {
      id: 'drv_001',
      name: 'Rajesh Kumar',
      phone: '+91-98765-43210',
      email: 'rajesh.kumar@aapat.com',
      license_number: 'DL-1234567890',
      experience_years: 5,
      rating: 4.5,
      total_emergencies: 120,
      successful_emergencies: 115,
      specializations: ['Basic Life Support', 'First Aid'],
      is_active: true,
      joined_date: '2019-03-15'
    },
    {
      id: 'drv_002',
      name: 'Suresh Singh',
      phone: '+91-98765-43211',
      email: 'suresh.singh@aapat.com',
      license_number: 'DL-1234567891',
      experience_years: 8,
      rating: 4.7,
      total_emergencies: 200,
      successful_emergencies: 195,
      specializations: ['Advanced Life Support', 'Trauma Care'],
      is_active: true,
      joined_date: '2016-07-20'
    },
    {
      id: 'drv_003',
      name: 'Amit Sharma',
      phone: '+91-98765-43212',
      email: 'amit.sharma@aapat.com',
      license_number: 'DL-1234567892',
      experience_years: 10,
      rating: 4.8,
      total_emergencies: 300,
      successful_emergencies: 290,
      specializations: ['Critical Care', 'Pediatric Emergency'],
      is_active: true,
      joined_date: '2014-01-10'
    },
    {
      id: 'drv_004',
      name: 'Vikram Patel',
      phone: '+91-98765-43213',
      email: 'vikram.patel@aapat.com',
      license_number: 'DL-1234567893',
      experience_years: 12,
      rating: 4.9,
      total_emergencies: 400,
      successful_emergencies: 395,
      specializations: ['Critical Care', 'Cardiac Emergency', 'Trauma Care'],
      is_active: true,
      joined_date: '2012-05-15'
    },
    {
      id: 'drv_005',
      name: 'Ravi Verma',
      phone: '+91-98765-43214',
      email: 'ravi.verma@aapat.com',
      license_number: 'DL-1234567894',
      experience_years: 3,
      rating: 4.2,
      total_emergencies: 80,
      successful_emergencies: 75,
      specializations: ['Basic Life Support'],
      is_active: true,
      joined_date: '2021-09-01'
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
    }
  ]
};

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await pool.query('DELETE FROM emergency_requests');
    await pool.query('DELETE FROM patients');
    await pool.query('DELETE FROM drivers');
    await pool.query('DELETE FROM ambulances');
    await pool.query('DELETE FROM hospitals');
    await pool.query('DELETE FROM emergency_types');
    
    // Insert emergency types
    console.log('📋 Inserting emergency types...');
    for (const type of sampleData.emergencyTypes) {
      await pool.query(`
        INSERT INTO emergency_types (id, name, priority, color, description)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        priority = EXCLUDED.priority,
        color = EXCLUDED.color,
        description = EXCLUDED.description
      `, [type.id, type.name, type.priority, type.color, type.description]);
    }

    // Insert hospitals
    console.log('🏥 Inserting hospitals...');
    for (const hospital of sampleData.hospitals) {
      await pool.query(`
        INSERT INTO hospitals (
          id, name, address, phone, email, total_beds, available_beds,
          icu_beds, available_icu_beds, ventilator_beds, available_ventilator_beds,
          specializations, equipment_level, rating, is_active, established_year,
          location
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          ST_Point($17, $18)
        )
        ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        total_beds = EXCLUDED.total_beds,
        available_beds = EXCLUDED.available_beds,
        icu_beds = EXCLUDED.icu_beds,
        available_icu_beds = EXCLUDED.available_icu_beds,
        ventilator_beds = EXCLUDED.ventilator_beds,
        available_ventilator_beds = EXCLUDED.available_ventilator_beds,
        specializations = EXCLUDED.specializations,
        equipment_level = EXCLUDED.equipment_level,
        rating = EXCLUDED.rating,
        is_active = EXCLUDED.is_active,
        established_year = EXCLUDED.established_year,
        location = EXCLUDED.location
      `, [
        hospital.id, hospital.name, hospital.address, hospital.phone, hospital.email,
        hospital.total_beds, hospital.available_beds, hospital.icu_beds, hospital.available_icu_beds,
        hospital.ventilator_beds, hospital.available_ventilator_beds, hospital.specializations,
        hospital.equipment_level, hospital.rating, hospital.is_active, hospital.established_year,
        hospital.lng, hospital.lat
      ]);
    }

    // Insert drivers
    console.log('👨‍⚕️ Inserting drivers...');
    for (const driver of sampleData.drivers) {
      await pool.query(`
        INSERT INTO drivers (
          id, name, phone, email, license_number, experience_years, rating,
          total_emergencies, successful_emergencies, specializations, is_active, joined_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        license_number = EXCLUDED.license_number,
        experience_years = EXCLUDED.experience_years,
        rating = EXCLUDED.rating,
        total_emergencies = EXCLUDED.total_emergencies,
        successful_emergencies = EXCLUDED.successful_emergencies,
        specializations = EXCLUDED.specializations,
        is_active = EXCLUDED.is_active,
        joined_date = EXCLUDED.joined_date
      `, [
        driver.id, driver.name, driver.phone, driver.email, driver.license_number,
        driver.experience_years, driver.rating, driver.total_emergencies,
        driver.successful_emergencies, driver.specializations, driver.is_active, driver.joined_date
      ]);
    }

    // Insert ambulances
    console.log('🚑 Inserting ambulances...');
    for (const ambulance of sampleData.ambulances) {
      await pool.query(`
        INSERT INTO ambulances (
          id, plate_number, type, equipment_level, status, driver_id,
          fuel_level, last_maintenance, next_maintenance, is_active,
          current_location
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ST_Point($11, $12))
        ON CONFLICT (id) DO UPDATE SET
        plate_number = EXCLUDED.plate_number,
        type = EXCLUDED.type,
        equipment_level = EXCLUDED.equipment_level,
        status = EXCLUDED.status,
        driver_id = EXCLUDED.driver_id,
        fuel_level = EXCLUDED.fuel_level,
        last_maintenance = EXCLUDED.last_maintenance,
        next_maintenance = EXCLUDED.next_maintenance,
        is_active = EXCLUDED.is_active,
        current_location = EXCLUDED.current_location
      `, [
        ambulance.id, ambulance.plate_number, ambulance.type, ambulance.equipment_level,
        ambulance.status, ambulance.driver_id, ambulance.fuel_level, ambulance.last_maintenance,
        ambulance.next_maintenance, ambulance.is_active, ambulance.lng, ambulance.lat
      ]);
    }

    // Insert patients
    console.log('👥 Inserting patients...');
    for (const patient of sampleData.patients) {
      await pool.query(`
        INSERT INTO patients (
          id, name, phone, email, age, gender, blood_group, allergies,
          medical_history, address, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        blood_group = EXCLUDED.blood_group,
        allergies = EXCLUDED.allergies,
        medical_history = EXCLUDED.medical_history,
        address = EXCLUDED.address,
        created_at = EXCLUDED.created_at
      `, [
        patient.id, patient.name, patient.phone, patient.email, patient.age,
        patient.gender, patient.blood_group, patient.allergies, patient.medical_history,
        patient.address, patient.created_at
      ]);

      // Insert emergency contacts
      for (const contact of patient.emergency_contacts) {
        await pool.query(`
          INSERT INTO emergency_contacts (
            patient_id, name, phone, relation, is_primary
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (patient_id, phone) DO UPDATE SET
          name = EXCLUDED.name,
          relation = EXCLUDED.relation,
          is_primary = EXCLUDED.is_primary
        `, [patient.id, contact.name, contact.phone, contact.relation, contact.is_primary]);
      }
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`📊 Data inserted:`);
    console.log(`   • ${sampleData.emergencyTypes.length} emergency types`);
    console.log(`   • ${sampleData.hospitals.length} hospitals`);
    console.log(`   • ${sampleData.drivers.length} drivers`);
    console.log(`   • ${sampleData.ambulances.length} ambulances`);
    console.log(`   • ${sampleData.patients.length} patients`);

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase().catch(console.error);
}

module.exports = { seedDatabase, sampleData };
