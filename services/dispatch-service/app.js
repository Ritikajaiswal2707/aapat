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
const cron = require('node-cron');

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

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'aapat_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'aapat_db',
  password: process.env.DB_PASSWORD || 'aapat_password',
  port: process.env.DB_PORT || 5432,
});

// Redis connection
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

// Service URLs
const AMBULANCE_SERVICE_URL = process.env.AMBULANCE_SERVICE_URL || 'http://ambulance-service:3002';
const EMERGENCY_SERVICE_URL = process.env.EMERGENCY_SERVICE_URL || 'http://emergency-service:3001';
const HOSPITAL_SERVICE_URL = process.env.HOSPITAL_SERVICE_URL || 'http://hospital-service:3004';

// Priority levels
const PRIORITY = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4
};

// Dispatch algorithms
class DispatchAlgorithm {
  static async findBestAmbulance(emergencyRequest, availableAmbulances) {
    const { priority_level, location, emergency_type, symptoms } = emergencyRequest;
    const { lat, lng } = location;
    
    // Score each ambulance based on multiple factors
    const scoredAmbulances = await Promise.all(
      availableAmbulances.map(async (ambulance) => {
        let score = 0;
        
        // Distance factor (40% weight)
        const distance = this.calculateDistance(
          lat, lng,
          ambulance.lat, ambulance.lng
        );
        const distanceScore = Math.max(0, 100 - (distance * 2)); // Closer = higher score
        score += distanceScore * 0.4;
        
        // Equipment matching (25% weight)
        const equipmentScore = this.calculateEquipmentScore(
          emergency_type, symptoms, ambulance.equipment_level, ambulance.equipment_list
        );
        score += equipmentScore * 0.25;
        
        // Driver rating (15% weight)
        const ratingScore = (ambulance.driver_rating / 5) * 100;
        score += ratingScore * 0.15;
        
        // Priority matching (10% weight)
        const priorityScore = this.calculatePriorityScore(priority_level, ambulance.equipment_level);
        score += priorityScore * 0.1;
        
        // Fuel level (5% weight)
        const fuelScore = ambulance.fuel_level;
        score += fuelScore * 0.05;
        
        // Availability factor (5% weight)
        const availabilityScore = ambulance.status === 'AVAILABLE' ? 100 : 0;
        score += availabilityScore * 0.05;
        
        return {
          ...ambulance,
          score: Math.round(score),
          distance_km: distance
        };
      })
    );
    
    // Sort by score (highest first) and return top candidates
    return scoredAmbulances
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Return top 3 candidates
  }
  
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  static deg2rad(deg) {
    return deg * (Math.PI/180);
  }
  
  static calculateEquipmentScore(emergencyType, symptoms, equipmentLevel, equipmentList) {
    let score = 0;
    
    // Base score by equipment level
    const levelScores = {
      'BASIC': 20,
      'INTERMEDIATE': 40,
      'ADVANCED': 70,
      'CRITICAL_CARE': 100
    };
    score += levelScores[equipmentLevel] || 0;
    
    // Specific equipment matching
    const equipment = Array.isArray(equipmentList) ? equipmentList : [];
    
    // Critical care equipment
    if (emergencyType?.toLowerCase().includes('cardiac') || 
        symptoms?.toLowerCase().includes('chest pain')) {
      if (equipment.includes('Defibrillator')) score += 20;
      if (equipment.includes('ECG Machine')) score += 15;
    }
    
    if (emergencyType?.toLowerCase().includes('respiratory') || 
        symptoms?.toLowerCase().includes('breathing')) {
      if (equipment.includes('Ventilator')) score += 25;
      if (equipment.includes('Oxygen Cylinder')) score += 10;
    }
    
    if (emergencyType?.toLowerCase().includes('trauma') || 
        symptoms?.toLowerCase().includes('accident')) {
      if (equipment.includes('Stretcher')) score += 15;
      if (equipment.includes('First Aid Kit')) score += 10;
    }
    
    return Math.min(score, 100);
  }
  
  static calculatePriorityScore(priorityLevel, equipmentLevel) {
    const priorityWeights = {
      [PRIORITY.CRITICAL]: { 'CRITICAL_CARE': 100, 'ADVANCED': 80, 'INTERMEDIATE': 40, 'BASIC': 20 },
      [PRIORITY.HIGH]: { 'CRITICAL_CARE': 90, 'ADVANCED': 100, 'INTERMEDIATE': 70, 'BASIC': 40 },
      [PRIORITY.MEDIUM]: { 'CRITICAL_CARE': 80, 'ADVANCED': 90, 'INTERMEDIATE': 100, 'BASIC': 70 },
      [PRIORITY.LOW]: { 'CRITICAL_CARE': 70, 'ADVANCED': 80, 'INTERMEDIATE': 90, 'BASIC': 100 }
    };
    
    return priorityWeights[priorityLevel]?.[equipmentLevel] || 50;
  }
  
  static async calculateETA(ambulanceLocation, emergencyLocation, trafficFactor = 1.0) {
    const distance = this.calculateDistance(
      emergencyLocation.lat, emergencyLocation.lng,
      ambulanceLocation.lat, ambulanceLocation.lng
    );
    
    // Base speed: 40 km/h in city, 60 km/h on highways
    const baseSpeed = 40; // km/h
    const adjustedSpeed = baseSpeed / trafficFactor;
    
    const etaMinutes = (distance / adjustedSpeed) * 60;
    return Math.round(etaMinutes);
  }
}

// Assign ambulance to emergency
app.post('/api/dispatch/assign', async (req, res) => {
  try {
    const { emergency_id, preferred_ambulance_id, force_assignment = false } = req.body;
    
    if (!emergency_id) {
      return res.status(400).json({
        success: false,
        message: 'Emergency ID is required'
      });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get emergency request details
      const emergencyQuery = `
        SELECT er.*, ST_X(er.location) as lng, ST_Y(er.location) as lat
        FROM emergency_requests er 
        WHERE er.id = $1 AND er.status = 'PENDING'
      `;
      
      const emergencyResult = await client.query(emergencyQuery, [emergency_id]);
      
      if (emergencyResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Emergency request not found or already assigned'
        });
      }
      
      const emergency = emergencyResult.rows[0];
      
      // Get available ambulances
      let availableAmbulances;
      
      if (preferred_ambulance_id && !force_assignment) {
        // Check if preferred ambulance is available
        const preferredQuery = `
          SELECT a.*, ST_X(a.current_location) as lng, ST_Y(a.current_location) as lat,
                 d.name as driver_name, d.phone as driver_phone, d.rating as driver_rating
          FROM ambulances a
          LEFT JOIN drivers d ON a.driver_id = d.id
          WHERE a.id = $1 AND a.status = 'AVAILABLE' AND a.is_active = true
        `;
        
        const preferredResult = await client.query(preferredQuery, [preferred_ambulance_id]);
        availableAmbulances = preferredResult.rows;
      } else {
        // Get nearby available ambulances
        const nearbyQuery = `
          SELECT a.*, ST_X(a.current_location) as lng, ST_Y(a.current_location) as lat,
                 d.name as driver_name, d.phone as driver_phone, d.rating as driver_rating
          FROM ambulances a
          LEFT JOIN drivers d ON a.driver_id = d.id
          WHERE a.status = 'AVAILABLE' 
            AND a.is_active = true 
            AND a.current_location IS NOT NULL
            AND ST_DWithin(a.current_location, ST_Point($1, $2), 50000) -- 50km radius
          ORDER BY ST_Distance(a.current_location, ST_Point($1, $2))
          LIMIT 10
        `;
        
        const nearbyResult = await client.query(nearbyQuery, [emergency.lng, emergency.lat]);
        availableAmbulances = nearbyResult.rows;
      }
      
      if (availableAmbulances.length === 0) {
        await client.query('ROLLBACK');
        return res.status(503).json({
          success: false,
          message: 'No available ambulances found'
        });
      }
      
      // Use AI algorithm to find best ambulance
      const candidates = await DispatchAlgorithm.findBestAmbulance(
        emergency, 
        availableAmbulances
      );
      
      const selectedAmbulance = candidates[0];
      
      // Calculate ETA
      const etaMinutes = await DispatchAlgorithm.calculateETA(
        { lat: selectedAmbulance.lat, lng: selectedAmbulance.lng },
        { lat: emergency.lat, lng: emergency.lng }
      );
      
      const estimatedArrival = new Date(Date.now() + etaMinutes * 60000);
      
      // Create dispatch assignment
      const assignmentQuery = `
        INSERT INTO dispatch_assignments (
          emergency_request_id, ambulance_id, driver_id, 
          estimated_arrival, status
        ) VALUES ($1, $2, $3, $4, 'ASSIGNED')
        RETURNING *
      `;
      
      const assignmentResult = await client.query(assignmentQuery, [
        emergency_id,
        selectedAmbulance.id,
        selectedAmbulance.driver_id,
        estimatedArrival
      ]);
      
      // Update emergency request status
      const updateEmergencyQuery = `
        UPDATE emergency_requests 
        SET status = 'ASSIGNED', 
            assigned_ambulance_id = $1,
            assigned_driver_id = $2,
            estimated_arrival = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `;
      
      await client.query(updateEmergencyQuery, [
        selectedAmbulance.id,
        selectedAmbulance.driver_id,
        estimatedArrival,
        emergency_id
      ]);
      
      // Update ambulance status
      const updateAmbulanceQuery = `
        UPDATE ambulances 
        SET status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      
      await client.query(updateAmbulanceQuery, [selectedAmbulance.id]);
      
      await client.query('COMMIT');
      
      // Notify ambulance service
      try {
        await axios.put(`${AMBULANCE_SERVICE_URL}/api/ambulances/${selectedAmbulance.id}/status`, {
          status: 'ASSIGNED',
          notes: `Assigned to emergency ${emergency_id}`
        });
      } catch (error) {
        console.error('Failed to notify ambulance service:', error.message);
      }
      
      // Emit real-time notification
      io.emit('ambulance_assigned', {
        emergency_id,
        ambulance_id: selectedAmbulance.id,
        driver_name: selectedAmbulance.driver_name,
        driver_phone: selectedAmbulance.driver_phone,
        estimated_arrival: estimatedArrival,
        eta_minutes: etaMinutes,
        score: selectedAmbulance.score
      });
      
      res.json({
        success: true,
        data: {
          assignment_id: assignmentResult.rows[0].id,
          emergency_id,
          ambulance_id: selectedAmbulance.id,
          driver_name: selectedAmbulance.driver_name,
          driver_phone: selectedAmbulance.driver_phone,
          estimated_arrival: estimatedArrival,
          eta_minutes: etaMinutes,
          score: selectedAmbulance.score,
          alternatives: candidates.slice(1).map(c => ({
            ambulance_id: c.id,
            score: c.score,
            distance_km: c.distance_km
          }))
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Dispatch assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign ambulance'
    });
  }
});

// Get dispatch status
app.get('/api/dispatch/status/:emergency_id', async (req, res) => {
  try {
    const { emergency_id } = req.params;
    
    const query = `
      SELECT 
        da.*, er.status as emergency_status, er.priority_level,
        a.license_plate, a.equipment_level,
        d.name as driver_name, d.phone as driver_phone,
        h.name as hospital_name
      FROM dispatch_assignments da
      JOIN emergency_requests er ON da.emergency_request_id = er.id
      LEFT JOIN ambulances a ON da.ambulance_id = a.id
      LEFT JOIN drivers d ON da.driver_id = d.id
      LEFT JOIN hospitals h ON a.hospital_id = h.id
      WHERE da.emergency_request_id = $1
    `;
    
    const result = await pool.query(query, [emergency_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch assignment not found'
      });
    }
    
    const assignment = result.rows[0];
    
    res.json({
      success: true,
      data: {
        assignment_id: assignment.id,
        emergency_id: assignment.emergency_request_id,
        emergency_status: assignment.emergency_status,
        priority_level: assignment.priority_level,
        ambulance: {
          id: assignment.ambulance_id,
          license_plate: assignment.license_plate,
          equipment_level: assignment.equipment_level
        },
        driver: {
          name: assignment.driver_name,
          phone: assignment.driver_phone
        },
        hospital: {
          name: assignment.hospital_name
        },
        status: assignment.status,
        estimated_arrival: assignment.estimated_arrival,
        actual_arrival: assignment.actual_arrival,
        assigned_at: assignment.assigned_at
      }
    });
    
  } catch (error) {
    console.error('Get dispatch status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dispatch status'
    });
  }
});

// Update dispatch status
app.put('/api/dispatch/status/:assignment_id', async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const { status, notes } = req.body;
    
    const validStatuses = ['ASSIGNED', 'EN_ROUTE', 'AT_PATIENT', 'TRANSPORTING', 'COMPLETED'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update dispatch assignment
      const updateAssignmentQuery = `
        UPDATE dispatch_assignments 
        SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      
      const assignmentResult = await client.query(updateAssignmentQuery, [status, notes, assignment_id]);
      
      if (assignmentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Dispatch assignment not found'
        });
      }
      
      const assignment = assignmentResult.rows[0];
      
      // Update ambulance status
      const ambulanceStatusMap = {
        'EN_ROUTE': 'ON_ROUTE',
        'AT_PATIENT': 'AT_PATIENT',
        'TRANSPORTING': 'TRANSPORTING',
        'COMPLETED': 'AVAILABLE'
      };
      
      if (ambulanceStatusMap[status]) {
        const updateAmbulanceQuery = `
          UPDATE ambulances 
          SET status = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `;
        
        await client.query(updateAmbulanceQuery, [ambulanceStatusMap[status], assignment.ambulance_id]);
      }
      
      // Update emergency request status
      const emergencyStatusMap = {
        'EN_ROUTE': 'ASSIGNED',
        'AT_PATIENT': 'IN_PROGRESS',
        'TRANSPORTING': 'IN_PROGRESS',
        'COMPLETED': 'COMPLETED'
      };
      
      if (emergencyStatusMap[status]) {
        const updateEmergencyQuery = `
          UPDATE emergency_requests 
          SET status = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `;
        
        await client.query(updateEmergencyQuery, [emergencyStatusMap[status], assignment.emergency_request_id]);
      }
      
      await client.query('COMMIT');
      
      // Emit real-time update
      io.emit('dispatch_status_update', {
        assignment_id,
        emergency_id: assignment.emergency_request_id,
        status,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: {
          assignment_id,
          status,
          updated_at: new Date().toISOString()
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Update dispatch status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dispatch status'
    });
  }
});

// Get dispatch analytics
app.get('/api/dispatch/analytics', async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    let timeFilter = '';
    switch (period) {
      case '1h':
        timeFilter = "AND da.assigned_at >= NOW() - INTERVAL '1 hour'";
        break;
      case '24h':
        timeFilter = "AND da.assigned_at >= NOW() - INTERVAL '24 hours'";
        break;
      case '7d':
        timeFilter = "AND da.assigned_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeFilter = "AND da.assigned_at >= NOW() - INTERVAL '30 days'";
        break;
    }
    
    const query = `
      SELECT 
        COUNT(*) as total_assignments,
        COUNT(CASE WHEN da.status = 'COMPLETED' THEN 1 END) as completed_assignments,
        AVG(EXTRACT(EPOCH FROM (da.actual_arrival - da.assigned_at))/60) as avg_response_time_minutes,
        COUNT(CASE WHEN er.priority_level = 1 THEN 1 END) as critical_emergencies,
        COUNT(CASE WHEN er.priority_level = 2 THEN 1 END) as high_emergencies,
        COUNT(CASE WHEN er.priority_level = 3 THEN 1 END) as medium_emergencies,
        COUNT(CASE WHEN er.priority_level = 4 THEN 1 END) as low_emergencies
      FROM dispatch_assignments da
      JOIN emergency_requests er ON da.emergency_request_id = er.id
      WHERE 1=1 ${timeFilter}
    `;
    
    const result = await pool.query(query);
    const analytics = result.rows[0];
    
    res.json({
      success: true,
      data: {
        period,
        total_assignments: parseInt(analytics.total_assignments),
        completed_assignments: parseInt(analytics.completed_assignments),
        completion_rate: analytics.total_assignments > 0 ? 
          ((analytics.completed_assignments / analytics.total_assignments) * 100).toFixed(2) : 0,
        avg_response_time_minutes: analytics.avg_response_time_minutes ? 
          parseFloat(analytics.avg_response_time_minutes).toFixed(2) : 0,
        priority_breakdown: {
          critical: parseInt(analytics.critical_emergencies),
          high: parseInt(analytics.high_emergencies),
          medium: parseInt(analytics.medium_emergencies),
          low: parseInt(analytics.low_emergencies)
        }
      }
    });
    
  } catch (error) {
    console.error('Get dispatch analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dispatch analytics'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Aapat Dispatch Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Dispatch service client connected:', socket.id);
  
  socket.on('join_dispatch', (emergencyId) => {
    socket.join(`dispatch_${emergencyId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Dispatch service client disconnected:', socket.id);
  });
});

// Background job to monitor dispatch performance
cron.schedule('*/5 * * * *', async () => {
  try {
    // Check for overdue assignments
    const overdueQuery = `
      SELECT da.*, er.priority_level
      FROM dispatch_assignments da
      JOIN emergency_requests er ON da.emergency_request_id = er.id
      WHERE da.status IN ('ASSIGNED', 'EN_ROUTE')
        AND da.estimated_arrival < NOW() - INTERVAL '10 minutes'
    `;
    
    const overdueResult = await pool.query(overdueQuery);
    
    if (overdueResult.rows.length > 0) {
      console.log(`Found ${overdueResult.rows.length} overdue assignments`);
      
      // Emit alert for overdue assignments
      io.emit('overdue_assignments', {
        count: overdueResult.rows.length,
        assignments: overdueResult.rows.map(row => ({
          assignment_id: row.id,
          emergency_id: row.emergency_request_id,
          priority_level: row.priority_level,
          estimated_arrival: row.estimated_arrival
        }))
      });
    }
  } catch (error) {
    console.error('Background job error:', error);
  }
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`🚑 Aapat Dispatch Service running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
