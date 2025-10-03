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

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});
app.use(limiter);

// In-memory stores
const rideRequests = new Map(); // Active ride requests
const drivers = new Map(); // Online drivers
const otpStore = new Map(); // OTP storage

// Mock drivers (replace with database)
const mockDrivers = [
  {
    id: 'driver-001',
    name: 'Rahul Singh',
    phone: '9876543210',
    rating: 4.8,
    vehicle_number: 'DL-01-AB-1234',
    vehicle_type: 'Ambulance',
    equipment: ['oxygen', 'defibrillator', 'stretcher'],
    license_valid_until: '2025-12-31',
    is_online: true,
    is_available: true,
    location: { lat: 28.6315, lng: 77.2167 },
    current_ride: null
  },
  {
    id: 'driver-002',
    name: 'Priya Sharma',
    phone: '9123456789',
    rating: 4.9,
    vehicle_number: 'DL-02-CD-5678',
    vehicle_type: 'Critical Care Ambulance',
    equipment: ['oxygen', 'defibrillator', 'ventilator', 'heart_monitor'],
    license_valid_until: '2026-03-15',
    is_online: true,
    is_available: true,
    location: { lat: 28.6350, lng: 77.2200 },
    current_ride: null
  },
  {
    id: 'driver-003',
    name: 'Amit Kumar',
    phone: '9988776655',
    rating: 4.7,
    vehicle_number: 'DL-03-EF-9012',
    vehicle_type: 'Basic Ambulance',
    equipment: ['oxygen', 'first_aid'],
    license_valid_until: '2025-11-20',
    is_online: true,
    is_available: true,
    location: { lat: 28.6280, lng: 77.2100 },
    current_ride: null
  },
  // NEW DRIVERS FOR SCALED UP SYSTEM
  {
    id: 'driver-004',
    name: 'Deepak Patel',
    phone: '9923456789',
    rating: 4.9,
    vehicle_number: 'DL-04-GH-3456',
    vehicle_type: 'Advanced Life Support',
    equipment: ['oxygen', 'defibrillator', 'heart_monitor', 'endotracheal_tube'],
    license_valid_until: '2026-06-30',
    is_online: true,
    is_available: true,
    location: { lat: 28.6400, lng: 77.2150 },
    current_ride: null
  },
  {
    id: 'driver-005',
    name: 'Sneha Reddy',
    phone: '9870123456',
    rating: 4.8,
    vehicle_number: 'DL-05-IJ-7890',
    vehicle_type: 'Critical Care Unit',
    equipment: ['oxygen', 'defibrillator', 'ventilator', 'heart_monitor', 'cpap', 'nebulizer'],
    license_valid_until: '2026-02-28',
    is_online: true,
    is_available: true,
    location: { lat: 28.6200, lng: 77.2050 },
    current_ride: null
  },
  {
    id: 'driver-006',
    name: 'Vikram Joshi',
    phone: '9876543211',
    rating: 4.6,
    vehicle_number: 'DL-06-KL-2468',
    vehicle_type: 'Basic Life Support',
    equipment: ['oxygen', 'first_aid', 'stretcher', 'wheelchair'],
    license_valid_until: '2025-10-15',
    is_online: true,
    is_available: true,
    location: { lat: 28.6450, lng: 77.2250 },
    current_ride: null
  },
  {
    id: 'driver-007',
    name: 'Meera Krishnan',
    phone: '9987654321',
    rating: 4.9,
    vehicle_number: 'DL-07-MN-1357',
    vehicle_type: 'Neonatal Unit',
    equipment: ['oxygen', 'incubator', 'neonatal_monitor', 'warming_lights'],
    license_valid_until: '2026-08-20',
    is_online: true,
    is_available: true,
    location: { lat: 28.6150, lng: 77.1950 },
    current_ride: null
  },
  {
    id: 'driver-008',
    name: 'Arjun Singh',
    phone: '9876543212',
    rating: 4.7,
    vehicle_number: 'DL-08-OP-9876',
    vehicle_type: 'Trauma Response Unit',
    equipment: ['oxygen', 'defibrillator', 'spine_board', 'cervical_collar', 'trauma_kit'],
    license_valid_until: '2025-09-30',
    is_online: true,
    is_available: true,
    location: { lat: 28.6500, lng: 77.2300 },
    current_ride: null
  },
  {
    id: 'driver-009',
    name: 'Kavya Sharma',
    phone: '9123456787',
    rating: 4.8,
    vehicle_number: 'DL-09-QR-6543',
    vehicle_type: 'Advanced Life Support',
    equipment: ['oxygen', 'defibrillator', 'heart_monitor', 'mobile_ecg'],
    license_valid_until: '2026-04-15',
    is_online: true,
    is_available: true,
    location: { lat: 28.6100, lng: 77.1900 },
    current_ride: null
  },
  {
    id: 'driver-010',
    name: 'Ravi Chaudhry',
    phone: '9870123457',
    rating: 4.5,
    vehicle_number: 'DL-10-ST-2109',
    vehicle_type: 'Basic Life Support',
    equipment: ['oxygen', 'first_aid', 'stretcher', 'basic_medications'],
    license_valid_until: '2025-12-10',
    is_online: true,
    is_available: true,
    location: { lat: 28.6550, lng: 77.2350 },
    current_ride: null
  }
];

// Initialize mock drivers
mockDrivers.forEach(driver => {
  drivers.set(driver.id, driver);
});

// Helper function to find nearby drivers (scaled up for larger fleet)
function findNearbyDrivers(userLocation, radiusKm = 15) {
  const nearbyDrivers = [];
  
  drivers.forEach(driver => {
    if (!driver.is_online || !driver.is_available || driver.current_ride) {
      return;
    }
    
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      driver.location.lat, driver.location.lng
    );
    
    if (distance <= radiusKm) {
      nearbyDrivers.push({
        ...driver,
        distance_km: Math.round(distance * 10) / 10,
        eta_minutes: Math.round(distance * 2 + Math.random() * 5)
      });
    }
  });
  
  return nearbyDrivers.sort((a, b) => a.distance_km - b.distance_km);
}

// Calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Generate 4-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// STEP 1: User requests ride (Uber-style)
app.post('/api/ride/request', async (req, res) => {
  try {
    const {
      customer,
      ride_type,
      pickup_location,
      destination_location,
      medical_info = {},
      payment_method
    } = req.body;

    if (!customer?.name || !customer?.phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone are required'
      });
    }

    if (!pickup_location?.lat || !pickup_location?.lng) {
      return res.status(400).json({
        success: false,
        message: 'Valid pickup location is required'
      });
    }

    console.log(`🚗 New ride request from ${customer.name} at ${pickup_location.lat}, ${pickup_location.lng}`);

    // Create ride request
    const rideRequestId = uuidv4();
    const rideRequest = {
      id: rideRequestId,
      customer,
      ride_type: ride_type || 'emergency',
      pickup_location,
      destination_location,
      medical_info,
      payment_method: payment_method || 'upi',
      status: 'searching_drivers',
      fare_estimate: calculateFareEstimate(ride_type, destination_location),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min expiry
    };

    // Find nearby drivers
    const nearbyDrivers = findNearbyDrivers(pickup_location, 10);
    
    if (nearbyDrivers.length === 0) {
      rideRequest.status = 'no_drivers_available';
      rideRequests.set(rideRequestId, rideRequest);
      
      return res.json({
        success: false,
        message: 'No drivers available in your area. Please try again later.',
        ride_request_id: rideRequestId
      });
    }

    // Store ride request
    rideRequests.set(rideRequestId, rideRequest);

    // BROADCAST TO ALL NEARBY DRIVERS (Uber-style)
    console.log(`📡 Broadcasting to ${nearbyDrivers.length} nearby drivers`);
    nearbyDrivers.forEach(driver => {
      io.to(`driver-${driver.id}`).emit('new_ride_request', {
        ride_request_id: rideRequestId,
        customer_name: customer.name,
        customer_phone: customer.phone,
        pickup_location: rideRequest.pickup_location,
        destination_location: rideRequest.destination_location,
        fare_estimate: rideRequest.fare_estimate,
        medical_info: rideRequest.medical_info,
        eta_minutes: driver.eta_minutes,
        distance_km: driver.distance_km
      });
      
      // Start acceptance timeout (15 seconds)
      setTimeout(() => {
        if (rideRequest.status === 'searching_drivers') {
          // Check if any drivers accepted
          const currentRequest = rideRequests.get(rideRequestId);
          if (currentRequest && currentRequest.status === 'searching_drivers') {
            currentRequest.status = 'timeout_no_acceptance';
            rideRequests.set(rideRequestId, currentRequest);
          }
        }
      }, 15000); // 15 second timeout
    });

    res.json({
      success: true,
      message: 'Ride request sent to nearby drivers',
      ride_request_id: rideRequestId,
      status: 'searching_drivers',
      nearby_drivers_count: nearbyDrivers.length,
      estimated_fare: rideRequest.fare_estimate
    });

  } catch (error) {
    console.error('Ride request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ride request'
    });
  }
});

// STEP 2: Driver accepts ride (Uber-style)
app.post('/api/driver/:driverId/accept', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { ride_request_id } = req.body;

    const driver = drivers.get(driverId);
    const rideRequest = rideRequests.get(ride_request_id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (!rideRequest) {
      return res.status(404).json({
        success: false,
        message: 'Ride request not found or expired'
      });
    }

    if (!driver.is_online || !driver.is_available || driver.current_ride) {
      return res.status(400).json({
        success: false,
        message: 'Driver not available'
      });
    }

    if (rideRequest.status !== 'searching_drivers') {
      return res.status(400).json({
        success: false,
        message: 'Ride request no longer available'
      });
    }

    // Driver accepts - update status
    driver.current_ride = ride_request_id;
    driver.is_available = false;
    
    rideRequest.status = 'driver_accepted';
    rideRequest.assigned_driver = driver;
    rideRequest.accepted_at = new Date().toISOString();

    // Notify user about driver acceptance
    io.to('user-' + rideRequest.customer.phone).emit('driver_accepted', {
      ride_request_id,
      driver: {
        name: driver.name,
        phone: driver.phone,
        rating: driver.rating,
        vehicle_number: driver.vehicle_number,
        vehicle_type: driver.vehicle_type,
        eta_minutes: driver.eta_minutes || 5
      }
    });

    // Store updated data
    drivers.set(driverId, driver);
    rideRequests.set(ride_request_id, rideRequest);

    console.log(`✅ Driver ${driver.name} accepted ride ${ride_request_id}`);

    res.json({
      success: true,
      message: 'Ride accepted successfully',
      ride_request_id,
      driver_info: {
        name: driver.name,
        phone: driver.phone,
        vehicle_number: driver.vehicle_number
      }
    });

  } catch (error) {
    console.error('Driver acceptance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept ride'
    });
  }
});

// STEP 3: Generate OTP for ride start (Uber-style)
app.post('/api/ride/:rideRequestId/generate-otp', async (req, res) => {
  try {
    const { rideRequestId } = req.params;
    const rideRequest = rideRequests.get(rideRequestId);

    if (!rideRequest) {
      return res.status(404).json({
        success: false,
        message: 'Ride request not found'
      });
    }

    if (rideRequest.status !== 'driver_accepted') {
      return res.status(400).json({
        success: false,
        message: 'Ride not ready for OTP generation'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpData = {
      ride_request_id: rideRequestId,
      otp,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min expiry
      verified: false
    };

    otpStore.set(`otp-${rideRequestId}`, otpData);
    
    // Update ride status
    rideRequest.status = 'otp_generated';
    rideRequest.otp_generated_at = new Date().toISOString();
    rideRequests.set(rideRequestId, rideRequest);

    console.log(`🔐 OTP generated for ride ${rideRequestId}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP generated successfully',
      ride_request_id: rideRequestId,
      otp_sent_to_customer: true,
      otp_expires_in_minutes: 5
    });

  } catch (error) {
    console.error('OTP generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate OTP'
    });
  }
});

// STEP 4: Driver verifies OTP and starts ride (Uber-style)
app.post('/api/driver/:driverId/verify-otp', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { ride_request_id, otp_entered } = req.body;

    const driver = drivers.get(driverId);
    const rideRequest = rideRequests.get(ride_request_id);
    const otpData = otpStore.get(`otp-${ride_request_id}`);

    if (!driver || !rideRequest || !otpData) {
      return res.status(404).json({
        success: false,
        message: 'Invalid ride request or OTP data'
      });
    }

    if (driverId !== rideRequest.assigned_driver.id) {
      return res.status(400).json({
        success: false,
        message: 'Driver not assigned to this ride'
      });
    }

    if (otpData.verified) {
      return res.status(400).json({
        success: false,
        message: 'OTP already verified'
      });
    }

    if (new Date() > new Date(otpData.expires_at)) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      });
    }

    // Verify OTP
    if (otp_entered !== otpData.otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // OTP verified - start ride
    otpData.verified = true;
    otpData.verified_at = new Date().toISOString();

    rideRequest.status = 'ride_started';
    rideRequest.ride_started_at = new Date().toISOString();

    console.log(`✅ Driver ${driver.name} verified OTP and started ride ${ride_request_id}`);

    res.json({
      success: true,
      message: 'OTP verified successfully. Ride started!',
      ride_request_id,
      status: 'ride_started'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});

// STEP 5: Complete ride (Uber-style)
app.post('/api/ride/:rideRequestId/complete', async (req, res) => {
  try {
    const { rideRequestId } = req.params;
    const { payment_confirmed, fare_paid } = req.body;

    const rideRequest = rideRequests.get(rideRequestId);

    if (!rideRequest) {
      return res.status(404).json({
        success: false,
        message: 'Ride request not found'
      });
    }

    if (rideRequest.status !== 'ride_started') {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete ride that has not started'
      });
    }

    // Get driver and mark as available
    const driver = drivers.get(rideRequest.assigned_driver.id);
    if (driver) {
      driver.current_ride = null;
      driver.is_available = true;
      drivers.set(driver.id, driver);
    }

    // Complete ride
    rideRequest.status = 'completed';
    rideRequest.completed_at = new Date().toISOString();
    rideRequest.payment_confirmed = payment_confirmed || false;
    rideRequest.fare_paid = fare_paid || rideRequest.fare_estimate.total_fare;

    rideRequests.set(rideRequestId, rideRequest);

    console.log(`🎉 Ride ${rideRequestId} completed! Fare: ₹${rideRequest.fare_paid}`);

    res.json({
      success: true,
      message: 'Ride completed successfully',
      ride_request_id: rideRequestId,
      status: 'completed',
      fare_paid: rideRequest.fare_paid,
      completion_time: rideRequest.completed_at
    });

  } catch (error) {
    console.error('Ride completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete ride'
    });
  }
});

// Get ride status
app.get('/api/ride/:rideRequestId/status', (req, res) => {
  try {
    const { rideRequestId } = req.params;
    const rideRequest = rideRequests.get(rideRequestId);

    if (!rideRequest) {
      return res.status(404).json({
        success: false,
        message: 'Ride request not found'
      });
    }

    res.json({
      success: true,
      data: rideRequest
    });

  } catch (error) {
    console.error('Ride status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ride status'
    });
  }
});

// Driver status endpoints
app.get('/api/drivers/nearby', (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    const nearbyDrivers = findNearbyDrivers({ lat: parseFloat(lat), lng: parseFloat(lng) }, radius);
    
    res.json({
      success: true,
      count: nearbyDrivers.length,
      drivers: nearbyDrivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        rating: driver.rating,
        vehicle_type: driver.vehicle_type,
        distance_km: driver.distance_km,
        eta_minutes: driver.eta_minutes,
        is_available: driver.is_available
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby drivers'
    });
  }
});

app.get('/api/driver/:driverId/status', (req, res) => {
  try {
    const { driverId } = req.params;
    const driver = drivers.get(driverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      data: driver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get driver status'
    });
  }
});

// Fare calculation
function calculateFareEstimate(rideType, destination) {
  let baseFare = 1500;
  let multiplier = 1.5; // Emergency multiplier
  
  if (rideType === 'scheduled') multiplier = 1.0;
  if (rideType === 'regular') multiplier = 1.2;

  return {
    base_fare: baseFare,
    distance_fare: 0,
    priority_multiplier: multiplier,
    total_fare: Math.round(baseFare * multiplier)
  };
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Uber-Style Driver Matching Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    active_requests: rideRequests.size,
    online_drivers: Array.from(drivers.values()).filter(d => d.is_online).length,
    available_drivers: Array.from(drivers.values()).filter(d => d.is_available).length
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Driver connects
  socket.on('driver_login', (data) => {
    const { driver_id } = data;
    socket.join(`driver-${driver_id}`);
    console.log(`Driver ${driver_id} connected`);
  });

  // User connects
  socket.on('user_login', (data) => {
    const { user_phone } = data;
    socket.join(`user-${user_phone}`);
    console.log(`User ${user_phone} connected`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const port = process.env.PORT || 3012;

server.listen(port, () => {
  console.log(`🚗 Uber-Style Driver Matching Service running on port ${port}`);
  console.log(`🔍 Health check: http://localhost:${port}/health`);
  console.log(`📡 Socket.io enabled for real-time updates`);
});
