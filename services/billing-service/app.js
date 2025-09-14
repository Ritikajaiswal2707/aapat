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
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_...');
const Razorpay = require('razorpay');

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

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_...',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your-secret-key'
});

// Pricing configuration
const PRICING = {
  BASE_FARE: 500, // ₹500 base fare
  PER_KM_RATE: 15, // ₹15 per kilometer
  PRIORITY_SURCHARGES: {
    1: 200, // Critical - ₹200 surcharge
    2: 100, // High - ₹100 surcharge
    3: 0,   // Medium - No surcharge
    4: 0    // Low - No surcharge
  },
  NIGHT_CHARGE: 50, // ₹50 night charge (10 PM - 6 AM)
  WAITING_CHARGE: 100, // ₹100 per hour waiting
  EQUIPMENT_CHARGES: {
    'BASIC': 0,
    'INTERMEDIATE': 100,
    'ADVANCED': 200,
    'CRITICAL_CARE': 300
  }
};

// Payment methods
const PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD',
  UPI: 'UPI',
  NET_BANKING: 'NET_BANKING',
  WALLET: 'WALLET',
  INSURANCE: 'INSURANCE'
};

// Validation schemas
const createBillSchema = Joi.object({
  emergency_request_id: Joi.string().uuid().required(),
  patient_id: Joi.string().uuid().optional(),
  distance_km: Joi.number().min(0).required(),
  priority_level: Joi.number().valid(1, 2, 3, 4).required(),
  equipment_level: Joi.string().valid('BASIC', 'INTERMEDIATE', 'ADVANCED', 'CRITICAL_CARE').required(),
  waiting_time_hours: Joi.number().min(0).default(0),
  is_night_charge: Joi.boolean().default(false),
  insurance_info: Joi.object().optional()
});

const processPaymentSchema = Joi.object({
  billing_id: Joi.string().uuid().required(),
  payment_method: Joi.string().valid(...Object.values(PAYMENT_METHODS)).required(),
  payment_reference: Joi.string().optional(),
  amount: Joi.number().min(0).required()
});

// Calculate bill amount
function calculateBillAmount(billingData) {
  const {
    distance_km,
    priority_level,
    equipment_level,
    waiting_time_hours,
    is_night_charge,
    insurance_info
  } = billingData;
  
  let totalAmount = PRICING.BASE_FARE;
  
  // Distance fare
  totalAmount += distance_km * PRICING.PER_KM_RATE;
  
  // Priority surcharge
  totalAmount += PRICING.PRIORITY_SURCHARGES[priority_level] || 0;
  
  // Equipment charge
  totalAmount += PRICING.EQUIPMENT_CHARGES[equipment_level] || 0;
  
  // Night charge
  if (is_night_charge) {
    totalAmount += PRICING.NIGHT_CHARGE;
  }
  
  // Waiting charge
  totalAmount += waiting_time_hours * PRICING.WAITING_CHARGE;
  
  // Insurance coverage
  let insuranceCovered = 0;
  let patientPayable = totalAmount;
  
  if (insurance_info && insurance_info.coverage_percentage) {
    insuranceCovered = (totalAmount * insurance_info.coverage_percentage) / 100;
    patientPayable = totalAmount - insuranceCovered;
  }
  
  return {
    base_fare: PRICING.BASE_FARE,
    distance_fare: distance_km * PRICING.PER_KM_RATE,
    priority_surcharge: PRICING.PRIORITY_SURCHARGES[priority_level] || 0,
    equipment_charge: PRICING.EQUIPMENT_CHARGES[equipment_level] || 0,
    night_charge: is_night_charge ? PRICING.NIGHT_CHARGE : 0,
    waiting_charge: waiting_time_hours * PRICING.WAITING_CHARGE,
    total_amount: totalAmount,
    insurance_covered: insuranceCovered,
    patient_payable: patientPayable
  };
}

// Create bill
app.post('/api/billing/create', async (req, res) => {
  try {
    const { error, value } = createBillSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if emergency request exists
      const emergencyQuery = 'SELECT * FROM emergency_requests WHERE id = $1';
      const emergencyResult = await client.query(emergencyQuery, [value.emergency_request_id]);
      
      if (emergencyResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Emergency request not found'
        });
      }
      
      // Calculate bill amount
      const billCalculation = calculateBillAmount(value);
      
      // Create billing record
      const insertQuery = `
        INSERT INTO billing (
          emergency_request_id, patient_id, amount, distance_km,
          base_fare, distance_fare, priority_surcharge, insurance_covered,
          patient_payable, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        value.emergency_request_id,
        value.patient_id,
        billCalculation.total_amount,
        value.distance_km,
        billCalculation.base_fare,
        billCalculation.distance_fare,
        billCalculation.priority_surcharge,
        billCalculation.insurance_covered,
        billCalculation.patient_payable
      ]);
      
      await client.query('COMMIT');
      
      const billing = result.rows[0];
      
      res.status(201).json({
        success: true,
        data: {
          billing_id: billing.id,
          emergency_request_id: billing.emergency_request_id,
          patient_id: billing.patient_id,
          amount: billing.amount,
          distance_km: billing.distance_km,
          breakdown: {
            base_fare: billing.base_fare,
            distance_fare: billing.distance_fare,
            priority_surcharge: billing.priority_surcharge,
            equipment_charge: billCalculation.equipment_charge,
            night_charge: billCalculation.night_charge,
            waiting_charge: billCalculation.waiting_charge
          },
          insurance_covered: billing.insurance_covered,
          patient_payable: billing.patient_payable,
          payment_status: billing.payment_status,
          created_at: billing.created_at
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bill'
    });
  }
});

// Process payment
app.post('/api/billing/payment', async (req, res) => {
  try {
    const { error, value } = processPaymentSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get billing record
      const billingQuery = 'SELECT * FROM billing WHERE id = $1';
      const billingResult = await client.query(billingQuery, [value.billing_id]);
      
      if (billingResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Billing record not found'
        });
      }
      
      const billing = billingResult.rows[0];
      
      if (billing.payment_status !== 'PENDING') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Payment already processed'
        });
      }
      
      let paymentResult;
      
      // Process payment based on method
      switch (value.payment_method) {
        case PAYMENT_METHODS.CARD:
          paymentResult = await processCardPayment(value.amount, value.payment_reference);
          break;
        case PAYMENT_METHODS.UPI:
          paymentResult = await processUPIPayment(value.amount, value.payment_reference);
          break;
        case PAYMENT_METHODS.NET_BANKING:
          paymentResult = await processNetBankingPayment(value.amount, value.payment_reference);
          break;
        case PAYMENT_METHODS.WALLET:
          paymentResult = await processWalletPayment(value.amount, value.payment_reference);
          break;
        case PAYMENT_METHODS.INSURANCE:
          paymentResult = await processInsurancePayment(billing, value.payment_reference);
          break;
        case PAYMENT_METHODS.CASH:
          paymentResult = { success: true, reference: 'CASH-' + Date.now() };
          break;
        default:
          throw new Error('Invalid payment method');
      }
      
      if (!paymentResult.success) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: paymentResult.message || 'Payment failed'
        });
      }
      
      // Update billing record
      const updateQuery = `
        UPDATE billing 
        SET payment_status = 'PAID', payment_method = $1, 
            payment_reference = $2, paid_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, [
        value.payment_method,
        paymentResult.reference,
        value.billing_id
      ]);
      
      await client.query('COMMIT');
      
      // Emit payment success notification
      io.emit('payment_success', {
        billing_id: value.billing_id,
        emergency_request_id: billing.emergency_request_id,
        amount: value.amount,
        payment_method: value.payment_method,
        paid_at: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: {
          billing_id: value.billing_id,
          payment_status: 'PAID',
          payment_method: value.payment_method,
          payment_reference: paymentResult.reference,
          paid_at: updateResult.rows[0].paid_at
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment'
    });
  }
});

// Get billing details
app.get('/api/billing/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        b.*, er.emergency_type, er.priority_level, er.created_at as emergency_created_at,
        p.name as patient_name, p.phone as patient_phone
      FROM billing b
      LEFT JOIN emergency_requests er ON b.emergency_request_id = er.id
      LEFT JOIN patients p ON b.patient_id = p.id
      WHERE b.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Billing record not found'
      });
    }
    
    const billing = result.rows[0];
    
    res.json({
      success: true,
      data: {
        billing_id: billing.id,
        emergency_request_id: billing.emergency_request_id,
        emergency_type: billing.emergency_type,
        priority_level: billing.priority_level,
        patient: {
          name: billing.patient_name,
          phone: billing.patient_phone
        },
        amount: billing.amount,
        distance_km: billing.distance_km,
        breakdown: {
          base_fare: billing.base_fare,
          distance_fare: billing.distance_fare,
          priority_surcharge: billing.priority_surcharge
        },
        insurance_covered: billing.insurance_covered,
        patient_payable: billing.patient_payable,
        payment_status: billing.payment_status,
        payment_method: billing.payment_method,
        payment_reference: billing.payment_reference,
        created_at: billing.created_at,
        paid_at: billing.paid_at
      }
    });
    
  } catch (error) {
    console.error('Get billing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing details'
    });
  }
});

// Get billing history
app.get('/api/billing', async (req, res) => {
  try {
    const { 
      patient_id, 
      emergency_request_id, 
      payment_status, 
      limit = 20, 
      offset = 0 
    } = req.query;
    
    let query = `
      SELECT 
        b.*, er.emergency_type, er.priority_level,
        p.name as patient_name
      FROM billing b
      LEFT JOIN emergency_requests er ON b.emergency_request_id = er.id
      LEFT JOIN patients p ON b.patient_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (patient_id) {
      query += ` AND b.patient_id = $${paramCount + 1}`;
      params.push(patient_id);
      paramCount++;
    }
    
    if (emergency_request_id) {
      query += ` AND b.emergency_request_id = $${paramCount + 1}`;
      params.push(emergency_request_id);
      paramCount++;
    }
    
    if (payment_status) {
      query += ` AND b.payment_status = $${paramCount + 1}`;
      params.push(payment_status);
      paramCount++;
    }
    
    query += ` ORDER BY b.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows.map(billing => ({
        billing_id: billing.id,
        emergency_request_id: billing.emergency_request_id,
        emergency_type: billing.emergency_type,
        priority_level: billing.priority_level,
        patient_name: billing.patient_name,
        amount: billing.amount,
        payment_status: billing.payment_status,
        payment_method: billing.payment_method,
        created_at: billing.created_at,
        paid_at: billing.paid_at
      }))
    });
    
  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing history'
    });
  }
});

// Get billing analytics
app.get('/api/billing/analytics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let timeFilter = '';
    switch (period) {
      case '1d':
        timeFilter = "AND b.created_at >= NOW() - INTERVAL '1 day'";
        break;
      case '7d':
        timeFilter = "AND b.created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeFilter = "AND b.created_at >= NOW() - INTERVAL '30 days'";
        break;
      case '90d':
        timeFilter = "AND b.created_at >= NOW() - INTERVAL '90 days'";
        break;
    }
    
    const query = `
      SELECT 
        COUNT(*) as total_bills,
        SUM(b.amount) as total_revenue,
        AVG(b.amount) as avg_bill_amount,
        COUNT(CASE WHEN b.payment_status = 'PAID' THEN 1 END) as paid_bills,
        COUNT(CASE WHEN b.payment_status = 'PENDING' THEN 1 END) as pending_bills,
        SUM(CASE WHEN b.payment_status = 'PAID' THEN b.amount ELSE 0 END) as paid_revenue,
        SUM(b.insurance_covered) as total_insurance_covered
      FROM billing b
      WHERE 1=1 ${timeFilter}
    `;
    
    const result = await pool.query(query);
    const analytics = result.rows[0];
    
    const collectionRate = analytics.total_bills > 0 ? 
      ((analytics.paid_bills / analytics.total_bills) * 100).toFixed(2) : 0;
    
    res.json({
      success: true,
      data: {
        period,
        total_bills: parseInt(analytics.total_bills),
        total_revenue: parseFloat(analytics.total_revenue || 0),
        avg_bill_amount: parseFloat(analytics.avg_bill_amount || 0),
        paid_bills: parseInt(analytics.paid_bills),
        pending_bills: parseInt(analytics.pending_bills),
        paid_revenue: parseFloat(analytics.paid_revenue || 0),
        collection_rate_percentage: parseFloat(collectionRate),
        total_insurance_covered: parseFloat(analytics.total_insurance_covered || 0)
      }
    });
    
  } catch (error) {
    console.error('Get billing analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing analytics'
    });
  }
});

// Payment processing functions
async function processCardPayment(amount, reference) {
  try {
    // Stripe payment processing
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'inr',
      metadata: { reference }
    });
    
    return {
      success: true,
      reference: paymentIntent.id
    };
  } catch (error) {
    console.error('Card payment error:', error);
    return {
      success: false,
      message: 'Card payment failed'
    };
  }
}

async function processUPIPayment(amount, reference) {
  try {
    // Razorpay UPI payment
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: reference
    });
    
    return {
      success: true,
      reference: order.id
    };
  } catch (error) {
    console.error('UPI payment error:', error);
    return {
      success: false,
      message: 'UPI payment failed'
    };
  }
}

async function processNetBankingPayment(amount, reference) {
  try {
    // Net banking payment processing
    // This would integrate with bank APIs
    return {
      success: true,
      reference: 'NB-' + Date.now()
    };
  } catch (error) {
    console.error('Net banking payment error:', error);
    return {
      success: false,
      message: 'Net banking payment failed'
    };
  }
}

async function processWalletPayment(amount, reference) {
  try {
    // Wallet payment processing
    // This would integrate with wallet providers like Paytm, PhonePe
    return {
      success: true,
      reference: 'WALLET-' + Date.now()
    };
  } catch (error) {
    console.error('Wallet payment error:', error);
    return {
      success: false,
      message: 'Wallet payment failed'
    };
  }
}

async function processInsurancePayment(billing, reference) {
  try {
    // Insurance payment processing
    // This would integrate with insurance company APIs
    if (billing.insurance_covered > 0) {
      return {
        success: true,
        reference: 'INS-' + Date.now()
      };
    } else {
      return {
        success: false,
        message: 'No insurance coverage available'
      };
    }
  } catch (error) {
    console.error('Insurance payment error:', error);
    return {
      success: false,
      message: 'Insurance payment failed'
    };
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Aapat Billing Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Billing service client connected:', socket.id);
  
  socket.on('join_billing', (billingId) => {
    socket.join(`billing_${billingId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Billing service client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3007;
server.listen(PORT, () => {
  console.log(`🚑 Aapat Billing Service running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
