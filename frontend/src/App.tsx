import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

interface Emergency {
  id: string;
  priority: number;
  location: { lat: number; lng: number };
  address: string;
  emergency_type: string;
  patient_info?: any;
  timestamp: string;
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
    low_emergencies: 0
  });
  
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

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
          available_ambulances: 28, // Mock data
          partner_hospitals: 15, // Mock data
          critical_emergencies: data.data.metrics.critical_emergencies || 0,
          high_emergencies: data.data.metrics.high_emergencies || 0,
          medium_emergencies: data.data.metrics.medium_emergencies || 0,
          low_emergencies: data.data.metrics.low_emergencies || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
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
              background: isConnected ? '#10b981' : '#ef4444'
            }}></div>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </header>
      
      <main>
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

        {/* Recent Emergencies */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginTop: 0, color: '#374151' }}>🚨 Recent Emergency Requests</h3>
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
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '5px' }}>
                      {emergency.address}
                    </div>
                    {emergency.patient_info?.name && (
                      <div style={{ color: '#374151', fontSize: '0.9rem', marginTop: '2px' }}>
                        Patient: {emergency.patient_info.name}
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
      </main>
      
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
