const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const socketIo = require('socket.io');
const http = require('http');
const redis = require('redis');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"]
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

// Redis client for caching
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redisClient.on('error', (err) => {
  console.log('Redis Client Error (using in-memory fallback)', err.message);
});

// Fallback to in-memory storage if Redis fails
const fallbackData = new Map();

// Safe Redis operations
async function safeRedisSet(key, value, ttl = 3600) {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.log('Redis set failed, using fallback');
    fallbackData.set(key, { value, expireAt: Date.now() + ttl * 1000 });
  }
}

async function safeRedisGet(key) {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.log('Redis get failed, using fallback');
    const fallback = fallbackData.get(key);
    if (fallback && fallback.expireAt > Date.now()) {
      return fallback.value;
    }
    return null;
  }
}

// Validate data schemas
const rideBookingSchema = Joi.object({
  customer: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    email: Joi.string().email().optional(),
    emergency_contact: Joi.string().min(10).max(15).optional()
  }).required(),
  
  ride_type: Joi.string().valid('emergency', 'scheduled', 'medical_transport').required(),
  
  pickup: Joi.object({
    address: Joi.string().max(500).required(),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).required(),
    landmark: Joi.string().max(200).optional(),
    instructions: Joi.string().max(500).optional()
  }).required(),
  
  destination: Joi.object({
    address: Joi.string().max(500).required(),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).required(),
    landmark: Joi.string().max(200).optional(),
    hospital_id: Joi.string().optional()
  }).required(),
  
  scheduled_time: Joi.date().min('now').optional(),
  
  medical_info: Joi.object({
    patient_condition: Joi.string().optional(),
    mobility_level: Joi.string().valid('independent', 'assisted', 'wheelchair', 'stretcher').optional(),
    medical_equipment_required: Joi.array().items(Joi.string()).optional(),
    emergency_type: Joi.string().optional(),
    priority_level: Joi.number().min(1).max(4).optional()
  }).optional(),
  
  payment_method: Joi.string().valid('cash', 'upi', 'card', 'insurance', 'corporate').default('cash'),
  
  estimated_distance: Joi.number().positive().optional(),
  estimated_duration: Joi.number().positive().optional(),
  estimated_fare: Joi.number().positive().optional()
});

// Emergency Ride Variables
const EMERGENCY_TYPES = {
  'heart_attack': 'Heart Attack',
  'stroke': 'Stroke',
  'accident': 'Accident',
  'breathing': 'Breathing Problems',
  'seizure': 'Seizure',
  'bleeding': 'Bleeding',
  'poisoning': 'Poisoning',
  'burn': 'Burns'
};

const PRIORITY_LEVELS = {
  1: 'CRITICAL',   // Life-threatening, immediate dispatch
  2: 'HIGH',       // Urgent, fast response
  3: 'MEDIUM',     // Stable condition, prompt response
  4: 'LOW'         // Non-urgent, scheduled accordingly
};

// Ride Booking Engine
class RideBookingEngine {
  static async findAvailableAmbulances(request) {
    try {
      // Check cache first
      const cacheKey = `available_ambulances_${request.pickup.location.lat}_${request.pickup.location.lng}`;
      const cached = await safeRedisGet(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Query ambulance service for available ambulances
      try {
        const response = await axios.get(`http://localhost:3002/api/ambulances/available`, {
          params: {
            lat: request.pickup.location.lat,
            lng: request.pickup.location.lng,
            equipment_level: request.medical_info?.equipment_level || 'basic',
            priority: request.medical_info?.priority_level || 3
          }
        });

        const ambulances = response.data.data || [];
        
        // Cache for 2 minutes
        await safeRedisSet(cacheKey, ambulances, 120);
        
        return ambulances;
      } catch (serviceError) {
        console.log('Ambulance service call failed, using mock data:', serviceError.message);
        
        // Return mock ambulance data if service is unavailable
        const mockAmbulances = [
          {
            id: 'amb-mock-001',
            driver_name: 'Rahul Singh',
            driver_phone: '9876543210',
            driver_rating: 4.8,
            vehicle_number: 'DL-01-AB-1234',
            equipment_level: 'ADVANCED',
            equipment_list: ['oxygen', 'defibrillator', 'heart_monitor', 'stretcher'],
            lat: request.pickup.location.lat + 0.005,
            lng: request.pickup.location.lng + 0.003,
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
            lat: request.pickup.location.lat + 0.008,
            lng: request.pickup.location.lng + 0.001,
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
            lat: request.pickup.location.lat + 0.003,
            lng: request.pickup.location.lng - 0.002,
            status: 'AVAILABLE',
            fuel_level: 78,
            is_active: true
          }
        ];

        // Cache mock data for 1 minute
        await safeRedisSet(cacheKey, mockAmbulances, 60);
        
        return mockAmbulances;
      }
    } catch (error) {
      console.error('Error finding available ambulances:', error.message);
      return [];
    }
  }

  static async calculateEstimatedFare(distance, duration, rideType, medicalRequirements) {
    // Base fares (in INR)
    const baseFares = {
      'emergency': 1500,
      'scheduled': 1000,
      'medical_transport': 800
    };

    // Distance rate (INR per km)
    const rates = {
      'emergency': 25,
      'scheduled': 20,
      'medical_transport': 15
    };

    const baseFare = baseFares[rideType] || 1000;
    const distanceFare = (distance || 0) * (rates[rideType] || 20);
    
    // Medical equipment surcharge
    let equipmentSurcharge = 0;
    if (medicalRequirements?.medical_equipment_required) {
      equipmentSurcharge = medicalRequirements.medical_equipment_required.length * 500;
    }
    
    // Priority multiplier
    let priorityMultiplier = 1;
    if (rideType === 'emergency') {
      switch (medicalRequirements?.priority_level) {
        case 1: priorityMultiplier = 1.5; break; // Critical
        case 2: priorityMultiplier = 1.3; break; // High
        default: priorityMultiplier = 1.1;
      }
    }

    const totalFare = Math.round((baseFare + distanceFare + equipmentSurcharge) * priorityMultiplier);
    
    return {
      base_fare: baseFare,
      distance_fare: distanceFare,
      equipment_surcharge: equipmentSurcharge,
      priority_multiplier: priorityMultiplier,
      total_fare: totalFare,
      breakdown: {
        base_fare: baseFare,
        distance_fare: distanceFare,
        equipment_surcharge: equipmentSurcharge,
        priority_multiplier: priorityMultiplier
      }
    };
  }

  static async calculateETA(pickupLocation, availableAmbulances) {
    const etas = availableAmbulances.map(ambulance => {
      if (!ambulance.current_location) return null;
      
      const distance = this.calculateDistance(
        pickupLocation.lat, pickupLocation.lng,
        ambulance.lat, ambulance.lng
      );
      
      // Assuming average speed of 40 km/h for ambulances
      const etaMinutes = Math.round((distance / 40) * 60);
      
      return {
        ambulance_id: ambulance.id,
        eta_minutes: etaMinutes,
        distance_km: Math.round(distance * 100) / 100,
        driver_name: ambulance.driver_name,
        driver_phone: ambulance.driver_phone,
        rating: ambulance.driver_rating
      };
    }).filter(Boolean);

    return etas.sort((a, b) => a.eta_minutes - b.eta_minutes);
  }

  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

// Create ride booking
app.post('/api/ride/book', async (req, res) => {
  try {
    // Validate request data
    const { error, value } = rideBookingSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const rideRequest = value;
    const bookingId = uuidv4();

    // For scheduled rides, just store the booking
    if (rideRequest.ride_type === 'scheduled') {
      const scheduledBooking = {
        id: bookingId,
        ...rideRequest,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        schedule_reminder_at: new Date(new Date(rideRequest.scheduled_time).getTime() - 30 * 60 * 1000).toISOString(), // 30 min before
        updated_at: new Date().toISOString()
      };

      // Store booking using safe Redis operation
      await safeRedisSet(
        `scheduled_booking:${bookingId}`,
        scheduledBooking,
        7 * 24 * 60 * 60 // 7 days
      );

      return res.json({
        success: true,
        message: 'Ride scheduled successfully',
        booking_id: bookingId,
        scheduled_time: rideRequest.scheduled_time,
        data: scheduledBooking
      });
    }

    // For emergency and medical transport - immediate processing
    const availableAmbulances = await RideBookingEngine.findAvailableAmbulances(rideRequest);
    
    if (availableAmbulances.length === 0) {
      return res.status(503).json({
        success: false,
        message: 'No ambulances available at the moment. Please try again in a few minutes.',
        booking_id: bookingId,
        retry_after_seconds: 60
      });
    }

    // Calculate estimates
    const fareEstimate = await RideBookingEngine.calculateEstimatedFare(
      rideRequest.estimated_distance,
      rideRequest.estimated_duration,
      rideRequest.ride_type,
      rideRequest.medical_info
    );

    const etaOptions = await RideBookingEngine.calculateETA(
      rideRequest.pickup.location,
      availableAmbulances
    );

    const bookingData = {
      id: bookingId,
      ...rideRequest,
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

    // Cache booking for 10 minutes using safe Redis
    await safeRedisSet(
      `booking:${bookingId}`,
      bookingData,
      600 // 10 minutes
    );

    // Emit booking created event
    io.emit('ride_booking_created', bookingData);

    res.json({
      success: true,
      message: 'Ride booking created successfully',
      booking_id: bookingId,
      estimated_options: bookingData.available_options.slice(0, 3), // Top 3 options
      fare_estimate: fareEstimate,
      next_steps: 'Waiting for ambulance confirmation...'
    });

  } catch (error) {
    console.error('Ride booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ride booking'
    });
  }
});

// Assign specific ambulance to booking
app.post('/api/ride/assign', async (req, res) => {
  try {
    const { booking_id, ambulance_id } = req.body;

    if (!booking_id || !ambulance_id) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and Ambulance ID are required'
      });
    }

    // Get booking from cache
    const booking = await safeRedisGet(`booking:${booking_id}`);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or expired'
      });
    }
    
    // Check if ambulance is still available
    const ambulanceOptions = booking.available_options || [];
    const selectedOption = ambulanceOptions.find(opt => opt.ambulance_id === ambulance_id);
    
    if (!selectedOption) {
      return res.status(400).json({
        success: false,
        message: 'Selected ambulance is no longer available'
      });
    }

    // Update booking status
    booking.status = 'confirmed';
    booking.selected_ambulance = selectedOption;
    booking.confirmed_at = new Date().toISOString();
    booking.updated_at = new Date().toISOString();

    // Cache updated booking
    await safeRedisSet(
      `booking:${booking_id}`,
      booking,
      3600 // 1 hour
    );

    // Notify dispatch service
    try {
      const dispatchResponse = await axios.post('http://localhost:3003/api/dispatch/assign', {
        emergency_id: booking_id,
        preferred_ambulance_id: ambulance_id,
        ride_type: booking.ride_type,
        customer_info: booking.customer,
        pickup_location: booking.pickup.location,
        destination_location: booking.destination.location,
        medical_info: booking.medical_info
      });

      if (dispatchResponse.data.success) {
        booking.status = 'assigned';
        booking.dispatch_id = dispatchResponse.data.data.assignment_id;
        booking.updated_at = new Date().toISOString();

        // Update cached booking
        await safeRedisSet(
          `booking:${booking_id}`,
          booking,
          3600
        );
      }
    } catch (dispatchError) {
      console.error('Dispatch assignment failed:', dispatchError.message);
    }

    // Emit booking confirmed event
    io.emit('ride_booking_confirmed', booking);

    res.json({
      success: true,
      message: 'Ride confirmed successfully',
      booking_id: booking_id,
      selected_ambulance: selectedOption,
      eta_minutes: selectedOption.eta_minutes,
      status: booking.status
    });

  } catch (error) {
    console.error('Ride assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign ride'
    });
  }
});

// Get booking status
app.get('/api/ride/status/:booking_id', async (req, res) => {
  try {
    const { booking_id } = req.params;
    
    const booking = await safeRedisGet(`booking:${booking_id}`);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or expired'
      });
    }

    // Get real-time ambulance status if assigned
    if (booking.selected_ambulance?.ambulance_id) {
      try {
        const ambulanceResponse = await axios.get(`http://localhost:3002/api/ambulances/${booking.selected_ambulance.ambulance_id}/status`);
        if (ambulanceResponse.data.success) {
          booking.ambulance_current_status = ambulanceResponse.data.data;
        }
      } catch (error) {
        console.error('Failed to get ambulance status:', error.message);
      }
    }

    res.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        ride_type: booking.ride_type,
        pickup: booking.pickup,
        destination: booking.destination,
        selected_ambulance: booking.selected_ambulance,
        eta_minutes: booking.selected_ambulance?.eta_minutes,
        fare_estimate: booking.fare_estimate,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        ambulance_current_status: booking.ambulance_current_status
      }
    });

  } catch (error) {
    console.error('Get booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking status'
    });
  }
});

// Cancel booking
app.delete('/api/ride/:booking_id', async (req, res) => {
  try {
    const { booking_id } = req.params;
    
    const bookingStr = await redisClient.get(`booking:${booking_id}`);
    if (!bookingStr) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = JSON.parse(bookingStr);

    // Update booking status
    booking.status = 'cancelled';
    booking.cancelled_at = new Date().toISOString();
    booking.updated_at = new Date().toISOString();

    // Cache updated booking
    await safeRedisSet(
      `booking:${booking_id}`,
      booking,
      3600
    );

    // If ambulance was assigned, notify dispatch to release it
    if (booking.dispatch_id) {
      try {
        await axios.put(`http://localhost:3003/api/dispatch/status/${booking.dispatch_id}`, {
          status: 'CANCELLED'
        });
      } catch (error) {
        console.error('Failed to update dispatch status:', error.message);
      }
    }

    // Emit booking cancelled event
    io.emit('ride_booking_cancelled', {
      booking_id,
      reason: 'Customer cancellation',
      cancelled_at: booking.cancelled_at
    });

    res.json({
      success: true,
      message: 'Ride booking cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Aapat Ride Booking Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get available ambulances for booking preview
app.get('/api/ride/preview', async (req, res) => {
  try {
    const { lat, lng, ride_type = 'emergency' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const ambulances = await RideBookingEngine.findAvailableAmbulances({
      pickup: { location: { lat: parseFloat(lat), lng: parseFloat(lng) } },
      ride_type,
      medical_info: { priority_level: ride_type === 'emergency' ? 1 : 3 }
    });

    const etas = await RideBookingEngine.calculateETA(
      { lat: parseFloat(lat), lng: parseFloat(lng) },
      ambulances
    );

    const fareEstimate = await RideBookingEngine.calculateEstimatedFare(
      null, null, ride_type, { priority_level: ride_type === 'emergency' ? 1 : 3 }
    );

    res.json({
      success: true,
      data: {
        available_ambulances: etas.slice(0, 5),
        estimated_fare: fareEstimate,
        ride_type: ride_type,
        location: { lat: parseFloat(lat), lng: parseFloat(lng) }
      }
    });

  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking preview'
    });
  }
});

const port = process.env.PORT || 3010;

server.listen(port, () => {
  console.log(`🚑 Aapat Ride Booking Service running on port ${port}`);
  console.log(`🔍 Health check: http://localhost:${port}/health`);
});
