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
  const [activeTab, setActiveTab] = useState<'overview' | 'emergencies' | 'ambulances' | 'hospitals'>('overview');
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

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/analytics/dashboard?period=24h');
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
      const response = await fetch('http://localhost:3000/api/ambulances');
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
      const response = await fetch('http://localhost:3000/api/hospitals');
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
      const response = await fetch('http://localhost:3000/api/emergency/recent');
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
      const response = await fetch('http://localhost:3000/api/emergency/request', {
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
      const response = await fetch('http://localhost:3000/api/emergency/request', {
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
