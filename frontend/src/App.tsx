import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

interface Emergency {
  id: string;
  priority: number;
  location: { lat: number; lng: number };
  address: string;
  emergency_type: string;
  patient_info?: any;
  timestamp: string;
  status: string;
  assigned_ambulance_id?: string;
  estimated_arrival?: string;
}

interface DashboardMetrics {
  active_emergencies: number;
  avg_response_time: number;
  available_ambulances: number;
  partner_hospitals: number;
  critical_emergencies: number;
  high_emergencies: number;
  medium_emergencies: number;
  low_emergencies: number;
  total_emergencies_today: number;
  completed_emergencies: number;
  avg_response_time_trend: number;
}

interface Ambulance {
  id: string;
  license_plate: string;
  status: string;
  location: { lat: number; lng: number };
  driver_name: string;
  equipment_level: string;
  eta_minutes?: number;
}

interface Hospital {
  id: string;
  name: string;
  available_beds: number;
  total_beds: number;
  available_icu_beds: number;
  icu_beds: number;
  location: { lat: number; lng: number };
}

interface UberStyleRide {
  id: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  ride_type: 'emergency' | 'scheduled' | 'medical_transport';
  pickup_location: {
    lat: number;
    lng: number;
    address: string;
  };
  destination_location?: {
    lat: number;
    lng: number;
    address: string;
  };
  medical_info?: {
    condition?: string;
    priority?: string;
    symptoms?: string[];
    mobility_level?: string;
  };
  status: 'pending_assignment' | 'broadcasting' | 'assigned' | 'driver_accepted' | 'otp_verified' | 'in_progress' | 'completed' | 'cancelled';
  estimated_fare?: {
    total_fare: number;
    base_fare: number;
    distance_fare: number;
    equipment_surcharge: number;
    priority_multiplier: number;
  };
  assigned_driver?: {
    name: string;
    phone: string;
    vehicle_number: string;
    rating: number;
  };
  otp?: string;
  payment_status?: 'pending' | 'completed' | 'failed';
  created_at: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle_number: string;
  vehicle_type: string;
  rating: number;
  is_online: boolean;
  is_available: boolean;
  current_location?: { lat: number; lng: number };
  equipment: string[];
  current_ride?: string;
}

function App() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    active_emergencies: 0,
    avg_response_time: 0,
    available_ambulances: 0,
    partner_hospitals: 0,
    critical_emergencies: 0,
    high_emergencies: 0,
    medium_emergencies: 0,
    low_emergencies: 0,
    total_emergencies_today: 0,
    completed_emergencies: 0,
    avg_response_time_trend: 0
  });
  
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'emergencies' | 'ambulances' | 'hospitals' | 'uber-rides'>('overview');
  
  // Uber-style state
  const [uberRides, setUberRides] = useState<UberStyleRide[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showRideForm, setShowRideForm] = useState(false);
  const [rideFormData, setRideFormData] = useState({
    customer_name: 'Demo Patient',
    customer_phone: '9876543210',
    pickup_address: 'India Gate, Delhi',
    destination_address: 'AIIMS Hospital',
    ride_type: 'emergency' as 'emergency' | 'scheduled' | 'medical_transport',
    medical_condition: 'heart attack',
    payment_method: 'upi'
  });
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [formName, setFormName] = useState('Test Patient');
  const [formPhone, setFormPhone] = useState('+919876543210');
  const [formType, setFormType] = useState<'CARDIAC' | 'TRAUMA' | 'RESPIRATORY' | 'NEUROLOGICAL'>('CARDIAC');
  const [formAddress, setFormAddress] = useState('Test Location, Bangalore');
  const [formSymptoms, setFormSymptoms] = useState('Chest pain');
  const [formConscious, setFormConscious] = useState(true);
  const [formBreathing, setFormBreathing] = useState(true);
  const [formPainLevel, setFormPainLevel] = useState(5);

  // Filters & detail drawer state
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchText, setSearchText] = useState<string>('');
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  // Derived filtered emergencies
  const filteredEmergencies = emergencies.filter(e => {
    const typeOk = filterType === 'ALL' || e.emergency_type === filterType;
    const statusOk = filterStatus === 'ALL' || (e.status || '').toUpperCase() === filterStatus;
    const text = `${e.emergency_type} ${e.address} ${e.patient_info?.name || ''}`.toLowerCase();
    const searchOk = searchText.trim() === '' || text.includes(searchText.toLowerCase());
    return typeOk && statusOk && searchOk;
  });

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to emergency service');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from emergency service');
    });

    newSocket.on('new_emergency', (emergency: Emergency) => {
      setEmergencies(prev => [emergency, ...prev.slice(0, 9)]); // Keep last 10
      updateMetrics();
    });

    // Fetch initial data
    fetchMetrics();
    fetchRecentEmergencies();
    fetchAmbulances();
    fetchHospitals();
    fetchUberRides();
    fetchDrivers();

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://localhost:3008/api/analytics/dashboard?period=24h');
      const data = await response.json();
      if (data.success) {
        setMetrics({
          active_emergencies: data.data.metrics.total_emergencies || 0,
          avg_response_time: data.data.metrics.avg_response_time_minutes || 0,
          available_ambulances: data.data.metrics.available_ambulances || 0,
          partner_hospitals: data.data.metrics.total_hospitals || 0,
          critical_emergencies: data.data.metrics.critical_emergencies || 0,
          high_emergencies: data.data.metrics.high_emergencies || 0,
          medium_emergencies: data.data.metrics.medium_emergencies || 0,
          low_emergencies: data.data.metrics.low_emergencies || 0,
          total_emergencies_today: data.data.metrics.total_emergencies || 0,
          completed_emergencies: data.data.metrics.completed_emergencies || 0,
          avg_response_time_trend: 0 // This would come from trend analysis
        });
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const fetchAmbulances = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/ambulances');
      const data = await response.json();
      if (data.success) {
        setAmbulances(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch ambulances:', error);
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/hospitals');
      const data = await response.json();
      if (data.success) {
        setHospitals(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    }
  };

  const fetchRecentEmergencies = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/emergency/recent');
      const data = await response.json();
      if (data.success) {
        setEmergencies(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch emergencies:', error);
    }
  };

  const updateMetrics = () => {
    fetchMetrics();
    fetchAmbulances();
    fetchHospitals();
    fetchUberRides();
    fetchDrivers();
  };

  // Uber-style API functions
  const fetchUberRides = async () => {
    try {
      // Mock data since we don't have a dedicated store endpoint
      const mockRides: UberStyleRide[] = [
        {
          id: 'a998e60e-123d-49c8-82dc-bc0b9d0d3e24',
          customer: { name: 'Patient Raj', phone: '9876543210' },
          ride_type: 'emergency',
          pickup_location: { lat: 28.6315, lng: 77.2167, address: 'India Gate, Delhi' },
          destination_location: { lat: 28.5667, lng: 77.2090, address: 'AIIMS Hospital' },
          medical_info: { condition: 'heart attack', priority: 'critical' },
          status: 'driver_accepted',
          estimated_fare: { total_fare: 2250, base_fare: 1500, distance_fare: 450, equipment_surcharge: 500, priority_multiplier: 1.5 },
          assigned_driver: { name: 'Rahul Singh', phone: '9876543210', vehicle_number: 'DL-01-AB-1234', rating: 4.8 },
          otp: '7343',
          payment_status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: 'd31ef003-95b3-47a0-a428-f3aba7fa41ed',
          customer: { name: 'Mrs. Priya Singh', phone: '9123456789' },
          ride_type: 'emergency',
          pickup_location: { lat: 28.6315, lng: 77.2167, address: 'Location X, Delhi' },
          destination_location: { lat: 28.5667, lng: 77.2090, address: 'Fortis Hospital' },
          medical_info: { condition: 'broken leg', priority: 'high' },
          status: 'otp_verified',
          estimated_fare: { total_fare: 1800, base_fare: 1200, distance_fare: 400, equipment_surcharge: 300, priority_multiplier: 1.2 },
          assigned_driver: { name: 'Priya Sharma', phone: '9123456789', vehicle_number: 'DL-02-CD-5678', rating: 4.9 },
          otp: '9439',
          payment_status: 'pending',
          created_at: new Date().toISOString()
        }
      ];
      setUberRides(mockRides);
    } catch (error) {
      console.error('Failed to fetch Uber rides:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch('http://localhost:3012/health');
      const data = await response.json();
      
         // Scaled-up driver fleet data
         const mockDrivers: Driver[] = [
           {
             id: 'driver-001',
             name: 'Rahul Singh',
             phone: '9876543210',
             vehicle_number: 'DL-01-AB-1234',
             vehicle_type: 'Advanced Life Support',
             rating: 4.8,
             is_online: true,
             is_available: false,
             current_location: { lat: 28.63, lng: 77.22 },
             equipment: ['oxygen', 'defibrillator', 'heart_monitor'],
             current_ride: 'a998e60e-123d-49c8-driver-completed'
           },
           {
             id: 'driver-002',
             name: 'Priya Sharma',
             phone: '9123456789',
             vehicle_number: 'DL-02-CD-5678',
             vehicle_type: 'Critical Care Unit',
             rating: 4.9,
             is_online: true,
             is_available: false,
             current_location: { lat: 28.64, lng: 77.22 },
             equipment: ['ventilator', 'defibrillator', 'heart_monitor'],
             current_ride: 'd31ef003-95b3-47a0-a428-completed'
           },
           {
             id: 'driver-003',
             name: 'Amit Kumar',
             phone: '9988776655',
             vehicle_number: 'DL-03-EF-9012',
             vehicle_type: 'Basic Life Support',
             rating: 4.7,
             is_online: true,
             is_available: true,
             current_location: { lat: 28.63, lng: 77.21 },
             equipment: ['oxygen', 'defibrillator', 'stretcher']
           },
           {
             id: 'driver-004',
             name: 'Deepak Patel',
             phone: '9923456789',
             vehicle_number: 'DL-04-GH-3456',
             vehicle_type: 'Advanced Life Support',
             rating: 4.9,
             is_online: true,
             is_available: true,
             current_location: { lat: 28.64, lng: 77.215 },
             equipment: ['oxygen', 'defibrillator', 'heart_monitor', 'endotracheal_tube']
           },
           {
             id: 'driver-005',
             name: 'Sneha Reddy',
             phone: '9870123456',
             vehicle_number: 'DL-05-IJ-7890',
             vehicle_type: 'Critical Care Unit',
             rating: 4.8,
             is_online: true,
             is_available: true,
             current_location: { lat: 28.62, lng: 77.205 },
             equipment: ['oxygen', 'defibrillator', 'ventilator', 'cpap', 'nebulizer']
           },
           {
             id: 'driver-006',
             name: 'Vikram Joshi',
             phone: '9876543211',
             vehicle_number: 'DL-06-KL-2468',
             vehicle_type: 'Basic Life Support',
             rating: 4.6,
             is_online: true,
             is_available: true,
             current_location: { lat: 28.645, lng: 77.225 },
             equipment: ['oxygen', 'first_aid', 'stretcher', 'wheelchair']
           },
           {
             id: 'driver-007',
             name: 'Meera Krishnan',
             phone: '9987654321',
             vehicle_number: 'DL-07-MN-1357',
             vehicle_type: 'Neonatal Unit',
             rating: 4.9,
             is_online: true,
             is_available: true,
             current_location: { lat: 28.615, lng: 77.195 },
             equipment: ['oxygen', 'incubator', 'neonatal_monitor', 'warming_lights']
           },
           {
             id: 'driver-008',
             name: 'Arjun Singh',
             phone: '9876543212',
             vehicle_number: 'DL-08-OP-9876',
             vehicle_type: 'Trauma Response Unit',
             rating: 4.7,
             is_online: true,
             is_available: true,
             current_location: { lat: 28.65, lng: 77.23 },
             equipment: ['oxygen', 'defibrillator', 'spine_board', 'cervical_collar', 'trauma_kit']
           },
           {
             id: 'driver-009',
             name: 'Kavya Sharma',
             phone: '9123456787',
             vehicle_number: 'DL-09-QR-6543',
             vehicle_type: 'Advanced Life Support',
             rating: 4.8,
             is_online: true,
             is_available: true,
             current_location: { lat: 28.61, lng: 77.19 },
             equipment: ['oxygen', 'defibrillator', 'heart_monitor', 'mobile_ecg']
           },
           {
             id: 'driver-010',
             name: 'Ravi Chaudhry',
             phone: '9870123457',
             vehicle_number: 'DL-10-ST-2109',
             vehicle_type: 'Basic Life Support',
             rating: 4.5,
             is_online: true,
             is_available: true,
             current_location: { lat: 28.655, lng: 77.235 },
             equipment: ['oxygen', 'first_aid', 'stretcher', 'basic_medications']
           }
         ];
      setDrivers(mockDrivers);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    }
  };

  const createUberStyleRide = async () => {
    try {
      const rideRequest = {
        customer: {
          name: rideFormData.customer_name,
          phone: rideFormData.customer_phone
        },
        ride_type: rideFormData.ride_type,
        pickup_location: {
          lat: 28.6315 + (Math.random() - 0.5) * 0.01,
          lng: 77.2167 + (Math.random() - 0.5) * 0.01,
          address: rideFormData.pickup_address
        },
        destination_location: {
          lat: 28.5667,
          lng: 77.2090,
          address: rideFormData.destination_address
        },
        medical_info: {
          condition: rideFormData.medical_condition,
          priority: rideFormData.ride_type === 'emergency' ? 'critical' : 'normal'
        },
        payment_method: rideFormData.payment_method
      };

      const response = await fetch('http://localhost:3012/api/ride/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rideRequest)
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ Ambulance booking request created! Check the Ambulance Booking tab to see driver matching in action.');
        setShowRideForm(false);
        fetchUberRides();
        fetchDrivers();
      } else {
        alert('❌ Failed to create booking request: ' + result.message);
      }
    } catch (error: any) {
      alert('❌ Error creating ride request: ' + error.message);
    }
  };

  const createTestEmergency = async () => {
    const testEmergency = {
      caller_phone: "+919876543210",
      patient_info: {
        name: "Test Patient",
        age: 35,
        gender: "MALE",
        blood_type: "O+"
      },
      location: {
        latitude: 12.9716 + (Math.random() - 0.5) * 0.01, // Add some randomness
        longitude: 77.5946 + (Math.random() - 0.5) * 0.01
      },
      address: "Test Location, Bangalore",
      emergency_type: ["CARDIAC", "TRAUMA", "RESPIRATORY", "NEUROLOGICAL"][Math.floor(Math.random() * 4)],
      symptoms: "Test emergency for demonstration",
      conscious: true,
      breathing: true,
      pain_level: Math.floor(Math.random() * 10) + 1
    };

    try {
      const response = await fetch('http://localhost:3001/api/emergency/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testEmergency)
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ Test emergency created successfully! Check the Recent Emergencies section.');
        updateMetrics();
        fetchRecentEmergencies();
      } else {
        alert('❌ Failed to create test emergency: ' + result.message);
      }
    } catch (error) {
      alert('❌ Error creating test emergency: ' + error.message);
    }
  };

  const submitCustomEmergency = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const payload = {
      caller_phone: formPhone,
      patient_info: {
        name: formName,
        age: 35,
        gender: 'MALE',
        blood_type: 'O+'
      },
      location: {
        latitude: 12.9716 + (Math.random() - 0.5) * 0.01,
        longitude: 77.5946 + (Math.random() - 0.5) * 0.01
      },
      address: formAddress,
      emergency_type: formType,
      symptoms: formSymptoms,
      conscious: formConscious,
      breathing: formBreathing,
      pain_level: formPainLevel
    };

    try {
      const response = await fetch('http://localhost:3001/api/emergency/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        alert('✅ Custom test emergency created!');
        setShowCustomForm(false);
        updateMetrics();
        fetchRecentEmergencies();
      } else {
        alert('❌ Failed to create emergency: ' + result.message);
      }
    } catch (error: any) {
      alert('❌ Error creating emergency: ' + error.message);
    }
  };

  const updateEmergencyStatusLocal = (id: string, newStatus: string) => {
    setEmergencies(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } as any : e));
  };

  const closeDetails = () => setSelectedEmergency(null);

  // Mock driver assignment helpers
  const toRad = (value: number) => (value * Math.PI) / 180;
  const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371; // km
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const estimateEtaMinutes = (distanceKm: number) => {
    // Mock average urban speed ~30 km/h
    const speedKmh = 30;
    return Math.max(2, Math.round((distanceKm / speedKmh) * 60));
  };

  const assignNearestAmbulance = (emergencyId: string) => {
    setEmergencies(prev => {
      const emergency = prev.find(e => e.id === emergencyId);
      if (!emergency) return prev;
      if (!emergency.location) return prev;

      let bestAmbulance: Ambulance | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;
      ambulances.forEach(amb => {
        const d = haversineKm(emergency.location, amb.location);
        if (d < bestDistance) {
          bestDistance = d;
          bestAmbulance = amb;
        }
      });

      if (!bestAmbulance || !isFinite(bestDistance)) return prev;
      const eta = estimateEtaMinutes(bestDistance);

      return prev.map(e =>
        e.id === emergencyId
          ? ({
              ...e,
              status: 'ASSIGNED',
              assigned_ambulance_id: bestAmbulance!.id,
              estimated_arrival: `${eta} min`
            } as any)
          : e
      );
    });
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return '#dc2626'; // Critical - Red
      case 2: return '#ea580c'; // High - Orange
      case 3: return '#d97706'; // Medium - Amber
      case 4: return '#16a34a'; // Low - Green
      default: return '#6b7280'; // Gray
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1: return 'CRITICAL';
      case 2: return 'HIGH';
      case 3: return 'MEDIUM';
      case 4: return 'LOW';
      default: return 'UNKNOWN';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return '#10b981';
      case 'ASSIGNED': return '#f59e0b';
      case 'ON_ROUTE': return '#3b82f6';
      case 'AT_PATIENT': return '#8b5cf6';
      case 'TRANSPORTING': return '#dc2626';
      case 'AT_HOSPITAL': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Uber-style helper functions
  const getRideStatusColor = (status: string) => {
    switch (status) {
      case 'pending_assignment': return '#6b7280';
      case 'broadcasting': return '#f59e0b';
      case 'assigned': return '#3b82f6';
      case 'driver_accepted': return '#10b981';
      case 'otp_verified': return '#8b5cf6';
      case 'in_progress': return '#dc2626';
      case 'completed': return '#059669';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRideStatusText = (status: string) => {
    switch (status) {
      case 'pending_assignment': return 'Finding Drivers';
      case 'broadcasting': return 'Broadcasting to Drivers';
      case 'assigned': return 'Driver Assigned';
      case 'driver_accepted': return 'Driver Coming';
      case 'otp_verified': return 'OTP Verified';
      case 'in_progress': return 'Ride in Progress';
      case 'completed': return 'Ride Completed';
      case 'cancelled': return 'Ride Cancelled';
      default: return status.toUpperCase();
    }
  };

  const getRideTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return '#dc2626';
      case 'scheduled': return '#3b82f6';
      case 'medical_transport': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ 
        background: 'linear-gradient(to right, #e53e3e, #dc2626)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>🚑 Aapat Emergency Dashboard</h1>
          <p style={{ margin: '5px 0 0 0' }}>Real-time Emergency Response Platform</p>
        </div>
        <div style={{ textAlign: 'right' }}>
            <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            fontSize: '0.9rem'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isConnected ? '#10b981' : '#f59e0b'
            }}></div>
            {isConnected ? 'Connected' : 'Mock Mode'}
          </div>
        </div>
      </header>
      
      <main>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          padding: '0 10px'
        }}>
          {[
            { id: 'overview', label: '📊 Overview', icon: 'chart-pie' },
            { id: 'emergencies', label: '🚨 Emergencies', icon: 'exclamation-triangle' },
            { id: 'ambulances', label: '🚑 Ambulances', icon: 'ambulance' },
            { id: 'hospitals', label: '🏥 Hospitals', icon: 'hospital' },
            { id: 'uber-rides', label: '🚑 Ambulance Booking', icon: 'ambulance' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                background: activeTab === tab.id ? 'linear-gradient(to right, #e53e3e, #dc2626)' : 'white',
                color: activeTab === tab.id ? 'white' : '#374151',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center',
            borderLeft: '4px solid #e53e3e'
          }}>
            <h3 style={{ color: '#e53e3e', marginTop: 0 }}>🚨 Active Emergencies</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>{metrics.active_emergencies}</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Currently being handled</p>
          </div>
          
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center',
            borderLeft: '4px solid #3b82f6'
          }}>
            <h3 style={{ color: '#3b82f6', marginTop: 0 }}>⏱️ Response Time</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>{metrics.avg_response_time.toFixed(1)} min</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Average response time</p>
          </div>
          
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center',
            borderLeft: '4px solid #10b981'
          }}>
            <h3 style={{ color: '#10b981', marginTop: 0 }}>🚑 Available Units</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>{metrics.available_ambulances}</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Ready for dispatch</p>
          </div>
          
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center',
            borderLeft: '4px solid #8b5cf6'
          }}>
            <h3 style={{ color: '#8b5cf6', marginTop: 0 }}>🏥 Partner Hospitals</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>{metrics.partner_hospitals}</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Connected facilities</p>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginTop: 0, color: '#374151' }}>📊 Emergency Priority Breakdown</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginTop: '15px'
          }}>
            <div style={{ textAlign: 'center', padding: '15px', background: '#fef2f2', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>{metrics.critical_emergencies}</div>
              <div style={{ color: '#dc2626', fontSize: '0.9rem' }}>Critical</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: '#fff7ed', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ea580c' }}>{metrics.high_emergencies}</div>
              <div style={{ color: '#ea580c', fontSize: '0.9rem' }}>High</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: '#fffbeb', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>{metrics.medium_emergencies}</div>
              <div style={{ color: '#d97706', fontSize: '0.9rem' }}>Medium</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: '#f0fdf4', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>{metrics.low_emergencies}</div>
              <div style={{ color: '#16a34a', fontSize: '0.9rem' }}>Low</div>
            </div>
          </div>
        </div>

        {/* Recent Emergencies (with filters and actions) */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginTop: 0, color: '#374151' }}>🚨 Recent Emergency Requests</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
            <input
              placeholder="Search (type, address, name)"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', flex: '1 1 240px' }}
            />
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <option value="ALL">All Types</option>
              <option value="CARDIAC">CARDIAC</option>
              <option value="TRAUMA">TRAUMA</option>
              <option value="RESPIRATORY">RESPIRATORY</option>
              <option value="NEUROLOGICAL">NEUROLOGICAL</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <option value="ALL">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          {filteredEmergencies.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No recent emergencies</p>
          ) : (
            <div style={{ marginTop: '15px' }}>
              {filteredEmergencies.map((emergency, index) => (
                <div key={emergency.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  background: index === 0 ? '#fef2f2' : 'white'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        background: getPriorityColor(emergency.priority),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {getPriorityText(emergency.priority)}
                      </span>
                      <span style={{ fontWeight: 'bold' }}>{emergency.emergency_type}</span>
                      <span style={{
                        background: (emergency.status || 'PENDING') === 'COMPLETED' ? '#10b981' : '#f59e0b',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '0.7rem'
                      }}>
                        {emergency.status || 'PENDING'}
                      </span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '5px' }}>{emergency.address}</div>
                    {emergency.assigned_ambulance_id && (
                      <div style={{ color: '#3b82f6', fontSize: '0.9rem', marginTop: '4px' }}>
                        Assigned: {emergency.assigned_ambulance_id} • ETA: {emergency.estimated_arrival || '—'}
                      </div>
                    )}
                    {emergency.patient_info?.name && (
                      <div style={{ color: '#374151', fontSize: '0.9rem', marginTop: '2px' }}>
                        Patient: {emergency.patient_info.name}
                      </div>
                    )}
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => setSelectedEmergency(emergency)} style={{
                        background: 'white', border: '1px solid #e5e7eb', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer'
                      }}>Details</button>
                      <button onClick={() => assignNearestAmbulance(emergency.id)} style={{
                        background: '#3b82f6', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer'
                      }}>Assign</button>
                      <button onClick={() => updateEmergencyStatusLocal(emergency.id, 'IN_PROGRESS')} style={{
                        background: '#8b5cf6', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer'
                      }}>Start</button>
                      <button onClick={() => updateEmergencyStatusLocal(emergency.id, 'COMPLETED')} style={{
                        background: '#10b981', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer'
                      }}>Complete</button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', color: '#6b7280', fontSize: '0.8rem' }}>
                    {new Date(emergency.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
            {/* System Status */}
            <div style={{
              background: 'white',
              padding: '40px',
              borderRadius: '10px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h2 style={{ 
                background: 'linear-gradient(to right, #e53e3e, #dc2626)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '2.5rem',
                marginBottom: '15px'
              }}>
                System Operational
              </h2>
              <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '25px' }}>
                All emergency services are online and ready to respond to critical situations.
              </p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={updateMetrics}
                  style={{
                    background: 'linear-gradient(to right, #e53e3e, #dc2626)',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🔄 Refresh Data
                </button>
                <button 
                  onClick={createTestEmergency}
                  style={{
                    background: 'linear-gradient(to right, #f59e0b, #d97706)',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🚨 Create Test Emergency
                </button>
                <button style={{
                  background: 'transparent',
                  color: '#e53e3e',
                  padding: '12px 24px',
                  border: '2px solid #e53e3e',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}>
                  📊 View Analytics
                </button>
              </div>
            </div>
          </>
        )}

        {/* Emergencies Tab */}
        {activeTab === 'emergencies' && (
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginTop: 0, color: '#374151' }}>🚨 All Emergency Requests</h3>
            {emergencies.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No recent emergencies</p>
            ) : (
              <div style={{ marginTop: '15px' }}>
                {emergencies.map((emergency, index) => (
                  <div key={emergency.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    background: index === 0 ? '#fef2f2' : 'white'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          background: getPriorityColor(emergency.priority),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          {getPriorityText(emergency.priority)}
                        </span>
                        <span style={{ fontWeight: 'bold' }}>{emergency.emergency_type}</span>
                        <span style={{
                          background: emergency.status === 'COMPLETED' ? '#10b981' : '#f59e0b',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '0.7rem'
                        }}>
                          {emergency.status}
                        </span>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '5px' }}>
                        {emergency.address}
                      </div>
                      {emergency.patient_info?.name && (
                        <div style={{ color: '#374151', fontSize: '0.9rem', marginTop: '2px' }}>
                          Patient: {emergency.patient_info.name}
                        </div>
                      )}
                      {emergency.assigned_ambulance_id && (
                        <div style={{ color: '#3b82f6', fontSize: '0.9rem', marginTop: '2px' }}>
                          Ambulance: {emergency.assigned_ambulance_id}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', color: '#6b7280', fontSize: '0.8rem' }}>
                      {new Date(emergency.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ambulances Tab */}
        {activeTab === 'ambulances' && (
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginTop: 0, color: '#374151' }}>🚑 Ambulance Fleet Status</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '15px',
              marginTop: '15px'
            }}>
              {ambulances.map(ambulance => (
                <div key={ambulance.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '15px',
                  background: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: '#374151' }}>{ambulance.license_plate}</h4>
                    <span style={{
                      background: getStatusColor(ambulance.status),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {ambulance.status}
                    </span>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    <div>Driver: {ambulance.driver_name}</div>
                    <div>Equipment: {ambulance.equipment_level}</div>
                    <div>Location: {ambulance.location.lat.toFixed(4)}, {ambulance.location.lng.toFixed(4)}</div>
                    {ambulance.eta_minutes && (
                      <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                        ETA: {ambulance.eta_minutes} minutes
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hospitals Tab */}
        {activeTab === 'hospitals' && (
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginTop: 0, color: '#374151' }}>🏥 Partner Hospitals</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '15px',
              marginTop: '15px'
            }}>
              {hospitals.map(hospital => (
                <div key={hospital.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '15px',
                  background: 'white'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>{hospital.name}</h4>
                  <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    <div>General Beds: {hospital.available_beds}/{hospital.total_beds}</div>
                    <div>ICU Beds: {hospital.available_icu_beds}/{hospital.icu_beds}</div>
                    <div>Location: {hospital.location.lat.toFixed(4)}, {hospital.location.lng.toFixed(4)}</div>
                    <div style={{ 
                      color: hospital.available_beds > 5 ? '#10b981' : hospital.available_beds > 2 ? '#f59e0b' : '#ef4444',
                      fontWeight: 'bold',
                      marginTop: '5px'
                    }}>
                      Capacity: {((hospital.total_beds - hospital.available_beds) / hospital.total_beds * 100).toFixed(1)}% occupied
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uber-Style Rides Tab */}
        {activeTab === 'uber-rides' && (
          <>
            {/* Live Ride Status Dashboard */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'center',
                borderLeft: '4px solid #dc2626'
              }}>
                <h3 style={{ color: '#dc2626', marginTop: 0 }}>🚑 Active Bookings</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>{uberRides.filter(r => ['assigned', 'driver_accepted', 'otp_verified', 'in_progress'].includes(r.status)).length}</p>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Ambulance bookings in progress</p>
              </div>
              
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'center',
                borderLeft: '4px solid #10b981'
              }}>
                <h3 style={{ color: '#10b981', marginTop: 0 }}>👨‍⚕️ Online Drivers</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>{drivers.filter(d => d.is_online).length}</p>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Professional paramedics online</p>
              </div>
              
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'center',
                borderLeft: '4px solid #3b82f6'
              }}>
                <h3 style={{ color: '#3b82f6', marginTop: 0 }}>💰 Today's Revenue</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>₹{uberRides.reduce((sum, ride) => sum + (ride.estimated_fare?.total_fare || 0), 0).toLocaleString()}</p>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>From completed rides</p>
              </div>
              
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'center',
                borderLeft: '4px solid #f59e0b'
              }}>
                <h3 style={{ color: '#f59e0b', marginTop: 0 }}>⌚ Avg Response</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>3.2 min</p>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Driver acceptance time</p>
              </div>
            </div>

            {/* Create New Ride Button */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              marginBottom: '30px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#374151' }}>🚑 Ambulance Booking</h3>
                <button
                  onClick={() => setShowRideForm(true)}
                  style={{
                    bg: 'linear-gradient(to right, #dc2626, #ef4444)',
                    bgcolor: 'linear-gradient(to right, #dc2626, #ef4444)',
                    background: 'linear-gradient(to right, #dc2626, #ef4444)',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}
                >
                  + Book Ambulance
                </button>
              </div>
              <p style={{ color: '#6b7280', margin: '10px 0 0', fontSize: '0.9rem' }}>
                Modern ambulance booking system with intelligent driver matching, OTP verification, and seamless payment processing for medical emergencies.
              </p>
            </div>

            {/* Active Uber-Style Rides */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              marginBottom: '30px'
            }}>
              <h3 style={{ marginTop: 0, color: '#374151' }}>🚑 Active Ambulance Bookings</h3>
              {uberRides.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No active bookings</p>
              ) : (
                <div style={{ marginTop: '15px' }}>
                  {uberRides.map((ride, index) => (
                    <div key={ride.id} style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '10px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      marginBottom: '15px',
                      background: ride.ride_type === 'emergency' ? '#fef2f2' : 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <span style={{
                              background: getRideTypeColor(ride.ride_type),
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}>
                              {ride.ride_type.replace('_', ' ')}
                            </span>
                            <span style={{
                              background: getRideStatusColor(ride.status),
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}>
                              {getRideStatusText(ride.status)}
                            </span>
                            {ride.otp && (
                              <span style={{
                                background: '#8b5cf6',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                              }}>
                                🔐 OTP: {ride.otp}
                              </span>
                            )}
                          </div>
                          
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontWeight: 'bold', color: '#374151', fontSize: '1rem' }}>
                              🧑‍🤝‍🧑 {ride.customer.name}
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '4px' }}>
                              📞 {ride.customer.phone}
                            </div>
                          </div>
                          
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                              📍 Pickup: {ride.pickup_location.address}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                              🏥 Destination: {ride.destination_location?.address || 'To be determined'}
                            </div>
                          </div>
                          
                          {ride.medical_info?.condition && (
                            <div style={{ color: '#dc2626', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '4px' }}>
                              🚑 Medical: {ride.medical_info.condition}
                            </div>
                          )}
                          
                          {ride.assigned_driver && (
                            <div style={{ background: '#f0f9ff', padding: '8px', borderRadius: '6px', marginBottom: '8px' }}>
                              <div style={{ fontWeight: 'bold', color: '#1e40af' }}>👨‍⚕️ Driver: {ride.assigned_driver.name}</div>
                              <div style={{ fontSize: '0.9rem', color: '#374151' }}>
                                📱 {ride.assigned_driver.phone} • ⭐ {ride.assigned_driver.rating}/5 • 🚑 {ride.assigned_driver.vehicle_number}
                              </div>
                            </div>
                          )}
                          
                          {ride.estimated_fare && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#059669' }}>
                                💰 ₹{ride.estimated_fare.total_fare}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                Created: {new Date(ride.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Driver Management */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              marginBottom: '30px'
            }}>
              <h3 style={{ marginTop: 0, color: '#374151' }}>👨‍⚕️ Professional Driver Fleet</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '15px',
                marginTop: '15px'
              }}>
                {drivers.map(driver => (
                  <div key={driver.id} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '20px',
                    background: driver.is_available ? '#f0fdf4' : '#fef2f2'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, color: '#374151' }}>{driver.name}</h4>
                      <span style={{
                        background: driver.is_online ? '#10b981' : '#ef4444',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {driver.is_online ? (driver.is_available ? 'Available' : 'Busy') : 'Offline'}
                      </span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                      <div>📞 {driver.phone}</div>
                      <div>🚑 {driver.vehicle_number} ({driver.vehicle_type})</div>
                      <div>⭐ Rating: {driver.rating}/5.0</div>
                      <div style={{ marginTop: '8px' }}>
                        <strong>🩺 Equipment:</strong><br />
                        {driver.equipment.join(' • ')}
                      </div>
                      {driver.current_ride && (
                        <div style={{ color: '#dc2626', fontWeight: 'bold', marginTop: '8px' }}>
                          🔄 Active ride: {driver.current_ride.substring(0, 8)}...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ride Form Modal */}
            {showRideForm && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100
              }}>
                <div style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '12px',
                  maxWidth: '600px',
                  width: '90%',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#374151' }}>🚑 Book Ambulance Transport</h3>
                    <button onClick={() => setShowRideForm(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
                  </div>
                  
                  <form onSubmit={(e) => { e.preventDefault(); createUberStyleRide(); }} style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#374151' }}>Patient Name</label>
                        <input 
                          value={rideFormData.customer_name}
                          onChange={e => setRideFormData({...rideFormData, customer_name: e.target.value})}
                          style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }}
                          required 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#374151' }}>Phone Number</label>
                        <input 
                          value={rideFormData.customer_phone}
                          onChange={e => setRideFormData({...rideFormData, customer_phone: e.target.value})}
                          style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#374151' }}>Ride Type</label>
                      <select 
                        value={rideFormData.ride_type}
                        onChange={e => setRideFormData({...rideFormData, ride_type: e.target.value as any})}
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }}
                      >
                        <option value="emergency">🚨 Emergency Ambulance</option>
                        <option value="scheduled">📅 Scheduled Medical Transport</option>
                        <option value="medical_transport">🏥 Inter-Hospital Transfer</option>
                      </select>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#374151' }}>Pickup Address</label>
                        <input 
                          value={rideFormData.pickup_address}
                          onChange={e => setRideFormData({...rideFormData, pickup_address: e.target.value})}
                          style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }}
                          required 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#374151' }}>Destination Hospital</label>
                        <input 
                          value={rideFormData.destination_address}
                          onChange={e => setRideFormData({...rideFormData, destination_address: e.target.value})}
                          style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#374151' }}>Medical Condition</label>
                        <input 
                          value={rideFormData.medical_condition}
                          onChange={e => setRideFormData({...rideFormData, medical_condition: e.target.value})}
                          style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }}
                          placeholder="e.g., heart attack, stroke"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#374151' }}>Payment Method</label>
                        <select 
                          value={rideFormData.payment_method}
                          onChange={e => setRideFormData({...rideFormData, payment_method: e.target.value})}
                          style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }}
                        >
                          <option value="upi">UPI (PhonePe, Google Pay)</option>
                          <option value="card">Credit/Debit Card</option>
                          <option value="cash">Cash Payment</option>
                          <option value="insurance">Insurance Claim</option>
                        </select>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                      <button type="button" onClick={() => setShowRideForm(false)} style={{
                        background: 'transparent',
                        color: '#6b7280',
                        padding: '12px 20px',
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}>Cancel</button>
                      <button type="submit" style={{
                        background: 'linear-gradient(to right, #dc2626, #ef4444)',
                        color: 'white',
                        padding: '12px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}>🚑 Book Ambulance Now</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      {/* Detail Drawer */}
      {selectedEmergency && (
        <div style={{
          position: 'fixed', right: 0, top: 0, height: '100vh', width: '380px', background: 'white',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.15)', padding: '20px', zIndex: 50, overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Emergency Details</h3>
            <button onClick={closeDetails} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
          </div>
          <div style={{ marginTop: '12px', color: '#374151' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ background: getPriorityColor(selectedEmergency.priority), color: 'white', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem' }}>
                {getPriorityText(selectedEmergency.priority)}
              </span>
              <span style={{ fontWeight: 'bold' }}>{selectedEmergency.emergency_type}</span>
            </div>
            <div style={{ marginTop: '8px' }}>Address: {selectedEmergency.address}</div>
            {selectedEmergency.patient_info?.name && (
              <div style={{ marginTop: '4px' }}>Patient: {selectedEmergency.patient_info.name}</div>
            )}
            <div style={{ marginTop: '4px' }}>Status: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{selectedEmergency.status || 'PENDING'}</span></div>
            <div style={{ marginTop: '4px' }}>Time: {new Date(selectedEmergency.timestamp).toLocaleString()}</div>
            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
              <button onClick={() => assignNearestAmbulance(selectedEmergency.id)} style={{ background: '#3b82f6', color: 'white', padding: '8px 10px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Assign</button>
              <button onClick={() => updateEmergencyStatusLocal(selectedEmergency.id, 'IN_PROGRESS')} style={{ background: '#8b5cf6', color: 'white', padding: '8px 10px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Start</button>
              <button onClick={() => updateEmergencyStatusLocal(selectedEmergency.id, 'COMPLETED')} style={{ background: '#10b981', color: 'white', padding: '8px 10px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Complete</button>
            </div>
          </div>
        </div>
      )}
          {/* Custom test emergency form */}
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginTop: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#374151' }}>📝 Create Custom Test Emergency</h3>
              <button
                onClick={() => setShowCustomForm(v => !v)}
                style={{
                  background: 'linear-gradient(to right, #e53e3e, #dc2626)',
                  color: 'white',
                  padding: '8px 14px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {showCustomForm ? 'Hide Form' : 'Open Form'}
              </button>
            </div>
            {showCustomForm && (
              <form onSubmit={submitCustomEmergency} style={{ marginTop: '15px', display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#374151', marginBottom: '6px' }}>Patient Name</label>
                    <input value={formName} onChange={e => setFormName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#374151', marginBottom: '6px' }}>Caller Phone</label>
                    <input value={formPhone} onChange={e => setFormPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#374151', marginBottom: '6px' }}>Emergency Type</label>
                    <select value={formType} onChange={e => setFormType(e.target.value as any)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <option value="CARDIAC">CARDIAC</option>
                      <option value="TRAUMA">TRAUMA</option>
                      <option value="RESPIRATORY">RESPIRATORY</option>
                      <option value="NEUROLOGICAL">NEUROLOGICAL</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#374151', marginBottom: '6px' }}>Address</label>
                    <input value={formAddress} onChange={e => setFormAddress(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#374151', marginBottom: '6px' }}>Symptoms</label>
                  <textarea value={formSymptoms} onChange={e => setFormSymptoms(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={formConscious} onChange={e => setFormConscious(e.target.checked)} />
                    Conscious
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={formBreathing} onChange={e => setFormBreathing(e.target.checked)} />
                    Breathing
                  </label>
                  <div>
                    <label style={{ display: 'block', color: '#374151', marginBottom: '6px' }}>Pain Level: {formPainLevel}</label>
                    <input type="range" min={1} max={10} value={formPainLevel} onChange={e => setFormPainLevel(parseInt(e.target.value))} style={{ width: '100%' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowCustomForm(false)} style={{
                    background: 'transparent',
                    color: '#e53e3e',
                    padding: '10px 16px',
                    border: '2px solid #e53e3e',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}>Cancel</button>
                  <button type="submit" style={{
                    background: 'linear-gradient(to right, #f59e0b, #d97706)',
                    color: 'white',
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}>Submit Emergency</button>
                </div>
              </form>
            )}
          </div>
      
      <footer style={{
        background: '#1f2937',
        color: 'white',
        textAlign: 'center',
        padding: '20px',
        borderRadius: '10px',
        marginTop: '40px'
      }}>
        <p style={{ margin: 0 }}>© 2024 Aapat Emergency Services. Saving lives, one call at a time.</p>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#9ca3af' }}>
          Real-time monitoring • 24/7 Emergency Response • Advanced AI Dispatch
        </p>
      </footer>
    </div>
  );
}

export default App;
