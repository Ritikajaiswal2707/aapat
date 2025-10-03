const express = require('express');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const uuidv4 = require('uuid').v4;

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

// In-memory storage (replacing Redis)
const bookings = new Map();
const ambulanceCache = new Map();

// Get available ambulances
async function getAvailableAmbulances(lat, lng) {
  try {
    // Try ambulance service first
    const response = await axios.get(`http://localhost:3002/api/ambulances/available`, {
      params: { lat, lng }
    });
    return response.data.data || [];
  } catch (error) {
    console.log('Ambulance service failed, using mock data:', error.message);
    
    // Return mock ambulances
    return [
      {
        id: 'amb-mock-001',
        driver_name: 'Rahul Singh',
        driver_phone: '9876543210',
        driver_rating: 4.8,
        vehicle_number: 'DL-01-AB-1234',
        equipment_level: 'ADVANCED',
        equipment_list: ['oxygen', 'defibrillator', 'heart_monitor', 'stretcher'],
        lat: parseFloat(lat) + 0.005,
        lng: parseFloat(lng) + 0.003,
        status: 'AVAILABLE',
        fuel_level: 85,
        is_active: true
      },
      {
        id: 'amb-mock-002',
        driver_name: 'Priya Sharma',
        driver_phone: '9123456789',
        driver_rating: 4.9,
        vehicle_number: 'DL-02-CD-5678',
        equipment_level: 'CRITICAL_CARE',
        equipment_list: ['oxygen', 'defibrillator', 'heart_monitor', 'ventilator', 'stretcher'],
        lat: parseFloat(lat) + 0.008,
        lng: parseFloat(lng) + 0.001,
        status: 'AVAILABLE',
        fuel_level: 92,
        is_active: true
      },
      {
        id: 'amb-mock-003',
        driver_name: 'Amit Kumar',
        driver_phone: '9988776655',
        driver_rating: 4.7,
        vehicle_number: 'DL-03-EF-9012',
        equipment_level: 'INTERMEDIATE',
        equipment_list: ['oxygen', 'defibrillator', 'stretcher'],
        lat: parseFloat(lat) + 0.003,
        lng: parseFloat(lng) - 0.002,
        status: 'AVAILABLE',
        fuel_level: 78,
        is_active: true
      }
    ];
  }
}

// Calculate fare estimate
function calculateFare(rideType, distance = 0) {
  let baseFare = 1500;
  let distanceFare = distance * 50; // ₹50 per km
  let multiplier = 1.0;
  
  if (rideType === 'emergency') {
    multiplier = 1.5;
  } else if (rideType === 'scheduled') {
    multiplier = 1.1;
  }
  
  const totalFare = Math.round((baseFare + distanceFare) * multiplier);
  
  return {
    base_fare: baseFare,
    distance_fare: distanceFare,
    equipment_surcharge: 0,
    priority_multiplier: multiplier,
    total_fare: totalFare
  };
}

// Calculate ETA
function calculateETA(ambulances, pickupLocation) {
  return ambulances.map(ambulance => {
    // Mock distance calculation (in real app, use Google Maps)
    const distance = Math.random() * 10 + 2; // 2-12 km
    const etaMinutes = Math.round(distance * 2 + Math.random() * 5); // 2-5 mins per km + traffic
    
    return {
      ambulance_id: ambulance.id,
      driver_name: ambulance.driver_name,
      driver_phone: ambulance.driver_phone,
      rating: ambulance.driver_rating,
      vehicle_number: ambulance.vehicle_number,
      equipment_level: ambulance.equipment_level,
      distance_km: Math.round(distance * 10) / 10,
      eta_minutes: etaMinutes,
      location: { lat: ambulance.lat, lng: ambulance.lng }
    };
  }).sort((a, b) => a.eta_minutes - b.eta_minutes);
}

// Preview endpoint
app.get('/api/ride/preview', async (req, res) => {
  try {
    const { lat, lng, ride_type = 'emergency' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    console.log(`📋 Generating preview for lat: ${lat}, lng: ${lng}, type: ${ride_type}`);

    const availableAmbulances = await getAvailableAmbulances(lat, lng);
    const fareEstimate = calculateFare(ride_type);
    const etaOptions = calculateETA(availableAmbulances, { lat: parseFloat(lat), lng: parseFloat(lng) });

    const previewData = {
      success: true,
      data: {
        available_ambulances: etaOptions,
        estimated_fare: fareEstimate,
        ride_type: ride_type,
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        message: 'Preview generated successfully'
      }
    };

    res.json(previewData);

  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking preview'
    });
  }
});

// Create ride booking
app.post('/api/ride/book', async (req, res) => {
  try {
    const {
      customer,
      ride_type,
      pickup,
      destination,
      payment_method
    } = req.body;

    if (!customer?.name || !customer?.phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone are required'
      });
    }

    if (!pickup?.location?.lat || !pickup?.location?.lng) {
      return res.status(400).json({
        success: false,
        message: 'Valid pickup location is required'
      });
    }

    console.log(`🚑 Creating ${ride_type} booking for ${customer.name}`);

    const bookingId = uuidv4();
    const availableAmbulances = await getAvailableAmbulances(pickup.location.lat, pickup.location.lng);
    
    if (availableAmbulances.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No ambulances available at the moment. Please try again.',
        booking_id: bookingId
      });
    }

    const fareEstimate = calculateFare(ride_type);
    const etaOptions = calculateETA(availableAmbulances, pickup.location);

    const bookingData = {
      id: bookingId,
      customer,
      ride_type: ride_type || 'emergency',
      pickup,
      destination,
      payment_method,
      status: 'searching_ambulance',
      available_options: etaOptions.map(option => ({
        ambulance_id: option.ambulance_id,
        eta_minutes: option.eta_minutes,
        distance_km: option.distance_km,
        driver_name: option.driver_name,
        driver_phone: option.driver_phone,
        rating: option.rating,
        estimated_fare: fareEstimate.total_fare
      })),
      fare_estimate: fareEstimate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store booking in memory
    bookings.set(bookingId, bookingData);

    console.log(`✅ Emergency booking created: ${bookingId}`);

    // Emit booking created event
    io.emit('ride_booking_created', bookingData);

    res.json({
      success: true,
      message: 'Emergency ride booking created successfully',
      booking_id: bookingId,
      estimated_options: bookingData.available_options,
      fare_estimate: fareEstimate
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ride booking'
    });
  }
});

// Get booking status
app.get('/api/ride/status/:id', (req, res) => {
  try {
    const { id } = req.params;
    const booking = bookings.get(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking status'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Aapat Ride Booking Service (Simple Mode)',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    active_bookings: bookings.size
  });
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Ride booking client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log(`Ride booking client disconnected: ${socket.id}`);
  });
});

const port = process.env.PORT || 3010;

server.listen(port, () => {
  console.log(`🚑 Aapat Ride Booking Service (Simple Mode) running on port ${port}`);
  console.log(`🔍 Health check: http://localhost:${port}/health`);
});
