const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const socketIo = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'aapat_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'aapat_db',
  password: process.env.DB_PASSWORD || 'aapat_password',
  port: process.env.DB_PORT || 5432,
});

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

// Create emergency request
app.post('/api/emergency/request', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      caller_phone,
      patient_info,
      location,
      address,
      emergency_type,
      symptoms,
      conscious = true,
      breathing = true
    } = req.body;

    // Determine priority based on symptoms and vitals
    let priority = PRIORITY.MEDIUM;
    
    const criticalKeywords = ['chest pain', 'heart attack', 'stroke', 'bleeding', 'unconscious', 'not breathing'];
    const highKeywords = ['accident', 'fall', 'fracture', 'severe pain'];
    
    const symptomText = (symptoms || '').toLowerCase();
    
    if (!conscious || !breathing || criticalKeywords.some(word => symptomText.includes(word))) {
      priority = PRIORITY.CRITICAL;
    } else if (highKeywords.some(word => symptomText.includes(word))) {
      priority = PRIORITY.HIGH;
    }

    await client.query('BEGIN');

    const query = `INSERT INTO emergency_requests (
      caller_phone, patient_info, location, address, 
      emergency_type, priority_level, status, symptoms
    ) VALUES ($1, $2, ST_Point($3, $4), $5, $6, $7, $8, $9)
    RETURNING *`;

    const values = [
      caller_phone,
      JSON.stringify(patient_info || {}),
      location.lng, 
      location.lat,
      address,
      emergency_type,
      priority,
      EMERGENCY_STATUS.PENDING,
      symptoms
    ];

    const emergencyResult = await client.query(query, values);
    const emergencyRequest = emergencyResult.rows[0];
    await client.query('COMMIT');

    // Emit real-time notification
    io.emit('new_emergency', {
      id: emergencyRequest.id,
      priority: priority,
      location: location,
      address: address,
      emergency_type: emergency_type,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      data: {
        emergency_id: emergencyRequest.id,
        priority: priority,
        estimated_response_time: getEstimatedResponseTime(priority),
        status: EMERGENCY_STATUS.PENDING
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