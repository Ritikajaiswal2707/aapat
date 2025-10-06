import { useState, useEffect, useCallback, FormEvent } from 'react';
import io from 'socket.io-client';

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
  recommended_hospital?: string;
  recommended_hospitals?: RecommendedHospital[];
}

interface DashboardMetrics {
  active_emergencies: number;
  in_progress_emergencies: number;
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

// Ambulance interface removed as it's unused

interface Hospital {
  id: string;
  name: string;
  available_beds: number;
  total_beds: number;
  available_icu_beds: number;
  icu_beds: number;
  location: { lat: number; lng: number };
}

interface RecommendedHospital {
  id: string;
  name: string;
  distance: number;
  eta: number;
  score: number;
  recommended: boolean;
  beds: {
    general: { total: number; available: number };
    icu: { total: number; available: number };
    emergency: { total: number; available: number };
  };
  specialties: string[];
  equipment: string[];
  match_reasons: {
    specialty_match: boolean;
    has_required_equipment: boolean;
    beds_available: number;
    distance_km: number;
  };
  location: { lat: number; lng: number };
  address: string;
  contact: string;
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
  recommended_hospitals?: RecommendedHospital[];
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
    in_progress_emergencies: 0,
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
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'emergencies' | 'hospitals' | 'uber-rides'>('overview');
  
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

  const updateMetrics = useCallback(() => {
    fetchMetrics();
    fetchAmbulances();
    fetchHospitals();
    fetchUberRides();
    fetchDrivers();
  }, []); // Empty dependencies since these functions don't depend on state

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3012');

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

    newSocket.on('emergency_completed', (emergency: Emergency) => {
      setEmergencies(prev => prev.map(e => e.id === emergency.id ? emergency : e));
      updateMetrics();
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Emergency Completed', {
          body: `${emergency.patient_info.name} - ${emergency.emergency_type}`,
          icon: '/favicon.ico'
        });
      }
    });

    newSocket.on('emergency_status_update', (updatedEmergency: Emergency) => {
      setEmergencies(prev => prev.map(e => e.id === updatedEmergency.id ? updatedEmergency : e));
      updateMetrics();
    });

    // Fetch initial data
    fetchMetrics();
    fetchRecentEmergencies();
    fetchAmbulances();
    fetchHospitals();
    fetchUberRides();
    fetchDrivers();

    // Set up periodic refresh for metrics (every 10 seconds)
    const refreshInterval = setInterval(() => {
      fetchMetrics();
      fetchRecentEmergencies();
    }, 10000);

    return () => {
      newSocket.close();
      clearInterval(refreshInterval);
    };
  }, [updateMetrics]);

  const fetchMetrics = async () => {
    try {
      // Fetch rides and drivers to calculate real metrics
      const ridesResponse = await fetch('http://localhost:3012/api/rides');
      const driversResponse = await fetch('http://localhost:3012/api/drivers');
      
      const ridesData = await ridesResponse.json();
      const driversData = await driversResponse.json();
      
      if (ridesData.success && driversData.success) {
        const rides = ridesData.data || [];
        const drivers = driversData.data || [];
        
        // Calculate metrics from actual data
        const criticalCount = rides.filter((r: any) => r.medical_info?.priority === 'critical').length;
        const highCount = rides.filter((r: any) => r.medical_info?.priority === 'high').length;
        const normalCount = rides.filter((r: any) => r.medical_info?.priority === 'normal').length;
        const activeCount = rides.filter((r: any) => 
          r.status === 'searching_drivers' || 
          r.status === 'broadcasting' || 
          r.status === 'pending_assignment'
        ).length;
        const inProgressCount = rides.filter((r: any) => 
          r.status === 'driver_accepted' || 
          r.status === 'otp_verified' ||
          r.status === 'in_progress' ||
          r.status === 'en_route'
        ).length;
        const completedCount = rides.filter((r: any) => r.status === 'completed').length;
        const availableDrivers = drivers.filter((d: any) => d.is_available).length;
        
        setMetrics({
          active_emergencies: activeCount,
          in_progress_emergencies: inProgressCount,
          avg_response_time: 5.2, // Mock value
          available_ambulances: availableDrivers,
          partner_hospitals: 15, // Mock value
          critical_emergencies: criticalCount,
          high_emergencies: highCount,
          medium_emergencies: normalCount,
          low_emergencies: 0,
          total_emergencies_today: rides.length,
          completed_emergencies: completedCount,
          avg_response_time_trend: -8 // Mock trend
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
        // Currently not displaying ambulances data
      }
    } catch (error) {
      console.error('Failed to fetch ambulances:', error);
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await fetch('http://localhost:3013/api/hospitals');
      const data = await response.json();
      if (data.success) {
        // Transform hospital data to match Hospital interface
        const transformedHospitals = (data.data || []).map((h: any) => ({
          id: h.id,
          name: h.name,
          total_beds: h.beds.general.total,
          available_beds: h.beds.general.available,
          icu_beds: h.beds.icu.total,
          available_icu_beds: h.beds.icu.available,
          location: h.location
        }));
        setHospitals(transformedHospitals);
      }
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    }
  };

  const fetchRecentEmergencies = async () => {
    try {
      const response = await fetch('http://localhost:3012/api/rides');
      const data = await response.json();
      if (data.success) {
        // Transform rides data to Emergency format
        const transformedData = (data.data || []).map((ride: any) => ({
          id: ride.id || ride.ride_request_id,
          priority: ride.medical_info?.priority === 'critical' ? 3 : 
                    ride.medical_info?.priority === 'high' ? 2 : 1,
          location: {
            lat: ride.pickup_location?.lat || 0,
            lng: ride.pickup_location?.lng || 0
          },
          address: ride.pickup_location?.address || 'Unknown location',
          emergency_type: ride.medical_info?.emergency_type || 'Emergency',
          patient_info: {
            name: ride.customer_name,
            phone: ride.customer_phone
          },
          timestamp: ride.created_at,
          status: ride.status,
          assigned_ambulance_id: ride.assigned_driver?.vehicle_number,
          estimated_arrival: ride.assigned_driver ? '5-10 mins' : null,
          recommended_hospital: ride.recommended_hospitals && ride.recommended_hospitals.length > 0 
            ? ride.recommended_hospitals[0].name 
            : null,
          // Add completion status for visual indication
          isCompleted: ride.status === 'completed',
          recommended_hospitals: ride.recommended_hospitals || []
        }));
        setEmergencies(transformedData);
      }
    } catch (error) {
      console.error('Failed to fetch emergencies:', error);
    }
  };

  // Uber-style API functions
  const fetchUberRides = async () => {
    try {
      // Fetch real ride data from the API
      const response = await fetch('http://localhost:3012/api/rides');
      const data = await response.json();
      
      if (data.success) {
        // Transform API data to UberStyleRide format
        const realRides: UberStyleRide[] = (data.data || []).map((ride: any) => ({
          id: ride.id || ride.ride_request_id,
          customer: {
            name: ride.customer?.name || 'Unknown Patient',
            phone: ride.customer?.phone || 'N/A',
            email: ride.customer?.email
          },
          ride_type: ride.ride_type || 'emergency',
          pickup_location: {
            lat: ride.pickup_location?.lat || 28.6139,
            lng: ride.pickup_location?.lng || 77.209,
            address: ride.pickup_location?.address || 'Delhi'
          },
          destination_location: ride.destination_location ? {
            lat: ride.destination_location.lat,
            lng: ride.destination_location.lng,
            address: ride.destination_location.address
          } : undefined,
          medical_info: ride.medical_info || {},
          status: ride.status || 'pending_assignment',
          estimated_fare: ride.estimated_fare,
          assigned_driver: ride.assigned_driver,
          recommended_hospitals: ride.recommended_hospitals,
          otp: ride.otp,
          payment_status: ride.payment_status || 'pending',
          created_at: ride.created_at || new Date().toISOString()
        }));
        
        setUberRides(realRides);
        return;
      }
      
      // Fallback to mock data if API fails
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
      await fetch('http://localhost:3012/health');
      
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
    const emergencyTypes = ["Heart Attack", "Accident", "Stroke", "Breathing Issue"];
    const testEmergency = {
      customer: {
        name: "Test Patient " + Math.floor(Math.random() * 1000),
        phone: "+91-" + Math.floor(Math.random() * 9000000000 + 1000000000)
      },
      ride_type: "emergency",
      pickup_location: {
        lat: 28.6315 + (Math.random() - 0.5) * 0.01,
        lng: 77.2167 + (Math.random() - 0.5) * 0.01,
        address: "Test Location, Delhi"
      },
      medical_info: {
        emergency_type: emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)],
        priority: ["critical", "high", "normal"][Math.floor(Math.random() * 3)],
        patient_age: 35,
        patient_gender: "MALE",
        blood_type: "O+",
        symptoms: "Test emergency for demonstration"
      },
      payment_method: "cash"
    };

    try {
      const response = await fetch('http://localhost:3012/api/ride/request', {
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

  const submitCustomEmergency = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const payload = {
      customer: {
        name: formName,
        phone: formPhone
      },
      ride_type: "emergency",
      pickup_location: {
        lat: 28.6315 + (Math.random() - 0.5) * 0.01,
        lng: 77.2167 + (Math.random() - 0.5) * 0.01,
        address: formAddress
      },
      medical_info: {
      emergency_type: formType,
        priority: "high",
        patient_age: 35,
        patient_gender: 'MALE',
        blood_type: 'O+',
      symptoms: formSymptoms,
      conscious: formConscious,
      breathing: formBreathing,
      pain_level: formPainLevel
      },
      payment_method: "cash"
    };

    try {
      const response = await fetch('http://localhost:3012/api/ride/request', {
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

  const startRide = async (rideId: string) => {
    try {
      // First, generate OTP for the ride
      const otpResponse = await fetch(`http://localhost:3012/api/ride/${rideId}/generate-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const otpResult = await otpResponse.json();
      if (!otpResult.success) {
        alert('❌ Failed to generate OTP: ' + otpResult.message);
        return;
      }

      // Then verify the OTP to start the ride
      const verifyResponse = await fetch(`http://localhost:3012/api/driver/driver-001/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ride_request_id: rideId,
          otp_entered: otpResult.otp // Use the generated OTP
        })
      });

      const verifyResult = await verifyResponse.json();
      if (verifyResult.success) {
        alert('✅ Ride started successfully!');
        updateMetrics(); // Refresh data
        fetchRecentEmergencies(); // Refresh emergencies list
      } else {
        alert('❌ Failed to start ride: ' + verifyResult.message);
      }
    } catch (error) {
      console.error('Error starting ride:', error);
      alert('❌ Error starting ride: ' + error.message);
    }
  };

  const completeRide = async (rideId: string) => {
    try {
      const response = await fetch(`http://localhost:3012/api/ride/${rideId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_confirmed: true,
          fare_paid: 400 // Mock fare amount
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ Ride completed successfully!');
        updateMetrics(); // Refresh data
        fetchRecentEmergencies(); // Refresh emergencies list
      } else {
        alert('❌ Failed to complete ride: ' + result.message);
      }
    } catch (error) {
      console.error('Error completing ride:', error);
      alert('❌ Error completing ride: ' + error.message);
    }
  };

  const closeDetails = () => setSelectedEmergency(null);

  // Driver assignment helpers removed as they were unused

  const assignNearestAmbulance = async (emergencyId: string) => {
    try {
      // Get available drivers from the API
      const driversResponse = await fetch('http://localhost:3012/api/drivers');
      const driversData = await driversResponse.json();
      
      if (!driversData.success) {
        alert('Failed to fetch available drivers');
        return;
      }
      
      const availableDrivers = driversData.data.filter((d: any) => d.is_available);
      
      if (availableDrivers.length === 0) {
        alert('No drivers currently available. Please try again later.');
        return;
      }
      
      // Select first available driver (in real app, would calculate nearest)
      const selectedDriver = availableDrivers[0];
      
      // Call the API to accept the ride on behalf of this driver
      const acceptResponse = await fetch(`http://localhost:3012/api/driver/${selectedDriver.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ride_request_id: emergencyId })
      });
      
      const acceptData = await acceptResponse.json();
      
      if (acceptData.success) {
        alert(`✅ Driver ${selectedDriver.name} assigned successfully!\nVehicle: ${selectedDriver.vehicle_number}\nOTP: ${acceptData.otp || 'Will be generated'}`);
        // Refresh the emergencies list
        fetchRecentEmergencies();
        fetchMetrics();
      } else {
        alert(`❌ Failed to assign driver: ${acceptData.message}`);
      }
    } catch (error: any) {
      console.error('Assignment error:', error);
      alert(`❌ Error assigning driver: ${error.message}`);
    }
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

  // getStatusColor function removed as it was unused

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
            { id: 'uber-rides', label: '🚑 Ambulance Booking', icon: 'ambulance' },
            { id: 'hospitals', label: '🏥 Hospitals', icon: 'hospital' }
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
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Awaiting driver assignment</p>
          </div>
          
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #f59e0b'
          }}>
            <h3 style={{ color: '#f59e0b', marginTop: 0 }}>🚑 In Progress</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>{metrics.in_progress_emergencies}</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Driver assigned & en route</p>
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
                    {emergency.recommended_hospital && (
                      <div style={{ color: '#10b981', fontSize: '0.9rem', marginTop: '4px', fontWeight: 'bold' }}>
                        🏥 Recommended: {emergency.recommended_hospital}
                      </div>
                    )}
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => setSelectedEmergency(emergency)} style={{
                        background: 'white', border: '1px solid #e5e7eb', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer'
                      }}>Details</button>
                      <button onClick={() => assignNearestAmbulance(emergency.id)} style={{
                        background: '#3b82f6', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer'
                      }}>Assign</button>
                      <button onClick={() => startRide(emergency.id)} style={{
                        background: '#8b5cf6', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer'
                      }}>Start</button>
                      <button onClick={() => completeRide(emergency.id)} style={{
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
                    <div key={ride.id}                     style={{
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
            
            {/* Hospital Recommendations */}
            {selectedEmergency.recommended_hospitals && selectedEmergency.recommended_hospitals.length > 0 && (
              <div style={{ marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '0.95rem' }}>🏥 Recommended Hospitals</h4>
                {selectedEmergency.recommended_hospitals.map((hospital: RecommendedHospital, index: number) => (
                  <div key={hospital.id} style={{
                    padding: '10px',
                    border: hospital.recommended ? '2px solid #10b981' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    background: hospital.recommended ? '#f0fdf4' : 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: '#374151' }}>
                          {hospital.recommended && '⭐ '}
                          {hospital.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                          📍 {hospital.distance} km • ⏱️ {hospital.eta} min ETA
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                          🛏️ Available: {hospital.match_reasons.beds_available} beds
                        </div>
                        {hospital.match_reasons.specialty_match && (
                          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '2px' }}>
                            ✅ Specialty Match
                          </div>
                        )}
                      </div>
                      <div style={{
                        background: hospital.score > 80 ? '#10b981' : hospital.score > 60 ? '#f59e0b' : '#6b7280',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {hospital.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
              <button onClick={() => assignNearestAmbulance(selectedEmergency.id)} style={{ background: '#3b82f6', color: 'white', padding: '8px 10px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Assign</button>
              <button onClick={() => startRide(selectedEmergency.id)} style={{ background: '#8b5cf6', color: 'white', padding: '8px 10px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Start</button>
              <button onClick={() => completeRide(selectedEmergency.id)} style={{ background: '#10b981', color: 'white', padding: '8px 10px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Complete</button>
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
