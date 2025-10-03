const express = require('express');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Mock ambulance data
const mockAmbulances = [
  {
    id: 'amb-001',
    driver_id: 'driver-001',
    driver_name: 'Rahul Singh',
    driver_phone: '9876543210',
    driver_rating: 4.8,
    vehicle_number: 'DL-01-AB-1234',
    vehicle_model: 'Tata Ace',
    equipment_level: 'ADVANCED',
    equipment_list: ['oxygen', 'defibrillator', 'heart_monitor', 'stretcher'],
    current_location: {
      lat: 28.6315,
      lng: 77.2167
    },
    lat: 28.6315,
    lng: 77.2167,
    status: 'AVAILABLE',
    fuel_level: 85,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'amb-002',
    driver_id: 'driver-002',
    driver_name: 'Priya Sharma',
    driver_phone: '9123456789',
    driver_rating: 4.9,
    vehicle_number: 'DL-02-CD-5678',
    vehicle_model: 'Force Gurkha',
    equipment_level: 'CRITICAL_CARE',
    equipment_list: ['oxygen', 'defibrillator', 'heart_monitor', 'ventilator', 'stretcher'],
    current_location: {
      lat: 28.6365,
      lng: 77.2217
    },
    lat: 28.6365,
    lng: 77.2217,
    status: 'AVAILABLE',
    fuel_level: 92,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'amb-003',
    driver_id: 'driver-003',
    driver_name: 'Amit Kumar',
    driver_phone: '9988776655',
    driver_rating: 4.7,
    vehicle_number: 'DL-03-EF-9012',
    vehicle_model: 'Mahindra Bolero',
    equipment_level: 'INTERMEDIATE',
    equipment_list: ['oxygen', 'defibrillator', 'stretcher'],
    current_location: {
      lat: 28.6345,
      lng: 77.2147
    },
    lat: 28.6345,
    lng: 77.2147,
    status: 'AVAILABLE',
    fuel_level: 78,
    is_active: true,
    created_at: new Date().toISOString()
  }
];

// Available ambulances endpoint
app.get('/api/ambulances/available', async (req, res) => {
  try {
    const { lat, lng, equipment_level, priority } = req.query;
    
    console.log(`🚑 Request for available ambulances at lat: ${lat}, lng: ${lng}`);
    
    // Return mock ambulances with slight modifications based on location
    const ambulances = mockAmbulances.map((ambulance, index) => ({
      ...ambulance,
      lat: parseFloat(lat) + (index * 0.005 - 0.007),
      lng: parseFloat(lng) + (index * 0.003 - 0.003),
      current_location: {
        lat: parseFloat(lat) + (index * 0.005 - 0.007),
        lng: parseFloat(lng) + (index * 0.003 - 0.003)
      }
    }));

    res.json({
      success: true,
      message: 'Available ambulances retrieved successfully',
      data: ambulances,
      count: ambulances.length,
      filters: {
        lat: lat || 'not specified',
        lng: lng || 'not specified',
        equipment_level: equipment_level || 'any',
        priority: priority || 'not specified'
      }
    });

  } catch (error) {
    console.error('Get available ambulances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available ambulances'
    });
  }
});

// Get ambulance status
app.get('/api/ambulances/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const ambulance = mockAmbulances.find(amb => amb.id === id);
    
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: ambulance.id,
        status: ambulance.status,
        location: ambulance.current_location,
        driver_name: ambulance.driver_name,
        driver_phone: ambulance.driver_phone,
        fuel_level: ambulance.fuel_level,
        equipment_level: ambulance.equipment_level,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get ambulance status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ambulance status'
    });
  }
});

// Update ambulance location
app.put('/api/ambulances/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    
    const ambulance = mockAmbulances.find(amb => amb.id === id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    // Update mock ambulance location (in real app, update database)
    ambulance.lat = latitude;
    ambulance.lng = longitude;
    ambulance.current_location = { lat: latitude, lng: longitude };

    console.log(`🚑 Ambulance ${id} location updated to: ${latitude}, ${longitude}`);

    // Emit real-time location update
    io.emit('ambulance_location_update', {
      ambulance_id: id,
      location: { lat: latitude, lng: longitude },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        ambulance_id: id,
        location: ambulance.current_location,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Aapat Ambulance Service (Simple Mode)',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mock_ambulances: mockAmbulances.length
  });
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Ambulance service client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log(`Ambulance service client disconnected: ${socket.id}`);
  });
});

const port = process.env.PORT || 3002;

server.listen(port, () => {
  console.log(`🚑 Aapat Ambulance Service (Simple Mode) running on port ${port}`);
  console.log(`🔍 Health check: http://localhost:${port}/health`);
  console.log(`📊 Mock ambulances: ${mockAmbulances.length}`);
});
