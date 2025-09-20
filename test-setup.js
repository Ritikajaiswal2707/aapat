// Simple test script to verify our implementation
const express = require('express');
const path = require('path');
const SMSService = require('./sms-service');
const PaymentService = require('./payment-service');
const MapsService = require('./maps-service');

const app = express();
const PORT = 3000;

// Initialize Services
const smsService = new SMSService();
const paymentService = new PaymentService();
const mapsService = new MapsService();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('frontend/build'));

// Serve mobile apps
app.use('/mobile', express.static('mobile-apps', { 
  index: false,
  redirect: false 
}));

// Serve hospital portal
app.use('/hospital', express.static('hospital-portal', { 
  index: false,
  redirect: false 
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Aapat Test Server',
    timestamp: new Date().toISOString(),
    features: {
      'Emergency Dashboard': 'http://localhost:3000',
      'Mobile Apps': 'http://localhost:3000/mobile',
      'Hospital Portal': 'http://localhost:3000/hospital',
      'SMS Service': smsService.isConfigured ? 'Configured' : 'Mock Mode',
      'Payment Service': paymentService.isConfigured ? 'Configured' : 'Mock Mode',
      'Maps Service': mapsService.isConfigured ? 'Configured' : 'Mock Mode'
    }
  });
});

// SMS Test endpoint
app.get('/api/sms/test', async (req, res) => {
  try {
    const result = await smsService.testSMS();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'SMS test failed',
      error: error.message
    });
  }
});

// Send test SMS endpoint
app.post('/api/sms/send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }

    const result = await smsService.sendStatusUpdateSMS(phone, 'Test', message);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send SMS',
      error: error.message
    });
  }
});

// Payment endpoints
app.get('/api/payment/test', async (req, res) => {
  try {
    const result = await paymentService.testPayment();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment test failed',
      error: error.message
    });
  }
});

app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { emergencyData, amount } = req.body;
    
    if (!emergencyData || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Emergency data and amount are required'
      });
    }

    const result = await paymentService.createPaymentOrder(emergencyData, amount);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
});

app.post('/api/payment/verify', async (req, res) => {
  try {
    const { paymentData } = req.body;
    
    if (!paymentData) {
      return res.status(400).json({
        success: false,
        message: 'Payment data is required'
      });
    }

    const result = await paymentService.verifyPayment(paymentData);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

app.get('/api/payment/calculate-pricing', (req, res) => {
  try {
    const { emergencyType, distance, priority } = req.query;
    
    const pricing = paymentService.calculateEmergencyPricing(
      emergencyType || 'GENERAL',
      parseFloat(distance) || 0,
      parseInt(priority) || 4
    );
    
    res.json({
      success: true,
      message: 'Pricing calculated successfully',
      data: pricing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate pricing',
      error: error.message
    });
  }
});

// Maps endpoints
app.get('/api/maps/test', async (req, res) => {
  try {
    const result = await mapsService.testMaps();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Maps test failed',
      error: error.message
    });
  }
});

app.post('/api/maps/directions', async (req, res) => {
  try {
    const { origin, destination, mode } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required'
      });
    }

    const result = await mapsService.getDirections(origin, destination, mode);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get directions',
      error: error.message
    });
  }
});

app.post('/api/maps/geocode', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    const result = await mapsService.geocodeAddress(address);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to geocode address',
      error: error.message
    });
  }
});

app.post('/api/maps/nearby-hospitals', async (req, res) => {
  try {
    const { location, radius } = req.body;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    const result = await mapsService.findNearbyHospitals(location, radius);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to find nearby hospitals',
      error: error.message
    });
  }
});

// Test emergency endpoint
app.post('/api/emergency/request', async (req, res) => {
  try {
    const emergencyData = req.body;
    const emergencyId = 'test-' + Date.now();
    
    // Send emergency SMS to contacts
    const smsResult = await smsService.sendEmergencySMS({
      ...emergencyData,
      emergency_id: emergencyId,
      estimated_arrival: '5-10 minutes'
    });

    res.json({
      success: true,
      message: 'Emergency request received and SMS sent',
      data: {
        emergency_id: emergencyId,
        status: 'PENDING',
        estimated_response_time: '5-10 minutes',
        sms_sent: smsResult.success
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Emergency request failed',
      error: error.message
    });
  }
});

// Test ambulances endpoint
app.get('/api/ambulances', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'amb-001',
        license_plate: 'DL-01-AB-1234',
        status: 'AVAILABLE',
        location: { lat: 28.6139, lng: 77.2090 },
        driver_name: 'John Doe',
        equipment_level: 'BASIC'
      },
      {
        id: 'amb-002',
        license_plate: 'DL-01-CD-5678',
        status: 'ON_ROUTE',
        location: { lat: 28.6149, lng: 77.2100 },
        driver_name: 'Jane Smith',
        equipment_level: 'ADVANCED'
      }
    ]
  });
});

// Test hospitals endpoint
app.get('/api/hospitals', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'hosp-001',
        name: 'AIIMS Delhi',
        available_beds: 15,
        total_beds: 50,
        available_icu_beds: 3,
        icu_beds: 10,
        location: { lat: 28.5679, lng: 77.2110 }
      },
      {
        id: 'hosp-002',
        name: 'Safdarjung Hospital',
        available_beds: 8,
        total_beds: 30,
        available_icu_beds: 2,
        icu_beds: 5,
        location: { lat: 28.5800, lng: 77.2200 }
      }
    ]
  });
});

// Test analytics endpoint
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      metrics: {
        total_emergencies: 12,
        avg_response_time_minutes: 8.5,
        available_ambulances: 5,
        total_hospitals: 8,
        critical_emergencies: 2,
        high_emergencies: 3,
        medium_emergencies: 4,
        low_emergencies: 3,
        completed_emergencies: 8
      }
    }
  });
});

// Mobile app routes
app.get('/mobile', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Aapat Mobile Apps</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .app-card { border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .app-card h3 { color: #dc2626; margin-top: 0; }
            .btn { background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
            .btn:hover { background: #b91c1c; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚑 Aapat Mobile Applications</h1>
            <p>Choose your mobile application:</p>
            
            <div class="app-card">
                <h3>📱 Public Emergency App</h3>
                <p>For patients and families to report emergencies and track ambulances.</p>
                <a href="/mobile/emergency" class="btn">Open Emergency App</a>
            </div>
            
            <div class="app-card">
                <h3>🚑 Driver/Paramedic App</h3>
                <p>For ambulance drivers and paramedics to manage emergency responses.</p>
                <a href="/mobile/driver" class="btn">Open Driver App</a>
            </div>
            
            <div class="app-card">
                <h3>🏥 Hospital Portal</h3>
                <p>For hospital staff to manage incoming patients and bed availability.</p>
                <a href="/hospital" class="btn">Open Hospital Portal</a>
            </div>
        </div>
    </body>
    </html>
  `);
});

app.get('/mobile/emergency', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Aapat Emergency App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
            .header { background: #dc2626; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center; }
            .sos-button { background: #dc2626; color: white; padding: 30px; border: none; border-radius: 50%; font-size: 24px; font-weight: bold; width: 200px; height: 200px; margin: 20px auto; display: block; cursor: pointer; }
            .sos-button:hover { background: #b91c1c; }
            .emergency-types { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
            .emergency-type { background: white; padding: 20px; border-radius: 10px; text-align: center; cursor: pointer; border: 2px solid #e5e7eb; }
            .emergency-type:hover { border-color: #dc2626; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🚑 Aapat Emergency</h1>
            <p>One-tap emergency response</p>
        </div>
        
        <button class="sos-button" onclick="alert('Emergency reported! Ambulance dispatched.')">
            🚨 SOS
        </button>
        
        <div class="emergency-types">
            <div class="emergency-type" onclick="alert('Cardiac emergency reported!')">
                <h3>❤️ Cardiac</h3>
                <p>Heart Attack</p>
            </div>
            <div class="emergency-type" onclick="alert('Trauma emergency reported!')">
                <h3>🏥 Trauma</h3>
                <p>Accident/Injury</p>
            </div>
            <div class="emergency-type" onclick="alert('Respiratory emergency reported!')">
                <h3>🫁 Breathing</h3>
                <p>Breathing Problem</p>
            </div>
            <div class="emergency-type" onclick="alert('Neurological emergency reported!')">
                <h3>🧠 Stroke</h3>
                <p>Stroke/Seizure</p>
            </div>
        </div>
        
        <p style="text-align: center; color: #666;">
            📍 Location: Delhi, India<br>
            📞 Emergency: 108
        </p>
    </body>
    </html>
  `);
});

app.get('/mobile/driver', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Aapat Driver App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
            .header { background: #1f2937; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
            .status-card { background: white; padding: 20px; border-radius: 10px; margin: 10px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .status-button { background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px; cursor: pointer; }
            .status-button:hover { background: #2563eb; }
            .emergency-alert { background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 10px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🚑 Driver Dashboard</h1>
            <p>John Doe - Ambulance DL-01-AB-1234</p>
        </div>
        
        <div class="status-card">
            <h3>Current Status: AVAILABLE</h3>
            <p>Fuel Level: 85% | Location: Delhi, India</p>
        </div>
        
        <div class="emergency-alert">
            <h3>🚨 New Emergency Assignment</h3>
            <p><strong>Type:</strong> Cardiac Emergency</p>
            <p><strong>Location:</strong> Connaught Place, Delhi</p>
            <p><strong>ETA:</strong> 8 minutes</p>
            <button class="status-button" onclick="alert('Emergency accepted!')">Accept</button>
            <button class="status-button" onclick="alert('Emergency declined.')">Decline</button>
        </div>
        
        <div class="status-card">
            <h3>Status Updates</h3>
            <button class="status-button" onclick="alert('Status updated to En Route')">En Route</button>
            <button class="status-button" onclick="alert('Status updated to At Patient')">At Patient</button>
            <button class="status-button" onclick="alert('Status updated to Transporting')">Transporting</button>
            <button class="status-button" onclick="alert('Status updated to At Hospital')">At Hospital</button>
        </div>
    </body>
    </html>
  `);
});

// Catch-all handler for non-API routes (Express v5 compatible)
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log('🚑 Aapat Test Server running on port ' + PORT);
  console.log('🔍 Health check: http://localhost:' + PORT + '/health');
  console.log('📱 Mobile apps: http://localhost:' + PORT + '/mobile');
  console.log('🏥 Hospital portal: http://localhost:' + PORT + '/hospital');
  console.log('📊 Emergency dashboard: http://localhost:' + PORT);
  console.log('\n✅ Test server is ready! Open the URLs above to test the features.');
});
