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

// Ambulance status constants
const AMBULANCE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  ASSIGNED: 'ASSIGNED',
  ON_ROUTE: 'ON_ROUTE',
  AT_PATIENT: 'AT_PATIENT',
  TRANSPORTING: 'TRANSPORTING',
  AT_HOSPITAL: 'AT_HOSPITAL',
  OFFLINE: 'OFFLINE',
  MAINTENANCE: 'MAINTENANCE'
};

const EQUIPMENT_LEVELS = {
  BASIC: 'BASIC',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
  CRITICAL_CARE: 'CRITICAL_CARE'
};

// Validation schemas
const updateLocationSchema = Joi.object({
  ambulance_id: Joi.string().uuid().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  heading: Joi.number().min(0).max(360).optional(),
  speed: Joi.number().min(0).optional()
});

const updateStatusSchema = Joi.object({
  ambulance_id: Joi.string().uuid().required(),
  status: Joi.string().valid(...Object.values(AMBULANCE_STATUS)).required(),
  fuel_level: Joi.number().min(0).max(100).optional(),
  notes: Joi.string().max(500).optional()
});

// Get all ambulances with real-time status
app.get('/api/ambulances', async (req, res) => {
  try {
    const { status, hospital_id, equipment_level } = req.query;
    
    let query = `
      SELECT 
        a.id, a.license_plate, a.status, a.equipment_level, a.equipment_list,
        a.fuel_level, a.mileage, a.last_maintenance, a.next_maintenance,
        a.current_location, ST_X(a.current_location) as lng, ST_Y(a.current_location) as lat,
        d.name as driver_name, d.phone as driver_phone, d.rating as driver_rating,
        h.name as hospital_name, h.address as hospital_address
      FROM ambulances a
      LEFT JOIN drivers d ON a.driver_id = d.id
      LEFT JOIN hospitals h ON a.hospital_id = h.id
      WHERE a.is_active = true
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (hospital_id) {
      query += ` AND a.hospital_id = $${paramCount}`;
      params.push(hospital_id);
      paramCount++;
    }
    
    if (equipment_level) {
      query += ` AND a.equipment_level = $${paramCount}`;
      params.push(equipment_level);
      paramCount++;
    }
    
    query += ' ORDER BY a.created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows.map(ambulance => ({
        ...ambulance,
        current_location: {
          lat: ambulance.lat,
          lng: ambulance.lng
        }
      }))
    });
    
  } catch (error) {
    console.error('Get ambulances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ambulances'
    });
  }
});

// Get ambulance by ID
app.get('/api/ambulances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        a.*, ST_X(a.current_location) as lng, ST_Y(a.current_location) as lat,
        d.name as driver_name, d.phone as driver_phone, d.rating as driver_rating,
        d.certifications as driver_certifications,
        h.name as hospital_name, h.address as hospital_address, h.phone as hospital_phone
      FROM ambulances a
      LEFT JOIN drivers d ON a.driver_id = d.id
      LEFT JOIN hospitals h ON a.hospital_id = h.id
      WHERE a.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }
    
    const ambulance = result.rows[0];
    
    res.json({
      success: true,
      data: {
        ...ambulance,
        current_location: {
          lat: ambulance.lat,
          lng: ambulance.lng
        }
      }
    });
    
  } catch (error) {
    console.error('Get ambulance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ambulance details'
    });
  }
});

// Update ambulance location
app.put('/api/ambulances/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, heading, speed } = req.body;
    
    // Validate input
    const { error } = updateLocationSchema.validate({
      ambulance_id: id,
      latitude,
      longitude,
      heading,
      speed
    });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update location in database
      const updateQuery = `
        UPDATE ambulances 
        SET current_location = ST_Point($1, $2), updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND is_active = true
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [longitude, latitude, id]);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Ambulance not found'
        });
      }
      
      await client.query('COMMIT');
      
      // Cache location in Redis for real-time tracking
      const locationData = {
        ambulance_id: id,
        latitude,
        longitude,
        heading: heading || null,
        speed: speed || null,
        timestamp: new Date().toISOString()
      };
      
      await redisClient.setEx(
        `ambulance_location:${id}`,
        300, // 5 minutes TTL
        JSON.stringify(locationData)
      );
      
      // Emit real-time location update
      io.emit('ambulance_location_update', locationData);
      
      res.json({
        success: true,
        data: {
          ambulance_id: id,
          location: { lat: latitude, lng: longitude },
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
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ambulance location'
    });
  }
});

// Update ambulance status
app.put('/api/ambulances/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, fuel_level, notes } = req.body;
    
    // Validate input
    const { error } = updateStatusSchema.validate({
      ambulance_id: id,
      status,
      fuel_level,
      notes
    });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      let updateQuery = 'UPDATE ambulances SET status = $1, updated_at = CURRENT_TIMESTAMP';
      const params = [status, id];
      let paramCount = 2;
      
      if (fuel_level !== undefined) {
        updateQuery += `, fuel_level = $${paramCount}`;
        params.splice(paramCount - 1, 0, fuel_level);
        paramCount++;
      }
      
      updateQuery += ' WHERE id = $' + paramCount + ' AND is_active = true RETURNING *';
      
      const result = await client.query(updateQuery, params);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Ambulance not found'
        });
      }
      
      await client.query('COMMIT');
      
      // Emit real-time status update
      io.emit('ambulance_status_update', {
        ambulance_id: id,
        status,
        fuel_level,
        notes,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: {
          ambulance_id: id,
          status,
          fuel_level,
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
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ambulance status'
    });
  }
});

// Get available ambulances near location
app.get('/api/ambulances/available/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, equipment_level } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    let query = `
      SELECT 
        a.id, a.license_plate, a.equipment_level, a.equipment_list,
        a.fuel_level, ST_X(a.current_location) as lng, ST_Y(a.current_location) as lat,
        ST_Distance(a.current_location, ST_Point($1, $2)) as distance_meters,
        d.name as driver_name, d.phone as driver_phone, d.rating as driver_rating,
        h.name as hospital_name
      FROM ambulances a
      LEFT JOIN drivers d ON a.driver_id = d.id
      LEFT JOIN hospitals h ON a.hospital_id = h.id
      WHERE a.is_active = true 
        AND a.status = 'AVAILABLE'
        AND a.current_location IS NOT NULL
        AND ST_DWithin(a.current_location, ST_Point($1, $2), $3 * 1000)
    `;
    
    const params = [longitude, latitude, radius];
    let paramCount = 3;
    
    if (equipment_level) {
      query += ` AND a.equipment_level = $${paramCount + 1}`;
      params.push(equipment_level);
    }
    
    query += ' ORDER BY distance_meters ASC LIMIT 10';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows.map(ambulance => ({
        ...ambulance,
        current_location: {
          lat: ambulance.lat,
          lng: ambulance.lng
        },
        distance_km: (ambulance.distance_meters / 1000).toFixed(2)
      }))
    });
    
  } catch (error) {
    console.error('Get nearby ambulances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby ambulances'
    });
  }
});

// Get ambulance maintenance schedule
app.get('/api/ambulances/:id/maintenance', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        license_plate, last_maintenance, next_maintenance, mileage,
        equipment_level, fuel_level
      FROM ambulances 
      WHERE id = $1 AND is_active = true
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }
    
    const ambulance = result.rows[0];
    const today = new Date();
    const nextMaintenance = new Date(ambulance.next_maintenance);
    const daysUntilMaintenance = Math.ceil((nextMaintenance - today) / (1000 * 60 * 60 * 24));
    
    res.json({
      success: true,
      data: {
        ...ambulance,
        days_until_maintenance: daysUntilMaintenance,
        maintenance_due: daysUntilMaintenance <= 7
      }
    });
    
  } catch (error) {
    console.error('Get maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance information'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Aapat Ambulance Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Ambulance service client connected:', socket.id);
  
  socket.on('join_ambulance', (ambulanceId) => {
    socket.join(`ambulance_${ambulanceId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Ambulance service client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`🚑 Aapat Ambulance Service running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
