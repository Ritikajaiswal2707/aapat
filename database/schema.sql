-- Enable PostGIS extension for location data
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Emergency requests table
CREATE TABLE emergency_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_phone VARCHAR(15) NOT NULL,
    patient_info JSONB DEFAULT '{}',
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address TEXT NOT NULL,
    emergency_type VARCHAR(100),
    symptoms TEXT,
    priority_level INTEGER NOT NULL CHECK (priority_level BETWEEN 1 AND 4),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    assigned_ambulance_id UUID,
    estimated_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hospitals table
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    phone VARCHAR(15),
    emergency_contact VARCHAR(15),
    specializations JSONB DEFAULT '[]',
    total_beds INTEGER DEFAULT 0,
    available_beds INTEGER DEFAULT 0,
    equipment_level VARCHAR(20) DEFAULT 'BASIC',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255),
    license_number VARCHAR(50) UNIQUE NOT NULL,
    certifications JSONB DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE',
    rating DECIMAL(2,1) DEFAULT 5.0 CHECK (rating BETWEEN 1.0 AND 5.0),
    total_trips INTEGER DEFAULT 0,
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ambulances table
CREATE TABLE ambulances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    hospital_id UUID REFERENCES hospitals(id),
    current_location GEOGRAPHY(POINT, 4326),
    status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
    equipment_level VARCHAR(20) NOT NULL DEFAULT 'BASIC',
    fuel_level INTEGER DEFAULT 100 CHECK (fuel_level BETWEEN 0 AND 100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO hospitals (name, address, location, phone, specializations, total_beds, available_beds, equipment_level) VALUES
('AIIMS Delhi', 'Ansari Nagar, New Delhi', ST_GeogFromText('POINT(77.2090 28.5665)'), '+91-11-26588500', '["cardiology", "neurology", "trauma", "emergency"]', 2500, 150, 'ADVANCED'),
('Fortis Hospital Bangalore', 'Bannerghatta Road, Bangalore', ST_GeogFromText('POINT(77.6051 12.8996)'), '+91-80-66214444', '["cardiology", "orthopedics", "oncology"]', 400, 25, 'ADVANCED');

INSERT INTO drivers (name, phone, license_number, certifications, status, rating) VALUES
('Rajesh Kumar', '+91-9876543210', 'DL1234567890', '["BLS", "First Aid", "Ambulance License"]', 'ACTIVE', 4.8),
('Suresh Singh', '+91-9876543211', 'DL1234567891', '["BLS", "ACLS", "Ambulance License"]', 'ACTIVE', 4.9);

INSERT INTO ambulances (license_plate, driver_id, hospital_id, current_location, status, equipment_level) VALUES
('KA01AB1234', (SELECT id FROM drivers WHERE phone = '+91-9876543210'), 
 (SELECT id FROM hospitals WHERE name = 'Fortis Hospital Bangalore'),
 ST_GeogFromText('POINT(77.5946 12.9716)'), 'AVAILABLE', 'BASIC'),
('DL01AB1235', (SELECT id FROM drivers WHERE phone = '+91-9876543211'),
 (SELECT id FROM hospitals WHERE name = 'AIIMS Delhi'),
 ST_GeogFromText('POINT(77.2090 28.5665)'), 'AVAILABLE', 'ADVANCED');
