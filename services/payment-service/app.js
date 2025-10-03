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
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

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

// Redis client for session management
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redisClient.on('error', (err) => {
  console.log('Redis Client Error', err);
});

// Razorpay Configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_secret';
const IS_PROD_MODE = RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET !== 'rzp_test_mock_secret';

console.log(`💳 Payment Service: Running in ${IS_PROD_MODE ? 'REAL' : 'MOCK'} mode`);

// Payment schemas
const paymentRequestSchema = Joi.object({
  booking_id: Joi.string().required(),
  customer: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    email: Joi.string().email().optional()
  }).required(),
  
  amount: Joi.number().positive().required(),
  currency: Joi.string().valid('INR').default('INR'),
  
  payment_method: Joi.string().valid('upi', 'card', 'netbanking', 'wallet', 'cash', 'insurance', 'corporate').required(),
  
  ride_details: Joi.object({
    ride_type: Joi.string().valid('emergency', 'scheduled', 'medical_transport').required(),
    pickup_address: Joi.string().max(500).required(),
    destination_address: Joi.string().max(500).required(),
    distance_km: Joi.number().positive().optional(),
    duration_minutes: Joi.number().positive().optional()
  }).required(),
  
  fare_breakdown: Joi.object({
    base_fare: Joi.number().min(0).required(),
    distance_fare: Joi.number().min(0).required(),
    equipment_surcharge: Joi.number().min(0).required(),
    priority_multiplier: Joi.number().min(0).required(),
    total_fare: Joi.number().min(0).required()
  }).required(),
  
  callback_urls: Joi.object({
    success: Joi.string().uri().optional(),
    failure: Joi.string().uri().optional()
  }).optional(),
  
  metadata: Joi.object().optional()
});

const paymentCallbackSchema = Joi.object({
  razorpay_payment_id: Joi.string().required(),
  razorpay_order_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  booking_id: Joi.string().required()
});

// Payment Processing Engine
class PaymentProcessor {
  static calculateRazorpayOrder(amount, currency = 'INR', metadata = {}) {
    return {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: currency,
      receipt: `aapat_${Date.now()}`,
      payment_capture: true,
      notes: {
        service: 'aapat_ambulance',
        booking_type: metadata.ride_type || 'medical_transport',
        ...metadata
      }
    };
  }

  static verifyWebhookSignature(signature, body) {
    if (!IS_PROD_MODE) {
      console.log('🔧 Mock mode: Webhook signature verification skipped');
      return true;
    }

    try {
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
      hmac.update(body);
      const generatedSignature = hmac.digest('hex');
      
      return generatedSignature === signature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  static async createMockPayment(paymentData) {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockResponse = {
      payment_id: `mock_pay_${Date.now()}`,
      order_id: `mock_order_${Date.now()}`,
      status: Math.random() > 0.1 ? 'captured' : 'failed', // 90% success rate
      amount: paymentData.amount,
      currency: paymentData.currency,
      receipt: `aapat_${paymentData.booking_id}`,
      created_at: new Date().toISOString(),
      method: paymentData.payment_method,
      description: `Payment for ${paymentData.ride_details.ride_type} ride`,
      notes: {
        booking_id: paymentData.booking_id,
        customer_name: paymentData.customer.name,
        ride_type: paymentData.ride_details.ride_type
      }
    };

    return mockResponse;
  }

  static async capturePayment(paymentId, amount = null) {
    if (!IS_PROD_MODE) {
      console.log('🔧 Mock mode: Payment capture simulated');
      return {
        id: paymentId,
        status: 'captured',
        amount: amount || 100000,
        currency: 'INR',
        captured_at: new Date().toISOString()
      };
    }

    try {
      const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      
      const response = await axios.post(
        `https://api.razorpay.com/v1/payments/${paymentId}/capture`,
        amount ? { amount } : {},
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Payment capture error:', error);
      throw new Error(`Payment capture failed: ${error.message}`);
    }
  }

  static async refundPayment(paymentId, amount = null, notes = {}) {
    if (!IS_PROD_MODE) {
      console.log('🔧 Mock mode: Payment refund simulated');
      return {
        id: `mock_refund_${Date.now()}`,
        payment_id: paymentId,
        amount: amount || 10000,
        currency: 'INR',
        status: 'processed',
        notes: { reason: 'Customer cancellation', ...notes },
        created_at: new Date().toISOString()
      };
    }

    try {
      const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      
      const response = await axios.post(
        'https://api.razorpay.com/v1/refunds',
        {
          payment_id: paymentId,
          amount: amount,
          notes: notes
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Refund processing error:', error);
      throw new Error(`Refund failed: ${error.message}`);
    }
  }
}

// Initiate Payment
app.post('/api/payment/initiate', async (req, res) => {
  try {
    // Validate request data
    const { error, value } = paymentRequestSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const paymentData = value;
    const paymentId = uuidv4();

    // Check if booking exists and get fare details
    let bookingExists = false;
    try {
      // Check ride booking service for booking details
      const bookingResponse = await axios.get(`http://localhost:3010/api/ride/status/${paymentData.booking_id}`, {
        timeout: 5000
      });
      
      if (bookingResponse.data.success && bookingResponse.data.booking.fare_estimate) {
        bookingExists = true;
        
        // Verify amount matches booking
        const expectedAmount = bookingResponse.data.booking.fare_estimate.total_fare;
        if (Math.abs(paymentData.amount - expectedAmount) > 0.01) {
          return res.status(400).json({
            success: false,
            message: `Amount mismatch. Expected: ₹${expectedAmount}, Provided: ₹${paymentData.amount}`
          });
        }
      }
    } catch (bookingError) {
      console.log('Booking verification failed:', bookingError.message);
    }

    if (!bookingExists) {
      console.log('⚠️ Booking verification failed, proceeding with payment data as-is');
    }

    // Create payment record
    const paymentRecord = {
      payment_id: paymentId,
      booking_id: paymentData.booking_id,
      customer: paymentData.customer,
      amount: paymentData.amount,
      currency: paymentData.currency,
      payment_method: paymentData.payment_method,
      ride_details: paymentData.ride_details,
      fare_breakdown: paymentData.fare_breakdown,
      status: 'pending',
      metadata: {
        ...(paymentData.metadata || {}),
        initiated_at: new Date().toISOString(),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      }
    };

    // Cache payment record
    await redisClient.setEx(
      `payment:${paymentId}`,
      3600, // 1 hour
      JSON.stringify(paymentRecord)
    );

    let paymentResponse;
    
    if (IS_PROD_MODE && paymentData.payment_method !== 'cash') {
      try {
        // Create Razorpay order
        const razorpayOrder = PaymentProcessor.calculateRazorpayOrder(
          paymentData.amount,
          paymentData.currency,
          paymentData.metadata
        );

        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        
        const razorpayResponse = await axios.post(
          'https://api.razorpay.com/v1/orders',
          razorpayOrder,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            }
          }
        );

        paymentResponse = {
          payment_id: paymentId,
          order_id: razorpayResponse.data.id,
          key_id: RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          status: 'created',
          razorpay_response: razorpayResponse.data
        };

        // Update payment record with Razorpay details
        paymentRecord.order_id = razorpayResponse.data.id;
        paymentRecord.status = 'created';
        await redisClient.setEx(
          `payment:${paymentId}`,
          3600,
          JSON.stringify(paymentRecord)
        );

      } catch (razorpayError) {
        console.error('Razorpay integration error:', razorpayError.message);
        
        // Fallback to mock payment for development
        paymentResponse = await PaymentProcessor.createMockPayment(paymentData);
        paymentRecord.status = paymentResponse.status;
        paymentRecord.order_id = paymentResponse.order_id;
        
        await redisClient.setEx(
          `payment:${paymentId}`,
          3600,
          JSON.stringify(paymentRecord)
        );
      }
    } else {
      // Mock payment or cash payment
      paymentResponse = await PaymentProcessor.createMockPayment(paymentData);
      paymentRecord.status = paymentResponse.status;
      paymentRecord.order_id = paymentResponse.order_id;
      
      await redisClient.setEx(
        `payment:${paymentId}`,
        3600,
        JSON.stringify(paymentRecord)
      );
    }

    // Emit payment initiated event
    io.emit('payment_initiated', {
      payment_id: paymentId,
      booking_id: paymentData.booking_id,
      status: paymentResponse.status,
      amount: paymentData.amount
    });

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      payment_id: paymentId,
      payment_data: {
        id: paymentResponse.payment_id || paymentId,
        amount: paymentResponse.amount || paymentData.amount * 100,
        currency: paymentResponse.currency || paymentData.currency,
        key_id: RAZORPAY_KEY_ID,
        order_id: paymentResponse.order_id,
        status: paymentResponse.status,
        customer: paymentData.customer,
        created_at: new Date().toISOString()
      },
      client_config: {
        key_id: RAZORPAY_KEY_ID,
        amount: paymentData.amount * 100,
        currency: paymentData.currency,
        order_id: paymentResponse.order_id,
        description: `${paymentData.ride_details.ride_type.toUpperCase()} Ride - Aapat Ambulance`,
        prefill: {
          name: paymentData.customer.name,
          email: paymentData.customer.email || '',
          contact: paymentData.customer.phone
        },
        theme: {
          color: '#C41E3A'
        }
      }
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment'
    });
  }
});

// Handle payment callback/success
app.post('/api/payment/callback', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, booking_id } = req.body;

    if (!IS_PROD_MODE) {
      // Mock callback processing
      console.log('🔧 Mock mode: Payment callback processed');
      
      const mockPayment = {
        payment_id: razorpay_payment_id || `mock_pay_${Date.now()}`,
        booking_id: booking_id,
        status: 'captured',
        amount: 100000,
        currency: 'INR',
        captured_at: new Date().toISOString(),
        order_id: razorpay_order_id
      };

      // Update payment record
      await redisClient.setEx(
        `payment:${booking_id}`,
        3600,
        JSON.stringify({
          ...mockPayment,
          callback_status: 'success',
          updated_at: new Date().toISOString()
        })
      );

      // Emit payment success event
      io.emit('payment_success', mockPayment);

      return res.json({
        success: true,
        message: 'Payment completed successfully',
        payment: mockPayment
      });
    }

    // Real Razorpay signature verification
    const raw = JSON.stringify(req.body);
    const isValidSignature = PaymentProcessor.verifyWebhookSignature(razorpay_signature, raw);

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Payment is valid, update records
    await redisClient.setEx(
      `payment:${booking_id}`,
      3600,
      JSON.stringify({
        payment_id: razorpay_payment_id,
        booking_id: booking_id,
        status: 'captured',
        captured_at: new Date().toISOString(),
        callback_status: 'success',
        updated_at: new Date().toISOString()
      })
    );

    // Emit payment success event
    io.emit('payment_success', {
      payment_id: razorpay_payment_id,
      booking_id: booking_id,
      status: 'captured'
    });

    res.json({
      success: true,
      message: 'Payment completed successfully',
      payment: {
        payment_id: razorpay_payment_id,
        booking_id: booking_id,
        status: 'captured'
      }
    });

  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment callback processing failed'
    });
  }
});

// Get payment status
app.get('/api/payment/status/:payment_id', async (req, res) => {
  try {
    const { payment_id } = req.params;
    
    const paymentStr = await redisClient.get(`payment:${payment_id}`);
    
    if (!paymentStr) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = JSON.parse(paymentStr);

    res.json({
      success: true,
      payment: {
        id: payment.payment_id,
        booking_id: payment.booking_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.payment_method,
        customer: payment.customer,
        ride_details: payment.ride_details,
        created_at: payment.metadata?.initiated_at,
        updated_at: payment.updated_at || payment.metadata?.initiated_at,
        order_id: payment.order_id
      }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status'
    });
  }
});

// Process refund
app.post('/api/payment/refund', async (req, res) => {
  try {
    const { payment_id, refund_amount, reason = 'Customer request' } = req.body;

    if (!payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID required for refund'
      });
    }

    // Get payment details
    const paymentStr = await redisClient.get(`payment:${payment_id}`);
    if (!paymentStr) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = JSON.parse(paymentStr);
    
    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: 'Payment not eligible for refund'
      });
    }

    // Process refund
    const refundResult = await PaymentProcessor.refundPayment(
      payment_id,
      refund_amount ? refund_amount * 100 : null, // Convert to paise
      { reason, booking_id: payment.booking_id }
    );

    // Update payment record
    payment.refunds = payment.refunds || [];
    payment.refunds.push({
      refund_id: refundResult.id,
      amount: refundResult.amount,
      status: refundResult.status,
      reason: reason,
      created_at: refundResult.created_at
    });

    await redisClient.setEx(
      `payment:${payment_id}`,
      3600,
      JSON.stringify(payment)
    );

    // Emit refund processed event
    io.emit('refund_processed', {
      payment_id: payment_id,
      refund_id: refundResult.id,
      amount: refundResult.amount,
      status: refundResult.status
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: refundResult
    });

  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Refund processing failed'
    });
  }
});

// Generate payment receipt
app.get('/api/payment/receipt/:payment_id', async (req, res) => {
  try {
    const { payment_id } = req.params;
    
    const paymentStr = await redisClient.get(`payment:${payment_id}`);
    
    if (!paymentStr) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = JSON.parse(paymentStr);

    const receipt = {
      receipt_number: `APT-${payment_id.slice(-8).toUpperCase()}`,
      date: payment.metadata?.initiated_at,
      customer: payment.customer,
      services: [
        {
          description: `${payment.ride_details.ride_type.toUpperCase()} Ambulance Ride`,
          quantity: 1,
          unit_price: payment.amount,
          total: payment.amount
        }
      ],
      fare_breakdown: payment.fare_breakdown,
      total: payment.amount,
      currency: payment.currency,
      payment_method: payment.payment_method,
      status: payment.status,
      booking_id: payment.booking_id,
      pickup_address: payment.ride_details.pickup_address,
      destination_address: payment.ride_details.destination_address
    };

    res.json({
      success: true,
      receipt: receipt
    });

  } catch (error) {
    console.error('Receipt generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate receipt'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Aapat Payment Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mode: IS_PROD_MODE ? 'production' : 'development',
    provider: IS_PROD_MODE ? 'razorpay' : 'mock'
  });
});

const port = process.env.PORT || 3009;

server.listen(port, () => {
  console.log(`💳 Aapat Payment Service running on port ${port}`);
  console.log(`🔍 Health check: http://localhost:${port}/health`);
  console.log(`💰 Mode: ${IS_PROD_MODE ? 'REAL Razorpay' : 'MOCK'}`);
});
