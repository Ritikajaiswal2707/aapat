import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ 
        background: 'linear-gradient(to right, #e53e3e, #dc2626)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>🚑 Aapat</h1>
        <p style={{ margin: '5px 0 0 0' }}>Emergency Response Platform</p>
      </header>
      
      <main>
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
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#e53e3e', marginTop: 0 }}>🚨 Active Emergencies</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>12</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Currently being handled</p>
          </div>
          
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#3b82f6', marginTop: 0 }}>⏱️ Response Time</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>4.2 min</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Average response time</p>
          </div>
          
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#10b981', marginTop: 0 }}>🚑 Available Units</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>28</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Ready for dispatch</p>
          </div>
          
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#8b5cf6', marginTop: 0 }}>🏥 Partner Hospitals</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>15</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Connected facilities</p>
          </div>
        </div>
        
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
            Welcome to Aapat
          </h2>
          <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '25px' }}>
            Your Emergency Ambulance Service Platform is operational and ready to save lives.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{
              background: 'linear-gradient(to right, #e53e3e, #dc2626)',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
              🚨 Emergency Dashboard
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
              📊 System Status
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
      </footer>
    </div>
  );
}

export default App;
