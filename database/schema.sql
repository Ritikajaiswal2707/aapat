-- Enable PostGIS extension for location data
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and role management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'DISPATCHER', 'DRIVER', 'PARAMEDIC', 'HOSPITAL_STAFF', 'PATIENT')),
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    assigned_driver_id UUID,
    assigned_hospital_id UUID,
    estimated_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    hospital_arrival TIMESTAMP,
    completed_at TIMESTAMP,
    response_time_minutes INTEGER,
    total_time_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table for comprehensive patient management
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) UNIQUE,
    name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    blood_type VARCHAR(5),
    medical_history JSONB DEFAULT '[]',
    allergies JSONB DEFAULT '[]',
    emergency_contacts JSONB DEFAULT '[]',
    insurance_info JSONB DEFAULT '{}',
    address TEXT,
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
    icu_beds INTEGER DEFAULT 0,
    available_icu_beds INTEGER DEFAULT 0,
    equipment_level VARCHAR(20) DEFAULT 'BASIC',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hospital departments table
CREATE TABLE hospital_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER DEFAULT 0,
    available_capacity INTEGER DEFAULT 0,
    specialization VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255),
    license_number VARCHAR(50) UNIQUE NOT NULL,
    certifications JSONB DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE',
    rating DECIMAL(2,1) DEFAULT 5.0 CHECK (rating BETWEEN 1.0 AND 5.0),
    total_trips INTEGER DEFAULT 0,
    join_date DATE DEFAULT CURRENT_DATE,
    current_location GEOGRAPHY(POINT, 4326),
    last_active TIMESTAMP,
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
    equipment_list JSONB DEFAULT '[]',
    fuel_level INTEGER DEFAULT 100 CHECK (fuel_level BETWEEN 0 AND 100),
    mileage INTEGER DEFAULT 0,
    last_maintenance DATE,
    next_maintenance DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dispatch assignments table
CREATE TABLE dispatch_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emergency_request_id UUID REFERENCES emergency_requests(id) ON DELETE CASCADE,
    ambulance_id UUID REFERENCES ambulances(id),
    driver_id UUID REFERENCES drivers(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED',
    estimated_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Communication logs table
CREATE TABLE communication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emergency_request_id UUID REFERENCES emergency_requests(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('SMS', 'CALL', 'PUSH', 'EMAIL')),
    recipient_phone VARCHAR(15),
    recipient_email VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Billing and payments table
CREATE TABLE billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emergency_request_id UUID REFERENCES emergency_requests(id),
    patient_id UUID REFERENCES patients(id),
    amount DECIMAL(10,2) NOT NULL,
    distance_km DECIMAL(8,2),
    base_fare DECIMAL(10,2),
    distance_fare DECIMAL(10,2),
    priority_surcharge DECIMAL(10,2) DEFAULT 0,
    insurance_covered DECIMAL(10,2) DEFAULT 0,
    patient_payable DECIMAL(10,2),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(20),
    payment_reference VARCHAR(100),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics and metrics table
CREATE TABLE analytics_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,2),
    metric_unit VARCHAR(20),
    time_period VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- System logs table
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(50) NOT NULL,
    log_level VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_emergency_requests_location ON emergency_requests USING GIST (location);
CREATE INDEX idx_emergency_requests_status ON emergency_requests (status);
CREATE INDEX idx_emergency_requests_priority ON emergency_requests (priority_level);
CREATE INDEX idx_emergency_requests_created_at ON emergency_requests (created_at);

CREATE INDEX idx_ambulances_location ON ambulances USING GIST (current_location);
CREATE INDEX idx_ambulances_status ON ambulances (status);
CREATE INDEX idx_ambulances_hospital ON ambulances (hospital_id);

CREATE INDEX idx_hospitals_location ON hospitals USING GIST (location);
CREATE INDEX idx_hospitals_active ON hospitals (is_active);

CREATE INDEX idx_drivers_status ON drivers (status);
CREATE INDEX idx_drivers_location ON drivers USING GIST (current_location);

CREATE INDEX idx_communication_logs_emergency ON communication_logs (emergency_request_id);
CREATE INDEX idx_communication_logs_type ON communication_logs (type);

CREATE INDEX idx_billing_emergency ON billing (emergency_request_id);
CREATE INDEX idx_billing_patient ON billing (patient_id);
CREATE INDEX idx_billing_status ON billing (payment_status);

CREATE INDEX idx_analytics_metrics_type ON analytics_metrics (metric_type);
CREATE INDEX idx_analytics_metrics_recorded_at ON analytics_metrics (recorded_at);

CREATE INDEX idx_system_logs_service ON system_logs (service_name);
CREATE INDEX idx_system_logs_level ON system_logs (log_level);
CREATE INDEX idx_system_logs_created_at ON system_logs (created_at);

-- Sample data
INSERT INTO users (phone, email, name, role, is_active) VALUES
('+91-9876543210', 'admin@aapat.com', 'System Administrator', 'ADMIN', true),
('+91-9876543211', 'dispatcher@aapat.com', 'Emergency Dispatcher', 'DISPATCHER', true),
('+91-9876543212', 'rajesh@aapat.com', 'Rajesh Kumar', 'DRIVER', true),
('+91-9876543213', 'suresh@aapat.com', 'Suresh Singh', 'DRIVER', true),
('+91-9876543214', 'hospital@aapat.com', 'Hospital Staff', 'HOSPITAL_STAFF', true);

INSERT INTO hospitals (name, address, location, phone, emergency_contact, specializations, total_beds, available_beds, icu_beds, available_icu_beds, equipment_level) VALUES
('AIIMS Delhi', 'Ansari Nagar, New Delhi', ST_GeogFromText('POINT(77.2090 28.5665)'), '+91-11-26588500', '+91-11-26588501', '["cardiology", "neurology", "trauma", "emergency"]', 2500, 150, 100, 15, 'ADVANCED'),
('Fortis Hospital Bangalore', 'Bannerghatta Road, Bangalore', ST_GeogFromText('POINT(77.6051 12.8996)'), '+91-80-66214444', '+91-80-66214445', '["cardiology", "orthopedics", "oncology"]', 400, 25, 20, 3, 'ADVANCED'),
('Apollo Hospital Chennai', 'Greams Road, Chennai', ST_GeogFromText('POINT(80.2507 13.0067)'), '+91-44-28290200', '+91-44-28290201', '["cardiology", "neurology", "oncology"]', 600, 45, 30, 5, 'ADVANCED'),
('Max Hospital Mumbai', 'Andheri West, Mumbai', ST_GeogFromText('POINT(72.8264 19.1136)'), '+91-22-42696969', '+91-22-42696970', '["trauma", "emergency", "cardiology"]', 300, 20, 15, 2, 'BASIC');

INSERT INTO hospital_departments (hospital_id, name, capacity, available_capacity, specialization) VALUES
((SELECT id FROM hospitals WHERE name = 'AIIMS Delhi'), 'Emergency Department', 50, 8, 'Emergency Medicine'),
((SELECT id FROM hospitals WHERE name = 'AIIMS Delhi'), 'Cardiology ICU', 20, 3, 'Cardiology'),
((SELECT id FROM hospitals WHERE name = 'AIIMS Delhi'), 'Neurology ICU', 15, 2, 'Neurology'),
((SELECT id FROM hospitals WHERE name = 'Fortis Hospital Bangalore'), 'Emergency Department', 30, 5, 'Emergency Medicine'),
((SELECT id FROM hospitals WHERE name = 'Fortis Hospital Bangalore'), 'Cardiology Ward', 25, 4, 'Cardiology'),
((SELECT id FROM hospitals WHERE name = 'Apollo Hospital Chennai'), 'Emergency Department', 40, 6, 'Emergency Medicine'),
((SELECT id FROM hospitals WHERE name = 'Max Hospital Mumbai'), 'Emergency Department', 20, 3, 'Emergency Medicine');

INSERT INTO drivers (user_id, name, phone, email, license_number, certifications, status, rating, current_location) VALUES
((SELECT id FROM users WHERE phone = '+91-9876543212'), 'Rajesh Kumar', '+91-9876543212', 'rajesh@aapat.com', 'DL1234567890', '["BLS", "First Aid", "Ambulance License"]', 'ACTIVE', 4.8, ST_GeogFromText('POINT(77.5946 12.9716)')),
((SELECT id FROM users WHERE phone = '+91-9876543213'), 'Suresh Singh', '+91-9876543213', 'suresh@aapat.com', 'DL1234567891', '["BLS", "ACLS", "Ambulance License"]', 'ACTIVE', 4.9, ST_GeogFromText('POINT(77.2090 28.5665)'));

INSERT INTO ambulances (license_plate, driver_id, hospital_id, current_location, status, equipment_level, equipment_list, fuel_level) VALUES
('KA01AB1234', (SELECT id FROM drivers WHERE phone = '+91-9876543212'), 
 (SELECT id FROM hospitals WHERE name = 'Fortis Hospital Bangalore'),
 ST_GeogFromText('POINT(77.5946 12.9716)'), 'AVAILABLE', 'BASIC', 
 '["Oxygen Cylinder", "First Aid Kit", "Stretcher", "Defibrillator"]', 85),
('DL01AB1235', (SELECT id FROM drivers WHERE phone = '+91-9876543213'),
 (SELECT id FROM hospitals WHERE name = 'AIIMS Delhi'),
 ST_GeogFromText('POINT(77.2090 28.5665)'), 'AVAILABLE', 'ADVANCED',
 '["Oxygen Cylinder", "First Aid Kit", "Stretcher", "Defibrillator", "Ventilator", "ECG Machine"]', 92),
('MH01AB1236', (SELECT id FROM drivers WHERE phone = '+91-9876543212'),
 (SELECT id FROM hospitals WHERE name = 'Max Hospital Mumbai'),
 ST_GeogFromText('POINT(72.8264 19.1136)'), 'AVAILABLE', 'BASIC',
 '["Oxygen Cylinder", "First Aid Kit", "Stretcher"]', 78);

INSERT INTO patients (phone, name, date_of_birth, gender, blood_type, medical_history, allergies, emergency_contacts, address) VALUES
('+91-9876543215', 'Priya Sharma', '1985-03-15', 'FEMALE', 'O+', '["Diabetes", "Hypertension"]', '["Penicillin"]', '[{"name": "Rahul Sharma", "phone": "+91-9876543216", "relation": "Husband"}]', '123 MG Road, Bangalore'),
('+91-9876543217', 'Amit Patel', '1978-07-22', 'MALE', 'B+', '["Heart Disease"]', '[]', '[{"name": "Sunita Patel", "phone": "+91-9876543218", "relation": "Wife"}]', '456 Park Street, Delhi');

-- Sample analytics data
INSERT INTO analytics_metrics (metric_type, metric_value, metric_unit, time_period, recorded_at) VALUES
('avg_response_time', 4.2, 'minutes', 'daily', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('total_emergencies', 45, 'count', 'daily', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('ambulance_utilization', 78.5, 'percentage', 'daily', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('patient_satisfaction', 4.6, 'rating', 'daily', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('avg_response_time', 3.8, 'minutes', 'weekly', CURRENT_TIMESTAMP - INTERVAL '7 days'),
('total_emergencies', 312, 'count', 'weekly', CURRENT_TIMESTAMP - INTERVAL '7 days');
