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

// Service URLs
const DISPATCH_SERVICE_URL = process.env.DISPATCH_SERVICE_URL || 'http://dispatch-service:3003';
const COMMUNICATION_SERVICE_URL = process.env.COMMUNICATION_SERVICE_URL || 'http://communication-service:3006';
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://patient-service:3005';

// Emergency Priority Levels
const PRIORITY = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4
};

const EMERGENCY_STATUS = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

// Emergency types
const EMERGENCY_TYPES = {
  CARDIAC: 'CARDIAC',
  TRAUMA: 'TRAUMA',
  RESPIRATORY: 'RESPIRATORY',
  NEUROLOGICAL: 'NEUROLOGICAL',
  PEDIATRIC: 'PEDIATRIC',
  OBSTETRIC: 'OBSTETRIC',
  PSYCHIATRIC: 'PSYCHIATRIC',
  GENERAL: 'GENERAL'
};

// Validation schemas
const emergencyRequestSchema = Joi.object({
  caller_phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  patient_info: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    age: Joi.number().min(0).max(150).optional(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional(),
    blood_type: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
    medical_history: Joi.array().items(Joi.string()).optional(),
    allergies: Joi.array().items(Joi.string()).optional()
  }).optional(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).required(),
  address: Joi.string().min(5).max(500).required(),
  emergency_type: Joi.string().valid(...Object.values(EMERGENCY_TYPES)).required(),
  symptoms: Joi.string().max(1000).optional(),
  conscious: Joi.boolean().default(true),
  breathing: Joi.boolean().default(true),
  bleeding: Joi.boolean().default(false),
  pain_level: Joi.number().min(1).max(10).optional(),
  additional_info: Joi.string().max(1000).optional()
});

// Create emergency request
app.post('/api/emergency/request', async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Validate request data
    const { error, value } = emergencyRequestSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const {
      caller_phone,
      patient_info,
      location,
      address,
      emergency_type,
      symptoms,
      conscious,
      breathing,
      bleeding,
      pain_level,
      additional_info
    } = value;

    // Advanced priority classification using AI-like algorithm
    let priority = classifyPriority({
      emergency_type,
      symptoms,
      conscious,
      breathing,
      bleeding,
      pain_level
    });

    await client.query('BEGIN');

    // Check if patient exists in database
    let patientId = null;
    if (patient_info && patient_info.name) {
      try {
        const patientResponse = await axios.post(`${PATIENT_SERVICE_URL}/api/patients`, {
          phone: caller_phone,
          ...patient_info
        });
        patientId = patientResponse.data.data.id;
      } catch (error) {
        console.log('Patient not found or created, proceeding without patient ID');
      }
    }

    const query = `INSERT INTO emergency_requests (
      caller_phone, patient_info, location, address, 
      emergency_type, priority_level, status, symptoms,
      conscious, breathing, bleeding, pain_level, additional_info
    ) VALUES ($1, $2, ST_Point($3, $4), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`;

    const values = [
      caller_phone,
      JSON.stringify(patient_info || {}),
      location.longitude, 
      location.latitude,
      address,
      emergency_type,
      priority,
      EMERGENCY_STATUS.PENDING,
      symptoms,
      conscious,
      breathing,
      bleeding,
      pain_level,
      additional_info
    ];

    const emergencyResult = await client.query(query, values);
    const emergencyRequest = emergencyResult.rows[0];
    await client.query('COMMIT');

    // Cache emergency request for quick access
    await redisClient.setEx(
      `emergency:${emergencyRequest.id}`,
      3600, // 1 hour TTL
      JSON.stringify({
        id: emergencyRequest.id,
        priority,
        status: EMERGENCY_STATUS.PENDING,
        location,
        emergency_type
      })
    );

    // Emit real-time notification
    io.emit('new_emergency', {
      id: emergencyRequest.id,
      priority: priority,
      location: location,
      address: address,
      emergency_type: emergency_type,
      patient_info: patient_info,
      timestamp: new Date()
    });

    // Send notifications
    try {
      await axios.post(`${COMMUNICATION_SERVICE_URL}/api/communication/emergency-notify`, {
        emergency_request_id: emergencyRequest.id,
        type: 'SMS',
        patient_phone: caller_phone,
        template_vars: {
          emergency_id: emergencyRequest.id,
          emergency_type: emergency_type,
          estimated_response_time: getEstimatedResponseTime(priority)
        }
      });
    } catch (error) {
      console.error('Failed to send notifications:', error.message);
    }

    // Auto-dispatch if critical
    if (priority === PRIORITY.CRITICAL) {
      try {
        await axios.post(`${DISPATCH_SERVICE_URL}/api/dispatch/assign`, {
          emergency_id: emergencyRequest.id
        });
      } catch (error) {
        console.error('Auto-dispatch failed:', error.message);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        emergency_id: emergencyRequest.id,
        priority: priority,
        estimated_response_time: getEstimatedResponseTime(priority),
        status: EMERGENCY_STATUS.PENDING,
        patient_id: patientId
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Emergency request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create emergency request'
    });
  } finally {
    client.release();
  }
});

// Get emergency status
app.get('/api/emergency/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `SELECT er.*, ST_X(er.location) as lng, ST_Y(er.location) as lat
                   FROM emergency_requests er WHERE er.id = $1`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }

    const emergency = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: emergency.id,
        status: emergency.status,
        priority_level: emergency.priority_level,
        created_at: emergency.created_at,
        location: {
          lat: emergency.lat,
          lng: emergency.lng
        },
        address: emergency.address,
        emergency_type: emergency.emergency_type
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency status'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Aapat Emergency Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Advanced priority classification algorithm
function classifyPriority(emergencyData) {
  const { emergency_type, symptoms, conscious, breathing, bleeding, pain_level } = emergencyData;
  
  let score = 0;
  
  // Base score by emergency type
  const typeScores = {
    [EMERGENCY_TYPES.CARDIAC]: 8,
    [EMERGENCY_TYPES.TRAUMA]: 7,
    [EMERGENCY_TYPES.RESPIRATORY]: 9,
    [EMERGENCY_TYPES.NEUROLOGICAL]: 8,
    [EMERGENCY_TYPES.PEDIATRIC]: 6,
    [EMERGENCY_TYPES.OBSTETRIC]: 7,
    [EMERGENCY_TYPES.PSYCHIATRIC]: 4,
    [EMERGENCY_TYPES.GENERAL]: 3
  };
  
  score += typeScores[emergency_type] || 3;
  
  // Vital signs scoring
  if (!conscious) score += 10;
  if (!breathing) score += 10;
  if (bleeding) score += 5;
  
  // Pain level scoring
  if (pain_level >= 8) score += 4;
  else if (pain_level >= 6) score += 2;
  else if (pain_level >= 4) score += 1;
  
  // Symptom-based scoring
  if (symptoms) {
    const symptomText = symptoms.toLowerCase();
    const criticalKeywords = [
      'heart attack', 'stroke', 'unconscious', 'not breathing', 'severe bleeding',
      'chest pain', 'difficulty breathing', 'seizure', 'allergic reaction'
    ];
    const highKeywords = [
      'accident', 'fall', 'fracture', 'severe pain', 'vomiting blood',
      'head injury', 'back injury', 'abdominal pain'
    ];
    
    if (criticalKeywords.some(keyword => symptomText.includes(keyword))) {
      score += 8;
    } else if (highKeywords.some(keyword => symptomText.includes(keyword))) {
      score += 4;
    }
  }
  
  // Determine priority based on total score
  if (score >= 15) return PRIORITY.CRITICAL;
  if (score >= 10) return PRIORITY.HIGH;
  if (score >= 5) return PRIORITY.MEDIUM;
  return PRIORITY.LOW;
}

function getEstimatedResponseTime(priority) {
  switch (priority) {
    case PRIORITY.CRITICAL: return '3-5 minutes';
    case PRIORITY.HIGH: return '6-10 minutes';
    case PRIORITY.MEDIUM: return '15-25 minutes';
    case PRIORITY.LOW: return '30-45 minutes';
    default: return '15-25 minutes';
  }
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_emergency', (emergencyId) => {
    socket.join(`emergency_${emergencyId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚑 Aapat Emergency Service running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});