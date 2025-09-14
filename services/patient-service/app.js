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
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Validation schemas
const patientSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  name: Joi.string().min(2).max(100).required(),
  date_of_birth: Joi.date().max('now').optional(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional(),
  blood_type: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
  medical_history: Joi.array().items(Joi.string()).default([]),
  allergies: Joi.array().items(Joi.string()).default([]),
  emergency_contacts: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    relation: Joi.string().required()
  })).default([]),
  insurance_info: Joi.object().default({}),
  address: Joi.string().max(500).optional()
});

const emergencyContactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  relation: Joi.string().min(2).max(50).required()
});

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Create or update patient profile
app.post('/api/patients', async (req, res) => {
  try {
    const { error, value } = patientSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if patient already exists
      const existingQuery = 'SELECT id FROM patients WHERE phone = $1';
      const existingResult = await client.query(existingQuery, [value.phone]);
      
      let patient;
      
      if (existingResult.rows.length > 0) {
        // Update existing patient
        const updateQuery = `
          UPDATE patients 
          SET name = $1, date_of_birth = $2, gender = $3, blood_type = $4,
              medical_history = $5, allergies = $6, emergency_contacts = $7,
              insurance_info = $8, address = $9, updated_at = CURRENT_TIMESTAMP
          WHERE phone = $10
          RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, [
          value.name, value.date_of_birth, value.gender, value.blood_type,
          JSON.stringify(value.medical_history),
          JSON.stringify(value.allergies),
          JSON.stringify(value.emergency_contacts),
          JSON.stringify(value.insurance_info),
          value.address,
          value.phone
        ]);
        
        patient = updateResult.rows[0];
      } else {
        // Create new patient
        const insertQuery = `
          INSERT INTO patients (
            phone, name, date_of_birth, gender, blood_type,
            medical_history, allergies, emergency_contacts, insurance_info, address
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `;
        
        const insertResult = await client.query(insertQuery, [
          value.phone, value.name, value.date_of_birth, value.gender, value.blood_type,
          JSON.stringify(value.medical_history),
          JSON.stringify(value.allergies),
          JSON.stringify(value.emergency_contacts),
          JSON.stringify(value.insurance_info),
          value.address
        ]);
        
        patient = insertResult.rows[0];
      }
      
      await client.query('COMMIT');
      
      // Cache patient data
      await redisClient.setEx(
        `patient:${patient.id}`,
        3600, // 1 hour TTL
        JSON.stringify(patient)
      );
      
      res.status(201).json({
        success: true,
        data: {
          id: patient.id,
          phone: patient.phone,
          name: patient.name,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          blood_type: patient.blood_type,
          medical_history: JSON.parse(patient.medical_history || '[]'),
          allergies: JSON.parse(patient.allergies || '[]'),
          emergency_contacts: JSON.parse(patient.emergency_contacts || '[]'),
          insurance_info: JSON.parse(patient.insurance_info || '{}'),
          address: patient.address,
          created_at: patient.created_at,
          updated_at: patient.updated_at
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Create/update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update patient profile'
    });
  }
});

// Get patient by ID or phone
app.get('/api/patients/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Check cache first
    const cached = await redisClient.get(`patient:${identifier}`);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached)
      });
    }
    
    // Determine if identifier is UUID or phone
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
    
    const query = isUUID 
      ? 'SELECT * FROM patients WHERE id = $1'
      : 'SELECT * FROM patients WHERE phone = $1';
    
    const result = await pool.query(query, [identifier]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const patient = result.rows[0];
    const patientData = {
      id: patient.id,
      phone: patient.phone,
      name: patient.name,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      blood_type: patient.blood_type,
      medical_history: JSON.parse(patient.medical_history || '[]'),
      allergies: JSON.parse(patient.allergies || '[]'),
      emergency_contacts: JSON.parse(patient.emergency_contacts || '[]'),
      insurance_info: JSON.parse(patient.insurance_info || '{}'),
      address: patient.address,
      created_at: patient.created_at,
      updated_at: patient.updated_at
    };
    
    // Cache the result
    await redisClient.setEx(
      `patient:${patient.id}`,
      3600,
      JSON.stringify(patientData)
    );
    
    res.json({
      success: true,
      data: patientData
    });
    
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient details'
    });
  }
});

// Update patient medical history
app.put('/api/patients/:id/medical-history', async (req, res) => {
  try {
    const { id } = req.params;
    const { medical_history, allergies } = req.body;
    
    if (!Array.isArray(medical_history) && !Array.isArray(allergies)) {
      return res.status(400).json({
        success: false,
        message: 'Medical history and allergies must be arrays'
      });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      let updateQuery = 'UPDATE patients SET updated_at = CURRENT_TIMESTAMP';
      const params = [id];
      let paramCount = 1;
      
      if (medical_history) {
        updateQuery += `, medical_history = $${paramCount + 1}`;
        params.splice(paramCount, 0, JSON.stringify(medical_history));
        paramCount++;
      }
      
      if (allergies) {
        updateQuery += `, allergies = $${paramCount + 1}`;
        params.splice(paramCount, 0, JSON.stringify(allergies));
        paramCount++;
      }
      
      updateQuery += ` WHERE id = $1 RETURNING *`;
      
      const result = await client.query(updateQuery, params);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }
      
      await client.query('COMMIT');
      
      // Clear cache
      await redisClient.del(`patient:${id}`);
      
      res.json({
        success: true,
        data: {
          id: result.rows[0].id,
          medical_history: JSON.parse(result.rows[0].medical_history || '[]'),
          allergies: JSON.parse(result.rows[0].allergies || '[]'),
          updated_at: result.rows[0].updated_at
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Update medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update medical history'
    });
  }
});

// Add emergency contact
app.post('/api/patients/:id/emergency-contacts', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = emergencyContactSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current emergency contacts
      const getQuery = 'SELECT emergency_contacts FROM patients WHERE id = $1';
      const getResult = await client.query(getQuery, [id]);
      
      if (getResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }
      
      const currentContacts = JSON.parse(getResult.rows[0].emergency_contacts || '[]');
      currentContacts.push(value);
      
      // Update emergency contacts
      const updateQuery = `
        UPDATE patients 
        SET emergency_contacts = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING emergency_contacts
      `;
      
      const updateResult = await client.query(updateQuery, [JSON.stringify(currentContacts), id]);
      
      await client.query('COMMIT');
      
      // Clear cache
      await redisClient.del(`patient:${id}`);
      
      res.json({
        success: true,
        data: {
          emergency_contacts: JSON.parse(updateResult.rows[0].emergency_contacts)
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Add emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add emergency contact'
    });
  }
});

// Get patient emergency history
app.get('/api/patients/:id/emergency-history', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    const query = `
      SELECT 
        er.id, er.emergency_type, er.symptoms, er.priority_level,
        er.status, er.created_at, er.completed_at,
        a.license_plate, d.name as driver_name,
        h.name as hospital_name
      FROM emergency_requests er
      LEFT JOIN ambulances a ON er.assigned_ambulance_id = a.id
      LEFT JOIN drivers d ON er.assigned_driver_id = d.id
      LEFT JOIN hospitals h ON er.assigned_hospital_id = h.id
      WHERE er.patient_info->>'phone' = (SELECT phone FROM patients WHERE id = $1)
         OR er.caller_phone = (SELECT phone FROM patients WHERE id = $1)
      ORDER BY er.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [id, limit, offset]);
    
    res.json({
      success: true,
      data: result.rows.map(emergency => ({
        id: emergency.id,
        emergency_type: emergency.emergency_type,
        symptoms: emergency.symptoms,
        priority_level: emergency.priority_level,
        status: emergency.status,
        created_at: emergency.created_at,
        completed_at: emergency.completed_at,
        ambulance: {
          license_plate: emergency.license_plate
        },
        driver: {
          name: emergency.driver_name
        },
        hospital: {
          name: emergency.hospital_name
        }
      }))
    });
    
  } catch (error) {
    console.error('Get emergency history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency history'
    });
  }
});

// Search patients
app.get('/api/patients', async (req, res) => {
  try {
    const { search, limit = 20, offset = 0 } = req.query;
    
    let query = 'SELECT id, phone, name, date_of_birth, gender, blood_type FROM patients WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (search) {
      query += ` AND (name ILIKE $${paramCount + 1} OR phone ILIKE $${paramCount + 1})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    query += ` ORDER BY name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Search patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search patients'
    });
  }
});

// Get patient statistics
app.get('/api/patients/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        COUNT(*) as total_emergencies,
        COUNT(CASE WHEN er.priority_level = 1 THEN 1 END) as critical_emergencies,
        COUNT(CASE WHEN er.status = 'COMPLETED' THEN 1 END) as completed_emergencies,
        AVG(EXTRACT(EPOCH FROM (er.completed_at - er.created_at))/60) as avg_response_time_minutes
      FROM emergency_requests er
      WHERE er.patient_info->>'phone' = (SELECT phone FROM patients WHERE id = $1)
         OR er.caller_phone = (SELECT phone FROM patients WHERE id = $1)
    `;
    
    const result = await pool.query(query, [id]);
    const stats = result.rows[0];
    
    res.json({
      success: true,
      data: {
        total_emergencies: parseInt(stats.total_emergencies),
        critical_emergencies: parseInt(stats.critical_emergencies),
        completed_emergencies: parseInt(stats.completed_emergencies),
        avg_response_time_minutes: stats.avg_response_time_minutes ? 
          parseFloat(stats.avg_response_time_minutes).toFixed(2) : 0
      }
    });
    
  } catch (error) {
    console.error('Get patient stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient statistics'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Aapat Patient Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Patient service client connected:', socket.id);
  
  socket.on('join_patient', (patientId) => {
    socket.join(`patient_${patientId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Patient service client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
  console.log(`🚑 Aapat Patient Service running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
