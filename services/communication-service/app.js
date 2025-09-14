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
const twilio = require('twilio');
const admin = require('firebase-admin');
const cron = require('node-cron');

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

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || 'your-account-sid',
  process.env.TWILIO_AUTH_TOKEN || 'your-auth-token'
);

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Communication types
const COMMUNICATION_TYPES = {
  SMS: 'SMS',
  CALL: 'CALL',
  PUSH: 'PUSH',
  EMAIL: 'EMAIL'
};

// Message templates
const MESSAGE_TEMPLATES = {
  EMERGENCY_ASSIGNED: {
    SMS: '🚑 Emergency Alert: Ambulance {ambulance_plate} with driver {driver_name} is on the way. ETA: {eta_minutes} minutes. Track: {tracking_url}',
    PUSH: 'Ambulance {ambulance_plate} assigned to your emergency. ETA: {eta_minutes} minutes'
  },
  AMBULANCE_ARRIVED: {
    SMS: '✅ Your ambulance has arrived at the location. Driver: {driver_name}, Phone: {driver_phone}',
    PUSH: 'Ambulance has arrived at your location'
  },
  HOSPITAL_UPDATE: {
    SMS: '🏥 Patient update: {patient_name} has been admitted to {hospital_name}. Status: {status}',
    PUSH: 'Patient admitted to {hospital_name}'
  },
  EMERGENCY_CANCELLED: {
    SMS: '❌ Emergency request cancelled. If this was an error, please call 108 immediately.',
    PUSH: 'Emergency request cancelled'
  },
  DRIVER_NOTIFICATION: {
    SMS: '🚨 New emergency assignment: {emergency_type} at {address}. Priority: {priority}. Please respond immediately.',
    PUSH: 'New emergency assignment - {emergency_type}'
  }
};

// Validation schemas
const sendMessageSchema = Joi.object({
  type: Joi.string().valid(...Object.values(COMMUNICATION_TYPES)).required(),
  recipient_phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).when('type', {
    is: Joi.string().valid('SMS', 'CALL'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  recipient_email: Joi.string().email().when('type', {
    is: 'EMAIL',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  recipient_token: Joi.string().when('type', {
    is: 'PUSH',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  message: Joi.string().min(1).max(1000).required(),
  emergency_request_id: Joi.string().uuid().optional(),
  template: Joi.string().optional(),
  template_vars: Joi.object().optional()
});

// Send message
app.post('/api/communication/send', async (req, res) => {
  try {
    const { error, value } = sendMessageSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Log communication attempt
      const logQuery = `
        INSERT INTO communication_logs (
          emergency_request_id, type, recipient_phone, recipient_email,
          message, status
        ) VALUES ($1, $2, $3, $4, $5, 'PENDING')
        RETURNING *
      `;
      
      const logResult = await client.query(logQuery, [
        value.emergency_request_id,
        value.type,
        value.recipient_phone,
        value.recipient_email,
        value.message
      ]);
      
      const logId = logResult.rows[0].id;
      
      let deliveryResult;
      
      try {
        // Send based on type
        switch (value.type) {
          case COMMUNICATION_TYPES.SMS:
            deliveryResult = await sendSMS(value.recipient_phone, value.message);
            break;
          case COMMUNICATION_TYPES.CALL:
            deliveryResult = await makeCall(value.recipient_phone, value.message);
            break;
          case COMMUNICATION_TYPES.PUSH:
            deliveryResult = await sendPushNotification(value.recipient_token, value.message);
            break;
          case COMMUNICATION_TYPES.EMAIL:
            deliveryResult = await sendEmail(value.recipient_email, value.message);
            break;
        }
        
        // Update log with success
        await client.query(
          'UPDATE communication_logs SET status = $1, sent_at = CURRENT_TIMESTAMP, delivered_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['DELIVERED', logId]
        );
        
        await client.query('COMMIT');
        
        res.json({
          success: true,
          data: {
            log_id: logId,
            type: value.type,
            status: 'DELIVERED',
            sent_at: new Date().toISOString()
          }
        });
        
      } catch (deliveryError) {
        // Update log with failure
        await client.query(
          'UPDATE communication_logs SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['FAILED', logId]
        );
        
        await client.query('COMMIT');
        
        throw deliveryError;
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Send template message
app.post('/api/communication/send-template', async (req, res) => {
  try {
    const { 
      template, 
      recipient_phone, 
      recipient_email, 
      recipient_token, 
      type, 
      template_vars = {},
      emergency_request_id 
    } = req.body;
    
    if (!MESSAGE_TEMPLATES[template]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template'
      });
    }
    
    const templateMessage = MESSAGE_TEMPLATES[template][type];
    if (!templateMessage) {
      return res.status(400).json({
        success: false,
        message: 'Template not available for this communication type'
      });
    }
    
    // Replace template variables
    let message = templateMessage;
    Object.keys(template_vars).forEach(key => {
      message = message.replace(`{${key}}`, template_vars[key]);
    });
    
    // Send the message
    const sendResult = await axios.post('http://localhost:3006/api/communication/send', {
      type,
      recipient_phone,
      recipient_email,
      recipient_token,
      message,
      emergency_request_id
    });
    
    res.json(sendResult.data);
    
  } catch (error) {
    console.error('Send template message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send template message'
    });
  }
});

// Send emergency notifications
app.post('/api/communication/emergency-notify', async (req, res) => {
  try {
    const { 
      emergency_request_id, 
      type, 
      patient_phone, 
      driver_phone, 
      hospital_phone,
      template_vars = {} 
    } = req.body;
    
    const notifications = [];
    
    // Notify patient
    if (patient_phone && (type === 'SMS' || type === 'CALL')) {
      const patientTemplate = type === 'SMS' ? 'EMERGENCY_ASSIGNED' : 'EMERGENCY_ASSIGNED';
      notifications.push({
        type,
        recipient_phone: patient_phone,
        template: patientTemplate,
        template_vars,
        emergency_request_id
      });
    }
    
    // Notify driver
    if (driver_phone && (type === 'SMS' || type === 'CALL')) {
      notifications.push({
        type,
        recipient_phone: driver_phone,
        template: 'DRIVER_NOTIFICATION',
        template_vars,
        emergency_request_id
      });
    }
    
    // Notify hospital
    if (hospital_phone && (type === 'SMS' || type === 'CALL')) {
      notifications.push({
        type,
        recipient_phone: hospital_phone,
        template: 'HOSPITAL_UPDATE',
        template_vars,
        emergency_request_id
      });
    }
    
    // Send all notifications
    const results = await Promise.allSettled(
      notifications.map(notification => 
        axios.post('http://localhost:3006/api/communication/send-template', notification)
      )
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    res.json({
      success: true,
      data: {
        total_notifications: notifications.length,
        successful,
        failed,
        results: results.map((r, i) => ({
          notification: notifications[i],
          status: r.status,
          data: r.status === 'fulfilled' ? r.value.data : r.reason.message
        }))
      }
    });
    
  } catch (error) {
    console.error('Emergency notify error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emergency notifications'
    });
  }
});

// Get communication logs
app.get('/api/communication/logs', async (req, res) => {
  try {
    const { 
      emergency_request_id, 
      type, 
      status, 
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = 'SELECT * FROM communication_logs WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (emergency_request_id) {
      query += ` AND emergency_request_id = $${paramCount + 1}`;
      params.push(emergency_request_id);
      paramCount++;
    }
    
    if (type) {
      query += ` AND type = $${paramCount + 1}`;
      params.push(type);
      paramCount++;
    }
    
    if (status) {
      query += ` AND status = $${paramCount + 1}`;
      params.push(status);
      paramCount++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Get communication logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch communication logs'
    });
  }
});

// Helper functions
async function sendSMS(phone, message) {
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
      to: phone
    });
    
    return {
      success: true,
      sid: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('SMS send error:', error);
    throw new Error('Failed to send SMS');
  }
}

async function makeCall(phone, message) {
  try {
    // For voice calls, we would use Twilio's voice API
    // This is a simplified implementation
    const result = await twilioClient.calls.create({
      twiml: `<Response><Say>${message}</Say></Response>`,
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER || '+1234567890'
    });
    
    return {
      success: true,
      sid: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('Call error:', error);
    throw new Error('Failed to make call');
  }
}

async function sendPushNotification(token, message) {
  try {
    if (!admin.apps.length) {
      throw new Error('Firebase not initialized');
    }
    
    const result = await admin.messaging().send({
      token: token,
      notification: {
        title: 'Aapat Emergency',
        body: message
      },
      data: {
        type: 'emergency_update'
      }
    });
    
    return {
      success: true,
      messageId: result
    };
  } catch (error) {
    console.error('Push notification error:', error);
    throw new Error('Failed to send push notification');
  }
}

async function sendEmail(email, message) {
  try {
    // For email, we would integrate with an email service like SendGrid or AWS SES
    // This is a placeholder implementation
    console.log(`Email to ${email}: ${message}`);
    
    return {
      success: true,
      messageId: 'email-' + Date.now()
    };
  } catch (error) {
    console.error('Email error:', error);
    throw new Error('Failed to send email');
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Aapat Communication Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Communication service client connected:', socket.id);
  
  socket.on('join_emergency', (emergencyId) => {
    socket.join(`emergency_${emergencyId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Communication service client disconnected:', socket.id);
  });
});

// Background job to retry failed communications
cron.schedule('*/10 * * * *', async () => {
  try {
    const query = `
      SELECT * FROM communication_logs 
      WHERE status = 'FAILED' 
        AND created_at > NOW() - INTERVAL '1 hour'
        AND retry_count < 3
    `;
    
    const result = await pool.query(query);
    
    for (const log of result.rows) {
      try {
        let deliveryResult;
        
        switch (log.type) {
          case COMMUNICATION_TYPES.SMS:
            deliveryResult = await sendSMS(log.recipient_phone, log.message);
            break;
          case COMMUNICATION_TYPES.CALL:
            deliveryResult = await makeCall(log.recipient_phone, log.message);
            break;
          case COMMUNICATION_TYPES.PUSH:
            deliveryResult = await sendPushNotification(log.recipient_token, log.message);
            break;
          case COMMUNICATION_TYPES.EMAIL:
            deliveryResult = await sendEmail(log.recipient_email, log.message);
            break;
        }
        
        // Update log with success
        await pool.query(
          'UPDATE communication_logs SET status = $1, sent_at = CURRENT_TIMESTAMP, delivered_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['DELIVERED', log.id]
        );
        
      } catch (error) {
        // Increment retry count
        await pool.query(
          'UPDATE communication_logs SET retry_count = retry_count + 1 WHERE id = $1',
          [log.id]
        );
      }
    }
  } catch (error) {
    console.error('Retry job error:', error);
  }
});

const PORT = process.env.PORT || 3006;
server.listen(PORT, () => {
  console.log(`🚑 Aapat Communication Service running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
