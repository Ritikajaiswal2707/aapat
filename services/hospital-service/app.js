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
    methods: ["GET", "POST", "PUT", "DELETE"]
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

// Hospital status constants
const HOSPITAL_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  OVERLOADED: 'OVERLOADED'
};

const EQUIPMENT_LEVELS = {
  BASIC: 'BASIC',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
  CRITICAL_CARE: 'CRITICAL_CARE'
};

// Validation schemas
const hospitalSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  address: Joi.string().min(5).max(500).required(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  emergency_contact: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  specializations: Joi.array().items(Joi.string()).default([]),
  total_beds: Joi.number().min(0).default(0),
  available_beds: Joi.number().min(0).default(0),
  icu_beds: Joi.number().min(0).default(0),
  available_icu_beds: Joi.number().min(0).default(0),
  equipment_level: Joi.string().valid(...Object.values(EQUIPMENT_LEVELS)).default('BASIC'),
  is_active: Joi.boolean().default(true)
});

const departmentSchema = Joi.object({
  hospital_id: Joi.string().uuid().required(),
  name: Joi.string().min(2).max(100).required(),
  capacity: Joi.number().min(0).default(0),
  available_capacity: Joi.number().min(0).default(0),
  specialization: Joi.string().max(100).optional(),
  is_active: Joi.boolean().default(true)
});

const bedUpdateSchema = Joi.object({
  hospital_id: Joi.string().uuid().required(),
  total_beds: Joi.number().min(0).optional(),
  available_beds: Joi.number().min(0).optional(),
  icu_beds: Joi.number().min(0).optional(),
  available_icu_beds: Joi.number().min(0).optional(),
  notes: Joi.string().max(500).optional()
});

// Get all hospitals
app.get('/api/hospitals', async (req, res) => {
  try {
    const { status, specialization, equipment_level, has_available_beds } = req.query;
    
    let query = `
      SELECT 
        h.*, ST_X(h.location) as lng, ST_Y(h.location) as lat,
        COUNT(hd.id) as department_count,
        COALESCE(SUM(hd.available_capacity), 0) as total_available_department_capacity
      FROM hospitals h
      LEFT JOIN hospital_departments hd ON h.id = hd.hospital_id AND hd.is_active = true
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND h.is_active = $${paramCount}`;
      params.push(status === 'ACTIVE');
      paramCount++;
    }
    
    if (specialization) {
      query += ` AND h.specializations @> $${paramCount}`;
      params.push(JSON.stringify([specialization]));
      paramCount++;
    }
    
    if (equipment_level) {
      query += ` AND h.equipment_level = $${paramCount}`;
      params.push(equipment_level);
      paramCount++;
    }
    
    if (has_available_beds === 'true') {
      query += ` AND h.available_beds > 0`;
    }
    
    query += ` GROUP BY h.id ORDER BY h.name`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows.map(hospital => ({
        ...hospital,
        location: {
          lat: hospital.lat,
          lng: hospital.lng
        },
        specializations: Array.isArray(hospital.specializations) ? hospital.specializations : [],
        capacity_utilization: hospital.total_beds > 0 ? 
          ((hospital.total_beds - hospital.available_beds) / hospital.total_beds * 100).toFixed(1) : 0,
        icu_utilization: hospital.icu_beds > 0 ? 
          ((hospital.icu_beds - hospital.available_icu_beds) / hospital.icu_beds * 100).toFixed(1) : 0
      }))
    });
    
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hospitals'
    });
  }
});

// Get hospital by ID
app.get('/api/hospitals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        h.*, ST_X(h.location) as lng, ST_Y(h.location) as lat
      FROM hospitals h
      WHERE h.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    const hospital = result.rows[0];
    
    // Get departments
    const departmentsQuery = `
      SELECT * FROM hospital_departments 
      WHERE hospital_id = $1 AND is_active = true
      ORDER BY name
    `;
    
    const departmentsResult = await pool.query(departmentsQuery, [id]);
    
    res.json({
      success: true,
      data: {
        ...hospital,
        location: {
          lat: hospital.lat,
          lng: hospital.lng
        },
        specializations: Array.isArray(hospital.specializations) ? hospital.specializations : [],
        departments: departmentsResult.rows,
        capacity_utilization: hospital.total_beds > 0 ? 
          ((hospital.total_beds - hospital.available_beds) / hospital.total_beds * 100).toFixed(1) : 0,
        icu_utilization: hospital.icu_beds > 0 ? 
          ((hospital.icu_beds - hospital.available_icu_beds) / hospital.icu_beds * 100).toFixed(1) : 0
      }
    });
    
  } catch (error) {
    console.error('Get hospital error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hospital details'
    });
  }
});

// Create new hospital
app.post('/api/hospitals', async (req, res) => {
  try {
    const { error, value } = hospitalSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const {
      name, address, location, phone, emergency_contact,
      specializations, total_beds, available_beds, icu_beds,
      available_icu_beds, equipment_level, is_active
    } = value;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO hospitals (
          name, address, location, phone, emergency_contact,
          specializations, total_beds, available_beds, icu_beds,
          available_icu_beds, equipment_level, is_active
        ) VALUES ($1, $2, ST_Point($3, $4), $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *, ST_X(location) as lng, ST_Y(location) as lat
      `;
      
      const values = [
        name, address, location.longitude, location.latitude,
        phone, emergency_contact, JSON.stringify(specializations),
        total_beds, available_beds, icu_beds, available_icu_beds,
        equipment_level, is_active
      ];
      
      const result = await client.query(query, values);
      const hospital = result.rows[0];
      
      await client.query('COMMIT');
      
      // Cache hospital data
      await redisClient.setEx(
        `hospital:${hospital.id}`,
        3600, // 1 hour TTL
        JSON.stringify({
          id: hospital.id,
          name: hospital.name,
          available_beds: hospital.available_beds,
          available_icu_beds: hospital.available_icu_beds,
          equipment_level: hospital.equipment_level
        })
      );
      
      // Emit real-time notification
      io.emit('hospital_created', {
        id: hospital.id,
        name: hospital.name,
        address: hospital.address,
        available_beds: hospital.available_beds,
        equipment_level: hospital.equipment_level,
        timestamp: new Date()
      });
      
      res.status(201).json({
        success: true,
        data: {
          ...hospital,
          location: {
            lat: hospital.lat,
            lng: hospital.lng
          },
          specializations: Array.isArray(hospital.specializations) ? hospital.specializations : []
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Create hospital error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create hospital'
    });
  }
});

// Update hospital
app.put('/api/hospitals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Validate update data
    const { error } = hospitalSchema.validate(updateData, { allowUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      Object.keys(updateData).forEach(key => {
        if (key === 'location') {
          updateFields.push(`location = ST_Point($${paramCount}, $${paramCount + 1})`);
          values.push(updateData[key].longitude, updateData[key].latitude);
          paramCount += 2;
        } else if (key === 'specializations') {
          updateFields.push(`specializations = $${paramCount}`);
          values.push(JSON.stringify(updateData[key]));
          paramCount++;
        } else {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);
      
      const query = `
        UPDATE hospitals 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *, ST_X(location) as lng, ST_Y(location) as lat
      `;
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Hospital not found'
        });
      }
      
      await client.query('COMMIT');
      
      const hospital = result.rows[0];
      
      // Update cache
      await redisClient.setEx(
        `hospital:${hospital.id}`,
        3600,
        JSON.stringify({
          id: hospital.id,
          name: hospital.name,
          available_beds: hospital.available_beds,
          available_icu_beds: hospital.available_icu_beds,
          equipment_level: hospital.equipment_level
        })
      );
      
      // Emit real-time update
      io.emit('hospital_updated', {
        id: hospital.id,
        name: hospital.name,
        available_beds: hospital.available_beds,
        available_icu_beds: hospital.available_icu_beds,
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        data: {
          ...hospital,
          location: {
            lat: hospital.lat,
            lng: hospital.lng
          },
          specializations: Array.isArray(hospital.specializations) ? hospital.specializations : []
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Update hospital error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hospital'
    });
  }
});

// Update bed availability
app.put('/api/hospitals/:id/beds', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = bedUpdateSchema.validate({
      hospital_id: id,
      ...req.body
    });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    const { total_beds, available_beds, icu_beds, available_icu_beds, notes } = value;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      if (total_beds !== undefined) {
        updateFields.push(`total_beds = $${paramCount}`);
        values.push(total_beds);
        paramCount++;
      }
      
      if (available_beds !== undefined) {
        updateFields.push(`available_beds = $${paramCount}`);
        values.push(available_beds);
        paramCount++;
      }
      
      if (icu_beds !== undefined) {
        updateFields.push(`icu_beds = $${paramCount}`);
        values.push(icu_beds);
        paramCount++;
      }
      
      if (available_icu_beds !== undefined) {
        updateFields.push(`available_icu_beds = $${paramCount}`);
        values.push(available_icu_beds);
        paramCount++;
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);
      
      const query = `
        UPDATE hospitals 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *, ST_X(location) as lng, ST_Y(location) as lat
      `;
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Hospital not found'
        });
      }
      
      await client.query('COMMIT');
      
      const hospital = result.rows[0];
      
      // Update cache
      await redisClient.setEx(
        `hospital:${hospital.id}`,
        3600,
        JSON.stringify({
          id: hospital.id,
          name: hospital.name,
          available_beds: hospital.available_beds,
          available_icu_beds: hospital.available_icu_beds,
          equipment_level: hospital.equipment_level
        })
      );
      
      // Emit real-time bed update
      io.emit('bed_availability_update', {
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        available_beds: hospital.available_beds,
        available_icu_beds: hospital.available_icu_beds,
        total_beds: hospital.total_beds,
        icu_beds: hospital.icu_beds,
        notes,
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        data: {
          hospital_id: hospital.id,
          available_beds: hospital.available_beds,
          available_icu_beds: hospital.available_icu_beds,
          total_beds: hospital.total_beds,
          icu_beds: hospital.icu_beds,
          capacity_utilization: hospital.total_beds > 0 ? 
            ((hospital.total_beds - hospital.available_beds) / hospital.total_beds * 100).toFixed(1) : 0,
          icu_utilization: hospital.icu_beds > 0 ? 
            ((hospital.icu_beds - hospital.available_icu_beds) / hospital.icu_beds * 100).toFixed(1) : 0,
          updated_at: hospital.updated_at
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Update beds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bed availability'
    });
  }
});

// Get hospitals with available beds near location
app.get('/api/hospitals/available/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 50, bed_type = 'general', specialization } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    let query = `
      SELECT 
        h.*, ST_X(h.location) as lng, ST_Y(h.location) as lat,
        ST_Distance(h.location, ST_Point($1, $2)) as distance_meters
      FROM hospitals h
      WHERE h.is_active = true
        AND h.current_location IS NOT NULL
        AND ST_DWithin(h.location, ST_Point($1, $2), $3 * 1000)
    `;
    
    const params = [longitude, latitude, radius];
    let paramCount = 3;
    
    if (bed_type === 'icu') {
      query += ` AND h.available_icu_beds > 0`;
    } else {
      query += ` AND h.available_beds > 0`;
    }
    
    if (specialization) {
      query += ` AND h.specializations @> $${paramCount + 1}`;
      params.push(JSON.stringify([specialization]));
    }
    
    query += ` ORDER BY distance_meters ASC LIMIT 10`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows.map(hospital => ({
        ...hospital,
        location: {
          lat: hospital.lat,
          lng: hospital.lng
        },
        specializations: Array.isArray(hospital.specializations) ? hospital.specializations : [],
        distance_km: (hospital.distance_meters / 1000).toFixed(2),
        capacity_utilization: hospital.total_beds > 0 ? 
          ((hospital.total_beds - hospital.available_beds) / hospital.total_beds * 100).toFixed(1) : 0,
        icu_utilization: hospital.icu_beds > 0 ? 
          ((hospital.icu_beds - hospital.available_icu_beds) / hospital.icu_beds * 100).toFixed(1) : 0
      }))
    });
    
  } catch (error) {
    console.error('Get nearby hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby hospitals'
    });
  }
});

// Department management
app.post('/api/hospitals/:id/departments', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = departmentSchema.validate({
      hospital_id: id,
      ...req.body
    });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    const { name, capacity, available_capacity, specialization, is_active } = value;
    
    const query = `
      INSERT INTO hospital_departments (
        hospital_id, name, capacity, available_capacity, specialization, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      id, name, capacity, available_capacity, specialization, is_active
    ]);
    
    const department = result.rows[0];
    
    // Emit real-time notification
    io.emit('department_created', {
      hospital_id: id,
      department: department,
      timestamp: new Date()
    });
    
    res.status(201).json({
      success: true,
      data: department
    });
    
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department'
    });
  }
});

// Get hospital analytics
app.get('/api/hospitals/analytics', async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    let timeFilter = '';
    switch (period) {
      case '1h':
        timeFilter = "AND h.updated_at >= NOW() - INTERVAL '1 hour'";
        break;
      case '24h':
        timeFilter = "AND h.updated_at >= NOW() - INTERVAL '24 hours'";
        break;
      case '7d':
        timeFilter = "AND h.updated_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeFilter = "AND h.updated_at >= NOW() - INTERVAL '30 days'";
        break;
    }
    
    const query = `
      SELECT 
        COUNT(*) as total_hospitals,
        COUNT(CASE WHEN h.is_active = true THEN 1 END) as active_hospitals,
        SUM(h.total_beds) as total_beds,
        SUM(h.available_beds) as available_beds,
        SUM(h.icu_beds) as total_icu_beds,
        SUM(h.available_icu_beds) as available_icu_beds,
        AVG(CASE WHEN h.total_beds > 0 THEN 
          ((h.total_beds - h.available_beds) / h.total_beds * 100) 
        END) as avg_capacity_utilization,
        AVG(CASE WHEN h.icu_beds > 0 THEN 
          ((h.icu_beds - h.available_icu_beds) / h.icu_beds * 100) 
        END) as avg_icu_utilization
      FROM hospitals h
      WHERE 1=1 ${timeFilter}
    `;
    
    const result = await pool.query(query);
    const analytics = result.rows[0];
    
    res.json({
      success: true,
      data: {
        period,
        total_hospitals: parseInt(analytics.total_hospitals),
        active_hospitals: parseInt(analytics.active_hospitals),
        total_beds: parseInt(analytics.total_beds),
        available_beds: parseInt(analytics.available_beds),
        total_icu_beds: parseInt(analytics.total_icu_beds),
        available_icu_beds: parseInt(analytics.available_icu_beds),
        bed_utilization: analytics.total_beds > 0 ? 
          ((analytics.total_beds - analytics.available_beds) / analytics.total_beds * 100).toFixed(1) : 0,
        icu_utilization: analytics.total_icu_beds > 0 ? 
          ((analytics.total_icu_beds - analytics.available_icu_beds) / analytics.total_icu_beds * 100).toFixed(1) : 0,
        avg_capacity_utilization: analytics.avg_capacity_utilization ? 
          parseFloat(analytics.avg_capacity_utilization).toFixed(1) : 0,
        avg_icu_utilization: analytics.avg_icu_utilization ? 
          parseFloat(analytics.avg_icu_utilization).toFixed(1) : 0
      }
    });
    
  } catch (error) {
    console.error('Get hospital analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hospital analytics'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Aapat Hospital Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Hospital service client connected:', socket.id);
  
  socket.on('join_hospital', (hospitalId) => {
    socket.join(`hospital_${hospitalId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Hospital service client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
  console.log(`🏥 Aapat Hospital Service running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});